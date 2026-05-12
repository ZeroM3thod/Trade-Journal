'use client';
import { useState, useEffect } from 'react';
import { MONTHS, dateKey, fmt } from '@/hooks/useJournal';

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function TradeDialog({ date, existing, onSave, onDelete, onClose }) {
  const [traded,  setTraded]  = useState(null);
  const [pnl,     setPnl]     = useState(null);
  const [amount,  setAmount]  = useState('');
  const [note,    setNote]    = useState('');
  const [saving,  setSaving]  = useState(false);

  // Populate from existing entry
  useEffect(() => {
    if (existing) {
      setTraded(existing.traded);
      setPnl(existing.pnl || null);
      setAmount(existing.amount ? String(existing.amount) : '');
      setNote(existing.note || '');
    } else {
      setTraded(null); setPnl(null); setAmount(''); setNote('');
    }
  }, [existing, date]);

  if (!date) return null;

  const title    = `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  const subtitle = DAYS[date.getDay()];
  const k        = dateKey(date);

  const handleSave = async () => {
    if (traded === null) return;
    setSaving(true);
    await onSave({
      date:    k,
      traded,
      pnl:     traded ? (pnl || 'profit') : null,
      amount:  traded ? (parseFloat(amount) || 0) : 0,
      note:    traded ? note.trim() : null,
    });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setSaving(true);
    await onDelete(k);
    setSaving(false);
    onClose();
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog" style={{ maxWidth: 400 }}>
        <div className="dlg-header">
          <div>
            <div className="dlg-title">{title}</div>
            <div className="dlg-subtitle">{subtitle}</div>
          </div>
          <button className="dlg-close" onClick={onClose}>&#x2715;</button>
        </div>

        <div className="dlg-body">
          {/* Traded? */}
          <div>
            <div className="form-label">Did you trade today?</div>
            <div className="choice-row">
              <button className={`choice-btn${traded === true ? ' active' : ''}`}  onClick={() => setTraded(true)}>Yes, I traded</button>
              <button className={`choice-btn${traded === false ? ' active' : ''}`} onClick={() => setTraded(false)}>No trade today</button>
            </div>
          </div>

          {/* Trade fields */}
          {traded === true && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <div className="form-label">Result</div>
                <div className="pnl-row">
                  <button className={`pnl-chip profit${pnl === 'profit' ? ' active' : ''}`} onClick={() => setPnl('profit')}>📈 Profit</button>
                  <button className={`pnl-chip loss${pnl === 'loss'     ? ' active' : ''}`} onClick={() => setPnl('loss')}>📉 Loss</button>
                </div>
              </div>
              <div>
                <div className="form-label">Amount (USD)</div>
                <div className="amount-wrap">
                  <span className="currency">$</span>
                  <input className="inp" type="number" min="0" step="0.01" placeholder="0.00"
                    style={{ flex:1 }} value={amount} onChange={e => setAmount(e.target.value)}/>
                </div>
              </div>
              <div>
                <div className="form-label">Note (optional)</div>
                <input className="inp" type="text" placeholder="e.g. BTC long, EUR/USD breakout…"
                  value={note} onChange={e => setNote(e.target.value)}/>
              </div>
            </div>
          )}

          {/* No-trade info */}
          {traded === false && (
            <div style={{ fontSize:13, color:'var(--text2)' }}>
              This day will be marked as a rest day — no color change on the calendar.
            </div>
          )}

          {/* Existing entry info */}
          {existing && (
            <div style={{ marginTop:4 }}>
              <div className="section-divider"/>
              <div className="info-row">
                <span>Existing entry</span>
                <span className="info-val">
                  {existing.traded
                    ? `${existing.pnl === 'profit' ? '+' : '-'}${fmt(existing.amount)} (${existing.pnl})`
                    : 'No trade'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="dlg-footer">
          {existing && (
            <button className="btn btn-danger" style={{ marginRight:'auto' }}
              onClick={handleDelete} disabled={saving}>
              Delete entry
            </button>
          )}
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || traded === null}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}