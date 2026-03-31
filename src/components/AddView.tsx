import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ArtItem, DomainKey, StatusKey, SenseScores } from '../types';
import { DOMAINS } from '../data/constants';
import { SenseSlider } from './SenseSlider';
import './AddView.css';

interface PrefillData {
  title: string;
  domain: string;
  description: string;
  hints?: string;
  treasureMapId: string;
  treasureMapItemId: string;
}

interface AddViewProps {
  isActive?: boolean;
  prefillData?: PrefillData | null;
  onNavigateToHome: () => void;
  onNavigateToCollection: () => void;
  onAdd: (item: Omit<ArtItem, 'createdAt' | 'updatedAt'>) => Promise<ArtItem>;
}

export function AddView({ isActive, prefillData, onNavigateToHome, onNavigateToCollection, onAdd }: AddViewProps) {
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState<DomainKey>('music');
  const [status, setStatus] = useState<StatusKey>('next');
  const [description, setDescription] = useState('');
  const [senses, setSenses] = useState<SenseScores>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // 处理预填数据
  useEffect(() => {
    if (prefillData) {
      setTitle(prefillData.title);
      setDomain(prefillData.domain as DomainKey);
      setDescription(prefillData.description);
    }
  }, [prefillData]);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    const newItem = {
      id: `custom-${uuidv4()}`,
      title: title.trim(),
      domain,
      status,
      description: description.trim(),
      senses,
      connections: [],
      notes: '',
    };

    await onAdd(newItem);

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      // Navigate to collection after success
      onNavigateToCollection();
    }, 1500);

    // Reset form (in case user goes back)
    setTitle('');
    setDomain('music');
    setStatus('next');
    setDescription('');
    setSenses({});
  };

  return (
    <div id="add-view" className={`view${isActive ? ' active' : ''}`}>
      <div className="add-container">
        <div className="add-header">
          <button className="back-btn" onClick={onNavigateToHome}>
            ← 返回
          </button>
        </div>

        <div className="add-title">
          <h2>藏品入库</h2>
          <p>记录一个新的艺术体验</p>
        </div>

        <div className="add-form">
          <div className={`add-success ${showSuccess ? 'show' : ''}`}>收藏成功 ✓</div>

          {prefillData?.hints && (
            <div className="add-hints-box">
              <div className="add-hints-label">💡 探索提示</div>
              <div className="add-hints-text">{prefillData.hints}</div>
            </div>
          )}

          <input
            type="text"
            className="add-input"
            placeholder="标题，例如：Chopin 练习曲"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="add-row">
            <select
              className="add-select"
              value={domain}
              onChange={(e) => setDomain(e.target.value as DomainKey)}
            >
              {Object.entries(DOMAINS).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
            <select
              className="add-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusKey)}
            >
              <option value="explored">✦ 已探索</option>
              <option value="next">→ 下一步</option>
              <option value="future">· 远方</option>
            </select>
          </div>

          <textarea
            className="add-textarea"
            rows={2}
            placeholder="描述（可选）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="add-sense-title">感官评分（可选）：</div>
          <SenseSlider
            prefix="add-"
            onChange={setSenses}
            initialValues={senses}
          />

          <div className="add-form-actions">
            <button
              className="add-submit-btn"
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              收藏
            </button>
            <button className="add-cancel-btn" onClick={onNavigateToHome}>
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
