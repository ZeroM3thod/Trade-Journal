'use client';
import { useState } from 'react';
import { useJournal } from '@/hooks/useJournal';
import Topbar        from '@/components/Topbar';
import Sidebar       from '@/components/Sidebar';
import Calendar      from '@/components/Calendar';
import TradeDialog   from '@/components/TradeDialog';
import DepositDialog from '@/components/DepositDialog';

export default function HomePage() {
  const journal = useJournal();

  const [tradeDate,  setTradeDate]  = useState(null);
  const [depType,    setDepType]    = useState(null);
  const [mobSidebar, setMobSidebar] = useState(false);

  const openTradeDialog  = (d) => setTradeDate(d);
  const closeTradeDialog = ()  => setTradeDate(null);
  const openDepDialog    = (t) => setDepType(t);
  const closeDepDialog   = ()  => setDepType(null);

  if (journal.loading) {
    return <div className="loading-overlay">Loading your journal…</div>;
  }

  return (
    <div className="app">
      {/* ── Supabase error banner ── */}
      {journal.error && (
        <div style={{
          background: 'rgba(242,139,130,0.15)',
          border: '1px solid rgba(242,139,130,0.4)',
          color: '#f28b82',
          padding: '10px 16px',
          fontSize: 13,
          flexShrink: 0,
        }}>
          ⚠️ <strong>Connection error:</strong> {journal.error}
          &nbsp;— Check your <code>.env.local</code> Supabase credentials, make sure the
          schema SQL has been run, and that Row Level Security (RLS) is disabled or has
          permissive policies on the <code>trades</code> and <code>transactions</code> tables.
        </div>
      )}

      {mobSidebar && (
        <div className="sidebar-overlay open" onClick={() => setMobSidebar(false)}/>
      )}

      <Topbar
        cur={journal.cur}
        onPrev={() => journal.goMonth(-1)}
        onNext={() => journal.goMonth(+1)}
        onToday={journal.goToday}
        onOpenDeposit={openDepDialog}
        onMobMenu={() => setMobSidebar(true)}
      />

      <div className="body">
        <Sidebar
          stats={journal.stats}
          sortedTxns={journal.sortedTxns}
          onOpenDeposit={(type) => { openDepDialog(type); setMobSidebar(false); }}
          mobOpen={mobSidebar}
        />

        <Calendar
          cur={journal.cur}
          today={journal.today}
          trades={journal.trades}
          txnsByDate={journal.txnsByDate}
          onDayClick={openTradeDialog}
        />
      </div>

      {tradeDate && (
        <TradeDialog
          date={tradeDate}
          existing={journal.trades[
            `${tradeDate.getFullYear()}-${String(tradeDate.getMonth()+1).padStart(2,'0')}-${String(tradeDate.getDate()).padStart(2,'0')}`
          ]}
          onSave={journal.saveTrade}
          onDelete={journal.deleteTrade}
          onClose={closeTradeDialog}
        />
      )}

      {depType && (
        <DepositDialog
          initialType={depType}
          onSave={journal.saveTransaction}
          onClose={closeDepDialog}
        />
      )}
    </div>
  );
}