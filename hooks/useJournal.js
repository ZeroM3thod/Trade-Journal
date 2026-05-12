'use client';
import { useState, useEffect, useCallback } from 'react';

// ── helpers ──────────────────────────────────────────────────────────────────
export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function fmt(n) { return '$' + Math.abs(n).toFixed(2); }
export function fmtSigned(n) { return (n >= 0 ? '+' : '-') + fmt(n); }

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
export { MONTHS };

// ── hook ─────────────────────────────────────────────────────────────────────
export function useJournal() {
  const today = new Date(); today.setHours(0,0,0,0);

  const [cur,          setCur]          = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [trades,       setTrades]       = useState({});   // { "YYYY-MM-DD": tradeObj }
  const [transactions, setTransactions] = useState([]);   // flat array from DB
  const [loading,      setLoading]      = useState(true);

  // ── fetch all transactions (they are small, grab all at once) ──────────────
  const fetchTransactions = useCallback(async () => {
    const res = await fetch('/api/transactions');
    if (!res.ok) return;
    const data = await res.json();
    setTransactions(data);
  }, []);

  // ── fetch trades for the visible month ────────────────────────────────────
  const fetchTrades = useCallback(async (year, month) => {
    const res = await fetch(`/api/trades?year=${year}&month=${month + 1}`);
    if (!res.ok) return;
    const data = await res.json();
    // convert array → keyed object
    const map = {};
    data.forEach(t => { map[t.date] = t; });
    setTrades(prev => ({ ...prev, ...map }));
  }, []);

  // initial load
  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([
        fetchTrades(cur.getFullYear(), cur.getMonth()),
        fetchTransactions(),
      ]);
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // fetch trades when month changes
  const goMonth = useCallback((delta) => {
    setCur(prev => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
      fetchTrades(next.getFullYear(), next.getMonth());
      return next;
    });
  }, [fetchTrades]);

  const goToday = useCallback(() => {
    setCur(new Date(today.getFullYear(), today.getMonth(), 1));
    fetchTrades(today.getFullYear(), today.getMonth());
  }, [fetchTrades, today]);

  // ── save trade ─────────────────────────────────────────────────────────────
  const saveTrade = useCallback(async ({ date, traded, pnl, amount, note }) => {
    const res = await fetch('/api/trades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, traded, pnl, amount, note }),
    });
    if (!res.ok) return false;
    const saved = await res.json();
    setTrades(prev => ({ ...prev, [saved.date]: saved }));
    return true;
  }, []);

  // ── delete trade ───────────────────────────────────────────────────────────
  const deleteTrade = useCallback(async (date) => {
    const res = await fetch(`/api/trades?date=${date}`, { method: 'DELETE' });
    if (!res.ok) return false;
    setTrades(prev => { const n = { ...prev }; delete n[date]; return n; });
    return true;
  }, []);

  // ── save transaction ───────────────────────────────────────────────────────
  const saveTransaction = useCallback(async ({ date, type, amount, time, note }) => {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, type, amount, time, note }),
    });
    if (!res.ok) return false;
    const saved = await res.json();
    setTransactions(prev => [...prev, saved]);
    return true;
  }, []);

  // ── computed stats ─────────────────────────────────────────────────────────
  const stats = useCallback(() => {
    let totalDep=0, totalWd=0, totalProfit=0, totalLoss=0;
    let tradeDays=0, profitDays=0, lossDays=0;

    transactions.forEach(t => {
      if (t.type === 'deposit')   totalDep += Number(t.amount);
      else                        totalWd  += Number(t.amount);
    });
    Object.values(trades).forEach(t => {
      if (!t.traded) return;
      tradeDays++;
      if (t.pnl === 'profit') { totalProfit += Number(t.amount); profitDays++; }
      else                    { totalLoss   += Number(t.amount); lossDays++;   }
    });
    const pnl     = totalProfit - totalLoss;
    const balance = totalDep - totalWd + pnl;
    const winRate = tradeDays > 0 ? Math.round(profitDays / tradeDays * 100) : null;
    return { totalDep, totalWd, totalProfit, totalLoss, tradeDays, profitDays, lossDays, pnl, balance, winRate };
  }, [trades, transactions]);

  // ── sorted deposit / withdrawal lists for sidebar ─────────────────────────
  const sortedTxns = useCallback(() => {
    const deps = transactions.filter(t => t.type === 'deposit').sort((a,b) => a.date.localeCompare(b.date));
    const wds  = transactions.filter(t => t.type === 'withdraw').sort((a,b) => a.date.localeCompare(b.date));
    return { deps, wds };
  }, [transactions]);

  // ── transactions by date (for calendar badges) ────────────────────────────
  const txnsByDate = useCallback((dateStr) => {
    return transactions.filter(t => t.date === dateStr);
  }, [transactions]);

  return {
    today, cur, trades, transactions, loading,
    goMonth, goToday,
    saveTrade, deleteTrade, saveTransaction,
    stats, sortedTxns, txnsByDate,
  };
}