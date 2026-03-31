import type { Item, TreasureMap } from '../types';
import { DOMAINS, STATUS_CONFIG } from '../data/constants';

export function exportToJSON(items: Item[], treasureMaps?: TreasureMap[]): void {
  const data = {
    version: 3,
    lastModified: new Date().toISOString(),
    items,
    treasureMaps: treasureMaps || [],
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `art-exploration-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

export function exportToTXT(items: Item[], treasureMaps?: TreasureMap[]): void {
  const lines = items.map((item) => {
    const senses = item.senses
      ? Object.entries(item.senses)
          .map(([k, v]) => `${k}:${v}`)
          .join(', ')
      : '';
    const status = STATUS_CONFIG[item.status]?.label || item.status;
    return `[${status}] ${item.title}\n领域: ${DOMAINS[item.domain]?.label || item.domain}\n描述: ${item.description || ''}\n感官: ${senses}\n备注: ${item.notes || ''}`;
  });

  const treasureMapLines = treasureMaps?.map((tm) => {
    const explored = tm.items.filter((i) => i.exploreStatus === 'explored').length;
    return `【寻宝图】${tm.name}\n描述: ${tm.description}\n进度: ${explored}/${tm.items.length}\n${tm.items
      .map((item) => `  ${item.exploreStatus === 'explored' ? '✓' : '○'} ${item.title} (${DOMAINS[item.domain]?.label || item.domain})`)
      .join('\n')}`;
  }) || [];

  const content = `艺术探索星图 - 数据导出\n导出时间: ${new Date().toLocaleString('zh-CN')}\n总条目数: ${items.length}\n寻宝图数量: ${treasureMaps?.length || 0}\n\n${'='.repeat(40)}\n\n【藏品】\n\n${lines.join('\n\n---\n\n')}${treasureMapLines.length > 0 ? `\n\n${'='.repeat(40)}\n\n【寻宝图】\n\n${treasureMapLines.join('\n\n---\n\n')}` : ''}`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `art-exploration-${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();

  URL.revokeObjectURL(url);
}

export function exportAll(items: Item[], treasureMaps?: TreasureMap[]): void {
  exportToJSON(items, treasureMaps);
  // Small delay to ensure first download starts
  setTimeout(() => exportToTXT(items, treasureMaps), 100);
}
