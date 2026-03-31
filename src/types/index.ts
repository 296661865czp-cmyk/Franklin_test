export type DomainKey =
  | 'music'
  | 'painting'
  | 'sculpture'
  | 'dance'
  | 'literature'
  | 'flavor'
  | 'film'
  | 'synesthesia'
  | 'sports';

export type StatusKey = 'explored' | 'next' | 'future';

export type SenseKey =
  | 'hearing'
  | 'sight'
  | 'touch'
  | 'smell'
  | 'taste'
  | 'body'
  | 'time';

export interface SenseScores {
  hearing?: number;
  sight?: number;
  touch?: number;
  smell?: number;
  taste?: number;
  body?: number;
  time?: number;
}

export interface ArtItem {
  id: string;
  title: string;
  domain: DomainKey;
  status: StatusKey;
  senses: Partial<Record<SenseKey, number>>; // 7维感官，值 0-100，0 时不保存
  description?: string;
  suggestion?: string;
  connections?: string[]; // 关联条目的 id 数组
  notes?: string;
  createdAt: string; // ISO 时间戳
  updatedAt: string; // ISO 时间戳
}

// 兼容旧名称
export type Item = ArtItem;

export interface SenseConfig {
  key: SenseKey;
  label: string;
  icon: string;
  color: string;
}

export interface DomainConfig {
  label: string;
  icon: string;
  color: string; // 领域主题色
}

export interface StatusConfig {
  label: string;
  emoji: string;
  dotClass: string;
}

export interface DataStore {
  version: number;
  lastModified: string;
  items: ArtItem[];
}

// 寻宝图相关类型
export type ExploreStatus = 'unexplored' | 'explored';

export interface TreasureMapItem {
  id: string; // 寻宝图内唯一标识，如 "tm-001"
  title: string;
  domain: DomainKey;
  description?: string;
  hints?: string; // 探索提示
  exploreStatus: ExploreStatus;
  collectionItemId?: string; // 已探索时对应的藏宝阁藏品 ID
}

export interface TreasureMap {
  id: string;
  name: string;
  description: string;
  creator?: string;
  createdAt: string; // ISO 时间戳
  importedAt: string; // 导入时间
  version?: string;
  items: TreasureMapItem[];
}

// 寻宝图 JSON 导入格式
export interface TreasureMapJSON {
  treasureMap: {
    name: string;
    description: string;
    creator?: string;
    createdAt?: string;
    version?: string;
  };
  items: Array<{
    id: string;
    title: string;
    domain: string;
    description?: string;
    hints?: string;
  }>;
}
