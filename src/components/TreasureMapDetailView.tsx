import type { TreasureMap, ArtItem } from '../types';
import { DOMAINS } from '../data/constants';
import './TreasureMapDetailView.css';

interface TreasureMapDetailViewProps {
  treasureMap: TreasureMap;
  allItems: ArtItem[];
  onNavigateToList: () => void;
  onExplore: (treasureMapId: string, itemId: string, title: string, domain: string, description: string, hints?: string) => void;
  onNavigateToCollection: (itemId: string) => void;
}

export function TreasureMapDetailView({
  treasureMap,
  allItems,
  onNavigateToList,
  onExplore,
  onNavigateToCollection,
}: TreasureMapDetailViewProps) {
  const exploredCount = treasureMap.items.filter((item) => item.exploreStatus === 'explored').length;
  const progress = treasureMap.items.length > 0 ? (exploredCount / treasureMap.items.length) * 100 : 0;

  const getCollectionItem = (collectionItemId?: string): ArtItem | undefined => {
    if (!collectionItemId) return undefined;
    return allItems.find((item) => item.id === collectionItemId);
  };

  return (
    <div className="treasure-map-detail-view">
      <div className="treasure-map-detail-header">
        <button className="back-btn" onClick={onNavigateToList}>
          ← 返回
        </button>
      </div>

      <div className="treasure-map-detail-title">
        <h2>{treasureMap.name}</h2>
        <p>{treasureMap.description}</p>
      </div>

      <div className="treasure-map-detail-progress">
        <div className="treasure-map-detail-progress-bar">
          <div
            className="treasure-map-detail-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="treasure-map-detail-progress-text">
          {exploredCount}/{treasureMap.items.length}
        </span>
      </div>

      <div className="treasure-map-items">
        {treasureMap.items.map((item) => {
          const isExplored = item.exploreStatus === 'explored';
          const collectionItem = getCollectionItem(item.collectionItemId);
          const domainConfig = DOMAINS[item.domain];

          return (
            <div
              key={item.id}
              className={`treasure-map-item-card ${isExplored ? 'explored' : ''}`}
            >
              <div className="treasure-map-item-header">
                <div
                  className={`treasure-map-item-status-icon ${isExplored ? 'explored' : 'unexplored'}`}
                >
                  {isExplored ? '✓' : '○'}
                </div>
                <div className="treasure-map-item-info">
                  <div className="treasure-map-item-title">{item.title}</div>
                  <span
                    className={`treasure-map-item-domain item-tag domain-${item.domain}`}
                  >
                    {domainConfig?.icon} {domainConfig?.label}
                  </span>
                </div>
              </div>

              {item.description && (
                <div className="treasure-map-item-description">
                  {item.description}
                </div>
              )}

              {item.hints && !isExplored && (
                <div className="treasure-map-item-hints">
                  💡 探索提示：{item.hints}
                </div>
              )}

              <div className="treasure-map-item-actions">
                {!isExplored ? (
                  <button
                    className="treasure-map-explore-btn"
                    onClick={() =>
                      onExplore(
                        treasureMap.id,
                        item.id,
                        item.title,
                        item.domain,
                        item.description || '',
                        item.hints
                      )
                    }
                  >
                    去探索
                  </button>
                ) : (
                  collectionItem && (
                    <button
                      className="treasure-map-view-collection-btn"
                      onClick={() => onNavigateToCollection(collectionItem.id)}
                    >
                      查看藏品 ✓
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
