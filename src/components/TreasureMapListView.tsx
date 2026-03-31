import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { TreasureMap, TreasureMapJSON, DomainKey } from '../types';
import { DOMAINS } from '../data/constants';
import './TreasureMapListView.css';

interface TreasureMapListViewProps {
  treasureMaps: TreasureMap[];
  onNavigateToHome: () => void;
  onNavigateToDetail: (id: string) => void;
  onAddTreasureMap: (treasureMap: TreasureMap) => Promise<void>;
  onDeleteTreasureMap: (id: string) => Promise<void>;
}

const VALID_DOMAINS = Object.keys(DOMAINS) as DomainKey[];

export function TreasureMapListView({
  treasureMaps,
  onNavigateToHome,
  onNavigateToDetail,
  onAddTreasureMap,
  onDeleteTreasureMap,
}: TreasureMapListViewProps) {
  const [showImport, setShowImport] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getExploredCount = (tm: TreasureMap) => {
    return tm.items.filter((item) => item.exploreStatus === 'explored').length;
  };

  const handleImportClick = () => {
    setImportError(null);
    setShowImport(true);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isImporting) {
      setShowImport(false);
      setImportError(null);
    }
  };

  const validateAndParseJSON = (text: string): { valid: boolean; data?: TreasureMapJSON; error?: string } => {
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return { valid: false, error: 'JSON 格式错误' };
    }

    if (typeof data !== 'object' || data === null) {
      return { valid: false, error: 'JSON 结构无效' };
    }

    const obj = data as Record<string, unknown>;

    // 验证 treasureMap 必填字段
    if (!obj.treasureMap || typeof obj.treasureMap !== 'object') {
      return { valid: false, error: '缺少 treasureMap 字段' };
    }

    const tm = obj.treasureMap as Record<string, unknown>;
    if (typeof tm.name !== 'string' || !tm.name.trim()) {
      return { valid: false, error: 'treasureMap.name 为必填字段' };
    }
    if (typeof tm.description !== 'string' || !tm.description.trim()) {
      return { valid: false, error: 'treasureMap.description 为必填字段' };
    }

    // 验证 items
    if (!Array.isArray(obj.items)) {
      return { valid: false, error: 'items 必须为数组' };
    }

    if (obj.items.length === 0) {
      return { valid: false, error: 'items 不能为空' };
    }

    // 验证每个 item
    for (let i = 0; i < obj.items.length; i++) {
      const item = obj.items[i] as Record<string, unknown>;
      if (typeof item !== 'object' || item === null) {
        return { valid: false, error: `第 ${i + 1} 个 item 格式无效` };
      }
      if (typeof item.id !== 'string' || !item.id.trim()) {
        return { valid: false, error: `第 ${i + 1} 个 item 缺少有效 id` };
      }
      if (typeof item.title !== 'string' || !item.title.trim()) {
        return { valid: false, error: `第 ${i + 1} 个 item 缺少有效 title` };
      }
      if (typeof item.domain !== 'string' || !VALID_DOMAINS.includes(item.domain as DomainKey)) {
        return { valid: false, error: `第 ${i + 1} 个 item 的 domain 无效: "${item.domain}"` };
      }
    }

    // 检查 ID 唯一性
    const ids = new Set<string>();
    for (const item of obj.items) {
      const itemObj = item as Record<string, unknown>;
      if (ids.has(itemObj.id as string)) {
        return { valid: false, error: `items 中存在重复的 id: "${itemObj.id}"` };
      }
      ids.add(itemObj.id as string);
    }

    return { valid: true, data: data as TreasureMapJSON };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      setImportError('文件为空');
      return;
    }

    const text = await file.text();
    if (!text.trim()) {
      setImportError('文件为空');
      return;
    }

    const validation = validateAndParseJSON(text);
    if (!validation.valid) {
      setImportError(validation.error || '未知错误');
      return;
    }

    const jsonData = validation.data!;
    setIsImporting(true);

    try {
      const now = new Date().toISOString();
      const treasureMap: TreasureMap = {
        id: `tm-${uuidv4()}`,
        name: jsonData.treasureMap.name.trim(),
        description: jsonData.treasureMap.description.trim(),
        creator: jsonData.treasureMap.creator?.trim(),
        createdAt: jsonData.treasureMap.createdAt || now,
        importedAt: now,
        version: jsonData.treasureMap.version,
        items: jsonData.items.map((item) => ({
          id: item.id,
          title: item.title,
          domain: item.domain as DomainKey,
          description: item.description?.trim(),
          hints: item.hints?.trim(),
          exploreStatus: 'unexplored',
        })),
      };

      await onAddTreasureMap(treasureMap);
      setShowImport(false);
      setImportError(null);
    } catch (err) {
      console.error('Import failed:', err);
      setImportError('导入失败，请重试');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteTreasureMap(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="treasure-map-list-view">
      <div className="treasure-map-list-header">
        <button className="back-btn" onClick={onNavigateToHome}>
          ← 返回
        </button>
      </div>

      <div className="treasure-map-list-title">
        <h2>寻宝图</h2>
        <p>{treasureMaps.length} 张寻宝图</p>
      </div>

      <div className="treasure-map-cards">
        {treasureMaps.length === 0 ? (
          <div className="empty-treasure-map">
            <div className="empty-treasure-map-icon">✦</div>
            <div className="empty-treasure-map-title">暂无寻宝图</div>
            <div className="empty-treasure-map-desc">
              导入寻宝图，开始你的艺术探索之旅
            </div>
          </div>
        ) : (
          treasureMaps.map((tm) => {
            const explored = getExploredCount(tm);
            const progress = tm.items.length > 0 ? (explored / tm.items.length) * 100 : 0;
            const isDeleting = deleteConfirm === tm.id;

            return (
              <div key={tm.id} className="treasure-map-card">
                <div
                  className="treasure-map-card-header"
                  onClick={() => !isDeleting && onNavigateToDetail(tm.id)}
                >
                  <div className="treasure-map-card-icon">✦</div>
                  <div className="treasure-map-card-info">
                    <div className="treasure-map-card-name">{tm.name}</div>
                    <div className="treasure-map-card-desc">{tm.description}</div>
                  </div>
                </div>

                <div className="treasure-map-card-meta">
                  {tm.creator && (
                    <span className="treasure-map-card-creator">
                      创建者：{tm.creator}
                    </span>
                  )}
                  <span className="treasure-map-card-date">
                    导入于 {new Date(tm.importedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>

                <div className="treasure-map-progress">
                  <div className="treasure-map-progress-bar">
                    <div
                      className="treasure-map-progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="treasure-map-progress-text">
                    {explored}/{tm.items.length}
                  </span>
                </div>

                <div className="treasure-map-card-actions">
                  <button
                    className="treasure-map-action-btn view"
                    onClick={() => onNavigateToDetail(tm.id)}
                  >
                    查看详情
                  </button>
                  {isDeleting ? (
                    <>
                      <button
                        className="treasure-map-action-btn delete"
                        onClick={() => handleDelete(tm.id)}
                      >
                        确认删除
                      </button>
                      <button
                        className="treasure-map-action-btn view"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <button
                      className="treasure-map-action-btn delete"
                      onClick={() => setDeleteConfirm(tm.id)}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}

        <button className="import-treasure-map-btn" onClick={handleImportClick}>
          <span>＋</span>
          <span>导入寻宝图</span>
        </button>
      </div>

      {showImport && (
        <div className="treasure-map-import-backdrop" onClick={handleBackdropClick}>
          <div className="treasure-map-import-modal">
            <div className="treasure-map-import-header">
              <h3>导入寻宝图</h3>
              {!isImporting && (
                <button
                  className="treasure-map-import-close"
                  onClick={() => {
                    setShowImport(false);
                    setImportError(null);
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {!isImporting ? (
              <div className="treasure-map-import-body">
                <p className="treasure-map-import-desc">
                  选择要导入的寻宝图 JSON 文件
                </p>

                {importError && (
                  <div className="treasure-map-import-error">{importError}</div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="treasure-map-import-file-input"
                  onChange={handleFileSelect}
                />

                <div className="treasure-map-import-actions">
                  <button
                    className="treasure-map-import-btn primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    选择文件
                  </button>
                  <button
                    className="treasure-map-import-btn secondary"
                    onClick={() => {
                      setShowImport(false);
                      setImportError(null);
                    }}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="treasure-map-import-loading">正在导入...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
