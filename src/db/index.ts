import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { ArtItem, DomainKey, StatusKey, TreasureMap } from '../types';
import { sampleData } from '../data/sampleData';
import { DOMAINS, STATUS_CONFIG } from '../data/constants';

// 数据库配置
const DB_NAME = 'art-star-map-db';
const DB_VERSION = 2;
const STORE_NAME = 'items';
const TREASURE_MAP_STORE = 'treasureMaps';

// 数据库 Schema 定义
interface ArtDB extends DBSchema {
  items: {
    key: string;
    value: ArtItem;
    indexes: {
      'by-domain': DomainKey;
      'by-status': StatusKey;
      'by-createdAt': string;
      'by-updatedAt': string;
    };
  };
  treasureMaps: {
    key: string;
    value: TreasureMap;
    indexes: {
      'by-importedAt': string;
    };
  };
}

let dbInstance: IDBPDatabase<ArtDB> | null = null;

// 验证 senses 值范围 0-100
function validateSenses(senses: unknown): senses is ArtItem['senses'] {
  if (typeof senses !== 'object' || senses === null) {
    return true; // senses 是可选的
  }
  const entries = Object.entries(senses);
  for (const [, value] of entries) {
    if (typeof value !== 'number') return false;
    if (value < 0 || value > 100) return false;
  }
  return true;
}

// 验证单个 item 的合法性
function validateItem(item: unknown): item is ArtItem {
  if (typeof item !== 'object' || item === null) return false;

  const obj = item as Record<string, unknown>;

  // 必填字段
  if (typeof obj.id !== 'string' || !obj.id.trim()) return false;
  if (typeof obj.title !== 'string' || !obj.title.trim()) return false;
  if (typeof obj.domain !== 'string') return false;
  if (!Object.keys(DOMAINS).includes(obj.domain)) return false;
  if (typeof obj.status !== 'string') return false;
  if (!['explored', 'next', 'future'].includes(obj.status)) return false;

  // 可选字段验证
  if (!validateSenses(obj.senses)) return false;

  if (obj.connections !== undefined && !Array.isArray(obj.connections)) return false;
  if (obj.connections !== undefined) {
    for (const conn of obj.connections) {
      if (typeof conn !== 'string') return false;
    }
  }

  if (obj.description !== undefined && typeof obj.description !== 'string') return false;
  if (obj.suggestion !== undefined && typeof obj.suggestion !== 'string') return false;
  if (obj.notes !== undefined && typeof obj.notes !== 'string') return false;
  if (obj.createdAt !== undefined && typeof obj.createdAt !== 'string') return false;
  if (obj.updatedAt !== undefined && typeof obj.updatedAt !== 'string') return false;

  return true;
}

// 获取数据库实例
async function getDB(): Promise<IDBPDatabase<ArtDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ArtDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by-domain', 'domain');
        store.createIndex('by-status', 'status');
        store.createIndex('by-createdAt', 'createdAt');
        store.createIndex('by-updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains(TREASURE_MAP_STORE)) {
        const tmStore = db.createObjectStore(TREASURE_MAP_STORE, { keyPath: 'id' });
        tmStore.createIndex('by-importedAt', 'importedAt');
      }
    },
  });

  return dbInstance;
}

// ==================== 数据库操作 ====================

/**
 * 初始化数据库
 * 首次使用时导入示例数据
 */
export async function initDB(): Promise<void> {
  const db = await getDB();
  const count = await db.count(STORE_NAME);

  // 如果数据库为空，导入示例数据
  if (count === 0) {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await Promise.all([
      ...sampleData.map((item) => tx.store.put(item)),
      tx.done,
    ]);
  }
}

/**
 * 获取所有记录
 */
export async function getAllItems(): Promise<ArtItem[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

/**
 * 获取单条记录
 */
export async function getItem(id: string): Promise<ArtItem | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

/**
 * 添加记录
 * 自动生成 createdAt 和 updatedAt
 */
export async function addItem(item: Omit<ArtItem, 'createdAt' | 'updatedAt'>): Promise<ArtItem> {
  const db = await getDB();
  const now = new Date().toISOString();

  const newItem: ArtItem = {
    ...item,
    createdAt: now,
    updatedAt: now,
  };

  await db.put(STORE_NAME, newItem);
  return newItem;
}

/**
 * 更新记录
 * 自动更新 updatedAt
 */
export async function updateItem(item: ArtItem): Promise<ArtItem> {
  const db = await getDB();
  const now = new Date().toISOString();

  const updatedItem: ArtItem = {
    ...item,
    updatedAt: now,
  };

  await db.put(STORE_NAME, updatedItem);
  return updatedItem;
}

/**
 * 删除记录
 */
export async function deleteItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

/**
 * 导出所有数据为 JSON 字符串
 * 格式：{ version: 2, lastModified: ISO时间, items: [...] }
 */
export function exportToJSON(items: ArtItem[]): string {
  const data = {
    version: 2,
    lastModified: new Date().toISOString(),
    items,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * 导出可读的 TXT 格式
 */
export function exportToTXT(items: ArtItem[]): string {
  const lines = items.map((item) => {
    const senses = item.senses
      ? Object.entries(item.senses)
          .map(([k, v]) => `${k}:${v}`)
          .join(', ')
      : '';
    const status = STATUS_CONFIG[item.status]?.label || item.status;
    return [
      `[${status}] ${item.title}`,
      `领域: ${DOMAINS[item.domain]?.label || item.domain}`,
      `描述: ${item.description || ''}`,
      `感官: ${senses}`,
      `备注: ${item.notes || ''}`,
    ].join('\n');
  });

  return [
    `艺术探索星图 - 数据导出`,
    `导出时间: ${new Date().toLocaleString('zh-CN')}`,
    `总条目数: ${items.length}`,
    '',
    '='.repeat(40),
    '',
    lines.join('\n\n---\n\n'),
  ].join('\n');
}

// ==================== 导入操作 ====================

export interface ImportResult {
  success: boolean;
  message: string;
  importedCount: number;
  updatedCount: number;
  invalidCount: number;
  errors: string[];
  treasureMapImported?: number;
  treasureMapUpdated?: number;
}

/**
 * 从 JSON 导入数据
 * @param jsonString JSON 字符串
 * @param mode 'merge' | 'replace' - merge: 增量合并(已有id更新,新id添加), replace: 全量替换
 */
export async function importFromJSON(
  jsonString: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<ImportResult> {
  const errors: string[] = [];
  let importedCount = 0;
  let updatedCount = 0;
  let invalidCount = 0;
  let treasureMapImported = 0;
  let treasureMapUpdated = 0;

  // 解析 JSON
  let data: { version?: number; items?: unknown[]; treasureMaps?: unknown[] };
  try {
    data = JSON.parse(jsonString);
  } catch {
    return {
      success: false,
      message: 'JSON 解析失败，请检查格式',
      importedCount: 0,
      updatedCount: 0,
      invalidCount: 0,
      errors: ['无效的 JSON 格式'],
    };
  }

  // 验证数据结构
  if (!data.items || !Array.isArray(data.items)) {
    return {
      success: false,
      message: '数据结构无效：缺少 items 数组',
      importedCount: 0,
      updatedCount: 0,
      invalidCount: 0,
      errors: ['缺少 items 数组'],
    };
  }

  // 验证并处理每个 item
  const validItems: ArtItem[] = [];

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];

    if (!validateItem(item)) {
      invalidCount++;
      const title = typeof item === 'object' && item !== null
        ? (item as Record<string, unknown>).title || `第 ${i + 1} 条`
        : `第 ${i + 1} 条`;
      errors.push(`无效记录: ${title}`);
      continue;
    }

    // 确保时间戳存在
    const now = new Date().toISOString();
    const validatedItem: ArtItem = {
      ...item,
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
    };

    validItems.push(validatedItem);
  }

  if (mode === 'replace') {
    // 全量替换：先清空再写入
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.clear();
    await Promise.all([
      ...validItems.map((item) => tx.store.put(item)),
      tx.done,
    ]);
    importedCount = validItems.length;
  } else {
    // 增量合并：检查已存在的 id
    const db = await getDB();

    for (const item of validItems) {
      const existing = await db.get(STORE_NAME, item.id);

      if (existing) {
        // 更新已有记录
        await db.put(STORE_NAME, {
          ...item,
          createdAt: existing.createdAt, // 保留原始创建时间
          updatedAt: new Date().toISOString(),
        });
        updatedCount++;
      } else {
        // 添加新记录
        await db.put(STORE_NAME, item);
        importedCount++;
      }
    }
  }

  // 处理寻宝图导入 (v3+)
  if (data.treasureMaps && Array.isArray(data.treasureMaps)) {
    const db = await getDB();

    for (const tm of data.treasureMaps) {
      if (typeof tm !== 'object' || tm === null) continue;

      const tmObj = tm as Record<string, unknown>;

      // 验证必填字段
      if (typeof tmObj.id !== 'string' || !tmObj.id.trim()) continue;
      if (typeof tmObj.name !== 'string' || !tmObj.name.trim()) continue;
      if (typeof tmObj.description !== 'string' || !tmObj.description.trim()) continue;
      if (!Array.isArray(tmObj.items)) continue;

      const existingTM = await db.get(TREASURE_MAP_STORE, tmObj.id as string);

      if (existingTM) {
        // 更新已有寻宝图（保留本地的探索状态）
        const updatedItems = existingTM.items.map((existingItem) => {
          const importedItem = (tmObj.items as Array<Record<string, unknown>>).find(
            (i) => i.id === existingItem.id
          );
          if (importedItem && existingItem.exploreStatus === 'unexplored') {
            // 如果本地是未探索状态，且导入数据中有不同的探索状态，则更新
            // 但实际上导入时应该保留本地的探索状态
          }
          return existingItem;
        });

        await db.put(TREASURE_MAP_STORE, {
          ...existingTM,
          items: updatedItems,
        });
        treasureMapUpdated++;
      } else {
        // 添加新寻宝图
        const treasureMap: TreasureMap = {
          id: tmObj.id as string,
          name: tmObj.name as string,
          description: tmObj.description as string,
          creator: tmObj.creator as string | undefined,
          createdAt: tmObj.createdAt as string || new Date().toISOString(),
          importedAt: new Date().toISOString(),
          version: tmObj.version as string | undefined,
          items: (tmObj.items as Array<Record<string, unknown>>).map((item) => ({
            id: item.id as string,
            title: item.title as string,
            domain: item.domain as any,
            description: item.description as string | undefined,
            hints: item.hints as string | undefined,
            exploreStatus: (item.exploreStatus as any) || 'unexplored',
            collectionItemId: item.collectionItemId as string | undefined,
          })),
        };
        await db.put(TREASURE_MAP_STORE, treasureMap);
        treasureMapImported++;
      }
    }
  }

  const success = invalidCount === 0;
  let message: string;

  const tmInfo = treasureMapImported > 0 || treasureMapUpdated > 0
    ? `，寻宝图 ${treasureMapImported} 张`
    : '';

  if (success) {
    message = `导入成功：新增 ${importedCount} 条，更新 ${updatedCount} 条${tmInfo}`;
  } else if (importedCount > 0 || updatedCount > 0) {
    message = `部分导入成功：新增 ${importedCount} 条，更新 ${updatedCount} 条，${invalidCount} 条无效${tmInfo}`;
  } else {
    message = `导入失败：${invalidCount} 条无效数据`;
  }

  return {
    success,
    message,
    importedCount,
    updatedCount,
    invalidCount,
    errors,
    treasureMapImported,
    treasureMapUpdated,
  };
}

// ==================== 工具函数 ====================

/**
 * 按领域筛选
 */
export async function getItemsByDomain(domain: DomainKey): Promise<ArtItem[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_NAME, 'by-domain', domain);
}

/**
 * 按状态筛选
 */
export async function getItemsByStatus(status: StatusKey): Promise<ArtItem[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_NAME, 'by-status', status);
}

/**
 * 按创建时间排序获取
 */
export async function getItemsByCreatedAt(order: 'asc' | 'desc' = 'desc'): Promise<ArtItem[]> {
  const db = await getDB();
  const items = await db.getAllFromIndex(STORE_NAME, 'by-createdAt');
  return order === 'asc' ? items : items.reverse();
}

/**
 * 按更新时间排序获取
 */
export async function getItemsByUpdatedAt(order: 'asc' | 'desc' = 'desc'): Promise<ArtItem[]> {
  const db = await getDB();
  const items = await db.getAllFromIndex(STORE_NAME, 'by-updatedAt');
  return order === 'asc' ? items : items.reverse();
}

/**
 * 获取记录总数
 */
export async function getItemCount(): Promise<number> {
  const db = await getDB();
  return db.count(STORE_NAME);
}

// ==================== 寻宝图数据库操作 ====================

/**
 * 获取所有寻宝图
 */
export async function getAllTreasureMaps(): Promise<TreasureMap[]> {
  const db = await getDB();
  return db.getAll(TREASURE_MAP_STORE);
}

/**
 * 获取单个寻宝图
 */
export async function getTreasureMap(id: string): Promise<TreasureMap | undefined> {
  const db = await getDB();
  return db.get(TREASURE_MAP_STORE, id);
}

/**
 * 保存寻宝图
 */
export async function saveTreasureMap(treasureMap: TreasureMap): Promise<void> {
  const db = await getDB();
  await db.put(TREASURE_MAP_STORE, treasureMap);
}

/**
 * 删除寻宝图
 */
export async function deleteTreasureMap(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(TREASURE_MAP_STORE, id);
}

/**
 * 更新寻宝图中的单个条目状态
 */
export async function updateTreasureMapItem(
  treasureMapId: string,
  itemId: string,
  updates: { exploreStatus: 'explored' | 'unexplored'; collectionItemId?: string }
): Promise<void> {
  const db = await getDB();
  const treasureMap = await db.get(TREASURE_MAP_STORE, treasureMapId);
  if (!treasureMap) return;

  const updatedItems = treasureMap.items.map((item) => {
    if (item.id === itemId) {
      return {
        ...item,
        exploreStatus: updates.exploreStatus,
        collectionItemId: updates.collectionItemId,
      };
    }
    return item;
  });

  await db.put(TREASURE_MAP_STORE, {
    ...treasureMap,
    items: updatedItems,
  });
}

/**
 * 清空所有寻宝图
 */
export async function clearAllTreasureMaps(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(TREASURE_MAP_STORE, 'readwrite');
  await tx.store.clear();
  await tx.done;
}

/**
 * 清空所有藏品
 */
export async function clearAllItems(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
}
