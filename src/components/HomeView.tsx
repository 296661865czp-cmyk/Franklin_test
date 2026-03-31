import type { Item, TreasureMap } from '../types';
import { exportAll } from '../utils/export';
import './HomeView.css';

interface HomeViewProps {
  items: Item[];
  treasureMaps?: TreasureMap[];
  onNavigateToAdd: () => void;
  onNavigateToCollection: () => void;
  onNavigateToTreasureMapList: () => void;
}

export function HomeView({ items, treasureMaps = [], onNavigateToAdd, onNavigateToCollection, onNavigateToTreasureMapList }: HomeViewProps) {
  const handleExport = (e: React.MouseEvent) => {
    e.preventDefault();
    exportAll(items, treasureMaps);
  };

  const treasureMapsCount = treasureMaps.length;

  return (
    <div id="home-view" className="home-view">
      <div className="home-accent" />

      <div className="home-title">
        <div className="home-subtitle-en">PERSONAL ART ODYSSEY</div>
        <h1>艺术探索星图</h1>
        <p>跨越感官边界，探索艺术的无限维度</p>
        <p className="count">共 {items.length} 条探索记录</p>
      </div>

      <div className="home-buttons">
        <button className="home-btn purple" onClick={onNavigateToTreasureMapList}>
          <div className="home-btn-icon">✦</div>
          <div>
            <div className="home-btn-title">寻宝图</div>
            <div className="home-btn-sub">
              {treasureMapsCount > 0
                ? `${treasureMapsCount} 张寻宝图`
                : '开始艺术探索之旅'}
            </div>
          </div>
        </button>
        <button className="home-btn gold" onClick={onNavigateToAdd}>
          <div className="home-btn-icon">＋</div>
          <div>
            <div className="home-btn-title">藏品入库</div>
            <div className="home-btn-sub">记录一个新的艺术体验</div>
          </div>
        </button>
        <button className="home-btn blue" onClick={onNavigateToCollection}>
          <div className="home-btn-icon">◇</div>
          <div>
            <div className="home-btn-title">藏宝阁</div>
            <div className="home-btn-sub">管理 {items.length} 条探索记录</div>
          </div>
        </button>
      </div>

      <div className="home-footer">
        数据存储于本地 · 自动保存 ·{' '}
        <a href="#" onClick={handleExport}>
          一键导出
        </a>
      </div>
    </div>
  );
}
