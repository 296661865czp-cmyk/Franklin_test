import type { Item } from '../types';
import { SENSES, DOMAIN_COLORS } from '../data/constants';
import './ComparePanel.css';

interface ComparePanelProps {
  item1: Item;
  item2: Item;
  onJump?: () => void;
}

export function ComparePanel({ item1, item2, onJump }: ComparePanelProps) {
  const commonSenses = SENSES.filter(
    (s) => (item1.senses?.[s.key] ?? 0) > 0 || (item2.senses?.[s.key] ?? 0) > 0
  );

  return (
    <div className="compare-panel show">
      <div className="compare-header">
        <div className="compare-label">
          感官对比：{item1.title} ↔ {item2.title}
        </div>
        {onJump && (
          <button
            className="jump-btn"
            style={{
              color: DOMAIN_COLORS[item2.domain],
              borderColor: `${DOMAIN_COLORS[item2.domain]}40`,
              background: `${DOMAIN_COLORS[item2.domain]}10`,
            }}
            onClick={onJump}
          >
            跳转 →
          </button>
        )}
      </div>
      {commonSenses.map((s) => {
        const v1 = item1.senses?.[s.key] || 0;
        const v2 = item2.senses?.[s.key] || 0;
        const diff = Math.abs(v1 - v2);
        const same = diff === 0;

        return (
          <div key={s.key} className="compare-row">
            <div className="compare-sense-label" style={{ color: s.color }}>
              {s.icon}
              {s.label}
            </div>
            <div className="compare-bar-group">
              <div className="compare-item1">
                <span className="compare-item1-val">{v1}</span>
                <div className="compare-bar">
                  <div
                    className="compare-bar-fill"
                    style={{
                      width: `${v1}%`,
                      background: DOMAIN_COLORS[item1.domain],
                    }}
                  />
                </div>
              </div>
              <span className={`compare-diff ${same ? 'diff-equal' : 'diff-diff'}`}>
                {same ? '=' : `差${diff}`}
              </span>
              <div className="compare-item2">
                <div className="compare-bar">
                  <div
                    className="compare-bar-fill"
                    style={{
                      width: `${v2}%`,
                      background: DOMAIN_COLORS[item2.domain],
                    }}
                  />
                </div>
                <span className="compare-item2-val">{v2}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
