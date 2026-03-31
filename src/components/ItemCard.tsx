import { useState } from 'react';
import type { ArtItem } from '../types';
import { DOMAINS, STATUS_CONFIG, DOMAIN_COLORS } from '../data/constants';
import { getSensoryFingerprint, getRelatedItems, getOppositeItems } from '../utils/similarity';
import { ComparePanel } from './ComparePanel';
import './ItemCard.css';

interface ItemCardProps {
  item: ArtItem;
  allItems: ArtItem[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onCycleStatus: () => void;
  onUpdate: (id: string, updates: Partial<ArtItem>) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
}

export function ItemCard({
  item,
  allItems,
  isExpanded,
  onToggleExpand,
  onCycleStatus,
  onUpdate,
  onDelete,
  onNavigate,
}: ItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [compareWithId, setCompareWithId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: item.title,
    description: item.description || '',
    domain: item.domain,
    status: item.status,
    notes: item.notes || '',
  });

  const domain = DOMAINS[item.domain];
  const status = STATUS_CONFIG[item.status];
  const domainColor = DOMAIN_COLORS[item.domain];
  const fingerprint = getSensoryFingerprint(item.senses);

  const relatedItems = getRelatedItems(allItems, item, 3);
  const oppositeItems = getOppositeItems(allItems, item, 3);

  const handleSave = () => {
    onUpdate(item.id, editForm);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm({
      title: item.title,
      description: item.description || '',
      domain: item.domain,
      status: item.status,
      notes: item.notes || '',
    });
    setIsEditing(false);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`item-card status-${item.status} ${isExpanded ? 'expanded' : ''}`}
      onClick={onToggleExpand}
    >
      <div className="item-card-header">
        <div className={`status-dot ${status.dotClass}`} />
        <div className="item-title">{item.title}</div>
      </div>

      <div className="item-tags">
        <span
          className={`item-tag domain-${item.domain}`}
          style={{ color: domainColor, borderColor: `${domainColor}40`, background: `${domainColor}10` }}
        >
          {domain.icon} {domain.label}
        </span>
        <button
          className="item-tag status-tag"
          style={{ color: domainColor, borderColor: `${domainColor}40`, background: `${domainColor}10` }}
          onClick={(e) => {
            e.stopPropagation();
            onCycleStatus();
          }}
        >
          {status.emoji} {status.label}
        </button>
      </div>

      {isExpanded && (
        <div className="item-expanded" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            // ========== 编辑模式 ==========
            <div className="edit-section show">
              <input
                type="text"
                className="edit-input"
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              />
              <textarea
                className="edit-textarea"
                rows={2}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="描述..."
              />
              <div className="edit-select-row">
                <select
                  className="edit-select"
                  value={editForm.domain}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, domain: e.target.value as ArtItem['domain'] }))}
                >
                  {Object.entries(DOMAINS).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
                <select
                  className="edit-select"
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as ArtItem['status'] }))}
                >
                  <option value="explored">✦ 已探索</option>
                  <option value="next">→ 下一步</option>
                  <option value="future">· 远方</option>
                </select>
              </div>
              <textarea
                className="edit-textarea"
                rows={2}
                value={editForm.notes}
                onChange={(e) => setEditForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="笔记..."
              />
              <div className="edit-actions">
                <button className="edit-btn save" onClick={handleSave}>
                  保存
                </button>
                <button className="edit-btn cancel" onClick={handleCancel}>
                  取消
                </button>
                <div style={{ flex: 1 }} />
                <button
                  className="edit-btn danger"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  删除
                </button>
              </div>
            </div>
          ) : (
            // ========== 查看模式 ==========
            <>
              <p style={{ margin: '0 0 8px 0' }}>{item.description || ''}</p>

              {item.suggestion && (
                <div className="suggestion-box">{item.suggestion}</div>
              )}

              {fingerprint.length > 0 && (
                <div className="sensory-section">
                  <div className="sensory-section-title">感官指纹：</div>
                  <div className="sensory-bars">
                    {fingerprint.map((s) => (
                      <div key={s.key} className="sensory-bar-item">
                        <span className="sensory-icon" style={{ color: s.color }}>
                          {s.icon}
                        </span>
                        <span className="sensory-name">{s.label}</span>
                        <div className="sensory-bar-track">
                          <div
                            className="sensory-bar-fill"
                            style={{
                              width: `${s.value}%`,
                              background: s.color,
                              opacity: 0.5 + s.value / 100 / 2,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="notes-btn"
                onClick={() => setIsEditing(true)}
              >
                {item.notes
                  ? `✏️ ${item.notes.substring(0, 30)}${item.notes.length > 30 ? '...' : ''}`
                  : '✏️ 添加笔记...'}
              </div>

              {item.connections && item.connections.length > 0 && (
                <div className="connections-section">
                  <div className="section-title">关联星点：</div>
                  <div className="connection-tags">
                    {item.connections.map((connId) => {
                      const connItem = allItems.find((i) => i.id === connId);
                      if (!connItem) return null;
                      const connDomain = DOMAINS[connItem.domain];
                      return (
                        <button
                          key={connId}
                          className="connection-tag"
                          style={{
                            color: DOMAIN_COLORS[connItem.domain],
                            borderColor: `${DOMAIN_COLORS[connItem.domain]}40`,
                            background: `${DOMAIN_COLORS[connItem.domain]}10`,
                          }}
                          onClick={() => onNavigate(connId)}
                        >
                          {connDomain.icon} {connItem.title}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {relatedItems.length > 0 && (
                <div className="recommend-section">
                  <div className="section-title">相似推荐：</div>
                  {relatedItems.map((r) => (
                    <div key={r.id} className="recommend-item">
                      <button
                        className="recommend-btn"
                        style={{
                          color: DOMAIN_COLORS[r.domain],
                          borderColor: `${DOMAIN_COLORS[r.domain]}40`,
                          background: `${DOMAIN_COLORS[r.domain]}10`,
                        }}
                        onClick={() =>
                          setCompareWithId(compareWithId === r.id ? null : r.id)
                        }
                      >
                        <span className="recommend-icon">{DOMAINS[r.domain].icon}</span>
                        <span className="recommend-title">{r.title}</span>
                        <span className="recommend-score">
                          {Math.round(r.similarity * 100)}% 相似
                        </span>
                      </button>
                      {compareWithId === r.id && (
                        <ComparePanel
                          item1={item}
                          item2={r}
                          onJump={() => onNavigate(r.id)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {oppositeItems.length > 0 && (
                <div className="recommend-section">
                  <div className="section-title">反差推荐：</div>
                  {oppositeItems.map((r) => (
                    <div key={r.id} className="recommend-item">
                      <button
                        className="recommend-btn"
                        style={{
                          color: DOMAIN_COLORS[r.domain],
                          borderColor: `${DOMAIN_COLORS[r.domain]}40`,
                          background: `${DOMAIN_COLORS[r.domain]}10`,
                        }}
                        onClick={() =>
                          setCompareWithId(compareWithId === r.id ? null : r.id)
                        }
                      >
                        <span className="recommend-icon">{DOMAINS[r.domain].icon}</span>
                        <span className="recommend-title">{r.title}</span>
                        <span className="recommend-score">反差 ↑</span>
                      </button>
                      {compareWithId === r.id && (
                        <ComparePanel
                          item1={item}
                          item2={r}
                          onJump={() => onNavigate(r.id)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {showDeleteConfirm ? (
                <div className="delete-confirm">
                  <span className="delete-confirm-text">确认删除？</span>
                  <button
                    className="delete-confirm-btn confirm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                  >
                    删除
                  </button>
                  <button
                    className="delete-confirm-btn cancel"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(false);
                    }}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="item-actions">
                  <button
                    className="action-btn edit"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                  >
                    编辑
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                  >
                    删除
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
