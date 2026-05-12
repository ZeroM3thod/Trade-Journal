'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

// ── helpers ──────────────────────────────────────────────────────────────────
export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
export function fmt(n) { return '$' + Math.abs(Number(n) || 0).toFixed(2); }
export function fmtSigned(n) { return (n >= 0 ? '+' : '-') + fmt(n); }

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
export { MONTHS };

// ── hook ─────────────────────────────────────────────────────────────────────
export function useJournal() {
  // Stable today ref — won't change between renders
  const todayRef = useRef(null);
  if (!todayRef.current) {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    todayRef.current = t;
  }
  const today = todayRef.current;

  const [cur,          setCur]          = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [trades,       setTrades]       = useState({});   // { "YYYY-MM-DD": tradeObj } — ALL loaded months
  const [allTrades,    setAllTrades]    = useState({});   // { "YYYY-MM-DD": tradeObj } — ALL trades for stats
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // ── fetch ALL transactions ─────────────────────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setTransactions(data);
    } catch (err) {
      console.error('[useJournal] fetchTransactions failed:', err);
      setError(err.message);
    }
  }, []);

  // ── fetch ALL trades (for accurate stats/balance) ─────────────────────────
  const fetchAllTrades = useCallback(async () => {
    try {
      const res = await fetch('/api/trades');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const map = {};
      data.forEach(t => { map[t.date] = t; });
      setAllTrades(map);
    } catch (err) {
      console.error('[useJournal] fetchAllTrades failed:', err);
      setError(err.message);
    }
  }, []);

  // ── fetch trades for the visible month (for calendar display) ─────────────
  const fetchTrades = useCallback(async (year, month) => {
    try {
      const res = await fetch(`/api/trades?year=${year}&month=${month + 1}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const map = {};
      data.forEach(t => { map[t.date] = t; });
      setTrades(prev => ({ ...prev, ...map }));
    } catch (err) {
      console.error('[useJournal] fetchTrades failed:', err);
      setError(err.message);
    }
  }, []);

  // ── initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchTrades(today.getFullYear(), today.getMonth()),
        fetchAllTrades(),
        fetchTransactions(),
      ]);
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── month navigation ───────────────────────────────────────────────────────
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
    try {
      const res = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, traded, pnl, amount, note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const saved = await res.json();
      setTrades(prev => ({ ...prev, [saved.date]: saved }));
      setAllTrades(prev => ({ ...prev, [saved.date]: saved })); // keep stats in sync
      return true;
    } catch (err) {
      console.error('[useJournal] saveTrade failed:', err);
      alert(`Failed to save trade: ${err.message}`);
      return false;
    }
  }, []);

  // ── delete trade ───────────────────────────────────────────────────────────
  const deleteTrade = useCallback(async (date) => {
    try {
      const res = await fetch(`/api/trades?date=${date}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setTrades(prev => { const n = { ...prev }; delete n[date]; return n; });
      setAllTrades(prev => { const n = { ...prev }; delete n[date]; return n; });
      return true;
    } catch (err) {
      console.error('[useJournal] deleteTrade failed:', err);
      alert(`Failed to delete trade: ${err.message}`);
      return false;
    }
  }, []);

  // ── save transaction ───────────────────────────────────────────────────────
  const saveTransaction = useCallback(async ({ date, type, amount, time, note }) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, type, amount, time, note }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const saved = await res.json();
      setTransactions(prev => [...prev, saved]);
      return true;
    } catch (err) {
      console.error('[useJournal] saveTransaction failed:', err);
      alert(`Failed to save transaction: ${err.message}`);
      return false;
    }
  }, []);

  // ── delete transaction ─────────────────────────────────────────────────────
  const deleteTransaction = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setTransactions(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      console.error('[useJournal] deleteTransaction failed:', err);
      alert(`Failed to delete transaction: ${err.message}`);
      return false;
    }
  }, []);

  // ── computed stats (uses ALL trades, not just current month) ───────────────
  const stats = useCallback(() => {
    let totalDep=0, totalWd=0, totalProfit=0, totalLoss=0;
    let tradeDays=0, profitDays=0, lossDays=0;

    transactions.forEach(t => {
      if (t.type === 'deposit') totalDep += Number(t.amount) || 0;
      else                      totalWd  += Number(t.amount) || 0;
    });

    // Use allTrades so balance/P&L is accurate across all months
    Object.values(allTrades).forEach(t => {
      if (!t.traded) return;
      tradeDays++;
      if (t.pnl === 'profit') { totalProfit += Number(t.amount) || 0; profitDays++; }
      else                    { totalLoss   += Number(t.amount) || 0; lossDays++;   }
    });

    const pnl     = totalProfit - totalLoss;
    const balance = totalDep - totalWd + pnl;
    const winRate = tradeDays > 0 ? Math.round(profitDays / tradeDays * 100) : null;
    return { totalDep, totalWd, totalProfit, totalLoss, tradeDays, profitDays, lossDays, pnl, balance, winRate };
  }, [allTrades, transactions]);

  // ── sorted deposit / withdrawal lists ─────────────────────────────────────
  const sortedTxns = useCallback(() => {
    const deps = transactions.filter(t => t.type === 'deposit').sort((a,b) => a.date.localeCompare(b.date));
    const wds  = transactions.filter(t => t.type === 'withdraw').sort((a,b) => a.date.localeCompare(b.date));
    return { deps, wds };
  }, [transactions]);

  // ── transactions by date (calendar badges) ─────────────────────────────────
  const txnsByDate = useCallback((dateStr) => {
    return transactions.filter(t => t.date === dateStr);
  }, [transactions]);

  return {
    today, cur, trades, transactions, loading, error,
    goMonth, goToday,
    saveTrade, deleteTrade, saveTransaction, deleteTransaction,
    stats, sortedTxns, txnsByDate,
  };
}