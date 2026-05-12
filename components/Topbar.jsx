'use client';
import { MONTHS } from '@/hooks/useJournal';

export default function Topbar({ cur, onPrev, onNext, onToday, onOpenDeposit, onMobMenu }) {
  return (
    <div className="topbar">
      <button className="mob-menu-btn" onClick={onMobMenu} aria-label="Open stats">
        <svg viewBox="0 0 22 22">
          <line x1="3" y1="6"  x2="19" y2="6" />
          <line x1="3" y1="11" x2="19" y2="11"/>
          <line x1="3" y1="16" x2="19" y2="16"/>
        </svg>
      </button>

      <div className="cal-logo">
        <svg width="32" height="32" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="6" fill="#1a73e8"/>
          <rect x="5"    y="5"  width="22" height="5" rx="1.5" fill="white" opacity="0.9"/>
          <rect x="5"    y="12" width="7"  height="7" rx="1.5" fill="white" opacity="0.9"/>
          <rect x="12.5" y="12" width="7"  height="7" rx="1.5" fill="white" opacity="0.9"/>
          <rect x="20"   y="12" width="7"  height="7" rx="1.5" fill="white" opacity="0.9"/>
          <rect x="5"    y="21" width="7"  height="6" rx="1.5" fill="white" opacity="0.9"/>
          <rect x="12.5" y="21" width="7"  height="6" rx="1.5" fill="white" opacity="0.9"/>
        </svg>
        <span className="cal-logo-text">Trading <span>Journal</span></span>
      </div>

      <div className="month-nav">
        <button className="icon-btn" onClick={onPrev} aria-label="Previous month">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="11,4 6,9 11,14"/>
          </svg>
        </button>
        <button className="icon-btn" onClick={onNext} aria-label="Next month">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="7,4 12,9 7,14"/>
          </svg>
        </button>
        <span className="month-label">{MONTHS[cur.getMonth()]} {cur.getFullYear()}</span>
      </div>

      <button className="today-btn" onClick={onToday}>Today</button>
      <div className="spacer"/>

      <button className="add-btn" onClick={() => onOpenDeposit('deposit')}>
        <svg viewBox="0 0 16 16">
          <line x1="8" y1="2" x2="8" y2="14"/>
          <line x1="2" y1="8" x2="14" y2="8"/>
        </svg>
        <span>Add deposit / withdrawal</span>
      </button>
    </div>
  );
}