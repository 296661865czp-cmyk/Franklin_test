import type { SenseConfig, DomainConfig, StatusConfig, DomainKey } from '../types';

// 7 维感官配置
export const SENSES: SenseConfig[] = [
  { key: 'hearing', label: '听觉', icon: '👂', color: '#7a9ebf' },
  { key: 'sight', label: '视觉', icon: '👁', color: '#c47878' },
  { key: 'touch', label: '触觉', icon: '✋', color: '#7aaa8a' },
  { key: 'smell', label: '嗅觉', icon: '👃', color: '#c4893a' },
  { key: 'taste', label: '味觉', icon: '👅', color: '#d4825a' },
  { key: 'body', label: '体感', icon: '🫀', color: '#9b8abf' },
  { key: 'time', label: '时间', icon: '⏱', color: '#7aabbb' },
];

// 9 个艺术领域配置
export const DOMAINS: Record<DomainKey, DomainConfig> = {
  music: { label: '音乐', icon: '🎵', color: '#7a9ebf' },
  painting: { label: '绘画', icon: '🎨', color: '#c47878' },
  sculpture: { label: '雕塑/建筑', icon: '🗿', color: '#7aaa8a' },
  dance: { label: '舞蹈/身体', icon: '💃', color: '#9b8abf' },
  literature: { label: '文学/诗歌', icon: '📖', color: '#c4893a' },
  flavor: { label: '风味艺术', icon: '🍷', color: '#d4825a' },
  film: { label: '电影/戏剧', icon: '🎬', color: '#7aabbb' },
  synesthesia: { label: '通感', icon: '🌈', color: '#b87ab0' },
  sports: { label: '体育', icon: '⚽', color: '#7aaa8a' },
};

// 状态配置
export const STATUS_CONFIG: Record<string, StatusConfig> = {
  explored: { label: '已探索', emoji: '✓', dotClass: 'explored' },
  next: { label: '下一步', emoji: '⏳', dotClass: 'next' },
  future: { label: '远方', emoji: '○', dotClass: 'future' },
};

// 状态循环顺序
export const STATUS_CYCLE: string[] = ['future', 'next', 'explored'];

// 领域颜色映射
export const DOMAIN_COLORS: Record<DomainKey, string> = {
  music: '#7a9ebf',
  painting: '#c47878',
  sculpture: '#7aaa8a',
  dance: '#9b8abf',
  literature: '#c4893a',
  flavor: '#d4825a',
  film: '#7aabbb',
  synesthesia: '#b87ab0',
  sports: '#7aaa8a',
};

// CSS 颜色变量
export const CSS_VARIABLES = {
  bg: '#f7f0e3',
  bgCard: '#fffdf8',
  bgInput: '#f2ebe0',
  border: '#e0d4c0',
  textPrimary: '#3d2b1f',
  textSecondary: '#7a5c40',
  textMuted: '#a08060',
  gold: '#c4893a',
  goldGlow: 'rgba(196,137,58,0.10)',
  blue: '#7a9ebf',
  blueGlow: 'rgba(122,158,191,0.10)',
  rose: '#c47878',
  roseGlow: 'rgba(196,120,120,0.10)',
  green: '#7aaa8a',
  greenGlow: 'rgba(122,170,138,0.10)',
  purple: '#9b8abf',
  purpleGlow: 'rgba(155,138,191,0.10)',
  orange: '#d4825a',
  teal: '#7aabbb',
  pink: '#b87ab0',
  danger: '#b85050',
  accent: '#722f37',
  accentLight: 'rgba(114,47,55,0.08)',
  accentBorder: 'rgba(114,47,55,0.25)',
};

// 存储相关
export const STORAGE_KEY = 'art-exploration-data';
export const AUTO_SAVE_DELAY = 800;
