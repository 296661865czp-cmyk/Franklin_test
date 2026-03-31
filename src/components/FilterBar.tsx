import type { DomainKey, StatusKey, SenseKey } from '../types';
import { SENSES, DOMAINS, STATUS_CONFIG } from '../data/constants';
import './FilterBar.css';

interface FilterBarProps {
  statusFilter: StatusKey | '';
  domainFilter: DomainKey | '';
  senseFilter: SenseKey | '';
  onStatusChange: (status: StatusKey | '') => void;
  onDomainChange: (domain: DomainKey | '') => void;
  onSenseChange: (sense: SenseKey | '') => void;
}

export function FilterBar({
  statusFilter,
  domainFilter,
  senseFilter,
  onStatusChange,
  onDomainChange,
  onSenseChange,
}: FilterBarProps) {
  return (
    <div className="filters-section">
      {/* 状态筛选 */}
      <div className="filter-row">
        <span className="filter-label">状态:</span>
        <button
          className={`filter-chip ${statusFilter === '' ? 'active' : ''}`}
          onClick={() => onStatusChange('')}
        >
          全部
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            className={`filter-chip ${statusFilter === key ? 'active' : ''}`}
            onClick={() => onStatusChange(statusFilter === key ? '' : (key as StatusKey))}
          >
            {config.emoji} {config.label}
          </button>
        ))}
      </div>

      {/* 分类筛选 */}
      <div className="filter-row">
        <span className="filter-label">分类:</span>
        <button
          className={`filter-chip ${domainFilter === '' ? 'active' : ''}`}
          onClick={() => onDomainChange('')}
        >
          全部
        </button>
        {Object.entries(DOMAINS).map(([key, config]) => (
          <button
            key={key}
            className={`filter-chip ${domainFilter === key ? 'active' : ''}`}
            onClick={() => onDomainChange(domainFilter === key ? '' : (key as DomainKey))}
          >
            {config.icon} {config.label}
          </button>
        ))}
      </div>

      {/* 感官筛选 */}
      <div className="filter-row">
        <span className="filter-label">感官:</span>
        <button
          className={`filter-chip ${senseFilter === '' ? 'active' : ''}`}
          onClick={() => onSenseChange('')}
        >
          全部
        </button>
        {SENSES.map((sense) => (
          <button
            key={sense.key}
            className={`filter-chip ${senseFilter === sense.key ? 'active' : ''}`}
            onClick={() => onSenseChange(senseFilter === sense.key ? '' : sense.key)}
          >
            {sense.icon} {sense.label}
          </button>
        ))}
      </div>
    </div>
  );
}
