import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import {
  useAgentActivity, useAgentAnalytics, useAgentRuns, useAgents, useCustomers,
  useDashboardPeakTime, useDashboardStats, useInventory, useProducts,
  useReports, useRoles, useUsers, usePermissions,
} from '../hooks';
import { agentsApi, billsApi, categoriesApi, customersApi, dashboardApi, inventoryApi, ordersApi, permissionsApi, productsApi, promotionsApi, refundsApi, rolesApi, suppliersApi, usersApi, adminAiApi, type AgentTool } from '../api';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Bill, Customer, Inventory, Order, Product, Promotion, RefundRequest, Role, RolePermission, Permission, User } from '../types/domain';
import type { ApiListResult } from '../types/api';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell, Boxes,
  CalendarDays, Check, ChevronDown, ChevronRight, CircleDollarSign, Clock3, Download,
  ExternalLink, FileText, Filter, LayoutDashboard, MoreHorizontal, Package, Plus,
  Receipt, RefreshCw, Search, Settings2, ShoppingBag, ShoppingCart, Sparkles, Store,
  Tag, TicketPercent, Trash2, TrendingUp, Truck, UserRound, Users, WalletCards, X,
} from 'lucide-react';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

function PageHeader({ eyebrow, title, description, action, children }: { eyebrow?: string; title: string; description?: string; action?: ReactNode; children?: ReactNode }) {
  return <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div><div className="mb-1 text-[11px] font-bold uppercase tracking-[.16em] text-indigo-600">{eyebrow ?? 'Store operations'}</div><h1 className="font-display text-[28px] font-800 tracking-[-.03em] text-zinc-950">{title}</h1>{description && <p className="mt-1 max-w-2xl text-sm text-zinc-500">{description}</p>}</div>
    <div className="flex items-center gap-2">{children}{action}</div>
  </div>;
}
function Button({ children, variant = 'primary', icon: Icon, onClick, className, disabled }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; icon?: typeof Plus; onClick?: () => void; className?: string; disabled?: boolean }) {
  return <button disabled={disabled} onClick={onClick} className={cx('inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition focus:outline-none disabled:opacity-50', variant === 'primary' && 'bg-zinc-950 text-white shadow-sm hover:bg-zinc-800', variant === 'secondary' && 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50', variant === 'ghost' && 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900', variant === 'danger' && 'bg-red-50 text-red-700 hover:bg-red-100', className)}>{Icon && <Icon size={15} strokeWidth={2.2} />}{children}</button>;
}
function Card({ children, className }: { children: ReactNode; className?: string }) { return <div className={cx('rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]', className)}>{children}</div>; }
function Badge({ children, tone = 'neutral', dot = true }: { children: ReactNode; tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'purple'; dot?: boolean }) { const tones = { neutral: 'bg-zinc-100 text-zinc-600', info: 'bg-blue-50 text-blue-700', success: 'bg-emerald-50 text-emerald-700', warning: 'bg-amber-50 text-amber-700', danger: 'bg-red-50 text-red-700', purple: 'bg-indigo-50 text-indigo-700' }; const dots = { neutral: 'bg-zinc-400', info: 'bg-blue-500', success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-red-500', purple: 'bg-indigo-500' }; return <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{dot && <span className={cx('h-1.5 w-1.5 rounded-full', dots[tone])} />}{children}</span>; }
function SearchBox({ value, onChange, placeholder = 'Search...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) { return <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-400 shadow-sm"><Search size={16} /><input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400" placeholder={placeholder} /></label>; }
function Money({ value }: { value: number }) { return <span className="tabular-nums">₫{value.toLocaleString('vi-VN')}</span>; }
function Avatar({ name, color = 'indigo' }: { name: string; color?: string }) { return <div className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold', color === 'amber' ? 'bg-amber-100 text-amber-700' : color === 'green' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700')}>{name.split(' ').map((x) => x[0]).slice(-2).join('').toUpperCase()}</div>; }
function FilterButton({ children }: { children: ReactNode }) { return <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50">{children}<ChevronDown size={14} /></button>; }
function Toolbar({ search, setSearch, placeholder, children }: { search?: string; setSearch?: (v: string) => void; placeholder?: string; children?: ReactNode }) { return <div className="mb-4 flex flex-wrap items-center gap-2">{setSearch && <SearchBox value={search ?? ''} onChange={setSearch} placeholder={placeholder} />}{children}<Button variant="ghost" icon={RefreshCw}>Refresh</Button></div>; }
function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) { return <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500"><Package size={20} /></div><h3 className="font-semibold text-zinc-900">{title}</h3><p className="mt-1 max-w-sm text-sm text-zinc-500">{copy}</p>{action && <div className="mt-4">{action}</div>}</div>; }
function Drawer({ open, title, subtitle, onClose, children, width = 'max-w-[600px]' }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode; width?: string }) { if (!open) return null; return <div className="fixed inset-0 z-50 flex justify-end"><button aria-label="Close drawer" className="absolute inset-0 bg-zinc-950/25 backdrop-blur-[1px]" onClick={onClose} /><aside className={cx('relative h-full w-full overflow-y-auto bg-white shadow-2xl', width)}><div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-200 bg-white/95 px-6 py-5 backdrop-blur"><div><h2 className="font-display text-lg font-bold text-zinc-950">{title}</h2>{subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}</div><button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><X size={18} /></button></div><div className="p-6">{children}</div></aside></div>; }
function Field({ label, value, placeholder, type = 'text', children }: { label: string; value?: string; placeholder?: string; type?: string; children?: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-zinc-600">{label}</span>{children ?? <input type={type} defaultValue={value} placeholder={placeholder} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />}</label>; }
function SectionTitle({ children }: { children: ReactNode }) { return <div className="mb-3 mt-6 text-xs font-bold uppercase tracking-[.12em] text-zinc-400">{children}</div>; }
function ConfirmPrompt({ open, title, description, onClose, onConfirm, confirmLabel = 'Confirm' }: { open: boolean; title: string; description: string; onClose: () => void; onConfirm: () => void; confirmLabel?: string }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/35 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><AlertTriangle size={19} /></div><h2 className="font-display text-lg font-bold text-zinc-950">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Keep order</Button><Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button></div></div></div>;
}  function Status({ value }: { value?: string | null }) { const label = String(value ?? ''); const tone = label.toLowerCase().includes('cancel') || label === 'Failed' ? 'danger' : ['Completed', 'Delivered', 'Active', 'Paid', 'Approved', 'Normal', 'Ready', 'Available'].includes(label) ? 'success' : ['Shipping', 'Low', 'Pending', 'Unpaid', 'Running', 'Waiting tool', 'Pending approval'].includes(label) ? 'warning' : ['Processing', 'Info', 'Queued'].includes(label) ? 'info' : 'neutral'; return <Badge tone={tone}>{label}</Badge>; }
function fmtDate(value: string | null | undefined): string { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function TableSkeleton({ rows = 6 }: { rows?: number }) { return <div className="divide-y divide-zinc-100">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-12 animate-pulse bg-zinc-50" />)}</div>; }
function ErrorCard({ onRetry, message }: { onRetry: () => void; message?: string }) { return <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><AlertTriangle size={20} /></div><h3 className="font-semibold text-zinc-900">Không tải được dữ liệu</h3><p className="mt-1 max-w-sm text-sm text-zinc-500">{message ?? 'Đã xảy ra lỗi khi gọi API. Vui lòng thử lại.'}</p><div className="mt-4"><Button variant="secondary" icon={RefreshCw} onClick={onRetry}>Thử lại</Button></div></div>; }
function statValue(value: number | null | undefined, formatter: (value: number) => string = (v) => v.toLocaleString('vi-VN')): string { return typeof value === 'number' ? formatter(value) : '—'; }
function num(value: unknown): number | null { return typeof value === 'number' ? value : null; }
function mapDailyStats(raw: unknown): { name: string; value: number; orders: number | null }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    const rec = (item ?? {}) as Record<string, unknown>;
    const rawDate = rec.Date ?? rec.date ?? rec.Day ?? rec.day ?? rec.Label ?? rec.label;
    const name = typeof rawDate === 'string' ? rawDate.slice(5, 10) : String(rawDate ?? '');
    const value = num(rec.TotalRevenue) ?? num(rec.Revenue) ?? num(rec.revenue) ?? num(rec.Total) ?? num(rec.Amount) ?? 0;
    const orders = num(rec.TotalOrders) ?? num(rec.Orders) ?? num(rec.OrderCount);
    return { name, value, orders };
  }).filter((row) => row.name);
}
function pendingCount(value: unknown): number | null {
  if (typeof value === 'number') return value;
  const rec = (value ?? {}) as Record<string, unknown>;
  return num(rec.Count) ?? num(rec.count) ?? null;
}
function fmtDateOnly(value: string | null | undefined): string { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN'); }
function promotionStatus(promotion: Promotion): string { const now = Date.now(); const start = Date.parse(promotion.StartDate ?? ''); const end = Date.parse(promotion.EndDate ?? ''); if (Number.isFinite(start) && now < start) return 'Scheduled'; if (Number.isFinite(end) && now > end) return 'Expired'; return 'Active'; }
function formatCompactMoney(value: number) {
  if (value >= 1_000_000) return `₫${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `₫${Math.round(value / 1_000)}K`;
  return `₫${Math.round(value).toLocaleString('vi-VN')}`;
}
function DashboardPage() {
  const dashboardQuery = useDashboardStats();
  const live = (dashboardQuery.data ?? {}) as Record<string, unknown>;
  const auth = useAuth();
  const now = new Date();
  const dailyQuery = useQuery({ queryKey: ['dashboard', 'daily', now.getFullYear(), now.getMonth() + 1], queryFn: () => dashboardApi.dailyStats(now.getFullYear(), now.getMonth() + 1) });
  const pendingRefundsQuery = useQuery({ queryKey: ['dashboard', 'pending-refunds'], queryFn: dashboardApi.pendingRefundCount });
  const lowStockQuery = useQuery({ queryKey: ['dashboard', 'low-stock'], queryFn: () => productsApi.list({ pageSize: 200 }) });
  const pendingOrdersQuery = useQuery({ queryKey: ['dashboard', 'pending-orders'], queryFn: () => ordersApi.online({ status: 'Pending', pageSize: 1 }) });
  const topProductsQuery = useQuery({ queryKey: ['dashboard', 'top-products'], queryFn: () => dashboardApi.topProducts({ pageSize: 5 }) });
  const peakTimeQuery = useDashboardPeakTime();
  const dailyRows = mapDailyStats(dailyQuery.data);
  const revenueData = dailyRows;
  const totalRevenue = num(live.TotalRevenue);
  const totalOrders = num(live.TotalOrders);
  const onlineOrders = num(live.TotalOnlineOrders);
  const offlineOrders = num(live.TotalOfflineOrders);
  const onlineRevenue = num(live.OnlineRevenue);
  const offlineRevenue = num(live.OfflineRevenue);
  const revenueTotal = (onlineRevenue ?? 0) + (offlineRevenue ?? 0);
  const lowStockCount = (lowStockQuery.data?.items ?? []).filter((product) => !product.Deleted && (product.Quantity ?? 0) <= 5).length;
  const pendingRefundCount = pendingCount(pendingRefundsQuery.data);
  const pendingOrdersCount = pendingOrdersQuery.data?.totalCount;
  const peak = (peakTimeQuery.data ?? {}) as Record<string, unknown>;
  const peakHour = peak.PeakHour ?? peak.Hour ?? peak.HourOfDay ?? peak.PeakTime ?? null;
  const peakBuckets = (Array.isArray(peak.Buckets) ? peak.Buckets : Array.isArray(peak.Distribution) ? peak.Distribution : Array.isArray(peak.Slots) ? peak.Slots : null) as Array<Record<string, unknown>> | null;
  const channelSplit = [{ label: 'Online', value: onlineRevenue, color: 'bg-indigo-600' }, { label: 'Offline', value: offlineRevenue, color: 'bg-indigo-300' }];
  const stats = [{ label: 'Tổng doanh thu', value: statValue(totalRevenue, formatCompactMoney), icon: CircleDollarSign, tone: 'indigo' }, { label: 'Tổng đơn hàng', value: statValue(totalOrders), icon: ShoppingBag, tone: 'blue' }, { label: 'Đơn online', value: statValue(onlineOrders), icon: ShoppingCart, tone: 'violet' }, { label: 'Đơn tại quầy', value: statValue(offlineOrders), icon: Store, tone: 'amber' }];
  return <><PageHeader eyebrow="Tổng quan" title={`Xin chào, ${auth.user?.FullName ?? 'Quản trị viên'}`} description="Bức tranh hôm nay của cửa hàng bạn — dữ liệu trực tiếp từ hệ thống." action={<Button icon={RefreshCw} onClick={() => void dashboardQuery.refetch()}>Làm mới</Button>} />
    {dashboardQuery.isError && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>Không tải được thống kê dashboard. Các số liệu bên dưới đang trống.</span><Button variant="secondary" icon={RefreshCw} onClick={() => void dashboardQuery.refetch()}>Thử lại</Button></div>}
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map((s) => <Card key={s.label} className="p-4"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-zinc-500">{s.label}</p><p className="mt-2 font-display text-2xl font-bold tracking-tight text-zinc-950">{s.value}</p></div><div className={cx('flex h-9 w-9 items-center justify-center rounded-lg', s.tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600')}><s.icon size={18} /></div></div></Card>)}</div>
    <div className="mb-6 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
      <Card><div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><div><h2 className="font-display text-sm font-bold text-zinc-900">Doanh thu theo ngày</h2><p className="mt-0.5 text-xs text-zinc-500">Tháng {now.getMonth() + 1}/{now.getFullYear()} · dữ liệu thực tế</p></div></div><div className="h-[280px] p-4">{dailyQuery.isLoading ? <TableSkeleton rows={6} /> : revenueData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}><defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} /><stop offset="100%" stopColor="#4f46e5" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#f1f1f4" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} /><Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e4e4e7', boxShadow: '0 8px 24px rgba(0,0,0,.08)', fontSize: 12 }} formatter={(v) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v)), 'Doanh thu']} /><Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2.5} fill="url(#revenue-fill)" /></AreaChart></ResponsiveContainer> : <EmptyState title="Chưa có dữ liệu theo ngày" copy="Tháng này chưa có doanh thu nào được ghi nhận." />}</div></Card>
      <Card><div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><div><h2 className="font-display text-sm font-bold text-zinc-900">Doanh thu theo kênh</h2><p className="mt-0.5 text-xs text-zinc-500">Tổng cộng: {revenueTotal > 0 ? <Money value={revenueTotal} /> : '—'}</p></div></div><div className="space-y-5 p-5">{channelSplit.map((row) => {
        const pct = revenueTotal > 0 ? Math.round(((row.value ?? 0) / revenueTotal) * 100) : 0;
        return <div key={row.label}><div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-600"><span className="inline-flex items-center gap-1.5"><i className={cx('h-2 w-2 rounded-full', row.color)} />{row.label}</span><span>{row.value == null ? '—' : <Money value={row.value} />}{row.value != null ? ` · ${pct}%` : ''}</span></div><div className="h-2 overflow-hidden rounded-full bg-zinc-100"><div className={cx('h-full rounded-full', row.color)} style={{ width: `${pct}%` }} /></div></div>;
      })}</div><div className="border-t border-zinc-100 px-5 py-4 text-xs text-zinc-500">Đơn đã hoàn thành: <b className="text-zinc-800">{statValue(num(live.CompletedOrders))}</b> · Online {statValue(num(live.CompletedOnlineOrders))} · Tại quầy {statValue(num(live.CompletedOfflineOrders))}</div></Card></div>
    <div className="mb-6 grid gap-5 lg:grid-cols-[1.15fr_1fr_1fr]"><Card className="border-amber-200 bg-amber-50/45"><div className="flex items-center gap-2 border-b border-amber-100 px-5 py-4"><AlertTriangle size={16} className="text-amber-600" /><h2 className="font-display text-sm font-bold text-zinc-900">Cần xử lý</h2></div><div className="divide-y divide-amber-100/70">{[
        { label: 'sản phẩm sắp hết hàng', value: lowStockQuery.isLoading ? null : lowStockCount, href: '/inventory' },
        { label: 'yêu cầu hoàn tiền đang chờ', value: pendingRefundsQuery.isLoading ? null : pendingRefundCount, href: '/refunds' },
        { label: 'đơn online chờ duyệt', value: pendingOrdersQuery.isLoading ? null : pendingOrdersCount ?? null, href: '/orders' },
      ].map((row) => <Link key={row.href} to={row.href} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-amber-50"><span><b className="mr-1 text-zinc-950">{row.value ?? '…'}</b><span className="text-zinc-600">{row.label}</span></span><ChevronRight size={15} className="text-zinc-400" /></Link>)}</div></Card><Card><div className="border-b border-zinc-100 px-5 py-4"><h2 className="font-display text-sm font-bold text-zinc-900">Sản phẩm bán chạy</h2><p className="mt-0.5 text-xs text-zinc-500">Theo số lượng bán · dữ liệu thực tế</p></div><div className="divide-y divide-zinc-100">{topProductsQuery.isLoading ? <TableSkeleton rows={3} /> : (topProductsQuery.data?.items ?? []).length ? (topProductsQuery.data?.items ?? []).slice(0, 5).map((product, index) => <div className="flex items-center gap-3 px-5 py-3" key={product.ProductId}><span className="w-4 text-xs font-bold text-zinc-400">0{index + 1}</span><div className="h-8 w-8 rounded-lg bg-zinc-100" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-zinc-800">{product.ProductName}</p><p className="text-[11px] text-zinc-400">{statValue(num(product.SoldQuantity) ?? num((product as Record<string, unknown>).SoldUnits) ?? num(product.Quantity), (v) => `${v.toLocaleString('vi-VN')} đã bán`)}</p></div><TrendingUp size={14} className="text-emerald-500" /></div>) : <EmptyState title="Chưa có dữ liệu" copy="Chưa có đơn hàng nào trong kỳ." />}</div></Card><Card><div className="border-b border-zinc-100 px-5 py-4"><h2 className="font-display text-sm font-bold text-zinc-900">Giờ cao điểm</h2><p className="mt-0.5 text-xs text-zinc-500">Đơn theo giờ · dữ liệu thực tế</p></div>{peakTimeQuery.isLoading ? <TableSkeleton rows={3} /> : peakHour != null || peakBuckets ? <div className="flex items-center gap-6 p-5"><div className="relative h-32 w-32 shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={peakBuckets ?? [{ value: 1 }]} dataKey="Percent" nameKey="Label" innerRadius={38} outerRadius={58} paddingAngle={3} startAngle={90} endAngle={-270}>{(peakBuckets ?? [{ Label: '' }]).map((bucket, index) => <Cell key={index} fill={['#4f46e5', '#818cf8', '#c7d2fe', '#e0e7ff'][index % 4]} />)}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center"><b className="font-display text-lg">{String(peakHour ?? '—')}</b><span className="text-[10px] text-zinc-400">giờ cao điểm</span></div></div><div className="flex-1 space-y-2 text-xs">{(peakBuckets ?? []).map((bucket, index) => <p key={index} className="flex items-center gap-2 text-zinc-600"><i className={cx('h-2 w-2 rounded-full', ['bg-indigo-600', 'bg-indigo-400', 'bg-indigo-300', 'bg-indigo-100'][index % 4])} />{String(bucket.Label ?? bucket.Hour ?? bucket.Time ?? '—')} <b className="ml-auto text-zinc-900">{String(bucket.Percent ?? bucket.Percentage ?? bucket.Share ?? '—')}</b></p>)}{!peakBuckets && <p className="text-zinc-600">Giờ có nhiều đơn nhất: <b className="text-zinc-900">{String(peakHour)}</b></p>}</div></div> : <EmptyState title="Chưa có dữ liệu giờ cao điểm" copy="Hệ thống chưa ghi nhận đủ đơn hàng để phân tích giờ cao điểm." />}</Card></div>
    <Card><div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><div><h2 className="font-display text-sm font-bold text-zinc-900">Hiệu suất theo ngày</h2><p className="mt-0.5 text-xs text-zinc-500">Tháng {now.getMonth() + 1}/{now.getFullYear()} · dữ liệu thực tế</p></div></div><div className="overflow-x-auto">{dailyQuery.isLoading ? <TableSkeleton rows={5} /> : dailyRows.length ? <table className="w-full text-left text-xs"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr><th className="px-5 py-3 font-bold">Ngày</th><th className="px-5 py-3 font-bold">Đơn hàng</th><th className="px-5 py-3 font-bold">Doanh thu</th></tr></thead><tbody className="divide-y divide-zinc-100">{dailyRows.map((row) => <tr key={row.name} className="hover:bg-zinc-50/60"><td className="px-5 py-3 font-semibold text-zinc-700">{row.name}</td><td className="px-5 py-3 text-zinc-500">{row.orders ?? '—'}</td><td className="px-5 py-3 text-zinc-500"><Money value={row.value} /></td></tr>)}</tbody></table> : <EmptyState title="Chưa có dữ liệu" copy="Tháng này chưa có doanh thu nào được ghi nhận." />}</div></Card>
  </>;
}
function orderChannel(order: Order): 'Online' | 'Offline' { return (order.OrderType ?? '').toLowerCase().includes('off') ? 'Offline' : 'Online'; }
function OrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'All' | 'Online' | 'Offline'>('All');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const [acting, setActing] = useState(false);
  const ordersQuery = useQuery({
    queryKey: ['admin-orders', tab, page],
    queryFn: async (): Promise<ApiListResult<Order>> => {
      if (tab === 'Online') return ordersApi.online({ page, pageSize: 20 });
      if (tab === 'Offline') return ordersApi.offline({ page, pageSize: 20 });
      const [online, offline] = await Promise.all([ordersApi.online({ page, pageSize: 20 }), ordersApi.offline({ page, pageSize: 20 })]);
      return { items: [...online.items, ...offline.items], totalCount: online.totalCount + offline.totalCount, page: 1, pageSize: online.pageSize + offline.pageSize, raw: null };
    },
  });
  const list = (ordersQuery.data?.items ?? []).filter((order) => [`#${order.OrderId}`, order.Name, order.OrderStatus, order.PaymentMethod].join(' ').toLowerCase().includes(search.toLowerCase()));
  const totalCount = ordersQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 40));
  const detailQuery = useQuery({ queryKey: ['admin-order', selectedId], queryFn: () => ordersApi.byId(selectedId!), enabled: selectedId != null });
  const detail = detailQuery.data;
  const items = detail?.OrderItems ?? [];
  const subtotal = items.reduce((sum, item) => sum + (item.UnitPrice ?? 0) * (item.Quantity ?? 0), 0);
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-order', selectedId] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const act = async (run: () => Promise<unknown>) => {
    setActing(true); setActionError('');
    try { await run(); setCancelOpen(false); setSelectedId(null); refresh(); } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Hành động thất bại.'); } finally { setActing(false); }
  };
  return <><PageHeader eyebrow="Bán hàng" title="Đơn hàng" description="Theo dõi và xử lý mọi đơn hàng online lẫn tại quầy." action={<Link to="/pos"><Button icon={Plus}>Tạo đơn tại quầy</Button></Link>} /><div className="mb-4 flex items-center gap-1 border-b border-zinc-200">{(['All', 'Online', 'Offline'] as const).map((t) => <button key={t} onClick={() => { setTab(t); setPage(1); }} className={cx('border-b-2 px-4 py-2.5 text-sm font-semibold', tab === t ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-zinc-400 hover:text-zinc-700')}>{t === 'All' ? 'Tất cả' : t === 'Online' ? 'Online' : 'Tại quầy'}</button>)}</div><Card><div className="border-b border-zinc-100 p-4"><Toolbar search={search} setSearch={setSearch} placeholder="Tìm theo mã đơn, khách, trạng thái..." /></div>
    {ordersQuery.isLoading ? <TableSkeleton rows={7} /> : ordersQuery.isError ? <ErrorCard onRetry={() => void ordersQuery.refetch()} /> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Đơn', 'Khách hàng', 'Kênh', 'Thanh toán', 'Trạng thái', 'Tổng', 'Ngày đặt', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{list.map((order) => <tr key={order.OrderId} onClick={() => setSelectedId(order.OrderId)} className="cursor-pointer text-sm hover:bg-indigo-50/30"><td className="px-5 py-4 font-bold text-zinc-900">#{order.OrderId}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><Avatar name={order.Name ?? 'Khách vãng lai'} /><span className="font-medium text-zinc-700">{order.Name ?? 'Khách vãng lai'}</span></div></td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 text-zinc-600"><i className={cx('h-1.5 w-1.5 rounded-full', orderChannel(order) === 'Online' ? 'bg-indigo-500' : 'bg-amber-500')} />{orderChannel(order) === 'Online' ? 'Online' : 'Tại quầy'}</span></td><td className="px-5 py-4 text-zinc-500">{order.PaymentMethod ?? '—'}</td><td className="px-5 py-4"><Status value={order.OrderStatus ?? '—'} /></td><td className="px-5 py-4 font-semibold text-zinc-800"><Money value={order.TotalAmount ?? 0} /></td><td className="px-5 py-4 text-xs text-zinc-400">{fmtDate(order.OrderDate)}</td><td className="px-5 py-4"><button onClick={(e) => { e.stopPropagation(); setSelectedId(order.OrderId); }} className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>{!list.length && <EmptyState title="Không có đơn hàng" copy="Chưa có đơn nào khớp tìm kiếm hoặc trong kênh này." />}</div>}
    <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-400"><span>Hiển thị {list.length} / {totalCount} đơn · Trang {page}/{totalPages}</span><div className="flex items-center gap-1"><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">‹</button><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">›</button></div></div></Card>
    <Drawer open={selectedId != null} onClose={() => { setSelectedId(null); setActionError(''); }} title={detail ? `Đơn #${detail.OrderId}` : 'Đơn hàng'} subtitle={detail ? `${orderChannel(detail) === 'Online' ? 'Online' : 'Tại quầy'} · ${fmtDate(detail.OrderDate)}` : undefined}>
      {detailQuery.isLoading || !detail ? <TableSkeleton rows={6} /> : <>
        <div className="mb-5 flex items-center justify-between"><Status value={detail.OrderStatus ?? '—'} /><Badge tone="info">{detail.PaymentMethod ?? '—'}</Badge></div>
        {actionError && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{actionError}</p>}
        <SectionTitle>Khách hàng</SectionTitle>
        <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3"><Avatar name={detail.Name ?? 'Khách vãng lai'} /><div><p className="text-sm font-semibold text-zinc-900">{detail.Name ?? 'Khách vãng lai'}</p><p className="text-xs text-zinc-500">{detail.Phone ?? '—'} · {detail.Email ?? '—'}</p></div></div>
        {detail.Address && <p className="mt-2 text-xs text-zinc-500">Địa chỉ: {detail.Address}</p>}
        <SectionTitle>Sản phẩm</SectionTitle>
        <div className="space-y-3">{items.length ? items.map((item) => <div key={item.OrderItemId ?? `${item.ProductId}`} className="flex items-center justify-between text-sm"><div><p className="font-medium text-zinc-700">{item.Product?.ProductName ?? `Sản phẩm #${item.ProductId ?? '?'}`}</p><p className="text-xs text-zinc-400">{item.Quantity ?? 0} × <Money value={item.UnitPrice ?? 0} /></p></div><b className="text-zinc-800"><Money value={(item.UnitPrice ?? 0) * (item.Quantity ?? 0)} /></b></div>) : <p className="text-sm text-zinc-500">Đơn không có chi tiết sản phẩm.</p>}</div>
        <div className="my-5 border-t border-dashed border-zinc-200" />
        <div className="space-y-2 text-sm"><p className="flex justify-between text-zinc-500"><span>Tạm tính</span><span><Money value={subtotal} /></span></p><p className="flex justify-between text-zinc-500"><span>Giảm giá</span><span className="text-emerald-600">−<Money value={detail.DiscountAmount ?? 0} /></span></p><p className="flex justify-between text-base font-bold text-zinc-950"><span>Tổng cộng</span><span><Money value={detail.TotalAmount ?? 0} /></span></p></div>
        <SectionTitle>Thao tác</SectionTitle>
        <div className="mt-2 flex gap-2"><Button variant="danger" icon={X} disabled={acting} onClick={() => setCancelOpen(true)}>Hủy đơn</Button><Button className="flex-1" disabled={acting || ['Completed', 'Delivered', 'Cancelled', 'Canceled'].includes(detail.OrderStatus ?? '')} onClick={() => void act(() => ordersApi.updateStatus(detail.OrderId, 'Delivered'))}>Chuyển sang đã giao</Button></div>
      </>}
    </Drawer>
    <ConfirmPrompt open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={() => { if (selectedId != null) void act(() => ordersApi.cancelAdmin(selectedId)); }} title={`Hủy đơn #${selectedId ?? ''}?`} description="Hành động này cập nhật trạng thái đơn và có thể hoàn lại tồn kho. Không thể hoàn tác từ trang quản trị." confirmLabel="Hủy đơn" /></>;
}
function ProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const emptyForm = { ProductName: '', Barcode: '', Unit: '', Price: '', CategoryId: '', SupplierId: '', Quantity: '' };
  const [form, setForm] = useState(emptyForm);
  const productsQuery = useProducts({ page, pageSize: 20 });
  const categoriesQuery = useQuery({ queryKey: ['admin-categories'], queryFn: () => categoriesApi.list({ pageSize: 100 }), enabled: drawer });
  const suppliersQuery = useQuery({ queryKey: ['admin-suppliers'], queryFn: () => suppliersApi.list({ pageSize: 100 }), enabled: drawer });
  const list = (productsQuery.data?.items ?? []).filter((product) => [product.ProductName, product.Barcode, product.Category?.CategoryName, product.Supplier?.Name].join(' ').toLowerCase().includes(search.toLowerCase()));
  const totalCount = productsQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 20));
  const create = async () => {
    if (!form.ProductName.trim() || !form.Price) { setFormError('Nhập tên và giá sản phẩm.'); return; }
    setCreating(true); setFormError('');
    try {
      await productsApi.create({ ProductName: form.ProductName.trim(), Barcode: form.Barcode.trim() || null, Unit: form.Unit.trim() || null, Price: Number(form.Price), CategoryId: form.CategoryId ? Number(form.CategoryId) : null, SupplierId: form.SupplierId ? Number(form.SupplierId) : null, Quantity: form.Quantity ? Number(form.Quantity) : null });
      setDrawer(false); setForm(emptyForm); void queryClient.invalidateQueries({ queryKey: ['products'] }); void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Tạo sản phẩm thất bại.'); } finally { setCreating(false); }
  };
  return <><PageHeader eyebrow="Danh mục" title="Sản phẩm" description="Quản lý sản phẩm, giá và tồn kho." action={<Button icon={Plus} onClick={() => setDrawer(true)}>Thêm sản phẩm</Button>} /><Card><div className="border-b border-zinc-100 p-4"><Toolbar search={search} setSearch={setSearch} placeholder="Tìm sản phẩm..." /></div>
    {productsQuery.isLoading ? <TableSkeleton rows={7} /> : productsQuery.isError ? <ErrorCard onRetry={() => void productsQuery.refetch()} /> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Sản phẩm', 'Mã vạch', 'Danh mục', 'Nhà cung cấp', 'Giá', 'Tồn kho', 'Trạng thái', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{list.map((product) => <tr key={product.ProductId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-zinc-100" /><div><p className="font-semibold text-zinc-800">{product.ProductName}</p><p className="text-[11px] text-zinc-400">{product.Unit ?? '—'}</p></div></div></td><td className="px-5 py-3.5 font-mono text-xs text-zinc-500">{product.Barcode ?? '—'}</td><td className="px-5 py-3.5 text-zinc-500">{product.Category?.CategoryName ?? '—'}</td><td className="px-5 py-3.5 text-zinc-500">{product.Supplier?.SupplierName ?? '—'}</td><td className="px-5 py-3.5 font-semibold text-zinc-800"><Money value={product.Price} /></td><td className="px-5 py-3.5"><span className={cx('font-semibold', (product.Quantity ?? 0) === 0 ? 'text-red-600' : (product.Quantity ?? 0) <= 5 ? 'text-amber-600' : 'text-zinc-700')}>{product.Quantity ?? 0}</span><span className="ml-2 text-xs text-zinc-400">{(product.Quantity ?? 0) === 0 ? 'Hết hàng' : (product.Quantity ?? 0) <= 5 ? 'Sắp hết' : 'Bình thường'}</span></td><td className="px-5 py-3.5"><Status value={product.Deleted ? 'Archived' : 'Active'} /></td><td className="px-5 py-3.5"><MoreHorizontal size={17} className="text-zinc-400" /></td></tr>)}</tbody></table>{!list.length && <EmptyState title="Không có sản phẩm" copy="Chưa có sản phẩm nào khớp tìm kiếm." />}</div>}
    <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-400"><span>Hiển thị {list.length} / {totalCount} · Trang {page}/{totalPages}</span><div className="flex items-center gap-1"><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">‹</button><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">›</button></div></div></Card>
    <Drawer open={drawer} onClose={() => setDrawer(false)} title="Thêm sản phẩm" subtitle="Tạo sản phẩm mới trong danh mục">
      <div className="space-y-4"><Field label="Tên sản phẩm"><input value={form.ProductName} onChange={(e) => setForm((f) => ({ ...f, ProductName: e.target.value }))} placeholder="VD: Coca Cola lon 330ml" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Mã vạch"><input value={form.Barcode} onChange={(e) => setForm((f) => ({ ...f, Barcode: e.target.value }))} placeholder="893..." className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></Field><Field label="Đơn vị"><input value={form.Unit} onChange={(e) => setForm((f) => ({ ...f, Unit: e.target.value }))} placeholder="chai / hộp..." className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></Field></div>
      <Field label="Giá (₫)"><input value={form.Price} onChange={(e) => setForm((f) => ({ ...f, Price: e.target.value }))} type="number" min="0" placeholder="0" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Danh mục"><select value={form.CategoryId} onChange={(e) => setForm((f) => ({ ...f, CategoryId: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"><option value="">— Chọn —</option>{(categoriesQuery.data?.items ?? []).map((category) => <option key={category.CategoryId} value={category.CategoryId}>{category.CategoryName}</option>)}</select></Field><Field label="Nhà cung cấp"><select value={form.SupplierId} onChange={(e) => setForm((f) => ({ ...f, SupplierId: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400"><option value="">— Chọn —</option>{(suppliersQuery.data?.items ?? []).map((supplier) => <option key={supplier.SupplierId} value={supplier.SupplierId}>{String(supplier.SupplierName ?? (supplier as Record<string, unknown>).Name ?? '—')}</option>)}</select></Field></div>
      <Field label="Tồn kho ban đầu"><input value={form.Quantity} onChange={(e) => setForm((f) => ({ ...f, Quantity: e.target.value }))} type="number" min="0" placeholder="0" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></Field>
      {formError && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{formError}</p>}</div>
      <div className="mt-8 flex justify-end gap-2"><Button variant="secondary" onClick={() => setDrawer(false)}>Hủy</Button><Button disabled={creating} onClick={() => void create()}>{creating ? 'Đang tạo…' : 'Tạo sản phẩm'}</Button></div>
    </Drawer></>;
}
function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Inventory | null>(null);
  const [newQty, setNewQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const inventoryQuery = useInventory({ page, pageSize: 20 });
  const stockOf = (row: Inventory) => row.Quantity ?? row.Product?.Quantity ?? 0;
  const list = (inventoryQuery.data?.items ?? [])
    .filter((row) => (filter === 'All' || filter === 'Low' && stockOf(row) > 0 && stockOf(row) <= 5 || filter === 'Out of stock' && stockOf(row) === 0 || filter === 'Normal' && stockOf(row) > 5))
    .filter((row) => [row.Product?.ProductName, row.Product?.Barcode, row.Product?.Category?.CategoryName, row.Product?.Supplier?.Name].join(' ').toLowerCase().includes(search.toLowerCase()));
  const totalCount = inventoryQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 20));
  const saveStock = async () => {
    if (!selected?.ProductId) return;
    const qty = Number(newQty);
    if (!Number.isFinite(qty) || qty < 0) { setFormError('Nhập số lượng hợp lệ.'); return; }
    setSaving(true); setFormError('');
    try {
      await inventoryApi.setProductQuantity(selected.ProductId, Math.round(qty));
      setSelected(null); setNewQty('');
      void queryClient.invalidateQueries({ queryKey: ['inventory'] }); void queryClient.invalidateQueries({ queryKey: ['products'] }); void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Cập nhật tồn kho thất bại.'); } finally { setSaving(false); }
  };
  return <><PageHeader eyebrow="Danh mục" title="Tồn kho" description="Cập nhật số lượng tồn kho nhanh chóng." action={<Button variant="secondary" icon={Download}>Xuất file</Button>} /><Card><div className="border-b border-zinc-100 p-4"><Toolbar search={search} setSearch={setSearch} placeholder="Tìm sản phẩm..."><FilterButton><Boxes size={14} /> {filter}</FilterButton>{['All', 'Low', 'Out of stock', 'Normal'].map((f) => <button key={f} onClick={() => setFilter(f)} className={cx('hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold lg:block', filter === f ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-400 hover:bg-zinc-100')}>{f === 'All' ? 'Tất cả' : f === 'Low' ? 'Sắp hết' : f === 'Out of stock' ? 'Hết hàng' : 'Bình thường'}</button>)}</Toolbar></div>
    {inventoryQuery.isLoading ? <TableSkeleton rows={7} /> : inventoryQuery.isError ? <ErrorCard onRetry={() => void inventoryQuery.refetch()} /> : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Sản phẩm', 'Mã vạch', 'Nhà cung cấp', 'Tồn kho', 'Cập nhật', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{list.map((row) => { const stock = stockOf(row); return <tr key={row.InventoryId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4"><p className="font-semibold text-zinc-800">{row.Product?.ProductName ?? `#${row.ProductId}`}</p><p className="text-[11px] text-zinc-400">{row.Product?.Category?.CategoryName ?? '—'}</p></td><td className="px-5 py-4 font-mono text-xs text-zinc-500">{row.Product?.Barcode ?? '—'}</td><td className="px-5 py-4 text-zinc-500">{row.Product?.Supplier?.SupplierName ?? '—'}</td><td className="px-5 py-4"><button onClick={() => { setSelected(row); setNewQty(String(stock)); setFormError(''); }} className="group inline-flex items-center gap-2"><span className={cx('font-display text-lg font-bold', stock === 0 ? 'text-red-600' : stock <= 5 ? 'text-amber-600' : 'text-zinc-800')}>{stock}</span><Status value={stock === 0 ? 'Hết hàng' : stock <= 5 ? 'Low' : 'Normal'} /></button></td><td className="px-5 py-4 text-xs text-zinc-400">{fmtDate(row.UpdatedAt)}</td><td className="px-5 py-4"><MoreHorizontal size={17} className="text-zinc-400" /></td></tr>; })}</tbody></table>{!list.length && <EmptyState title="Không có dữ liệu tồn kho" copy="Chưa có bản ghi tồn kho nào khớp bộ lọc." />}</div>}
    <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-400"><span>Hiển thị {list.length} / {totalCount} · Trang {page}/{totalPages}</span><div className="flex items-center gap-1"><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">‹</button><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">›</button></div></div></Card>
    <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title="Cập nhật tồn kho" subtitle={selected?.Product?.ProductName}><div className="rounded-xl bg-zinc-50 p-4"><p className="text-xs text-zinc-500">Số lượng hiện tại</p><p className="mt-1 font-display text-2xl font-bold text-zinc-950">{selected ? stockOf(selected) : '—'}</p></div><div className="mt-5"><Field label="Số lượng mới"><input value={newQty} onChange={(e) => setNewQty(e.target.value)} type="number" min="0" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></Field></div>{formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{formError}</p>}<div className="mt-8 flex justify-end gap-2"><Button variant="secondary" onClick={() => setSelected(null)}>Hủy</Button><Button disabled={saving} onClick={() => void saveStock()}>{saving ? 'Đang lưu…' : 'Cập nhật'}</Button></div></Drawer></>;
}function PosPage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<Array<{ product: Product; qty: number }>>([]);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const productsQuery = useQuery({ queryKey: ['pos-products', query], queryFn: () => productsApi.pos({ search: query.trim() || undefined, pageSize: 48 }) });
  const shown = productsQuery.data?.items ?? [];
  const total = cart.reduce((sum, line) => sum + line.product.Price * line.qty, 0);
  const add = (product: Product) => setCart((items) => items.some((line) => line.product.ProductId === product.ProductId) ? items.map((line) => line.product.ProductId === product.ProductId ? { ...line, qty: line.qty + 1 } : line) : [...items, { product, qty: 1 }]);
  const pay = async () => {
    if (!cart.length) return;
    setPaying(true); setMessage(null);
    try {
      const result = await ordersApi.create({ OrderType: 'Offline', PaymentMethod: 'Cash', Name: 'Khách tại quầy', OrderItems: cart.map((line) => ({ ProductId: line.product.ProductId, Quantity: line.qty, UnitPrice: line.product.Price })) });
      setCart([]);
      const created = (result as { Order?: Order }).Order;
      setMessage({ tone: 'ok', text: created ? `Đã tạo đơn #${created.OrderId} · <Money value={${created.TotalAmount ?? total}} />` : 'Đã tạo đơn thành công.' });
      void queryClient.invalidateQueries({ queryKey: ['pos-products'] }); void queryClient.invalidateQueries({ queryKey: ['admin-orders'] }); void queryClient.invalidateQueries({ queryKey: ['dashboard'] }); void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (cause) { setMessage({ tone: 'error', text: cause instanceof Error ? cause.message : 'Tạo đơn thất bại.' }); } finally { setPaying(false); }
  };
  return <div className="-m-4 min-h-[calc(100vh-64px)] bg-zinc-100/70 p-4 lg:-m-6 lg:p-6"><div className="mb-4 flex items-center justify-between"><div><div className="mb-1 text-[11px] font-bold uppercase tracking-[.16em] text-indigo-600">Bán hàng</div><h1 className="font-display text-2xl font-bold text-zinc-950">Điểm bán (POS)</h1></div><Badge tone="success">Quầy mở · #01</Badge></div>{message && <div className={cx('mb-4 rounded-xl px-4 py-3 text-sm font-medium', message.tone === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>{message.tone === 'ok' ? <>Đã tạo đơn thành công. Tổng: <b><Money value={total} /></b> — xem chi tiết ở trang Đơn hàng.</> : message.text}</div>}<div className="grid min-h-[calc(100vh-160px)] gap-4 xl:grid-cols-[1.65fr_1fr]"><Card className="flex flex-col overflow-hidden"><div className="flex flex-wrap gap-2 border-b border-zinc-100 p-4"><SearchBox value={query} onChange={setQuery} placeholder="Quét mã vạch hoặc tìm sản phẩm..." /></div><div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-4">{productsQuery.isLoading ? <TableSkeleton rows={8} /> : productsQuery.isError ? <ErrorCard onRetry={() => void productsQuery.refetch()} /> : shown.map((product) => <button key={product.ProductId} disabled={(product.Quantity ?? 0) === 0} onClick={() => add(product)} className="group rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"><div className="mb-3 flex aspect-[1.2] items-center justify-center rounded-lg bg-zinc-100"><Package size={24} className="text-zinc-400" /></div><p className="line-clamp-2 min-h-8 text-xs font-semibold text-zinc-800">{product.ProductName}</p><p className="mt-1 text-sm font-bold text-zinc-950"><Money value={product.Price} /></p><p className={cx('mt-2 text-[11px] font-semibold', (product.Quantity ?? 0) === 0 ? 'text-red-600' : (product.Quantity ?? 0) <= 5 ? 'text-amber-600' : 'text-zinc-400')}>{(product.Quantity ?? 0) === 0 ? 'Hết hàng' : `Còn ${product.Quantity}`}</p></button>)}{!productsQuery.isLoading && !shown.length && <EmptyState title="Không tìm thấy sản phẩm" copy="Thử từ khóa khác." />}</div></Card><Card className="flex flex-col overflow-hidden"><div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><div><h2 className="font-display text-sm font-bold text-zinc-900">Đơn hiện tại</h2><p className="mt-0.5 text-xs text-zinc-400">{cart.reduce((sum, line) => sum + line.qty, 0)} món · Bán tại quầy</p></div><button onClick={() => setCart([])} className="text-xs font-semibold text-red-600 hover:underline">Xóa</button></div><div className="flex-1 divide-y divide-zinc-100 overflow-y-auto p-4">{cart.map((line) => <div key={line.product.ProductId} className="flex gap-3 py-3 first:pt-0"><div className="h-10 w-10 shrink-0 rounded-lg bg-zinc-100" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-zinc-800">{line.product.ProductName}</p><p className="mt-1 text-xs text-zinc-400"><Money value={line.product.Price} /></p></div><div className="flex items-center gap-2"><button onClick={() => setCart((items) => items.map((item) => item.product.ProductId === line.product.ProductId ? { ...item, qty: Math.max(1, item.qty - 1) } : item))} className="h-6 w-6 rounded border border-zinc-200 text-zinc-500">−</button><span className="w-4 text-center text-xs font-bold">{line.qty}</span><button onClick={() => add(line.product)} className="h-6 w-6 rounded border border-zinc-200 text-zinc-500">+</button></div></div>)}{!cart.length && <EmptyState title="Đơn trống" copy="Chọn sản phẩm để thêm vào đơn bán." />}</div><div className="border-t border-zinc-100 p-5"><div className="space-y-2 text-sm"><p className="flex justify-between text-zinc-500"><span>Tạm tính</span><span><Money value={total} /></span></p><p className="flex justify-between text-zinc-500"><span>Giảm giá</span><span>₫0</span></p><p className="mt-3 flex justify-between border-t border-dashed border-zinc-200 pt-3 text-base font-bold text-zinc-950"><span>Tổng cộng</span><span><Money value={total} /></span></p></div><Button className="mt-4 w-full" disabled={!cart.length || paying} onClick={() => void pay()}>{paying ? 'Đang xử lý…' : <>Thanh toán & hoàn tất <ChevronRight size={16} /></>}</Button></div></Card></div></div>;
}
function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const emptyForm = { Name: '', Phone: '', Email: '', Address: '' };
  const [form, setForm] = useState(emptyForm);
  const [drawerCreateOpen, setDrawerCreateOpen] = useState(false);
  const customersQuery = useCustomers({ pageSize: 50 });
  const list = (customersQuery.data?.items ?? []).filter((customer) => [customer.Name, customer.Phone, customer.Email].join(' ').toLowerCase().includes(search.toLowerCase()));
  const detailQuery = useQuery({ queryKey: ['admin-customer', selectedId], queryFn: () => customersApi.byId(selectedId!), enabled: selectedId != null && drawerOpen });
  const detail = detailQuery.data;
  const recentOrders = detail?.Orders ?? [];
  const create = async () => {
    if (!form.Name.trim()) { setFormError('Nhập tên khách hàng.'); return; }
    setCreating(true); setFormError('');
    try {
      await customersApi.create({ Name: form.Name.trim(), Phone: form.Phone.trim() || null, Email: form.Email.trim() || null, Address: form.Address.trim() || null });
      setDrawerCreateOpen(false); setForm(emptyForm); void queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Tạo khách hàng thất bại.'); } finally { setCreating(false); }
  };
  return <><PageHeader eyebrow="Bán hàng" title="Khách hàng" description="Danh sách khách hàng của cửa hàng." action={<Button icon={Plus} onClick={() => setDrawerCreateOpen(true)}>Thêm khách hàng</Button>} /><Card><div className="border-b border-zinc-100 p-4"><Toolbar search={search} setSearch={setSearch} placeholder="Tìm theo tên, số điện thoại..." /></div><div className="overflow-x-auto">{customersQuery.isLoading ? <TableSkeleton rows={6} /> : customersQuery.isError ? <ErrorCard onRetry={() => void customersQuery.refetch()} /> : <table className="w-full min-w-[760px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Khách hàng', 'Điện thoại', 'Email', 'Ngày tạo', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{list.map((customer) => <tr key={customer.CustomerId} onClick={() => { setSelectedId(customer.CustomerId); setDrawerOpen(true); }} className="cursor-pointer text-sm hover:bg-zinc-50/60"><td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar name={customer.Name} /><span className="font-semibold text-zinc-800">{customer.Name}</span></div></td><td className="px-5 py-4 text-zinc-500">{customer.Phone ?? '—'}</td><td className="px-5 py-4 text-zinc-500">{customer.Email ?? '—'}</td><td className="px-5 py-4 text-xs text-zinc-400">{fmtDate(customer.CreatedAt)}</td><td className="px-5 py-4"><MoreHorizontal size={17} className="text-zinc-400" /></td></tr>)}</tbody></table>}{!customersQuery.isLoading && !list.length && <EmptyState title="Không có khách hàng" copy="Chưa có khách hàng nào khớp tìm kiếm." />}</div></Card>
    <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={detail?.Name ?? 'Khách hàng'} subtitle={detail ? `Khách hàng từ ${fmtDate(detail.CreatedAt)}` : undefined}>
      {detailQuery.isLoading || !detail ? <TableSkeleton rows={5} /> : <>
        <div className="flex items-center gap-3"><Avatar name={detail.Name} /><div><p className="font-semibold text-zinc-900">{detail.Name}</p><p className="text-xs text-zinc-500">{detail.Phone ?? '—'} · {detail.Email ?? '—'}</p></div></div>
        {detail.Address && <p className="mt-3 text-xs text-zinc-500">Địa chỉ: {detail.Address}</p>}
        <div className="mt-5 rounded-xl bg-zinc-50 p-4"><p className="text-xs text-zinc-500">Số đơn hàng</p><p className="mt-1 font-display text-xl font-bold text-zinc-950">{detail.Orders?.length ?? '—'}</p></div>
        <SectionTitle>Đơn hàng gần đây</SectionTitle>
        {recentOrders.length ? recentOrders.slice(0, 5).map((order) => <div key={order.OrderId} className="flex items-center justify-between border-b border-zinc-100 py-3"><div><p className="text-sm font-semibold text-zinc-700">#{order.OrderId}</p><p className="text-xs text-zinc-400">{fmtDate(order.OrderDate)}</p></div><div className="text-right"><p className="text-sm font-semibold text-zinc-800"><Money value={order.TotalAmount ?? 0} /></p><Status value={order.OrderStatus ?? '—'} /></div></div>) : <p className="text-sm text-zinc-500">Chưa có đơn hàng nào.</p>}
      </>}
    </Drawer>
    <Drawer open={drawerCreateOpen} onClose={() => setDrawerCreateOpen(false)} title="Thêm khách hàng" subtitle="Tạo hồ sơ khách hàng mới">
      <div className="space-y-4"><Field label="Họ tên"><input value={form.Name} onChange={(e) => setForm((f) => ({ ...f, Name: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Điện thoại"><input value={form.Phone} onChange={(e) => setForm((f) => ({ ...f, Phone: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></Field><Field label="Email"><input value={form.Email} onChange={(e) => setForm((f) => ({ ...f, Email: e.target.value }))} type="email" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></Field></div>
      <Field label="Địa chỉ"><input value={form.Address} onChange={(e) => setForm((f) => ({ ...f, Address: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></Field>
      {formError && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{formError}</p>}</div>
      <div className="mt-8 flex justify-end gap-2"><Button variant="secondary" onClick={() => setDrawerCreateOpen(false)}>Hủy</Button><Button disabled={creating} onClick={() => void create()}>{creating ? 'Đang tạo…' : 'Tạo khách hàng'}</Button></div>
    </Drawer></>;
}
function ListPage({ type }: { type: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const meta: Record<string, { title: string; eyebrow: string; description: string; icon: typeof Tag; action: string }> = {
    Categories: { title: 'Danh mục', eyebrow: 'Danh mục', description: 'Nhóm sản phẩm thành các nhóm dễ tìm.', icon: Tag, action: 'Thêm danh mục' },
    Suppliers: { title: 'Nhà cung cấp', eyebrow: 'Danh mục', description: 'Thông tin nhà cung cấp và nguồn hàng.', icon: Truck, action: 'Thêm nhà cung cấp' },
    Promotions: { title: 'Khuyến mãi', eyebrow: 'Bán hàng', description: 'Theo dõi các chiến dịch giảm giá.', icon: TicketPercent, action: 'Tạo khuyến mãi' },
    Bills: { title: 'Hóa đơn', eyebrow: 'Tài chính', description: 'Trạng thái thanh toán của đơn hàng.', icon: Receipt, action: 'Xuất hóa đơn' },
    Refunds: { title: 'Yêu cầu hoàn tiền', eyebrow: 'Tài chính', description: 'Xử lý yêu cầu hoàn tiền của khách.', icon: RefreshCw, action: 'Xuất file' },
  };
  const config = meta[type] ?? meta.Categories;
  const categoriesQuery = useQuery({ queryKey: ['admin-categories'], queryFn: () => categoriesApi.list({ pageSize: 100 }), enabled: type === 'Categories' });
  const suppliersQuery = useQuery({ queryKey: ['admin-suppliers'], queryFn: () => suppliersApi.list({ pageSize: 100 }), enabled: type === 'Suppliers' });
  const promotionsQuery = useQuery({ queryKey: ['admin-promotions'], queryFn: () => promotionsApi.list({ pageSize: 100 }), enabled: type === 'Promotions' });
  const billsQuery = useQuery({ queryKey: ['admin-bills'], queryFn: () => billsApi.list({ pageSize: 100 }), enabled: type === 'Bills' });
  const refundsQuery = useQuery({ queryKey: ['admin-refunds'], queryFn: () => refundsApi.list({ pageSize: 100 }), enabled: type === 'Refunds' });
  const activeQuery = type === 'Categories' ? categoriesQuery : type === 'Suppliers' ? suppliersQuery : type === 'Promotions' ? promotionsQuery : type === 'Bills' ? billsQuery : refundsQuery;
  const list = (activeQuery.data?.items ?? []).filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase()));
  const isLoading = activeQuery.isLoading;
  const runAction = async (run: () => Promise<unknown>) => {
    setActionError('');
    try { await run(); void queryClient.invalidateQueries({ queryKey: ['admin-refunds'] }); void queryClient.invalidateQueries({ queryKey: ['admin-bills'] }); void queryClient.invalidateQueries({ queryKey: ['dashboard'] }); } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Hành động thất bại.'); }
  };
  const createItem = async () => {
    if (!createName.trim()) { setFormError('Nhập tên.'); return; }
    setCreating(true); setFormError('');
    try {
      if (type === 'Categories') await categoriesApi.create({ CategoryName: createName.trim() });
      else if (type === 'Suppliers') await suppliersApi.create({ Name: createName.trim() });
      setCreateOpen(false); setCreateName('');
      void queryClient.invalidateQueries({ queryKey: ['admin-categories'] }); void queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] }); void queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Tạo thất bại.'); } finally { setCreating(false); }
  };
  return <><PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description} action={(type === 'Categories' || type === 'Suppliers') ? <Button icon={config.icon} onClick={() => { setCreateOpen(true); setFormError(''); }}>{config.action}</Button> : <Button variant="secondary" icon={Download}>{config.action}</Button>} />
    {type === 'Refunds' && <div className="mb-4 flex gap-2"><Badge tone="warning">Đang chờ: {(refundsQuery.data?.items ?? []).filter((refund) => (refund.Status ?? '').toLowerCase() === 'pending').length}</Badge></div>}<Card><div className="border-b border-zinc-100 p-4"><Toolbar search={search} setSearch={setSearch} placeholder="Tìm kiếm..." /></div>{actionError && <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{actionError}</p>}<div className="overflow-x-auto">
    {isLoading ? <TableSkeleton rows={6} /> : activeQuery.isError ? <ErrorCard onRetry={() => void activeQuery.refetch()} /> : !list.length ? <EmptyState title="Không có dữ liệu" copy="Chưa có bản ghi nào." /> : type === 'Categories' ? (
      <table className="w-full min-w-[600px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Danh mục', 'Trạng thái', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{(list as import('../types/domain').Category[]).map((category) => <tr key={category.CategoryId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4 font-semibold text-zinc-800">{category.CategoryName}</td><td className="px-5 py-4"><Status value="Active" /></td><td className="px-5 py-4"><MoreHorizontal size={17} className="text-zinc-400" /></td></tr>)}</tbody></table>
    ) : type === 'Suppliers' ? (
      <table className="w-full min-w-[700px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Nhà cung cấp', 'Điện thoại', 'Email', 'Địa chỉ', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{(list as import('../types/domain').Supplier[]).map((supplier) => <tr key={supplier.SupplierId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4 font-semibold text-zinc-800">{String(supplier.SupplierName ?? (supplier as Record<string, unknown>).Name ?? '—')}</td><td className="px-5 py-4 text-zinc-500">{String(supplier.Phone ?? '—')}</td><td className="px-5 py-4 text-zinc-500">{String(supplier.Email ?? '—')}</td><td className="px-5 py-4 text-zinc-500">{String(supplier.Address ?? '—')}</td><td className="px-5 py-4"><MoreHorizontal size={17} className="text-zinc-400" /></td></tr>)}</tbody></table>
    ) : type === 'Promotions' ? (
      <table className="w-full min-w-[820px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Mã', 'Giảm giá', 'Lượt dùng', 'Thời gian', 'Trạng thái', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{(list as Promotion[]).map((promotion) => <tr key={promotion.PromoId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4 font-bold text-zinc-800">{promotion.PromoCode}</td><td className="px-5 py-4 text-zinc-600">{promotion.DiscountType === 'percent' ? `${promotion.DiscountValue}%` : <Money value={promotion.DiscountValue} />}</td><td className="px-5 py-4 text-zinc-500">{promotion.UsedCount ?? 0} / {promotion.UsageLimit ?? '∞'}</td><td className="px-5 py-4 text-xs text-zinc-400">{fmtDateOnly(promotion.StartDate)} → {fmtDateOnly(promotion.EndDate)}</td><td className="px-5 py-4"><Status value={promotionStatus(promotion)} /></td><td className="px-5 py-4"><MoreHorizontal size={17} className="text-zinc-400" /></td></tr>)}</tbody></table>
    ) : type === 'Bills' ? (
      <table className="w-full min-w-[820px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Hóa đơn', 'Đơn', 'Khách hàng', 'Số tiền', 'Trạng thái', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{(list as Bill[]).map((bill) => <tr key={bill.BillId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4 font-bold text-zinc-800">#B-{bill.BillId}</td><td className="px-5 py-4 text-zinc-500">#{bill.OrderId}</td><td className="px-5 py-4 text-zinc-500">{String(bill.Customer?.Name ?? bill.Name ?? '—')}</td><td className="px-5 py-4 font-semibold text-zinc-800"><Money value={bill.FinalAmount} /></td><td className="px-5 py-4"><div className="flex flex-col items-start gap-1"><Status value={bill.PayStatus} /><Status value={bill.BillStatus} /></div></td><td className="px-5 py-4">{String(bill.PayStatus ?? '').toLowerCase() === 'unpaid' ? <Button variant="secondary" className="h-8 text-xs" onClick={() => void runAction(() => billsApi.pay(bill.BillId))}>Nhận tiền</Button> : <MoreHorizontal size={17} className="text-zinc-400" />}</td></tr>)}</tbody></table>
    ) : (
      <table className="w-full min-w-[820px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Yêu cầu', 'Đơn', 'Khách hàng', 'Lý do', 'Số tiền', 'Trạng thái', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{(list as RefundRequest[]).map((refund) => <tr key={refund.RefundId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4 font-bold text-zinc-800">#RF-{refund.RefundId}</td><td className="px-5 py-4 text-zinc-500">#{refund.OrderId}</td><td className="px-5 py-4 text-zinc-500">{String(refund.CustomerName ?? refund.Order?.Customer?.Name ?? '—')}</td><td className="px-5 py-4 max-w-[220px] truncate text-zinc-500">{refund.Reason ?? '—'}</td><td className="px-5 py-4 font-semibold text-zinc-800"><Money value={refund.RefundAmount} /></td><td className="px-5 py-4"><Status value={refund.Status ?? 'Pending'} /></td><td className="px-5 py-4">{(refund.Status ?? '').toLowerCase() === 'pending' ? <Button variant="secondary" className="h-8 text-xs" onClick={() => void runAction(() => ordersApi.confirmRefund(refund.RefundId))}>Duyệt hoàn tiền</Button> : <MoreHorizontal size={17} className="text-zinc-400" />}</td></tr>)}</tbody></table>
    )}
    </div></Card>
    <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title={config.action} subtitle="Dữ liệu sẽ được lưu ngay vào hệ thống">
      <Field label="Tên"><input value={createName} onChange={(e) => setCreateName(e.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" /></Field>
      {formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{formError}</p>}
      <div className="mt-8 flex justify-end gap-2"><Button variant="secondary" onClick={() => setCreateOpen(false)}>Hủy</Button><Button disabled={creating} onClick={() => void createItem()}>{creating ? 'Đang tạo…' : 'Tạo'}</Button></div>
    </Drawer></>; }function AiPage({ page }: { page: string }) {
  const titles: Record<string, [string, string]> = { chat: ['Trợ lý AI', 'Hỏi đáp về cửa hàng dựa trên dữ liệu thật.'], agents: ['Agents', 'Cấu hình các agent vận hành và công cụ cho phép.'], runs: ['Agent runs', 'Theo dõi model runs, tool calls và kết quả.'], activity: ['Hoạt động trực tiếp', 'Sự kiện tool execution và model theo thời gian thực.'], reports: ['Báo cáo', 'Báo cáo vận hành do agent tạo ra.'], analytics: ['Phân tích agent', 'Mức sử dụng, độ tin cậy và hiệu suất tool.'], tools: ['Tools', 'Danh sách tool read-only khả dụng.'] };
  const [title, description] = titles[page] ?? titles.agents;
  const agentsQuery = useAgents({ pageSize: 50 });
  const runsQuery = useAgentRuns({ pageSize: 50 });
  const activityQuery = useAgentActivity({ pageSize: 50 });
  const reportsQuery = useReports({ pageSize: 50 });
  const analyticsQuery = useAgentAnalytics();
  const toolsQuery = useQuery({ queryKey: ['admin-agent-tools'], queryFn: () => agentsApi.tools(), enabled: page === 'tools' });
  const analytics = (analyticsQuery.data ?? {}) as Record<string, unknown>;
  const successRate = num(analytics.SuccessRate) ?? num(analytics.successRate);
  const listQuery = page === 'agents' ? agentsQuery : page === 'runs' ? runsQuery : page === 'activity' ? activityQuery : page === 'reports' ? reportsQuery : toolsQuery;
  if (page === 'chat') return <AiChatPage />;
  return <><PageHeader eyebrow="Vận hành AI" title={title} description={description} action={<Button variant="secondary" icon={Download}>Xuất file</Button>} />
    {page === 'analytics' ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: 'Tổng runs', value: statValue(num(analytics.TotalRuns) ?? num(analytics.totalRuns) ?? num(analytics.Total)) },
      { label: 'Tỷ lệ thành công', value: typeof successRate === 'number' ? `${successRate.toFixed(1)}%` : '—' },
      { label: 'Runs thất bại', value: statValue(num(analytics.FailedRuns) ?? num(analytics.failedRuns)) },
      { label: 'Lượt gọi tool', value: statValue(num(analytics.ToolCalls) ?? num(analytics.toolCalls)) },
    ].map(({ label, value }) => <Card key={label} className="p-5"><p className="text-xs font-semibold text-zinc-500">{label}</p><div className="mt-2 flex items-end justify-between"><b className="font-display text-2xl text-zinc-950">{value}</b><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Settings2 size={16} /></span></div></Card>)}</div> : <Card>
      {listQuery.isLoading ? <TableSkeleton rows={6} /> : listQuery.isError ? <ErrorCard onRetry={() => void listQuery.refetch()} /> : !listQuery.data || (('items' in listQuery.data) && (listQuery.data as ApiListResult<unknown>).items.length === 0) || (page === 'tools' && ((listQuery.data as unknown as AgentTool[] | null)?.length ?? 0) === 0) ? <EmptyState title="Chưa có dữ liệu" copy="Hệ thống chưa ghi nhận dữ liệu nào." /> : <div className="divide-y divide-zinc-100">{(page === 'agents' ? (agentsQuery.data?.items ?? []).map((agent) => ({ id: agent.AgentId, icon: 'agents', name: agent.Name, sub: `${agent.Model} · ${(agent.Tools ?? []).length} tools`, status: agent.Enabled ? 'Running' : 'Paused' })) : page === 'runs' ? (runsQuery.data?.items ?? []).map((run) => ({ id: run.AgentRunId, icon: 'runs', name: run.AgentName, sub: `RUN-${run.AgentRunId} · ${fmtDate((run as unknown as Record<string, unknown>).CreatedAt as string)}`, status: run.Status })) : page === 'activity' ? (activityQuery.data?.items ?? []).map((event) => ({ id: event.AgentEventId ?? Math.random(), icon: 'activity', name: `${event.Type} · ${event.Level}`, sub: event.Message, status: event.Level })) : page === 'reports' ? (reportsQuery.data?.items ?? []).map((report) => ({ id: report.AgentReportId, icon: 'reports', name: report.Title, sub: `${report.ReportType} · Run #${report.AgentRunId}`, status: 'Ready' })) : ((toolsQuery.data ?? []) as AgentTool[]).map((tool) => ({ id: tool.Name, icon: 'tools', name: tool.Name, sub: `${tool.Description} · ${tool.Category}`, status: tool.Enabled ? 'Available' : 'Disabled' }))).map((row) => <div key={`${row.icon}-${row.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">{row.icon === 'agents' ? <Sparkles size={16} /> : row.icon === 'tools' ? <Settings2 size={16} /> : <Activity size={16} />}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-zinc-800">{row.name}</p><p className="text-xs text-zinc-400">{row.sub}</p></div><Status value={row.status} /><button className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100"><MoreHorizontal size={17} /></button></div>)}</div>}
    </Card>}</>;
}

function AiChatPage() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    setMessages((current) => [...current, { role: 'user', content }, { role: 'assistant', content: '' }]);
    setInput(''); setBusy(true); setError('');
    try {
      for await (const event of adminAiApi.stream(content)) {
        if (event.Type === 'error') { setError(event.Error ?? 'AI tạm thời không khả dụng.'); break; }
        if (event.Text) setMessages((current) => { const copy = [...current]; const last = copy[copy.length - 1]; copy[copy.length - 1] = { ...last, content: last.content + (event.Text ?? '') }; return copy; });
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không kết nối được AI.'); } finally { setBusy(false); }
  };
  return <div className="-m-4 flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-100/70 p-4 lg:-m-6 lg:p-6"><Card className="flex h-[min(720px,calc(100vh-110px))] w-full max-w-4xl flex-col overflow-hidden">
    <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white"><Sparkles size={17} /></div><div><h1 className="font-display text-sm font-bold">Trợ lý cửa hàng</h1><p className="text-xs text-zinc-400">Copilot vận hành chỉ đọc</p></div><Badge tone="success">Online</Badge></div>
    <div className="flex-1 space-y-4 overflow-y-auto bg-zinc-50/60 p-5">{!messages.length && !busy ? <div className="flex h-full flex-col items-center justify-center text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Sparkles size={24} /></div><h2 className="font-display text-2xl font-bold text-zinc-950">Bạn cần tìm gì?</h2><p className="mt-2 max-w-md text-sm text-zinc-500">Hỏi về tồn kho, đơn hàng, xu hướng bán hoặc hiệu suất sản phẩm.</p><div className="mt-7 grid w-full max-w-xl gap-2 sm:grid-cols-2"><button onClick={() => void send('Tồn kho mì gói hiện tại là bao nhiêu?')} className="rounded-xl border border-zinc-200 bg-white p-3 text-left text-xs font-semibold text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50">“Tồn kho mì gói hiện tại?”</button><button onClick={() => void send('Doanh thu tuần này so với tuần trước như thế nào?')} className="rounded-xl border border-zinc-200 bg-white p-3 text-left text-xs font-semibold text-zinc-600 hover:border-indigo-300 hover:bg-indigo-50">“Doanh thu tuần này so với tuần trước?”</button></div></div> : messages.map((message, index) => <div key={index} className={cx('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}><div className={cx('max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6', message.role === 'user' ? 'bg-indigo-600 text-white' : 'border border-zinc-200 bg-white text-zinc-800')}>{message.content || (busy && index === messages.length - 1 ? <span className="inline-flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:.15s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:.3s]" /></span> : '…')}</div></div>)}</div>
    {error && <p className="mx-5 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
    <div className="border-t border-zinc-100 p-4"><form onSubmit={(event) => { event.preventDefault(); void send(input); }} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Hỏi về cửa hàng của bạn..." className="flex-1 bg-transparent text-sm outline-none" disabled={busy} /><button type="submit" disabled={busy || !input.trim()} className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white disabled:opacity-40"><ArrowUpRight size={15} /></button></form><p className="mt-2 text-center text-[11px] text-zinc-400">Câu trả lời dựa trên dữ liệu cửa hàng. Hãy kiểm tra các quyết định quan trọng.</p></div>
  </Card></div>;
}
function AdminPage({ page }: { page: string }) {
  const queryClient = useQueryClient();
  const map: Record<string, [string, string]> = { users: ['Nhân sự', 'Quản lý tài khoản nhân viên và phân quyền.'], roles: ['Vai trò', 'Định nghĩa vai trò trong cửa hàng.'], permissions: ['Quyền hạn', 'Xem và gán quyền cho từng vai trò.'] };
  const [title, description] = map[page] ?? map.users;
  const usersQuery = useUsers({ pageSize: 100 });
  const rolesQuery = useRoles({ pageSize: 100 });
  const permissionsQuery = usePermissions({ pageSize: 100 });
  const mappingsQuery = useQuery({ queryKey: ['admin-role-permissions'], queryFn: () => permissionsApi.mappings({ pageSize: 500 }), enabled: page === 'permissions' });
  const [toggling, setToggling] = useState(false);
  const [actionError, setActionError] = useState('');
  const mappingSet = new Set((mappingsQuery.data?.items ?? []).map((mapping) => `${mapping.RoleId}-${mapping.PermissionId}`));
  const togglePermission = async (roleId: number, permissionId: number, has: boolean) => {
    setToggling(true); setActionError('');
    try {
      if (has) await permissionsApi.removeMapping({ RoleId: roleId, PermissionId: permissionId });
      else await permissionsApi.assign({ RoleId: roleId, PermissionId: permissionId });
      void queryClient.invalidateQueries({ queryKey: ['admin-role-permissions'] });
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Cập nhật quyền thất bại.'); } finally { setToggling(false); }
  };
  const roleLabel = (role: number | null | undefined) => role === 1 ? 'Admin' : role === 2 ? 'Manager' : role === 3 ? 'Staff' : `Vai trò ${role ?? '?'}`;
  return <><PageHeader eyebrow="Quản trị" title={title} description={description} action={<Button icon={Plus}>{page === 'users' ? 'Thêm nhân sự' : page === 'roles' ? 'Thêm vai trò' : 'Thêm quyền'}</Button>} /><Card><div className="border-b border-zinc-100 p-4"><FilterButton>Tất cả vai trò</FilterButton></div>{actionError && <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{actionError}</p>}
    {page === 'permissions' ? (
      mappingsQuery.isLoading || permissionsQuery.isLoading || rolesQuery.isLoading ? <TableSkeleton rows={6} /> : mappingsQuery.isError ? <ErrorCard onRetry={() => void mappingsQuery.refetch()} /> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400"><tr><th className="px-5 py-3">Quyền hạn</th>{(rolesQuery.data?.items ?? []).map((role) => <th key={role.RoleId} className="px-5 py-3">{role.RoleName}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{(permissionsQuery.data?.items ?? []).map((permission) => <tr key={permission.PermissionId}><td className="px-5 py-4 font-semibold text-zinc-700">{permission.PermissionName}<span className="ml-2 font-mono text-[10px] text-zinc-400">{permission.ActionKey}</span></td>{(rolesQuery.data?.items ?? []).map((role) => { const has = mappingSet.has(`${role.RoleId}-${permission.PermissionId}`); return <td key={role.RoleId} className="px-5 py-4"><button disabled={toggling} onClick={() => void togglePermission(role.RoleId, permission.PermissionId, has)} className={cx('flex h-5 w-5 items-center justify-center rounded border transition', has ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-zinc-300 bg-white text-transparent hover:border-indigo-400')}><Check size={13} /></button></td>; })}</tr>)}</tbody></table></div>
    ) : page === 'users' ? (
      usersQuery.isLoading ? <TableSkeleton rows={5} /> : usersQuery.isError ? <ErrorCard onRetry={() => void usersQuery.refetch()} /> : <div className="divide-y divide-zinc-100">{(usersQuery.data?.items ?? []).map((user) => <div key={user.UserId} className="flex items-center gap-3 px-5 py-4"><Avatar name={user.FullName ?? user.Username} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-zinc-800">{user.FullName ?? user.Username}</p><p className="text-xs text-zinc-400">{user.Username} · {user.RoleNavigation?.RoleName ?? roleLabel(user.Role)}</p></div><Status value="Active" /><MoreHorizontal size={17} className="text-zinc-400" /></div>)}</div>
    ) : (
      rolesQuery.isLoading ? <TableSkeleton rows={4} /> : rolesQuery.isError ? <ErrorCard onRetry={() => void rolesQuery.refetch()} /> : <div className="divide-y divide-zinc-100">{(rolesQuery.data?.items ?? []).map((role) => <div key={role.RoleId} className="flex items-center gap-3 px-5 py-4"><Avatar name={role.RoleName} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-zinc-800">{role.RoleName}</p><p className="text-xs text-zinc-400">{role.Description ?? '—'}</p></div><Status value="Active" /><MoreHorizontal size={17} className="text-zinc-400" /></div>)}</div>
    )}
  </Card></>;
}
export const pages = { DashboardPage, OrdersPage, ProductsPage, InventoryPage, PosPage, CustomersPage, ListPage, AiPage, AdminPage };
export function PlaceholderPage({ title }: { title: string }) { return <PageHeader title={title} description="This workspace is ready for the next connected operation." action={<Button icon={Plus}>Create</Button>} />; }
export function OrderDetailPage() { const { id } = useParams(); return <OrdersPage />; }

export function AdminPages({ page }: { page: string }) {
  switch (page) {
    case 'dashboard': return <DashboardPage />;
    case 'orders': return <OrdersPage />;
    case 'orders-detail': return <OrderDetailPage />;
    case 'pos': return <PosPage />;
    case 'products': return <ProductsPage />;
    case 'inventory': return <InventoryPage />;
    case 'customers': return <CustomersPage />;
    case 'categories': return <ListPage type="Categories" />;
    case 'suppliers': return <ListPage type="Suppliers" />;
    case 'promotions': return <ListPage type="Promotions" />;
    case 'bills': return <ListPage type="Bills" />;
    case 'refunds': return <ListPage type="Refunds" />;
    case 'ai-chat': return <AiPage page="chat" />;
    case 'ai-agents':
    case 'ai-agents-detail': return <AiPage page="agents" />;
    case 'ai-runs':
    case 'ai-runs-detail': return <AiPage page="runs" />;
    case 'ai-activity': return <AiPage page="activity" />;
    case 'ai-reports': return <AiPage page="reports" />;
    case 'ai-analytics': return <AiPage page="analytics" />;
    case 'ai-tools': return <AiPage page="tools" />;
    case 'admin-users': return <AdminPage page="users" />;
    case 'admin-roles': return <AdminPage page="roles" />;
    case 'admin-permissions': return <AdminPage page="permissions" />;
    default: return <PlaceholderPage title="Page not found" />;
  }
}

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!username || !password) { setError('Enter your username and password.'); return; }
    if (!auth) { navigate('/dashboard'); return; }
    setBusy(true);
    try { await auth.login(username, password); navigate('/dashboard'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to sign in.'); } finally { setBusy(false); }
  }
  return <div className="flex min-h-screen bg-zinc-950"><div className="hidden w-[46%] flex-col justify-between overflow-hidden bg-indigo-600 p-10 text-white lg:flex"><div><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Store size={20} /></span><span className="font-display text-lg font-bold">NOVA MART</span></div><div className="mt-[18vh] max-w-md"><p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-indigo-200">Store operations</p><h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-[-.04em]">Run your store with clarity.</h1><p className="mt-5 text-base leading-7 text-indigo-100">One calm workspace for orders, inventory, customers and the decisions behind them.</p></div></div><p className="text-xs text-indigo-200">© 2026 Nova Mart · Admin workspace</p></div><main className="flex flex-1 items-center justify-center bg-canvas p-6 sm:p-10"><div className="w-full max-w-[380px]"><div className="mb-10 lg:hidden"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white"><Store size={20} /></span><span className="font-display text-lg font-bold">NOVA MART</span></div></div><div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-indigo-600">Welcome back</p><h1 className="font-display text-3xl font-extrabold tracking-[-.03em] text-zinc-950">Sign in to admin</h1><p className="mt-2 text-sm text-zinc-500">Use your store account to continue.</p></div><form onSubmit={submit} className="space-y-4"><Field label="Username"><input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="you@store.vn" className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100" /></Field><Field label="Password"><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Enter your password" className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100" /></Field>{error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{error}</p>}<Button className="mt-2 h-11 w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}<ChevronRight size={16} /></Button></form><div className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-xs leading-5 text-indigo-800"><b>Local preview</b><br />The dashboard remains available without a live API. Sign in connects to `/api/auth/login` when the backend is running.</div></div></main></div>;
}
