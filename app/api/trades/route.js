import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/trades            — returns ALL trades (for stats)
// GET /api/trades?year=2025&month=5  — returns trades for that month
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const year  = searchParams.get('year');
  const month = searchParams.get('month');

  let query = supabase.from('trades').select('*').order('date');

  if (year && month) {
    const y = String(year);
    const m = String(month).padStart(2, '0');
    const from = `${y}-${m}-01`;
    // Use the actual last day of the month instead of hardcoded 31
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const to = `${y}-${m}-${String(lastDay).padStart(2, '0')}`;
    query = query.gte('date', from).lte('date', to);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/trades  — upsert (insert or update by date)
export async function POST(request) {
  const body = await request.json();
  const { date, traded, pnl, amount, note } = body;

  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('trades')
    .upsert(
      {
        date,
        traded,
        pnl:    traded ? pnl    : null,
        amount: traded ? amount : 0,
        note:   traded ? note   : null,
      },
      { onConflict: 'date' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/trades?date=2025-05-12
export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 });

  const { error } = await supabase.from('trades').delete().eq('date', date);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}