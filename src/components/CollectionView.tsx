import { useState, useMemo, useRef, useEffect } from 'react';
import type { ArtItem, DomainKey, StatusKey, SenseKey, TreasureMap } from '../types';
import { exportAll } from '../utils/export';
import { ImportModal } from './ImportModal';
import { WishPanel } from './WishPanel';
import { FilterBar } from './FilterBar';
import { ItemCard } from './ItemCard';
import './CollectionView.css';

interface CollectionViewProps {
  items: ArtItem[];
  treasureMaps?: TreasureMap[];
  onNavigateToHome: () => void;
  onNavigateToAdd: () => void;
  onCycleStatus: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ArtItem>) => void;
  onDelete: (id: string) => void;
  onImport: (items: ArtItem[], mode: 'merge' | 'replace') => Promise<void>;
  onReset: () => void;
}

export function CollectionView({
  items,
  treasureMaps = [],
  onNavigateToHome,
  onNavigateToAdd,
  onCycleStatus,
  onUpdate,
  onDelete,
  onImport,
  onReset,
}: CollectionViewProps) {
  const [statusFilter, setStatusFilter] = useState<StatusKey | ''>('');
  const [domainFilter, setDomainFilter] = useState<DomainKey | ''>('');
  const [senseFilter, setSenseFilter] = useState<SenseKey | ''>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showWish, setShowWish] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (domainFilter && item.domain !== domainFilter) return false;
      if (senseFilter && (!item.senses || (item.senses[senseFilter] || 0) < 30)) return false;
      return true;
    });
  }, [items, statusFilter, domainFilter, senseFilter]);

  const handleExport = (e: React.MouseEvent) => {
    e.preventDefault();
    exportAll(items, treasureMaps);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleNavigate = (id: string) => {
    setExpandedId(id);
    // Scroll to the card
    setTimeout(() => {
      const card = cardRefs.current[id];
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Clear expanded ID when filters change
  useEffect(() => {
    setExpandedId(null);
  }, [statusFilter, domainFilter, senseFilter]);

  return (
    <div className="collection-view">
      <div className="collection-header">
        <button className="back-btn" onClick={onNavigateToHome}>
          ← 返回
        </button>
        <div className="header-actions">
          <button className="header-btn add" onClick={onNavigateToAdd}>
            藏品入库
          </button>
          <button className="header-btn import" onClick={() => setShowImport(true)}>
            导入
          </button>
          <button className="header-btn export" onClick={handleExport}>
            导出
          </button>
          <button className="header-btn reset" onClick={onReset}>
            重置
          </button>
        </div>
      </div>

      <div className="collection-title">
        <h2>藏宝阁</h2>
        <p>{items.length} 条藏品</p>
      </div>

      <FilterBar
        statusFilter={statusFilter}
        domainFilter={domainFilter}
        senseFilter={senseFilter}
        onStatusChange={setStatusFilter}
        onDomainChange={setDomainFilter}
        onSenseChange={setSenseFilter}
      />

      <div className="wish-toggle-row">
        <button
          className={`wish-toggle-btn ${showWish ? 'active' : ''}`}
          onClick={() => setShowWish(!showWish)}
        >
          感受不可能
        </button>
      </div>

      {showWish && (
        <WishPanel
          items={items}
          onClose={() => setShowWish(false)}
          onNavigate={handleNavigate}
        />
      )}

      <div className="items-container">
        {filteredItems.length === 0 ? (
          <div className="empty-state">暂无匹配记录</div>
        ) : (
          <div className="items-grid">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                ref={(el) => { cardRefs.current[item.id] = el; }}
              >
                <ItemCard
                  item={item}
                  allItems={items}
                  isExpanded={expandedId === item.id}
                  onToggleExpand={() => toggleExpand(item.id)}
                  onCycleStatus={() => onCycleStatus(item.id)}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onNavigate={handleNavigate}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={onImport}
          currentItems={items}
        />
      )}
    </div>
  );
}
