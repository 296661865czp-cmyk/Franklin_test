import { useState, useRef } from 'react';
import type { ArtItem } from '../types';
import './ImportModal.css';

interface ImportPreview {
  total: number;
  newCount: number;
  updateCount: number;
  invalidCount: number;
  validItems: ArtItem[];
  errors: string[];
}

interface ImportModalProps {
  onClose: () => void;
  onImport: (items: ArtItem[], mode: 'merge' | 'replace') => Promise<void>;
  currentItems: ArtItem[];
}

export function ImportModal({ onClose, onImport, currentItems }: ImportModalProps) {
  const [step, setStep] = useState<'select' | 'preview' | 'importing' | 'result'>('select');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedMode, setSelectedMode] = useState<'merge' | 'replace'>('merge');
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAndClose = () => {
    setStep('select');
    setPreview(null);
    setImportResult(null);
    setParseError(null);
    setSelectedMode('merge');
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size === 0) {
      setParseError('文件为空');
      return;
    }

    const text = await file.text();
    if (!text.trim()) {
      setParseError('文件为空');
      return;
    }

    let data: { items?: unknown[] };
    try {
      data = JSON.parse(text);
    } catch {
      setParseError('文件格式错误');
      return;
    }

    if (!data.items || !Array.isArray(data.items)) {
      setParseError('文件格式错误');
      return;
    }

    // Validate items and count new/update
    const currentIds = new Set(currentItems.map((i) => i.id));
    let newCount = 0;
    let updateCount = 0;
    let invalidCount = 0;
    const validItems: ArtItem[] = [];
    const errors: string[] = [];

    const DOMAINS = ['music', 'painting', 'sculpture', 'dance', 'literature', 'flavor', 'film', 'synesthesia', 'sports'];
    const STATUSES = ['explored', 'next', 'future'];

    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i] as Record<string, unknown>;

      // Basic validation
      if (typeof item !== 'object' || item === null) {
        invalidCount++;
        errors.push(`第 ${i + 1} 条：无效对象`);
        continue;
      }

      if (typeof item.id !== 'string' || !item.id.trim()) {
        invalidCount++;
        errors.push(`第 ${i + 1} 条：缺少有效 ID`);
        continue;
      }

      if (typeof item.title !== 'string' || !item.title.trim()) {
        invalidCount++;
        errors.push(`第 ${i + 1} 条：缺少有效标题`);
        continue;
      }

      if (!DOMAINS.includes(item.domain as string)) {
        invalidCount++;
        errors.push(`第 ${i + 1} 条 "${item.title}"：无效领域 "${item.domain}"`);
        continue;
      }

      if (!STATUSES.includes(item.status as string)) {
        invalidCount++;
        errors.push(`第 ${i + 1} 条 "${item.title}"：无效状态 "${item.status}"`);
        continue;
      }

      // Validate senses
      if (item.senses !== undefined) {
        if (typeof item.senses !== 'object' || item.senses === null) {
          invalidCount++;
          errors.push(`第 ${i + 1} 条 "${item.title}"：感官数据格式错误`);
          continue;
        }
        for (const [, v] of Object.entries(item.senses)) {
          if (typeof v !== 'number' || v < 0 || v > 100) {
            invalidCount++;
            errors.push(`第 ${i + 1} 条 "${item.title}"：感官值超出范围`);
            continue;
          }
        }
      }

      // Validate connections
      if (item.connections !== undefined && !Array.isArray(item.connections)) {
        invalidCount++;
        errors.push(`第 ${i + 1} 条 "${item.title}"：关联格式错误`);
        continue;
      }

      const now = new Date().toISOString();
      const validatedItem: ArtItem = {
        id: item.id,
        title: item.title,
        domain: item.domain as ArtItem['domain'],
        status: item.status as ArtItem['status'],
        senses: item.senses as ArtItem['senses'],
        description: item.description as string | undefined,
        suggestion: item.suggestion as string | undefined,
        notes: item.notes as string | undefined,
        connections: item.connections as string[] | undefined,
        createdAt: (item.createdAt as string) || now,
        updatedAt: (item.updatedAt as string) || now,
      };

      if (currentIds.has(item.id as string)) {
        updateCount++;
      } else {
        newCount++;
      }

      validItems.push(validatedItem);
    }

    if (validItems.length === 0) {
      setParseError(`无法导入：所有 ${invalidCount} 条记录均无效`);
      return;
    }

    setPreview({ total: data.items.length, newCount, updateCount, invalidCount, validItems, errors });
    setStep('preview');
    setParseError(null);
  };

  const handleImport = async () => {
    if (!preview) return;
    setStep('importing');
    try {
      await onImport(preview.validItems, selectedMode);
      setImportResult({ success: true, message: `导入成功：新增 ${preview.newCount} 条，更新 ${preview.updateCount} 条` });
    } catch (err) {
      setImportResult({ success: false, message: err instanceof Error ? err.message : '导入失败' });
    }
    setStep('result');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      resetAndClose();
    }
  };

  return (
    <div className="import-modal-backdrop" onClick={handleBackdropClick}>
      <div className="import-modal">
        <div className="import-modal-header">
          <h3>导入数据</h3>
          <button className="import-modal-close" onClick={resetAndClose}>×</button>
        </div>

        {step === 'select' && (
          <div className="import-modal-body">
            {parseError && (
              <div className="import-error-msg">{parseError}</div>
            )}

            <p className="import-desc">选择要导入的 JSON 文件（.json）</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="import-file-input"
              onChange={handleFileSelect}
            />

            <div className="import-modal-actions">
              <button
                className="import-btn primary"
                onClick={() => fileInputRef.current?.click()}
              >
                选择文件
              </button>
              <button className="import-btn secondary" onClick={resetAndClose}>
                取消
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="import-modal-body">
            <div className="import-preview">
              <div className="preview-title">导入预览</div>
              <div className="preview-stats">
                <div className="preview-stat">
                  <span className="stat-num">{preview.total}</span>
                  <span className="stat-label">总记录</span>
                </div>
                <div className="preview-stat new">
                  <span className="stat-num">{preview.newCount}</span>
                  <span className="stat-label">新增</span>
                </div>
                <div className="preview-stat update">
                  <span className="stat-num">{preview.updateCount}</span>
                  <span className="stat-label">更新</span>
                </div>
                {preview.invalidCount > 0 && (
                  <div className="preview-stat invalid">
                    <span className="stat-num">{preview.invalidCount}</span>
                    <span className="stat-label">无效</span>
                  </div>
                )}
              </div>

              {preview.errors.length > 0 && (
                <div className="preview-errors">
                  <div className="preview-errors-title">以下记录有问题（将被跳过）：</div>
                  {preview.errors.slice(0, 5).map((err, i) => (
                    <div key={i} className="preview-error-item">{err}</div>
                  ))}
                  {preview.errors.length > 5 && (
                    <div className="preview-error-more">...还有 {preview.errors.length - 5} 条</div>
                  )}
                </div>
              )}

              <div className="import-mode-section">
                <div className="mode-label">导入模式：</div>
                <label className="mode-option">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={selectedMode === 'merge'}
                    onChange={() => setSelectedMode('merge')}
                  />
                  <span className="mode-title">增量合并</span>
                  <span className="mode-desc">保留现有数据，新增/更新导入的记录</span>
                </label>
                <label className="mode-option">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={selectedMode === 'replace'}
                    onChange={() => setSelectedMode('replace')}
                  />
                  <span className="mode-title">全量替换</span>
                  <span className="mode-desc">清空现有数据，完全使用导入数据</span>
                </label>
              </div>
            </div>

            <div className="import-modal-actions">
              <button className="import-btn primary" onClick={handleImport}>
                确认导入
              </button>
              <button className="import-btn secondary" onClick={resetAndClose}>
                取消
              </button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="import-modal-body">
            <div className="import-loading">导入中...</div>
          </div>
        )}

        {step === 'result' && importResult && (
          <div className="import-modal-body">
            <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
              {importResult.message}
            </div>
            <div className="import-modal-actions">
              <button className="import-btn primary" onClick={resetAndClose}>
                完成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
