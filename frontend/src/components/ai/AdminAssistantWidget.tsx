import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, LoaderCircle, Send, Sparkles, X } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminAiApi } from '../../api';

type AiChartData = { type: 'bar' | 'line'; title: string; metric: string; points: Array<{ label: string; value: number }>; order_count?: number | null; revenue?: number | null };

function parseAiChart(text: string): AiChartData | null {
  const match = text.match(/```chart\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[1].trim()) as { type?: string; title?: string; metric?: string; points?: Array<{ label?: string; value?: number | string }>; order_count?: number | string; orderCount?: number | string; revenue?: number | string };
    const points = (raw.points ?? []).map((p) => ({ label: String(p.label ?? ''), value: Number(p.value ?? 0) })).filter((p) => p.label && Number.isFinite(p.value));
    if (!points.length) return null;
    const toNum = (v: unknown): number | null => { const n = Number(v); return Number.isFinite(n) ? n : null; };
    return { type: raw.type === 'bar' ? 'bar' : 'line', title: String(raw.title ?? 'Biểu đồ'), metric: String(raw.metric ?? 'revenue'), points, order_count: toNum((raw as Record<string, unknown>).order_count ?? (raw as Record<string, unknown>).orderCount), revenue: toNum(raw.revenue) };
  } catch { return null; }
}

function widgetChartStats(chart: AiChartData) {
  const total = chart.points.reduce((sum, p) => sum + p.value, 0);
  const avg = chart.points.length ? total / chart.points.length : 0;
  const peak = chart.points.reduce((best, p) => (p.value > best.value ? p : best), chart.points[0]);
  const money = chart.metric !== 'orders';
  const orders = chart.order_count ?? (money ? null : Math.round(total));
  const revenue = chart.revenue ?? (money ? total : null);
  return { total, avg, peak, orders, revenue, money };
}

function widgetFullMoney(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}

function WidgetChart({ chart }: { chart: AiChartData }) {
  const data = chart.points.map((p) => ({ name: p.label.slice(5), value: p.value }));
  const stats = widgetChartStats(chart);
  const tip = (v: unknown) => [stats.money ? widgetFullMoney(Number(v)) : String(v), chart.metric === 'orders' ? 'Số đơn' : 'Doanh thu'] as const;
  return <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white"><div className="border-b border-zinc-100 px-3 py-1.5"><p className="text-[11px] font-bold text-zinc-800">{chart.title}</p><div className="mt-1 flex flex-wrap gap-1 text-[10px]">{stats.revenue != null ? <span className="rounded-md bg-leaf-soft px-1.5 py-px font-bold text-leaf">Tổng {widgetFullMoney(stats.revenue)}</span> : <span className="rounded-md bg-leaf-soft px-1.5 py-px font-bold text-leaf">Tổng {stats.money ? widgetFullMoney(stats.total) : `${Math.round(stats.total)} đơn`}</span>}{stats.orders != null && stats.money ? <span className="rounded-md bg-zinc-100 px-1.5 py-px font-semibold text-zinc-700">{stats.orders} đơn</span> : null}<span className="rounded-md bg-zinc-100 px-1.5 py-px font-semibold text-zinc-700">TB {stats.money ? widgetFullMoney(Math.round(stats.avg)) : `${stats.avg.toFixed(1)} đơn`}</span><span className="rounded-md bg-zinc-100 px-1.5 py-px font-semibold text-zinc-700">Đỉnh {stats.peak.label.slice(5)}: {stats.money ? widgetFullMoney(Math.round(stats.peak.value)) : `${Math.round(stats.peak.value)} đơn`}</span></div></div><div className="h-[180px] p-1.5"><ResponsiveContainer width="100%" height="100%">{chart.type === 'bar' ? <BarChart data={data} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}><CartesianGrid stroke="#f1f1f4" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#a1a1aa' }} interval="preserveStartEnd" /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#a1a1aa' }} /><Tooltip formatter={tip} /><Bar dataKey="value" fill="#247448" radius={[3, 3, 0, 0]} /></BarChart> : <AreaChart data={data} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}><defs><linearGradient id="widget-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#247448" stopOpacity={0.25} /><stop offset="100%" stopColor="#247448" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#f1f1f4" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#a1a1aa' }} interval="preserveStartEnd" /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: '#a1a1aa' }} /><Tooltip formatter={tip} /><Area type="monotone" dataKey="value" stroke="#247448" strokeWidth={2} fill="url(#widget-chart-fill)" /></AreaChart>}</ResponsiveContainer></div></div>;
}

function renderWidgetText(text: string) {
  const all = [...text.matchAll(/```chart[\s\S]*?```/g)];
  if (all.length > 1) { let seen = 0; text = text.replace(/```chart[\s\S]*?```/g, (m) => (++seen < all.length ? '' : m)); }
  const chart = parseAiChart(text);
  const stripped = text.replace(/```chart[\s\S]*?```/g, '').trim() || (chart ? '' : text);
  return <>{stripped ? <p className="whitespace-pre-wrap">{stripped}</p> : null}{chart ? <WidgetChart chart={chart} /> : null}</>;
}

type ChatRow = { role: 'user' | 'assistant'; content: string };

const quickPrompts = ['Tóm tắt doanh thu hôm nay', 'Sản phẩm nào sắp hết hàng?', 'Cho xem các đơn đang chờ'];

export function AdminAssistantWidget({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<ChatRow[]>([
    { role: 'assistant', content: 'Mình có thể giúp bạn hiểu doanh thu, đơn hàng, tồn kho và khách hàng.' },
  ]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState<number | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || busy) return;
    setMessage('');
    setRows(current => [...current, { role: 'user', content }, { role: 'assistant', content: '' }]);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      for await (const item of adminAiApi.stream(content, sessionId, controller.signal)) {
        if (item.Type === 'error') throw new Error(item.Error ?? 'AI tạm thời không khả dụng.');
        if (item.SessionId) setSessionId(item.SessionId);
        if (item.Type === 'chart' && item.ChartJson) setRows(current => current.map((row, index) => index === current.length - 1 ? { ...row, content: row.content + `\n\`\`\`chart ${item.ChartJson}\`\`\`\n` } : row));
        if (item.Text) setRows(current => current.map((row, index) => index === current.length - 1 ? { ...row, content: row.content + item.Text } : row));
      }
    } catch (error) {
      if (!controller.signal.aborted) setRows(current => current.map((row, index) => index === current.length - 1 ? { ...row, content: error instanceof Error ? error.message : 'AI tạm thời không khả dụng.' } : row));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  if (!open) return null;

  return <div className="fixed inset-0 z-50 md:pointer-events-none" role="dialog" aria-modal="true" aria-label="Trợ lý cửa hàng">
    <button type="button" aria-label="Đóng trợ lý AI" onClick={onClose} className="absolute inset-0 bg-zinc-950/30 md:hidden" />
    <aside className="pointer-events-auto absolute bottom-0 right-0 flex h-[min(760px,100vh)] w-full flex-col overflow-hidden rounded-t-3xl border-zinc-200 bg-white shadow-2xl md:bottom-5 md:right-5 md:h-[min(700px,calc(100vh-3rem))] md:w-[410px] md:rounded-3xl md:border">
      <div className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-leaf text-white"><Sparkles size={19} /></span>
        <div className="min-w-0 flex-1"><h2 className="text-sm font-extrabold text-zinc-950">Trợ lý cửa hàng</h2><p className="text-xs text-zinc-500">Doanh thu, tồn kho, đơn hàng và khách hàng</p></div>
        {busy ? <LoaderCircle size={17} className="animate-spin text-leaf" /> : null}
        <button type="button" onClick={() => { abortRef.current?.abort(); onClose(); }} aria-label="Đóng" className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-50"><X size={18} /></button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfdfb] p-4">
        {rows.map((row, index) => <div key={index} className={row.role === 'user' ? 'ml-8' : 'mr-5'}><div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${row.role === 'user' ? 'rounded-br-md bg-leaf text-white' : 'rounded-bl-md border border-zinc-200 bg-white text-zinc-800'}`}>{row.role === 'assistant' ? <Bot size={15} className="mb-1 text-leaf" /> : null}{row.role === 'assistant' && row.content ? renderWidgetText(row.content) : row.content || <span className="inline-flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:100ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:200ms]" /></span>}</div></div>)}
      </div>
      <div className="border-t border-zinc-100 bg-white px-4 py-3"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-zinc-400">Hỏi nhanh</p><div className="flex flex-wrap gap-1.5">{quickPrompts.map(prompt => <button type="button" key={prompt} onClick={() => setMessage(prompt)} disabled={busy} className="rounded-lg bg-zinc-50 px-2 py-1.5 text-left text-[11px] font-semibold text-zinc-600 hover:bg-leaf/10 hover:text-leaf disabled:opacity-50">{prompt}</button>)}</div></div>
      <form onSubmit={event => void send(event)} className="flex gap-2 border-t border-zinc-100 bg-white p-4"><input autoFocus value={message} onChange={event => setMessage(event.target.value)} placeholder="Hỏi về cửa hàng của bạn..." disabled={busy} className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-leaf focus:bg-white" /><button type="submit" aria-label="Gửi tin nhắn" disabled={!message.trim() || busy} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf text-white transition hover:bg-leaf-dark disabled:bg-zinc-200"><Send size={17} /></button></form>
    </aside>
  </div>;
}
