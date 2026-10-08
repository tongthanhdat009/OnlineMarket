import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  Download,
  Filter,
  Info,
  Inbox,
  Loader2,
  MoreHorizontal,
  PackageOpen,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
} from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'purple';

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  info: 'bg-blue-50 text-blue-700 ring-blue-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
};

const toneIcons: Record<StatusTone, typeof Circle> = {
  neutral: Circle,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
  purple: Circle,
};

export function StatusBadge({
  children,
  tone = 'neutral',
  className = '',
  dot = true,
}: {
  children: ReactNode;
  tone?: StatusTone;
  className?: string;
  dot?: boolean;
}) {
  const Icon = toneIcons[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${toneClasses[tone]} ${className}`}>
      {dot ? <Icon size={12} strokeWidth={2.25} aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function statusTone(value: string): StatusTone {
  const normalized = value.trim().toLowerCase().replaceAll('_', ' ');
  if (['completed', 'delivered', 'paid', 'approved', 'active', 'success', 'normal', 'online'].includes(normalized)) return 'success';
  if (['shipping', 'processing', 'running', 'waiting tool', 'queued', 'low', 'pending'].includes(normalized)) return 'warning';
  if (['canceled', 'cancelled', 'failed', 'rejected', 'out of stock', 'inactive', 'error'].includes(normalized)) return 'danger';
  if (['info', 'new', 'offline'].includes(normalized)) return 'info';
  if (['waiting', 'draft', 'paused'].includes(normalized)) return 'purple';
  return 'neutral';
}

export function Money({ value, currency = 'VND', className = '' }: { value: number | null | undefined; currency?: string; className?: string }) {
  const amount = Number.isFinite(value) ? Number(value) : 0;
  return (
    <span className={`tabular-nums ${className}`}>
      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)}
    </span>
  );
}

export function ProductAvatar({ src, name, size = 'md' }: { src?: string | null; name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const dimensions = size === 'sm' ? 'size-8 text-xs' : size === 'lg' ? 'size-14 text-lg' : 'size-10 text-sm';
  const initials = (name ?? 'P')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return src ? (
    <img src={src} alt={name ?? 'Product'} className={`${dimensions} rounded-lg object-cover ring-1 ring-zinc-200`} />
  ) : (
    <span className={`${dimensions} inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo-50 font-bold text-indigo-700 ring-1 ring-indigo-100`} aria-label={name ?? 'Product'}>
      {initials || 'P'}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-indigo-600">{eyebrow}</p> : null}
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-[28px]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PrimaryButton({ children, onClick, type = 'button', disabled = false, className = '', size = 'md' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit' | 'reset'; disabled?: boolean; className?: string; size?: 'sm' | 'md' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45 ${size === 'sm' ? 'h-9 px-3 text-xs' : 'h-10'} ${className}`}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, type = 'button', disabled = false, className = '', size = 'md' }: { children: ReactNode; onClick?: () => void; type?: 'button' | 'submit' | 'reset'; disabled?: boolean; className?: string; size?: 'sm' | 'md' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-45 ${size === 'sm' ? 'h-9 px-3 text-xs' : 'h-10'} ${className}`}>
      {children}
    </button>
  );
}

export function IconButton({ label, onClick, children, className = '', disabled = false }: { label: string; onClick?: () => void; children: ReactNode; className?: string; disabled?: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={`inline-flex size-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-40 ${className}`}>{children}</button>;
}

export function SearchInput({ value, onChange, placeholder = 'Tìm kiếm...', className = '', onClear }: { value?: string; onChange?: (value: string) => void; placeholder?: string; className?: string; onClear?: () => void }) {
  return (
    <label className={`relative block ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
      <input value={value} onChange={(event) => onChange?.(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-9 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100" />
      {value && onClear ? <IconButton label="Xóa tìm kiếm" onClick={onClear} className="absolute right-1 top-1/2 size-8 -translate-y-1/2"><X size={15} /></IconButton> : null}
    </label>
  );
}

export function FilterSelect<T extends string | number>({ value, onChange, options, placeholder = 'Lọc', className = '', label }: { value?: T | ''; onChange?: (value: T | '') => void; options: { value: T; label: string }[]; placeholder?: string; className?: string; label?: string }) {
  return (
    <label className={`relative block ${className}`}>
      {label ? <span className="sr-only">{label}</span> : null}
      <SlidersHorizontal size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
      <select value={value ?? ''} onChange={(event) => { const raw = event.target.value; const selected = options.find((option) => String(option.value) === raw); onChange?.(selected?.value ?? ''); }} className="h-10 w-full appearance-none rounded-lg border border-zinc-200 bg-white pl-9 pr-8 text-sm text-zinc-700 outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100">
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={String(option.value)} value={String(option.value)}>{option.label}</option>)}
      </select>
      <ChevronDownIcon />
    </label>
  );
}

function ChevronDownIcon() {
  return <svg viewBox="0 0 20 20" className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 fill-none stroke-zinc-400" strokeWidth="1.8" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>;
}

export function DateRangePicker({ from, to, onFromChange, onToChange }: { from?: string; to?: string; onFromChange?: (value: string) => void; onToChange?: (value: string) => void }) {
  return (
    <div className="flex h-10 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-600 focus-within:border-indigo-400 focus-within:ring-3 focus-within:ring-indigo-100">
      <CalendarDays size={15} className="shrink-0 text-zinc-400" />
      <input type="date" value={from ?? ''} onChange={(event) => onFromChange?.(event.target.value)} className="min-w-0 bg-transparent text-xs outline-none" aria-label="Từ ngày" />
      <span className="text-zinc-300">–</span>
      <input type="date" value={to ?? ''} onChange={(event) => onToChange?.(event.target.value)} className="min-w-0 bg-transparent text-xs outline-none" aria-label="Đến ngày" />
    </div>
  );
}

export function TableToolbar({ search, onSearch, searchPlaceholder = 'Tìm kiếm...', filters, actions }: { search?: string; onSearch?: (value: string) => void; searchPlaceholder?: string; filters?: ReactNode; actions?: ReactNode }) {
  return <div className="mb-4 flex flex-col gap-2.5 lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row"><SearchInput value={search} onChange={onSearch} placeholder={searchPlaceholder} className="w-full sm:max-w-xs" />{filters}</div>{actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}</div>;
}

export function StatCard({ label, value, icon, trend, trendLabel, tone = 'neutral', loading = false }: { label: string; value: ReactNode; icon?: ReactNode; trend?: number; trendLabel?: string; tone?: StatusTone; loading?: boolean }) {
  const isUp = trend !== undefined && trend >= 0;
  return <article className="rounded-xl border border-zinc-200/90 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-5"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-zinc-500">{label}</p>{icon ? <span className={`inline-flex size-9 items-center justify-center rounded-lg ${toneClasses[tone].split(' ')[0]} ${toneClasses[tone].split(' ')[1]}`}>{icon}</span> : null}</div>{loading ? <div className="skeleton mt-3 h-8 w-28 rounded-md" /> : <p className="mt-3 font-display text-2xl font-extrabold tracking-tight text-zinc-950">{value}</p>}{trend !== undefined ? <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${isUp ? 'text-emerald-600' : 'text-red-600'}`}>{isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(trend).toFixed(1)}%{trendLabel ? <span className="font-normal text-zinc-400">{trendLabel}</span> : null}</p> : null}</article>;
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey?: (row: T, index: number) => string | number;
  loading?: boolean;
  empty?: ReactNode;
  error?: ReactNode;
  onRowClick?: (row: T) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  actions?: (row: T, index: number) => ReactNode;
  caption?: string;
}

export function DataTable<T>({ columns, data, rowKey, loading = false, empty, error, onRowClick, page = 1, pageSize = 20, total, onPageChange, actions, caption }: DataTableProps<T>) {
  const count = total ?? data.length;
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const first = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, count);
  const visiblePages = Array.from(new Set([1, page - 1, page, page + 1, pages].filter((candidate) => candidate >= 1 && candidate <= pages)));
  return <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]"><div className="overflow-x-auto"><table className="w-full min-w-[720px] border-collapse text-left" aria-describedby={caption ? undefined : undefined}><caption className="sr-only">{caption ?? 'Bảng dữ liệu'}</caption><thead className="border-b border-zinc-100 bg-zinc-50/70"><tr>{columns.map((column) => <th key={column.key} className={`whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-zinc-500 ${column.headerClassName ?? ''}`}>{column.header}</th>)}{actions ? <th className="w-12 px-3 py-3" aria-label="Thao tác" /> : null}</tr></thead><tbody className="divide-y divide-zinc-100">{loading ? Array.from({ length: Math.min(5, pageSize) }, (_, rowIndex) => <tr key={`skeleton-${rowIndex}`}>{columns.map((column) => <td key={column.key} className="px-4 py-4"><span className="skeleton block h-4 w-3/4 rounded" /></td>)}{actions ? <td /> : null}</tr>) : error ? <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center">{error}</td></tr> : data.length === 0 ? <tr><td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center">{empty ?? <EmptyState title="Chưa có dữ liệu" compact />}</td></tr> : data.map((row, index) => <tr key={rowKey ? String(rowKey(row, index)) : index} onClick={() => onRowClick?.(row)} className={`group transition ${onRowClick ? 'cursor-pointer hover:bg-zinc-50/80' : ''}`}>{columns.map((column) => <td key={column.key} className={`px-4 py-3.5 text-sm text-zinc-700 ${column.className ?? ''}`}>{column.render(row, index)}</td>)}{actions ? <td className="px-3 py-3 text-right" onClick={(event) => event.stopPropagation()}>{actions(row, index)}</td> : null}</tr>)}</tbody></table></div>{onPageChange && pages > 1 ? <div className="flex flex-col gap-2 border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between"><span>Hiển thị <strong className="font-semibold text-zinc-700">{first}–{last}</strong> / <strong className="font-semibold text-zinc-700">{count}</strong></span><div className="flex items-center gap-1"><IconButton label="Trang trước" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} /></IconButton>{visiblePages.map((pageNumber, index) => <span key={pageNumber}>{index > 0 && visiblePages[index - 1] !== pageNumber - 1 ? <span className="px-1 text-zinc-300">…</span> : null}<button type="button" onClick={() => onPageChange(pageNumber)} className={`size-8 rounded-md text-xs font-semibold transition ${pageNumber === page ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}>{pageNumber}</button></span>)}<IconButton label="Trang sau" disabled={page >= pages} onClick={() => onPageChange(page + 1)}><ChevronRight size={16} /></IconButton></div></div> : null}</div>;
}

export function EmptyState({ title = 'Không tìm thấy dữ liệu', description, action, icon, compact = false }: { title?: string; description?: string; action?: ReactNode; icon?: ReactNode; compact?: boolean }) {
  return <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-5' : 'rounded-xl border border-dashed border-zinc-200 bg-white py-16'}`}><span className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">{icon ?? <Inbox size={21} />}</span><h3 className="text-sm font-bold text-zinc-800">{title}</h3>{description ? <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">{description}</p> : null}{action ? <div className="mt-4">{action}</div> : null}</div>;
}

export function ErrorState({ title = 'Không tải được dữ liệu', description = 'Thử lại. Nếu vấn đề vẫn tiếp tục, hãy kiểm tra kết nối.', onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return <div className="flex flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/40 py-14 text-center"><span className="mb-3 inline-flex size-11 items-center justify-center rounded-xl bg-red-100 text-red-600"><AlertCircle size={21} /></span><h3 className="text-sm font-bold text-zinc-800">{title}</h3><p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">{description}</p>{onRetry ? <SecondaryButton onClick={onRetry} size="sm" className="mt-4"><RefreshCw size={14} /> Thử lại</SecondaryButton> : null}</div>;
}

export function Skeleton({ className = '' }: { className?: string }) { return <span className={`skeleton inline-block rounded-md ${className}`} aria-hidden="true" />; }

export function Drawer({ open, onClose, title, description, children, width = 'max-w-xl', footer, side = 'right' }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; width?: string; footer?: ReactNode; side?: 'left' | 'right' }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}><button type="button" className="absolute inset-0 bg-zinc-950/30 backdrop-blur-[2px]" onClick={onClose} aria-label="Đóng hộp thoại" /><aside className={`absolute inset-y-0 ${side === 'right' ? 'right-0' : 'left-0'} flex w-full ${width} flex-col bg-white shadow-2xl`}><header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6"><div><h2 className="font-display text-lg font-extrabold tracking-tight text-zinc-950">{title}</h2>{description ? <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p> : null}</div><IconButton label="Đóng" onClick={onClose}><X size={18} /></IconButton></header><div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>{footer ? <footer className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 sm:px-6">{footer}</footer> : null}</aside></div>;
}

export function Modal({ open, onClose, title, description, children, size = 'max-w-lg', footer }: { open: boolean; onClose: () => void; title: string; description?: string; children: ReactNode; size?: string; footer?: ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}><button type="button" className="absolute inset-0 bg-zinc-950/35 backdrop-blur-[2px]" onClick={onClose} aria-label="Đóng hộp thoại" /><section className={`relative flex max-h-[calc(100vh-2rem)] w-full ${size} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}><header className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 sm:px-6"><div><h2 className="font-display text-lg font-extrabold tracking-tight text-zinc-950">{title}</h2>{description ? <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p> : null}</div><IconButton label="Đóng" onClick={onClose}><X size={18} /></IconButton></header><div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>{footer ? <footer className="border-t border-zinc-100 bg-zinc-50/60 px-5 py-4 sm:px-6">{footer}</footer> : null}</section></div>;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', destructive = false, loading = false }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; description: string; confirmLabel?: string; destructive?: boolean; loading?: boolean }) {
  return <Modal open={open} onClose={onClose} title={title} description={description} size="max-w-md" footer={<div className="flex justify-end gap-2"><SecondaryButton onClick={onClose} disabled={loading}>Keep</SecondaryButton><button type="button" onClick={onConfirm} disabled={loading} className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 ${destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-zinc-950 hover:bg-zinc-800'}`}>{loading ? <Loader2 size={15} className="animate-spin" /> : null}{confirmLabel}</button></div>}>{<div className={`flex gap-3 rounded-lg p-3 text-sm leading-5 ${destructive ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900'}`}><AlertTriangle size={18} className="mt-0.5 shrink-0" />This action may affect connected records and cannot be undone.</div>}</Modal>;
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="border-b border-zinc-100 pb-5 last:border-0 last:pb-0"><h3 className="text-sm font-bold text-zinc-900">{title}</h3>{description ? <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p> : null}<div className="mt-4">{children}</div></section>;
}

export function Field({ label, hint, error, children, required = false }: { label: string; hint?: string; error?: string; children: ReactNode; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-zinc-700">{label}{required ? <span className="ml-1 text-red-500">*</span> : null}</span>{children}{error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : hint ? <span className="mt-1 block text-xs text-zinc-400">{hint}</span> : null}</label>;
}

export const inputClassName = 'h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100';

export function OrderTimeline({ steps, current }: { steps: { label: string; meta?: string; state?: 'done' | 'current' | 'upcoming' | 'cancelled' }[]; current?: string }) {
  return <ol className="space-y-0">{steps.map((step, index) => { const state = step.state ?? (current && step.label.toLowerCase() === current.toLowerCase() ? 'current' : 'upcoming'); const done = state === 'done'; return <li key={`${step.label}-${index}`} className="relative flex gap-3 pb-5 last:pb-0"><div className="relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm ring-1 ring-zinc-200">{done ? <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500 text-white"><Check size={13} strokeWidth={3} /></span> : state === 'current' ? <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600"><span className="size-2 rounded-full bg-white" /></span> : state === 'cancelled' ? <span className="flex size-6 items-center justify-center rounded-full bg-red-500 text-white"><X size={13} /></span> : <span className="size-2 rounded-full bg-zinc-300" />}</div>{index < steps.length - 1 ? <span className={`absolute left-3 top-6 h-full w-px ${done ? 'bg-emerald-300' : 'bg-zinc-200'}`} /> : null}<div className="min-w-0 pt-0.5"><p className={`text-sm font-semibold ${state === 'upcoming' ? 'text-zinc-400' : 'text-zinc-800'}`}>{step.label}</p>{step.meta ? <p className="mt-0.5 text-xs text-zinc-400">{step.meta}</p> : null}</div></li>; })}</ol>;
}

export function ActivityTimeline({ events }: { events: { label: string; timestamp?: string; detail?: string; tone?: StatusTone }[] }) {
  return <ol className="space-y-4">{events.map((event, index) => <li key={`${event.label}-${index}`} className="flex gap-3"><span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${event.tone === 'danger' ? 'bg-red-500' : event.tone === 'success' ? 'bg-emerald-500' : event.tone === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`} /><div className="min-w-0"><div className="flex flex-wrap items-baseline gap-2"><p className="text-sm font-semibold text-zinc-800">{event.label}</p>{event.timestamp ? <time className="text-xs text-zinc-400">{event.timestamp}</time> : null}</div>{event.detail ? <p className="mt-0.5 text-xs leading-5 text-zinc-500">{event.detail}</p> : null}</div></li>)}</ol>;
}

export function AgentRunStatus({ status }: { status: string }) {
  const label = status.replaceAll('_', ' ');
  const Icon = statusTone(status) === 'success' ? CheckCircle2 : statusTone(status) === 'danger' ? XCircle : statusTone(status) === 'warning' ? Clock3 : Circle;
  return <StatusBadge tone={statusTone(status)}><Icon size={12} />{label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}</StatusBadge>;
}

export function LoadingButton({ children, loading, ...props }: ComponentProps<typeof PrimaryButton> & { loading?: boolean }) {
  return <PrimaryButton {...props} disabled={props.disabled || loading}>{loading ? <Loader2 size={15} className="animate-spin" /> : null}{children}</PrimaryButton>;
}

export function RefreshButton({ onClick, label = 'Refresh' }: { onClick?: () => void; label?: string }) { return <SecondaryButton onClick={onClick} size="sm"><RefreshCw size={14} />{label}</SecondaryButton>; }
export function AddButton({ children = 'Add new', onClick }: { children?: ReactNode; onClick?: () => void }) { return <PrimaryButton onClick={onClick}><Plus size={16} />{children}</PrimaryButton>; }
export function MoreButton({ onClick }: { onClick?: () => void }) { return <IconButton label="More actions" onClick={onClick}><MoreHorizontal size={18} /></IconButton>; }
export function ExportButton({ onClick, children = 'Export' }: { onClick?: () => void; children?: ReactNode }) { return <SecondaryButton onClick={onClick} size="sm"><Download size={14} />{children}</SecondaryButton>; }
export function FilterButton({ onClick, children = 'Filter' }: { onClick?: () => void; children?: ReactNode }) { return <SecondaryButton onClick={onClick} size="sm"><Filter size={14} />{children}</SecondaryButton>; }

export function SectionCard({ title, description, actions, children, className = '' }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-zinc-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${className}`}>{title || actions ? <header className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4"><div>{title ? <h2 className="text-sm font-bold text-zinc-900">{title}</h2> : null}{description ? <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p> : null}</div>{actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}</header> : null}<div className="p-5">{children}</div></section>;
}

export function PercentBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'success' | 'warning' | 'danger' }) {
  const color = tone === 'success' ? 'bg-emerald-500' : tone === 'warning' ? 'bg-amber-500' : tone === 'danger' ? 'bg-red-500' : 'bg-indigo-500';
  return <div className="h-2 overflow-hidden rounded-full bg-zinc-100"><div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

export function ShortcutHint({ children }: { children: ReactNode }) { return <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400">{children}</kbd>; }

export { AlertTriangle, CalendarDays, CheckCircle2, Circle, Clock3, Filter, Info, Loader2, PackageOpen, RefreshCw, Search, SlidersHorizontal, XCircle };
