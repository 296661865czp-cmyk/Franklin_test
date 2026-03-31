import { useState, useMemo } from 'react';
import type { ArtItem, SenseScores } from '../types';
import { DOMAIN_COLORS } from '../data/constants';
import { matchItemsBySenses } from '../utils/similarity';
import { SenseSlider } from './SenseSlider';
import './WishPanel.css';

interface WishPanelProps {
  items: ArtItem[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function WishPanel({ items, onClose, onNavigate }: WishPanelProps) {
  const [customSenses, setCustomSenses] = useState<SenseScores>({});

  const matches = useMemo(() => {
    if (Object.keys(customSenses).length === 0) return [];
    return matchItemsBySenses(items, customSenses).slice(0, 3);
  }, [items, customSenses]);

  const handleReset = () => {
    setCustomSenses({});
  };

  const handleSenseChange = (senses: SenseScores) => {
    setCustomSenses(senses);
  };

  return (
    <div className="wish-panel">
      <div className="wish-header">
        <div className="wish-title">感受不可能</div>
        <div className="wish-actions">
          <button className="wish-reset-btn" onClick={handleReset}>
            重置
          </button>
          <button className="wish-close-btn" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>

      <div className="wish-slider-section">
        <SenseSlider
          onChange={handleSenseChange}
          initialValues={customSenses}
          showLabels={true}
          prefix="wish-"
        />
      </div>

      <div className="wish-recommendations">
        {matches.length > 0 ? (
          <>
            <div className="wish-reco-title">为你推荐：</div>
            {matches.map(({ item, score }) => (
              <button
                key={item.id}
                className="wish-reco-item"
                style={{
                  color: DOMAIN_COLORS[item.domain],
                  borderColor: `${DOMAIN_COLORS[item.domain]}40`,
                  background: `${DOMAIN_COLORS[item.domain]}10`,
                }}
                onClick={() => onNavigate(item.id)}
              >
                <span className="wish-reco-icon">{item.title.charAt(0)}</span>
                <span className="wish-reco-title-text">{item.title}</span>
                <span className="wish-reco-score">{Math.round(score * 100)}% 匹配</span>
              </button>
            ))}
          </>
        ) : (
          <div className="wish-empty">
            {Object.keys(customSenses).length === 0
              ? '拖动滑块，探索与你感官共鸣的艺术'
              : '暂无匹配项，尝试调整滑块'}
          </div>
        )}
      </div>
    </div>
  );
}
