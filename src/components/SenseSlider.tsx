import { useRef, useCallback, useState, useEffect } from 'react';
import type { SenseKey, SenseScores } from '../types';
import { SENSES } from '../data/constants';
import './SenseSlider.css';

interface SenseSliderProps {
  onChange?: (senses: SenseScores) => void;
  initialValues?: SenseScores;
  showLabels?: boolean;
  prefix?: string;
}

export function SenseSlider({
  onChange,
  initialValues = {},
  showLabels = true,
  prefix = '',
}: SenseSliderProps) {
  const [values, setValues] = useState<SenseScores>(initialValues);
  const trackRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const draggingRef = useRef<SenseKey | null>(null);

  // Sync with external changes
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const updateValue = useCallback(
    (key: SenseKey, value: number) => {
      const newValues = { ...values };
      if (value > 0) {
        newValues[key] = value;
      } else {
        delete newValues[key];
      }
      setValues(newValues);
      onChange?.(newValues);
    },
    [values, onChange]
  );

  const getValueFromEvent = useCallback((e: MouseEvent | TouchEvent, key: SenseKey): number => {
    const track = trackRefs.current[key];
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const val = Math.round(((clientX - rect.left) / rect.width) * 100);
    return Math.max(0, Math.min(100, val));
  }, []);

  const handlePointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current) return;
      const val = getValueFromEvent(e, draggingRef.current);
      updateValue(draggingRef.current, val);
    },
    [getValueFromEvent, updateValue]
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
    document.removeEventListener('mousemove', handlePointerMove);
    document.removeEventListener('mouseup', handlePointerUp);
    document.removeEventListener('touchmove', handlePointerMove);
    document.removeEventListener('touchend', handlePointerUp);
  }, [handlePointerMove]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent, key: SenseKey) => {
      const val = getValueFromEvent(e.nativeEvent, key);
      updateValue(key, val);
    },
    [getValueFromEvent, updateValue]
  );

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent, key: SenseKey) => {
      e.preventDefault();
      draggingRef.current = key;

      // Handle touch events
      if ('touches' in e) {
        document.addEventListener('touchmove', handlePointerMove, { passive: false });
        document.addEventListener('touchend', handlePointerUp);
      } else {
        document.addEventListener('mousemove', handlePointerMove);
        document.addEventListener('mouseup', handlePointerUp);
      }

      // Immediate update on touch start
      const val = getValueFromEvent(e.nativeEvent, key);
      updateValue(key, val);
    },
    [getValueFromEvent, handlePointerMove, handlePointerUp, updateValue]
  );

  const handleInputChange = useCallback(
    (key: SenseKey, value: string) => {
      const num = parseInt(value, 10) || 0;
      updateValue(key, Math.max(0, Math.min(100, num)));
    },
    [updateValue]
  );

  return (
    <div className={`${prefix}sense-slider-container`}>
      {SENSES.map((sense) => {
        const val = values[sense.key] || 0;
        return (
          <div key={sense.key} className={`${prefix}sense-slider-row`}>
            {showLabels && (
              <div className={`${prefix}sense-label`} style={{ color: sense.color }}>
                {sense.icon} {sense.label}
              </div>
            )}
            <div
              className={`${prefix}sense-track`}
              ref={(el) => { trackRefs.current[sense.key] = el; }}
              onClick={(e) => handleTrackClick(e as unknown as React.MouseEvent, sense.key)}
            >
              <div
                className={`${prefix}sense-track-fill`}
                style={{ width: `${val}%`, background: sense.color }}
              />
              <div
                className={`${prefix}sense-thumb`}
                style={{ left: `${val}%`, background: sense.color }}
                onMouseDown={(e) => handlePointerDown(e, sense.key)}
                onTouchStart={(e) => handlePointerDown(e as unknown as React.MouseEvent, sense.key)}
              />
            </div>
            <input
              type="number"
              className={`${prefix}sense-input`}
              value={val || ''}
              placeholder="0"
              min={0}
              max={100}
              onChange={(e) => handleInputChange(sense.key, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      })}
    </div>
  );
}
