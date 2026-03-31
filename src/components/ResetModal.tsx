import { useState } from 'react';
import './ResetModal.css';

interface ResetModalProps {
  onClose: () => void;
  onReset: (clearItems: boolean, clearTreasureMaps: boolean) => Promise<void>;
}

export function ResetModal({ onClose, onReset }: ResetModalProps) {
  const [clearItems, setClearItems] = useState(true);
  const [clearTreasureMaps, setClearTreasureMaps] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isResetting) {
      onClose();
    }
  };

  const handleReset = async () => {
    if (!clearItems && !clearTreasureMaps) return;

    setIsResetting(true);
    try {
      await onReset(clearItems, clearTreasureMaps);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Reset failed:', err);
      setIsResetting(false);
    }
  };

  const canReset = clearItems || clearTreasureMaps;

  return (
    <>
      <div className="reset-modal-backdrop" onClick={handleBackdropClick}>
        <div className="reset-modal">
          <div className="reset-modal-header">
            <h3>重置数据</h3>
            {!isResetting && (
              <button className="reset-modal-close" onClick={onClose}>×</button>
            )}
          </div>

          {!isResetting ? (
            <div className="reset-modal-body">
              <div className="reset-warning">
                <span className="reset-warning-icon">⚠️</span>
                <span className="reset-warning-text">
                  此操作将清除所选数据且不可恢复，请谨慎操作
                </span>
              </div>

              <div className="reset-options">
                <label className="reset-option">
                  <input
                    type="checkbox"
                    checked={clearItems}
                    onChange={(e) => setClearItems(e.target.checked)}
                  />
                  <div className="reset-option-content">
                    <div className="reset-option-title">藏宝阁数据</div>
                    <div className="reset-option-desc">清除所有藏品记录</div>
                  </div>
                </label>

                <label className="reset-option">
                  <input
                    type="checkbox"
                    checked={clearTreasureMaps}
                    onChange={(e) => setClearTreasureMaps(e.target.checked)}
                  />
                  <div className="reset-option-content">
                    <div className="reset-option-title">寻宝图数据</div>
                    <div className="reset-option-desc">清除所有寻宝图及其探索进度</div>
                  </div>
                </label>
              </div>

              <div className="reset-modal-actions">
                <button className="reset-btn cancel" onClick={onClose}>
                  取消
                </button>
                <button
                  className="reset-btn confirm"
                  onClick={handleReset}
                  disabled={!canReset}
                >
                  确认清除
                </button>
              </div>
            </div>
          ) : (
            <div className="reset-loading">正在清除数据...</div>
          )}
        </div>
      </div>

      {showToast && (
        <div className="reset-success-toast">
          ✓ 清除成功
        </div>
      )}
    </>
  );
}
