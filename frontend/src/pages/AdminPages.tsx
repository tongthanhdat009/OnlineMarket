import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import {
  useAgentActivity, useAgentAnalytics, useAgentRuns, useAgents, useAutoAnalysisStatus, useCustomers,
  useDashboardPeakTime, useDashboardStats, useInventory, useProducts,
  useReports, useRoles, useUsers, usePermissions,
} from '../hooks';
import { agentsApi, billsApi, categoriesApi, customersApi, dashboardApi, inventoryApi, ordersApi, permissionsApi, productsApi, promotionsApi, refundsApi, rolesApi, suppliersApi, usersApi, adminAiApi, adminAuditApi, reportsApi, type AgentTool } from '../api';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Bill, Customer, Inventory, Order, Product, Promotion, RefundRequest, Role, RolePermission, Permission, User } from '../types/domain';
import type { ApiListResult } from '../types/api';
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell, Boxes,
  CalendarDays, Check, ChevronDown, ChevronRight, CircleDollarSign, ClipboardList, Clock3, Download,
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
    <div><div className="mb-1 text-[11px] font-bold uppercase tracking-[.16em] text-leaf">{eyebrow ?? 'Vận hành cửa hàng'}</div><h1 className="font-display text-[28px] font-800 tracking-[-.03em] text-zinc-950">{title}</h1>{description && <p className="mt-1 max-w-2xl text-sm text-zinc-500">{description}</p>}</div>
    <div className="flex items-center gap-2">{children}{action}</div>
  </div>;
}
function Button({ children, variant = 'primary', icon: Icon, onClick, className, disabled }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; icon?: typeof Plus; onClick?: () => void; className?: string; disabled?: boolean }) {
  return <button disabled={disabled} onClick={onClick} className={cx('inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition focus:outline-none disabled:opacity-50', variant === 'primary' && 'bg-leaf text-white shadow-sm hover:bg-leaf-dark', variant === 'secondary' && 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50', variant === 'ghost' && 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900', variant === 'danger' && 'bg-red-50 text-red-700 hover:bg-red-100', className)}>{Icon && <Icon size={15} strokeWidth={2.2} />}{children}</button>;
}
function Card({ children, className }: { children: ReactNode; className?: string }) { return <div className={cx('rounded-xl border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]', className)}>{children}</div>; }
function Badge({ children, tone = 'neutral', dot = true }: { children: ReactNode; tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'purple'; dot?: boolean }) { const tones = { neutral: 'bg-zinc-100 text-zinc-600', info: 'bg-blue-50 text-blue-700', success: 'bg-emerald-50 text-emerald-700', warning: 'bg-amber-50 text-amber-700', danger: 'bg-red-50 text-red-700', purple: 'bg-leaf-soft text-leaf-dark' }; const dots = { neutral: 'bg-zinc-400', info: 'bg-blue-500', success: 'bg-emerald-500', warning: 'bg-amber-500', danger: 'bg-red-500', purple: 'bg-leaf' }; return <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', tones[tone])}>{dot && <span className={cx('h-1.5 w-1.5 rounded-full', dots[tone])} />}{children}</span>; }
function SearchBox({ value, onChange, placeholder = 'Tìm kiếm...' }: { value: string; onChange: (v: string) => void; placeholder?: string }) { return <label className="flex h-9 min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-zinc-400 shadow-sm"><Search size={16} /><input value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400" placeholder={placeholder} /></label>; }
function Money({ value }: { value: number }) { return <span className="tabular-nums">₫{value.toLocaleString('vi-VN')}</span>; }
function Avatar({ name, color = 'indigo' }: { name: string; color?: string }) { return <div className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold', color === 'amber' ? 'bg-amber-100 text-amber-700' : color === 'green' ? 'bg-emerald-100 text-emerald-700' : 'bg-leaf-soft text-leaf-dark')}>{name.split(' ').map((x) => x[0]).slice(-2).join('').toUpperCase()}</div>; }
function ProductThumbnail({ product }: { product: Product }) {
  const src = typeof product.ImageUrl === 'string' && product.ImageUrl.trim() ? product.ImageUrl : null;
  return src ? (
    <img
      src={src}
      alt={product.ProductName}
      className="h-10 w-10 shrink-0 overflow-hidden rounded-lg object-cover"
      loading="lazy"
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400"><Package size={16} /></div>
  );
}
function FilterButton({ children }: { children: ReactNode }) { return <button className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 shadow-sm hover:bg-zinc-50">{children}<ChevronDown size={14} /></button>; }
/** Tải file CSV từ bảng dữ liệu (header + các dòng). */
function exportCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}
function Toolbar({ search, setSearch, placeholder, children, onRefresh }: { search?: string; setSearch?: (v: string) => void; placeholder?: string; children?: ReactNode; onRefresh?: () => void }) { return <div className="mb-4 flex flex-wrap items-center gap-2">{setSearch && <SearchBox value={search ?? ''} onChange={setSearch} placeholder={placeholder} />}{children}<Button variant="ghost" icon={RefreshCw} onClick={onRefresh}>Làm mới</Button></div>; }
/** Hành động trên mỗi dòng bảng: Sửa / Xóa. */
function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) { return <div className="flex justify-end gap-1"><button onClick={onEdit} className="rounded px-2 py-1 text-xs font-semibold text-leaf hover:bg-leaf-soft">Sửa</button><button onClick={onDelete} className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">Xóa</button></div>; }
function EmptyState({ title, copy, action }: { title: string; copy: string; action?: ReactNode }) { return <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500"><Package size={20} /></div><h3 className="font-semibold text-zinc-900">{title}</h3><p className="mt-1 max-w-sm text-sm text-zinc-500">{copy}</p>{action && <div className="mt-4">{action}</div>}</div>; }
function Drawer({ open, title, subtitle, onClose, children, width = 'max-w-[600px]' }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode; width?: string }) { if (!open) return null; return <div className="fixed inset-0 z-50 flex justify-end"><button aria-label="Đóng" className="absolute inset-0 bg-zinc-950/25 backdrop-blur-[1px]" onClick={onClose} /><aside className={cx('relative h-full w-full overflow-y-auto bg-white shadow-2xl', width)}><div className="sticky top-0 z-10 flex items-start justify-between border-b border-zinc-200 bg-white/95 px-6 py-5 backdrop-blur"><div><h2 className="font-display text-lg font-bold text-zinc-950">{title}</h2>{subtitle && <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p>}</div><button onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><X size={18} /></button></div><div className="p-6">{children}</div></aside></div>; }
function Field({ label, value, placeholder, type = 'text', children }: { label: string; value?: string; placeholder?: string; type?: string; children?: ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-zinc-600">{label}</span>{children ?? <input type={type} defaultValue={value} placeholder={placeholder} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-leaf focus:ring-2 focus:ring-leaf/20" />}</label>; }
function SectionTitle({ children }: { children: ReactNode }) { return <div className="mb-3 mt-6 text-xs font-bold uppercase tracking-[.12em] text-zinc-400">{children}</div>; }
function ConfirmPrompt({ open, title, description, onClose, onConfirm, confirmLabel = 'Xác nhận' }: { open: boolean; title: string; description: string; onClose: () => void; onConfirm: () => void; confirmLabel?: string }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/35 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600"><AlertTriangle size={19} /></div><h2 className="font-display text-lg font-bold text-zinc-950">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p><div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Quay lại</Button><Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button></div></div></div>;  }  function Status({ value }: { value?: string | null }) { const raw = String(value ?? ''); const label = statusLabel[raw] ?? raw; const tone = raw.toLowerCase().includes('cancel') || raw === 'Failed' ? 'danger' : ['Completed', 'Delivered', 'Active', 'Paid', 'Approved', 'Normal', 'Ready', 'Available'].includes(raw) ? 'success' : ['Shipping', 'Low', 'Pending', 'Unpaid', 'Running', 'Waiting tool', 'Pending approval'].includes(raw) ? 'warning' : ['Processing', 'Info', 'Queued'].includes(raw) ? 'info' : 'neutral'; return <Badge tone={tone}>{label}</Badge>; }
function fmtDate(value: string | null | undefined): string { if (!value) return '—'; const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
/** Bản dịch trạng thái (giữ nguyên chuỗi lạ từ API nếu chưa có trong map). */
const statusLabel: Record<string, string> = {
  Completed: 'Hoàn tất', Delivered: 'Đã giao', Shipping: 'Đang giao', Processing: 'Đang xử lý', Queued: 'Chờ lượt',
  Active: 'Hoạt động', Expired: 'Hết hạn', Scheduled: 'Đã lên lịch', Disabled: 'Tắt',
  Paid: 'Đã thanh toán', Unpaid: 'Chưa thanh toán', Approved: 'Đã duyệt', Rejected: 'Từ chối',
  Normal: 'Bình thường', Low: 'Sắp hết', 'Out of stock': 'Hết hàng', Ready: 'Sẵn sàng', Available: 'Khả dụng',
  Running: 'Đang chạy', Paused: 'Tạm dừng', Failed: 'Thất bại', Cancelled: 'Đã hủy', Canceled: 'Đã hủy',
  Pending: 'Chờ xử lý', 'Waiting tool': 'Chờ công cụ', 'Pending approval': 'Chờ phê duyệt', Info: 'Thông tin',
};
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
  const channelSplit = [{ label: 'Online', value: onlineRevenue, color: 'bg-leaf' }, { label: 'Offline', value: offlineRevenue, color: 'bg-leaf/40' }];
  const stats = [{ label: 'Tổng doanh thu', value: statValue(totalRevenue, formatCompactMoney), icon: CircleDollarSign, tone: 'indigo' }, { label: 'Tổng đơn hàng', value: statValue(totalOrders), icon: ShoppingBag, tone: 'blue' }, { label: 'Đơn online', value: statValue(onlineOrders), icon: ShoppingCart, tone: 'violet' }, { label: 'Đơn tại quầy', value: statValue(offlineOrders), icon: Store, tone: 'amber' }];
  return <><PageHeader eyebrow="Tổng quan" title={`Xin chào, ${auth.user?.FullName ?? 'Quản trị viên'}`} description="Bức tranh hôm nay của cửa hàng bạn — dữ liệu trực tiếp từ hệ thống." action={<Button icon={RefreshCw} onClick={() => void dashboardQuery.refetch()}>Làm mới</Button>} />
    {dashboardQuery.isError && <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><span>Không tải được thống kê dashboard. Các số liệu bên dưới đang trống.</span><Button variant="secondary" icon={RefreshCw} onClick={() => void dashboardQuery.refetch()}>Thử lại</Button></div>}
    <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map((s) => <Card key={s.label} className="p-4"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-zinc-500">{s.label}</p><p className="mt-2 font-display text-2xl font-bold tracking-tight text-zinc-950">{s.value}</p></div><div className={cx('flex h-9 w-9 items-center justify-center rounded-lg', s.tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-leaf-soft text-leaf')}><s.icon size={18} /></div></div></Card>)}</div>
    <div className="mb-6 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
      <Card><div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><div><h2 className="font-display text-sm font-bold text-zinc-900">Doanh thu theo ngày</h2><p className="mt-0.5 text-xs text-zinc-500">Tháng {now.getMonth() + 1}/{now.getFullYear()} · dữ liệu thực tế</p></div></div><div className="h-[280px] p-4">{dailyQuery.isLoading ? <TableSkeleton rows={6} /> : revenueData.length ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={revenueData} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}><defs><linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#247448" stopOpacity={0.2} /><stop offset="100%" stopColor="#247448" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#f1f1f4" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#a1a1aa' }} /><Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e4e4e7', boxShadow: '0 8px 24px rgba(0,0,0,.08)', fontSize: 12 }} formatter={(v) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v)), 'Doanh thu']} /><Area type="monotone" dataKey="value" stroke="#247448" strokeWidth={2.5} fill="url(#revenue-fill)" /></AreaChart></ResponsiveContainer> : <EmptyState title="Chưa có dữ liệu theo ngày" copy="Tháng này chưa có doanh thu nào được ghi nhận." />}</div></Card>
      <Card><div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><div><h2 className="font-display text-sm font-bold text-zinc-900">Doanh thu theo kênh</h2><p className="mt-0.5 text-xs text-zinc-500">Tổng cộng: {revenueTotal > 0 ? <Money value={revenueTotal} /> : '—'}</p></div></div><div className="space-y-5 p-5">{channelSplit.map((row) => {
        const pct = revenueTotal > 0 ? Math.round(((row.value ?? 0) / revenueTotal) * 100) : 0;
        return <div key={row.label}><div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-zinc-600"><span className="inline-flex items-center gap-1.5"><i className={cx('h-2 w-2 rounded-full', row.color)} />{row.label}</span><span>{row.value == null ? '—' : <Money value={row.value} />}{row.value != null ? ` · ${pct}%` : ''}</span></div><div className="h-2 overflow-hidden rounded-full bg-zinc-100"><div className={cx('h-full rounded-full', row.color)} style={{ width: `${pct}%` }} /></div></div>;
      })}</div><div className="border-t border-zinc-100 px-5 py-4 text-xs text-zinc-500">Đơn đã hoàn thành: <b className="text-zinc-800">{statValue(num(live.CompletedOrders))}</b> · Online {statValue(num(live.CompletedOnlineOrders))} · Tại quầy {statValue(num(live.CompletedOfflineOrders))}</div></Card></div>
    <div className="mb-6 grid gap-5 lg:grid-cols-[1.15fr_1fr_1fr]"><Card className="border-amber-200 bg-amber-50/45"><div className="flex items-center gap-2 border-b border-amber-100 px-5 py-4"><AlertTriangle size={16} className="text-amber-600" /><h2 className="font-display text-sm font-bold text-zinc-900">Cần xử lý</h2></div><div className="divide-y divide-amber-100/70">{[
        { label: 'sản phẩm sắp hết hàng', value: lowStockQuery.isLoading ? null : lowStockCount, href: '/inventory' },
        { label: 'yêu cầu hoàn tiền đang chờ', value: pendingRefundsQuery.isLoading ? null : pendingRefundCount, href: '/refunds' },
        { label: 'đơn online chờ duyệt', value: pendingOrdersQuery.isLoading ? null : pendingOrdersCount ?? null, href: '/orders' },
      ].map((row) => <Link key={row.href} to={row.href} className="flex items-center justify-between px-5 py-3 text-sm hover:bg-amber-50"><span><b className="mr-1 text-zinc-950">{row.value ?? '…'}</b><span className="text-zinc-600">{row.label}</span></span><ChevronRight size={15} className="text-zinc-400" /></Link>)}</div></Card><Card><div className="border-b border-zinc-100 px-5 py-4"><h2 className="font-display text-sm font-bold text-zinc-900">Sản phẩm bán chạy</h2><p className="mt-0.5 text-xs text-zinc-500">Theo số lượng bán · dữ liệu thực tế</p></div><div className="divide-y divide-zinc-100">{topProductsQuery.isLoading ? <TableSkeleton rows={3} /> : (topProductsQuery.data?.items ?? []).length ? (topProductsQuery.data?.items ?? []).slice(0, 5).map((product, index) => <div className="flex items-center gap-3 px-5 py-3" key={product.ProductId}><span className="w-4 text-xs font-bold text-zinc-400">0{index + 1}</span><div className="h-8 w-8 rounded-lg bg-zinc-100" /><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-zinc-800">{product.ProductName}</p><p className="text-[11px] text-zinc-400">{statValue(num(product.SoldQuantity) ?? num((product as Record<string, unknown>).SoldUnits) ?? num(product.Quantity), (v) => `${v.toLocaleString('vi-VN')} đã bán`)}</p></div><TrendingUp size={14} className="text-emerald-500" /></div>) : <EmptyState title="Chưa có dữ liệu" copy="Chưa có đơn hàng nào trong kỳ." />}</div></Card><Card><div className="border-b border-zinc-100 px-5 py-4"><h2 className="font-display text-sm font-bold text-zinc-900">Giờ cao điểm</h2><p className="mt-0.5 text-xs text-zinc-500">Đơn theo giờ · dữ liệu thực tế</p></div>{peakTimeQuery.isLoading ? <TableSkeleton rows={3} /> : peakHour != null || peakBuckets ? <div className="flex items-center gap-6 p-5"><div className="relative h-32 w-32 shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={peakBuckets ?? [{ value: 1 }]} dataKey="Percent" nameKey="Label" innerRadius={38} outerRadius={58} paddingAngle={3} startAngle={90} endAngle={-270}>{(peakBuckets ?? [{ Label: '' }]).map((bucket, index) => <Cell key={index} fill={['#247448', '#15532f', '#7fb894', '#cfe8d6'][index % 4]} />)}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 flex flex-col items-center justify-center"><b className="font-display text-lg">{String(peakHour ?? '—')}</b><span className="text-[10px] text-zinc-400">giờ cao điểm</span></div></div><div className="flex-1 space-y-2 text-xs">{(peakBuckets ?? []).map((bucket, index) => <p key={index} className="flex items-center gap-2 text-zinc-600"><i className={cx('h-2 w-2 rounded-full', ['bg-leaf', 'bg-leaf-dark', 'bg-leaf/40', 'bg-leaf-soft'][index % 4])} />{String(bucket.Label ?? bucket.Hour ?? bucket.Time ?? '—')} <b className="ml-auto text-zinc-900">{String(bucket.Percent ?? bucket.Percentage ?? bucket.Share ?? '—')}</b></p>)}{!peakBuckets && <p className="text-zinc-600">Giờ có nhiều đơn nhất: <b className="text-zinc-900">{String(peakHour)}</b></p>}</div></div> : <EmptyState title="Chưa có dữ liệu giờ cao điểm" copy="Hệ thống chưa ghi nhận đủ đơn hàng để phân tích giờ cao điểm." />}</Card></div>
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
  return <><PageHeader eyebrow="Bán hàng" title="Đơn hàng" description="Theo dõi và xử lý mọi đơn hàng online lẫn tại quầy." action={<Link to="/pos"><Button icon={Plus}>Tạo đơn tại quầy</Button></Link>} /><div className="mb-4 flex items-center gap-1 border-b border-zinc-200">{(['All', 'Online', 'Offline'] as const).map((t) => <button key={t} onClick={() => { setTab(t); setPage(1); }} className={cx('border-b-2 px-4 py-2.5 text-sm font-semibold', tab === t ? 'border-leaf text-leaf-dark' : 'border-transparent text-zinc-400 hover:text-zinc-700')}>{t === 'All' ? 'Tất cả' : t === 'Online' ? 'Online' : 'Tại quầy'}</button>)}</div><Card><div className="border-b border-zinc-100 p-4"><Toolbar search={search} setSearch={setSearch} placeholder="Tìm theo mã đơn, khách, trạng thái..." onRefresh={() => void ordersQuery.refetch()} /></div>
    {ordersQuery.isLoading ? <TableSkeleton rows={7} /> : ordersQuery.isError ? <ErrorCard onRetry={() => void ordersQuery.refetch()} /> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Đơn', 'Khách hàng', 'Kênh', 'Thanh toán', 'Trạng thái', 'Tổng', 'Ngày đặt', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{list.map((order) => <tr key={order.OrderId} onClick={() => setSelectedId(order.OrderId)} className="cursor-pointer text-sm hover:bg-leaf-soft/30"><td className="px-5 py-4 font-bold text-zinc-900">#{order.OrderId}</td><td className="px-5 py-4"><div className="flex items-center gap-2"><Avatar name={order.Name ?? 'Khách vãng lai'} /><span className="font-medium text-zinc-700">{order.Name ?? 'Khách vãng lai'}</span></div></td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 text-zinc-600"><i className={cx('h-1.5 w-1.5 rounded-full', orderChannel(order) === 'Online' ? 'bg-leaf' : 'bg-amber-500')} />{orderChannel(order) === 'Online' ? 'Online' : 'Tại quầy'}</span></td><td className="px-5 py-4 text-zinc-500">{order.PaymentMethod ?? '—'}</td><td className="px-5 py-4"><Status value={order.OrderStatus ?? '—'} /></td><td className="px-5 py-4 font-semibold text-zinc-800"><Money value={order.TotalAmount ?? 0} /></td><td className="px-5 py-4 text-xs text-zinc-400">{fmtDate(order.OrderDate)}</td><td className="px-5 py-4"><button onClick={(e) => { e.stopPropagation(); setSelectedId(order.OrderId); }} className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table>{!list.length && <EmptyState title="Không có đơn hàng" copy="Chưa có đơn nào khớp tìm kiếm hoặc trong kênh này." />}</div>}
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
  const [actionError, setActionError] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const emptyForm = { ProductName: '', Barcode: '', Unit: '', Price: '', CategoryId: '', SupplierId: '', Quantity: '' };
  const [form, setForm] = useState(emptyForm);
  const productsQuery = useProducts({ page, pageSize: 20 });
  const categoriesQuery = useQuery({ queryKey: ['admin-categories'], queryFn: () => categoriesApi.list({ pageSize: 100 }), enabled: drawer });
  const suppliersQuery = useQuery({ queryKey: ['admin-suppliers'], queryFn: () => suppliersApi.list({ pageSize: 100 }), enabled: drawer });
  const list = (productsQuery.data?.items ?? []).filter((product) => [product.ProductName, product.Barcode, product.Category?.CategoryName, product.Supplier?.Name].join(' ').toLowerCase().includes(search.toLowerCase()));
  const totalCount = productsQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 20));
  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(''); setDrawer(true); };
  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      ProductName: product.ProductName,
      Barcode: product.Barcode ?? '',
      Unit: product.Unit ?? '',
      Price: String(product.Price),
      CategoryId: product.CategoryId != null ? String(product.CategoryId) : product.Category?.CategoryId != null ? String(product.Category.CategoryId) : '',
      SupplierId: product.SupplierId != null ? String(product.SupplierId) : product.Supplier?.SupplierId != null ? String(product.Supplier.SupplierId) : '',
      Quantity: product.Quantity != null ? String(product.Quantity) : '',
    });
    setFormError(''); setDrawer(true);
  };
  const save = async () => {
    if (!form.ProductName.trim() || !form.Price) { setFormError('Nhập tên và giá sản phẩm.'); return; }
    setCreating(true); setFormError('');
    try {
      const base = { ProductName: form.ProductName.trim(), Barcode: form.Barcode.trim() || null, Unit: form.Unit.trim() || null, Price: Number(form.Price), CategoryId: form.CategoryId ? Number(form.CategoryId) : null, SupplierId: form.SupplierId ? Number(form.SupplierId) : null };
      // Khi sửa KHÔNG gửi Quantity — số lượng tồn do Inventory quản lý.
      if (editing) await productsApi.update(editing.ProductId, base);
      else await productsApi.create({ ...base, Quantity: form.Quantity ? Number(form.Quantity) : null });
      setDrawer(false); setEditing(null); setForm(emptyForm);
      void queryClient.invalidateQueries({ queryKey: ['products'] }); void queryClient.invalidateQueries({ queryKey: ['dashboard'] }); void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : editing ? 'Cập nhật sản phẩm thất bại.' : 'Tạo sản phẩm thất bại.'); } finally { setCreating(false); }
  };
  const remove = async () => {
    if (!deleteTarget) return;
    setCreating(true); setActionError('');
    try {
      await productsApi.archive(deleteTarget.ProductId);
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['products'] }); void queryClient.invalidateQueries({ queryKey: ['dashboard'] }); void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Xóa sản phẩm thất bại.'); setDeleteTarget(null); } finally { setCreating(false); }
  };
  return <><PageHeader eyebrow="Danh mục" title="Sản phẩm" description="Quản lý sản phẩm, giá và tồn kho." action={<Button icon={Plus} onClick={openCreate}>Thêm sản phẩm</Button>} /><Card><div className="border-b border-zinc-100 p-4"><Toolbar search={search} setSearch={setSearch} placeholder="Tìm sản phẩm..." onRefresh={() => void productsQuery.refetch()} /></div>{actionError && <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{actionError}</p>}
    {productsQuery.isLoading ? <TableSkeleton rows={7} /> : productsQuery.isError ? <ErrorCard onRetry={() => void productsQuery.refetch()} /> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Sản phẩm', 'Mã vạch', 'Danh mục', 'Nhà cung cấp', 'Giá', 'Tồn kho', 'Trạng thái', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{list.map((product) => <tr key={product.ProductId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><ProductThumbnail product={product} /><div><p className="font-semibold text-zinc-800">{product.ProductName}</p><p className="text-[11px] text-zinc-400">{product.Unit ?? '—'}</p></div></div></td><td className="px-5 py-3.5 font-mono text-xs text-zinc-500">{product.Barcode ?? '—'}</td><td className="px-5 py-3.5 text-zinc-500">{product.Category?.CategoryName ?? '—'}</td><td className="px-5 py-3.5 text-zinc-500">{product.Supplier?.SupplierName ?? '—'}</td><td className="px-5 py-3.5 font-semibold text-zinc-800"><Money value={product.Price} /></td><td className="px-5 py-3.5"><span className={cx('font-semibold', (product.Quantity ?? 0) === 0 ? 'text-red-600' : (product.Quantity ?? 0) <= 5 ? 'text-amber-600' : 'text-zinc-700')}>{product.Quantity ?? 0}</span><span className="ml-2 text-xs text-zinc-400">{(product.Quantity ?? 0) === 0 ? 'Hết hàng' : (product.Quantity ?? 0) <= 5 ? 'Sắp hết' : 'Bình thường'}</span></td><td className="px-5 py-3.5"><Status value={product.Deleted ? 'Archived' : 'Active'} /></td><td className="px-5 py-3.5"><RowActions onEdit={() => openEdit(product)} onDelete={() => setDeleteTarget(product)} /></td></tr>)}</tbody></table>{!list.length && <EmptyState title="Không có sản phẩm" copy="Chưa có sản phẩm nào khớp tìm kiếm." />}</div>}
    <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-400"><span>Hiển thị {list.length} / {totalCount} · Trang {page}/{totalPages}</span><div className="flex items-center gap-1"><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">‹</button><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">›</button></div></div></Card>
    <Drawer open={drawer} onClose={() => { setDrawer(false); setEditing(null); }} title={editing ? `Sửa sản phẩm #${editing.ProductId}` : 'Thêm sản phẩm'} subtitle={editing ? editing.ProductName : 'Tạo sản phẩm mới trong danh mục'}>
      <div className="space-y-4"><Field label="Tên sản phẩm"><input value={form.ProductName} onChange={(e) => setForm((f) => ({ ...f, ProductName: e.target.value }))} placeholder="VD: Coca Cola lon 330ml" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Mã vạch"><input value={form.Barcode} onChange={(e) => setForm((f) => ({ ...f, Barcode: e.target.value }))} placeholder="893..." className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field><Field label="Đơn vị"><input value={form.Unit} onChange={(e) => setForm((f) => ({ ...f, Unit: e.target.value }))} placeholder="chai / hộp..." className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field></div>
      <Field label="Giá (₫)"><input value={form.Price} onChange={(e) => setForm((f) => ({ ...f, Price: e.target.value }))} type="number" min="0" placeholder="0" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Danh mục"><select value={form.CategoryId} onChange={(e) => setForm((f) => ({ ...f, CategoryId: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf"><option value="">— Chọn —</option>{(categoriesQuery.data?.items ?? []).map((category) => <option key={category.CategoryId} value={category.CategoryId}>{category.CategoryName}</option>)}</select></Field><Field label="Nhà cung cấp"><select value={form.SupplierId} onChange={(e) => setForm((f) => ({ ...f, SupplierId: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf"><option value="">— Chọn —</option>{(suppliersQuery.data?.items ?? []).map((supplier) => <option key={supplier.SupplierId} value={supplier.SupplierId}>{String(supplier.SupplierName ?? (supplier as Record<string, unknown>).Name ?? '—')}</option>)}</select></Field></div>
      <Field label={editing ? 'Tồn kho (điều chỉnh ở trang Tồn kho)' : 'Tồn kho ban đầu'}><input disabled={!!editing} value={form.Quantity} onChange={(e) => setForm((f) => ({ ...f, Quantity: e.target.value }))} type="number" min="0" placeholder="0" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20 disabled:bg-zinc-50 disabled:text-zinc-400" /></Field>
      {formError && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{formError}</p>}</div>
      <div className="mt-8 flex justify-end gap-2"><Button variant="secondary" onClick={() => { setDrawer(false); setEditing(null); }}>Hủy</Button><Button disabled={creating} onClick={() => void save()}>{creating ? 'Đang lưu…' : editing ? 'Lưu thay đổi' : 'Tạo sản phẩm'}</Button></div>
    </Drawer>
    <ConfirmPrompt open={deleteTarget != null} onClose={() => setDeleteTarget(null)} onConfirm={() => void remove()} title={`Xóa “${deleteTarget?.ProductName ?? ''}”?`} description="Sản phẩm sẽ bị ngừng hiển thị (loại khỏi danh mục bán). Hành động này không thể hoàn tác từ trang quản trị." confirmLabel="Xóa sản phẩm" /></>;
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
  return <><PageHeader eyebrow="Danh mục" title="Tồn kho" description="Cập nhật số lượng tồn kho nhanh chóng." action={<Button variant="secondary" icon={Download}>Xuất file</Button>} /><Card><div className="border-b border-zinc-100 p-4"><Toolbar search={search} setSearch={setSearch} placeholder="Tìm sản phẩm..." onRefresh={() => void inventoryQuery.refetch()}><FilterButton><Boxes size={14} /> {filter}</FilterButton>{['All', 'Low', 'Out of stock', 'Normal'].map((f) => <button key={f} onClick={() => setFilter(f)} className={cx('hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold lg:block', filter === f ? 'bg-leaf-soft text-leaf-dark' : 'text-zinc-400 hover:bg-zinc-100')}>{f === 'All' ? 'Tất cả' : f === 'Low' ? 'Sắp hết' : f === 'Out of stock' ? 'Hết hàng' : 'Bình thường'}</button>)}</Toolbar></div>
    {inventoryQuery.isLoading ? <TableSkeleton rows={7} /> : inventoryQuery.isError ? <ErrorCard onRetry={() => void inventoryQuery.refetch()} /> : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Sản phẩm', 'Mã vạch', 'Nhà cung cấp', 'Tồn kho', 'Cập nhật', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{list.map((row) => { const stock = stockOf(row); return <tr key={row.InventoryId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4"><p className="font-semibold text-zinc-800">{row.Product?.ProductName ?? `#${row.ProductId}`}</p><p className="text-[11px] text-zinc-400">{row.Product?.Category?.CategoryName ?? '—'}</p></td><td className="px-5 py-4 font-mono text-xs text-zinc-500">{row.Product?.Barcode ?? '—'}</td><td className="px-5 py-4 text-zinc-500">{row.Product?.Supplier?.SupplierName ?? '—'}</td><td className="px-5 py-4"><button onClick={() => { setSelected(row); setNewQty(String(stock)); setFormError(''); }} className="group inline-flex items-center gap-2"><span className={cx('font-display text-lg font-bold', stock === 0 ? 'text-red-600' : stock <= 5 ? 'text-amber-600' : 'text-zinc-800')}>{stock}</span><Status value={stock === 0 ? 'Hết hàng' : stock <= 5 ? 'Low' : 'Normal'} /></button></td><td className="px-5 py-4 text-xs text-zinc-400">{fmtDate(row.UpdatedAt)}</td><td className="px-5 py-4"><MoreHorizontal size={17} className="text-zinc-400" /></td></tr>; })}</tbody></table>{!list.length && <EmptyState title="Không có dữ liệu tồn kho" copy="Chưa có bản ghi tồn kho nào khớp bộ lọc." />}</div>}
    <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-400"><span>Hiển thị {list.length} / {totalCount} · Trang {page}/{totalPages}</span><div className="flex items-center gap-1"><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">‹</button><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">›</button></div></div></Card>
    <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title="Cập nhật tồn kho" subtitle={selected?.Product?.ProductName}><div className="rounded-xl bg-zinc-50 p-4"><p className="text-xs text-zinc-500">Số lượng hiện tại</p><p className="mt-1 font-display text-2xl font-bold text-zinc-950">{selected ? stockOf(selected) : '—'}</p></div><div className="mt-5"><Field label="Số lượng mới"><input value={newQty} onChange={(e) => setNewQty(e.target.value)} type="number" min="0" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field></div>{formError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{formError}</p>}<div className="mt-8 flex justify-end gap-2"><Button variant="secondary" onClick={() => setSelected(null)}>Hủy</Button><Button disabled={saving} onClick={() => void saveStock()}>{saving ? 'Đang lưu…' : 'Cập nhật'}</Button></div></Drawer></>;
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
      setMessage({ tone: 'ok', text: created ? `Đã tạo đơn #${created.OrderId} · ${formatCompactMoney(created.TotalAmount ?? total)}` : 'Đã tạo đơn thành công.' });
      void queryClient.invalidateQueries({ queryKey: ['pos-products'] }); void queryClient.invalidateQueries({ queryKey: ['admin-orders'] }); void queryClient.invalidateQueries({ queryKey: ['dashboard'] }); void queryClient.invalidateQueries({ queryKey: ['inventory'] });
    } catch (cause) { setMessage({ tone: 'error', text: cause instanceof Error ? cause.message : 'Tạo đơn thất bại.' }); } finally { setPaying(false); }
  };
  return <div className="-mx-4 -my-6 flex h-[calc(100vh_-_72px)] min-w-0 flex-col bg-zinc-100/70 p-4 sm:-mx-6 lg:-mx-8 lg:-my-8 lg:p-6">{message && <div className={cx('mb-4 rounded-xl px-4 py-3 text-sm font-medium', message.tone === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>{message.tone === 'ok' ? <>Đã tạo đơn thành công. Tổng: <b><Money value={total} /></b> — xem chi tiết ở trang Đơn hàng.</> : message.text}</div>}<div className="grid min-h-0 w-full flex-1 grid-cols-[1.65fr_1fr] gap-4"><Card className="flex min-h-0 flex-col overflow-hidden"><div className="flex flex-wrap gap-2 border-b border-zinc-100 p-4"><SearchBox value={query} onChange={setQuery} placeholder="Quét mã vạch hoặc tìm sản phẩm..." /></div><div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-4">{productsQuery.isLoading ? <TableSkeleton rows={8} /> : productsQuery.isError ? <ErrorCard onRetry={() => void productsQuery.refetch()} /> : shown.map((product) => <button key={product.ProductId} disabled={(product.Quantity ?? 0) === 0} onClick={() => add(product)} className="group rounded-xl border border-zinc-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-leaf hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"><div className="mb-3 flex aspect-[1.2] items-center justify-center rounded-lg bg-zinc-100 overflow-hidden">{product.ImageUrl && typeof product.ImageUrl === 'string' && product.ImageUrl.trim() ? (
    <img src={product.ImageUrl} alt={product.ProductName} className="h-full w-full object-cover" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
  ) : (
    <Package size={24} className="text-zinc-400" />
  )}</div><p className="line-clamp-2 min-h-8 text-xs font-semibold text-zinc-800">{product.ProductName}</p><p className="mt-1 text-sm font-bold text-zinc-950"><Money value={product.Price} /></p><p className={cx('mt-2 text-[11px] font-semibold', (product.Quantity ?? 0) === 0 ? 'text-red-600' : (product.Quantity ?? 0) <= 5 ? 'text-amber-600' : 'text-zinc-400')}>{(product.Quantity ?? 0) === 0 ? 'Hết hàng' : `Còn ${product.Quantity}`}</p></button>)}{!productsQuery.isLoading && !shown.length && <EmptyState title="Không tìm thấy sản phẩm" copy="Thử từ khóa khác." />}</div></Card><Card className="flex flex-col overflow-hidden"><div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4"><div><h2 className="font-display text-sm font-bold text-zinc-900">Đơn hiện tại</h2><p className="mt-0.5 text-xs text-zinc-400">{cart.reduce((sum, line) => sum + line.qty, 0)} món · Bán tại quầy</p></div><button onClick={() => setCart([])} className="text-xs font-semibold text-red-600 hover:underline">Xóa</button></div><div className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto p-4">{cart.map((line) => <div key={line.product.ProductId} className="flex gap-3 py-3 first:pt-0"><div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-zinc-100">{line.product.ImageUrl && typeof line.product.ImageUrl === 'string' && line.product.ImageUrl.trim() ? (
      <img src={line.product.ImageUrl} alt={line.product.ProductName} className="h-full w-full object-cover" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
    ) : (
      <div className="flex h-full items-center justify-center text-zinc-400"><Package size={14} /></div>
    )}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-zinc-800">{line.product.ProductName}</p><p className="mt-1 text-xs text-zinc-400"><Money value={line.product.Price} /></p></div><div className="flex items-center gap-2"><button onClick={() => setCart((items) => items.map((item) => item.product.ProductId === line.product.ProductId ? { ...item, qty: Math.max(1, item.qty - 1) } : item))} className="h-6 w-6 rounded border border-zinc-200 text-zinc-500">−</button><span className="w-4 text-center text-xs font-bold">{line.qty}</span><button onClick={() => add(line.product)} className="h-6 w-6 rounded border border-zinc-200 text-zinc-500">+</button></div></div>)}{!cart.length && <EmptyState title="Đơn trống" copy="Chọn sản phẩm để thêm vào đơn bán." />}</div><div className="border-t border-zinc-100 p-5"><div className="space-y-2 text-sm"><p className="flex justify-between text-zinc-500"><span>Tạm tính</span><span><Money value={total} /></span></p><p className="flex justify-between text-zinc-500"><span>Giảm giá</span><span>₫0</span></p><p className="mt-3 flex justify-between border-t border-dashed border-zinc-200 pt-3 text-base font-bold text-zinc-950"><span>Tổng cộng</span><span><Money value={total} /></span></p></div><Button className="mt-4 w-full" disabled={!cart.length || paying} onClick={() => void pay()}>{paying ? 'Đang xử lý…' : <>Thanh toán & hoàn tất <ChevronRight size={16} /></>}</Button></div></Card></div></div>;
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState('');
  const customersQuery = useCustomers({ pageSize: 50 });
  const list = (customersQuery.data?.items ?? []).filter((customer) => [customer.Name, customer.Phone, customer.Email].join(' ').toLowerCase().includes(search.toLowerCase()));
  const detailQuery = useQuery({ queryKey: ['admin-customer', selectedId], queryFn: () => customersApi.byId(selectedId!), enabled: selectedId != null && drawerOpen });
  const detail = detailQuery.data;
  const recentOrders = detail?.Orders ?? [];
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormError(''); setDrawerCreateOpen(true); };
  const openEdit = (customer: Customer) => {
    setEditingId(customer.CustomerId);
    setForm({ Name: customer.Name, Phone: customer.Phone ?? '', Email: customer.Email ?? '', Address: customer.Address ?? '' });
    setFormError(''); setDrawerCreateOpen(true);
  };
  const save = async () => {
    if (!form.Name.trim()) { setFormError('Nhập tên khách hàng.'); return; }
    setCreating(true); setFormError('');
    try {
      const input = { Name: form.Name.trim(), Phone: form.Phone.trim() || null, Email: form.Email.trim() || null, Address: form.Address.trim() || null };
      if (editingId != null) await customersApi.update(editingId, input);
      else await customersApi.create(input);
      setDrawerCreateOpen(false); setEditingId(null); setForm(emptyForm);
      void queryClient.invalidateQueries({ queryKey: ['customers'] }); void queryClient.invalidateQueries({ queryKey: ['admin-customer', selectedId] }); void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Lưu khách hàng thất bại.'); } finally { setCreating(false); }
  };
  const remove = async () => {
    if (!detail) return;
    setCreating(true); setActionError('');
    try {
      await customersApi.remove(detail.CustomerId);
      setDeleteOpen(false); setDrawerOpen(false); setSelectedId(null);
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Xóa khách hàng thất bại.'); setDeleteOpen(false); } finally { setCreating(false); }
  };
  return <><PageHeader eyebrow="Bán hàng" title="Khách hàng" description="Danh sách khách hàng của cửa hàng." action={<Button icon={Plus} onClick={openCreate}>Thêm khách hàng</Button>} /><Card><div className="border-b border-zinc-100 p-4"><Toolbar search={search} setSearch={setSearch} placeholder="Tìm theo tên, số điện thoại..." onRefresh={() => void customersQuery.refetch()} /></div>{actionError && <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{actionError}</p>}<div className="overflow-x-auto">{customersQuery.isLoading ? <TableSkeleton rows={6} /> : customersQuery.isError ? <ErrorCard onRetry={() => void customersQuery.refetch()} /> : <table className="w-full min-w-[760px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Khách hàng', 'Điện thoại', 'Email', 'Ngày tạo', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{list.map((customer) => <tr key={customer.CustomerId} onClick={() => { setSelectedId(customer.CustomerId); setDrawerOpen(true); }} className="cursor-pointer text-sm hover:bg-zinc-50/60"><td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar name={customer.Name} /><span className="font-semibold text-zinc-800">{customer.Name}</span></div></td><td className="px-5 py-4 text-zinc-500">{customer.Phone ?? '—'}</td><td className="px-5 py-4 text-zinc-500">{customer.Email ?? '—'}</td><td className="px-5 py-4 text-xs text-zinc-400">{fmtDate(customer.CreatedAt)}</td><td className="px-5 py-4"><MoreHorizontal size={17} className="text-zinc-400" /></td></tr>)}</tbody></table>}{!customersQuery.isLoading && !list.length && <EmptyState title="Không có khách hàng" copy="Chưa có khách hàng nào khớp tìm kiếm." />}</div></Card>
    <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={detail?.Name ?? 'Khách hàng'} subtitle={detail ? `Khách hàng từ ${fmtDate(detail.CreatedAt)}` : undefined}>
      {detailQuery.isLoading || !detail ? <TableSkeleton rows={5} /> : <>
        <div className="flex items-center gap-3"><Avatar name={detail.Name} /><div><p className="font-semibold text-zinc-900">{detail.Name}</p><p className="text-xs text-zinc-500">{detail.Phone ?? '—'} · {detail.Email ?? '—'}</p></div></div>
        {detail.Address && <p className="mt-3 text-xs text-zinc-500">Địa chỉ: {detail.Address}</p>}
        <div className="mt-5 flex gap-2"><Button variant="secondary" onClick={() => openEdit(detail)}>Chỉnh sửa</Button><Button variant="danger" onClick={() => setDeleteOpen(true)}>Xóa khách hàng</Button></div>
        <div className="mt-5 rounded-xl bg-zinc-50 p-4"><p className="text-xs text-zinc-500">Số đơn hàng</p><p className="mt-1 font-display text-xl font-bold text-zinc-950">{detail.Orders?.length ?? '—'}</p></div>
        <SectionTitle>Đơn hàng gần đây</SectionTitle>
        {recentOrders.length ? recentOrders.slice(0, 5).map((order) => <div key={order.OrderId} className="flex items-center justify-between border-b border-zinc-100 py-3"><div><p className="text-sm font-semibold text-zinc-700">#{order.OrderId}</p><p className="text-xs text-zinc-400">{fmtDate(order.OrderDate)}</p></div><div className="text-right"><p className="text-sm font-semibold text-zinc-800"><Money value={order.TotalAmount ?? 0} /></p><Status value={order.OrderStatus ?? '—'} /></div></div>) : <p className="text-sm text-zinc-500">Chưa có đơn hàng nào.</p>}
      </>}
    </Drawer>
    <Drawer open={drawerCreateOpen} onClose={() => { setDrawerCreateOpen(false); setEditingId(null); }} title={editingId != null ? 'Sửa khách hàng' : 'Thêm khách hàng'} subtitle={editingId != null ? 'Cập nhật hồ sơ khách hàng' : 'Tạo hồ sơ khách hàng mới'}>
      <div className="space-y-4"><Field label="Họ tên"><input value={form.Name} onChange={(e) => setForm((f) => ({ ...f, Name: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field>
      <div className="grid grid-cols-2 gap-3"><Field label="Điện thoại"><input value={form.Phone} onChange={(e) => setForm((f) => ({ ...f, Phone: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field><Field label="Email"><input value={form.Email} onChange={(e) => setForm((f) => ({ ...f, Email: e.target.value }))} type="email" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field></div>
      <Field label="Địa chỉ"><input value={form.Address} onChange={(e) => setForm((f) => ({ ...f, Address: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field>
      {formError && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{formError}</p>}</div>
      <div className="mt-8 flex justify-end gap-2"><Button variant="secondary" onClick={() => { setDrawerCreateOpen(false); setEditingId(null); }}>Hủy</Button><Button disabled={creating} onClick={() => void save()}>{creating ? 'Đang lưu…' : editingId != null ? 'Lưu thay đổi' : 'Tạo khách hàng'}</Button></div>
    </Drawer>
    <ConfirmPrompt open={deleteOpen} onClose={() => setDeleteOpen(false)} onConfirm={() => void remove()} title={`Xóa “${detail?.Name ?? ''}”?`} description="Hồ sơ khách hàng sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác từ trang quản trị." confirmLabel="Xóa khách hàng" /></>;
}
function ListPage({ type }: { type: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const emptyForm = { Name: '', Phone: '', Email: '', Address: '', PromoCode: '', DiscountType: 'percent', DiscountValue: '', StartDate: '', EndDate: '', MinOrderAmount: '', UsageLimit: '', Status: 'active' };
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const inputCls = 'h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20';
  const setField = (key: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
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
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormError(''); setCreateOpen(true); };
  const openEdit = (row: Record<string, unknown>) => {
    setEditingId(Number(row.PromoId ?? row.CategoryId ?? row.SupplierId ?? 0));
    setForm(type === 'Promotions'
      ? { ...emptyForm, PromoCode: String(row.PromoCode ?? ''), DiscountType: String(row.DiscountType ?? 'percent'), DiscountValue: String(row.DiscountValue ?? ''), StartDate: String(row.StartDate ?? '').slice(0, 10), EndDate: String(row.EndDate ?? '').slice(0, 10), MinOrderAmount: row.MinOrderAmount != null ? String(row.MinOrderAmount) : '', UsageLimit: row.UsageLimit != null ? String(row.UsageLimit) : '', Status: ['active', 'inactive'].includes(String(row.Status ?? '').toLowerCase()) ? String(row.Status).toLowerCase() : 'active' }
      : { ...emptyForm, Name: String(row.SupplierName ?? row.Name ?? row.CategoryName ?? ''), Phone: String(row.Phone ?? ''), Email: String(row.Email ?? ''), Address: String(row.Address ?? '') });
    setFormError(''); setCreateOpen(true);
  };
  const invalidateList = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
    void queryClient.invalidateQueries({ queryKey: ['products'] });
  };
  const saveItem = async () => {
    setFormError('');
    if (type === 'Promotions') {
      const value = Number(form.DiscountValue);
      if (!form.PromoCode.trim()) { setFormError('Nhập mã khuyến mãi.'); return; }
      if (!Number.isFinite(value) || value <= 0) { setFormError('Nhập giá trị giảm giá hợp lệ.'); return; }
      if (!form.StartDate || !form.EndDate) { setFormError('Chọn thời gian bắt đầu và kết thúc.'); return; }
      if (form.EndDate < form.StartDate) { setFormError('Ngày kết thúc phải sau ngày bắt đầu.'); return; }
      const current = editingId != null ? (list as Promotion[]).find((row) => row.PromoId === editingId) : undefined;
      if (form.UsageLimit && Number(form.UsageLimit) < (current?.UsedCount ?? 0)) { setFormError(`Giới hạn lượt dùng không được nhỏ hơn ${current?.UsedCount ?? 0} lượt đã dùng.`); return; }
      const input = { PromoCode: form.PromoCode.trim().toUpperCase(), DiscountType: form.DiscountType, DiscountValue: value, StartDate: form.StartDate, EndDate: form.EndDate, MinOrderAmount: form.MinOrderAmount ? Number(form.MinOrderAmount) : null, UsageLimit: form.UsageLimit ? Number(form.UsageLimit) : null, Status: form.Status };
      setCreating(true);
      try { if (editingId != null) await promotionsApi.update(editingId, input); else await promotionsApi.create(input); setCreateOpen(false); setEditingId(null); invalidateList(); }
      catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Lưu khuyến mãi thất bại.'); } finally { setCreating(false); }
      return;
    }
    if (!form.Name.trim()) { setFormError(type === 'Suppliers' ? 'Nhập tên nhà cung cấp.' : 'Nhập tên danh mục.'); return; }
    setCreating(true);
    try {
      if (type === 'Suppliers') {
        const input = { Name: form.Name.trim(), Phone: form.Phone.trim() || undefined, Email: form.Email.trim() || undefined, Address: form.Address.trim() || undefined };
        if (editingId != null) await suppliersApi.update(editingId, input); else await suppliersApi.create(input);
      } else {
        if (editingId != null) await categoriesApi.update(editingId, { CategoryName: form.Name.trim() });
        else await categoriesApi.create({ CategoryName: form.Name.trim() });
      }
      setCreateOpen(false); setEditingId(null); setForm(emptyForm); invalidateList();
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Lưu thất bại.'); } finally { setCreating(false); }
  };
  const removeItem = async () => {
    if (!deleteTarget) return;
    setCreating(true); setActionError('');
    try {
      if (type === 'Categories') await categoriesApi.remove(deleteTarget.id);
      else if (type === 'Suppliers') await suppliersApi.remove(deleteTarget.id);
      else if (type === 'Promotions') await promotionsApi.remove(deleteTarget.id);
      setDeleteTarget(null); invalidateList();
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Xóa thất bại.'); setDeleteTarget(null); } finally { setCreating(false); }
  };
  return <><PageHeader eyebrow={config.eyebrow} title={config.title} description={config.description}    action={(type === 'Categories' || type === 'Suppliers' || type === 'Promotions') ? <Button icon={config.icon} onClick={openCreate}>{config.action}</Button> : <Button variant="secondary" icon={Download} onClick={() => {
      if (type === 'Bills') exportCsv('hoa-don.csv', ['Hóa đơn', 'Đơn', 'Khách hàng', 'Số tiền', 'Trạng thái', 'Thanh toán'], (billsQuery.data?.items ?? []).map((bill) => [`B-${bill.BillId}`, bill.OrderId, String(bill.Customer?.Name ?? bill.Name ?? ''), bill.FinalAmount, bill.BillStatus, bill.PayStatus]));
      else exportCsv('yeu-cau-hoan-tien.csv', ['Yêu cầu', 'Đơn', 'Khách hàng', 'Lý do', 'Số tiền', 'Trạng thái'], (refundsQuery.data?.items ?? []).map((refund) => [`RF-${refund.RefundId}`, refund.OrderId, String(refund.CustomerName ?? refund.Order?.Customer?.Name ?? ''), refund.Reason ?? '', refund.RefundAmount, refund.Status ?? '']));
    }}>{config.action}</Button>} />
    {type === 'Refunds' && <div className="mb-4 flex gap-2"><Badge tone="warning">Đang chờ: {(refundsQuery.data?.items ?? []).filter((refund) => (refund.Status ?? '').toLowerCase() === 'pending').length}</Badge></div>}<Card><div className="border-b border-zinc-100 p-4"><Toolbar search={search} setSearch={setSearch} placeholder="Tìm kiếm..." onRefresh={() => void activeQuery.refetch()} /></div>{actionError && <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{actionError}</p>}<div className="overflow-x-auto">
    {isLoading ? <TableSkeleton rows={6} /> : activeQuery.isError ? <ErrorCard onRetry={() => void activeQuery.refetch()} /> : !list.length ? <EmptyState title="Không có dữ liệu" copy="Chưa có bản ghi nào." /> : type === 'Categories' ? (
      <table className="w-full min-w-[600px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Danh mục', 'Trạng thái', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{(list as import('../types/domain').Category[]).map((category) => <tr key={category.CategoryId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4 font-semibold text-zinc-800">{category.CategoryName}</td><td className="px-5 py-4"><Status value="Active" /></td><td className="px-5 py-4"><RowActions onEdit={() => openEdit(category)} onDelete={() => setDeleteTarget({ id: category.CategoryId ?? 0, label: category.CategoryName ?? '' })} /></td></tr>)}</tbody></table>
    ) : type === 'Suppliers' ? (
      <table className="w-full min-w-[700px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Nhà cung cấp', 'Điện thoại', 'Email', 'Địa chỉ', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{(list as import('../types/domain').Supplier[]).map((supplier) => <tr key={supplier.SupplierId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4 font-semibold text-zinc-800">{String(supplier.SupplierName ?? (supplier as Record<string, unknown>).Name ?? '—')}</td><td className="px-5 py-4 text-zinc-500">{String(supplier.Phone ?? '—')}</td><td className="px-5 py-4 text-zinc-500">{String(supplier.Email ?? '—')}</td><td className="px-5 py-4 text-zinc-500">{String(supplier.Address ?? '—')}</td><td className="px-5 py-4"><RowActions onEdit={() => openEdit(supplier)} onDelete={() => setDeleteTarget({ id: supplier.SupplierId ?? 0, label: String(supplier.SupplierName ?? supplier.Name ?? 'nhà cung cấp') })} /></td></tr>)}</tbody></table>
    ) : type === 'Promotions' ? (
      <table className="w-full min-w-[820px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Mã', 'Giảm giá', 'Lượt dùng', 'Thời gian', 'Trạng thái', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{(list as Promotion[]).map((promotion) => <tr key={promotion.PromoId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4 font-bold text-zinc-800">{promotion.PromoCode}</td><td className="px-5 py-4 text-zinc-600">{promotion.DiscountType === 'percent' ? `${promotion.DiscountValue}%` : <Money value={promotion.DiscountValue} />}</td><td className="px-5 py-4 text-zinc-500">{promotion.UsedCount ?? 0} / {promotion.UsageLimit ?? '∞'}</td><td className="px-5 py-4 text-xs text-zinc-400">{fmtDateOnly(promotion.StartDate)} → {fmtDateOnly(promotion.EndDate)}</td><td className="px-5 py-4"><Status value={promotionStatus(promotion)} /></td><td className="px-5 py-4"><RowActions onEdit={() => openEdit(promotion)} onDelete={() => setDeleteTarget({ id: promotion.PromoId, label: promotion.PromoCode })} /></td></tr>)}</tbody></table>
    ) : type === 'Bills' ? (
      <table className="w-full min-w-[820px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Hóa đơn', 'Đơn', 'Khách hàng', 'Số tiền', 'Trạng thái', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{(list as Bill[]).map((bill) => <tr key={bill.BillId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4 font-bold text-zinc-800">#B-{bill.BillId}</td><td className="px-5 py-4 text-zinc-500">#{bill.OrderId}</td><td className="px-5 py-4 text-zinc-500">{String(bill.Customer?.Name ?? bill.Name ?? '—')}</td><td className="px-5 py-4 font-semibold text-zinc-800"><Money value={bill.FinalAmount} /></td><td className="px-5 py-4"><div className="flex flex-col items-start gap-1"><Status value={bill.PayStatus} /><Status value={bill.BillStatus} /></div></td><td className="px-5 py-4">{String(bill.PayStatus ?? '').toLowerCase() === 'unpaid' ? <Button variant="secondary" className="h-8 text-xs" onClick={() => void runAction(() => billsApi.pay(bill.BillId))}>Nhận tiền</Button> : <MoreHorizontal size={17} className="text-zinc-400" />}</td></tr>)}</tbody></table>
    ) : (
      <table className="w-full min-w-[820px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Yêu cầu', 'Đơn', 'Khách hàng', 'Lý do', 'Số tiền', 'Trạng thái', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{(list as RefundRequest[]).map((refund) => <tr key={refund.RefundId} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4 font-bold text-zinc-800">#RF-{refund.RefundId}</td><td className="px-5 py-4 text-zinc-500">#{refund.OrderId}</td><td className="px-5 py-4 text-zinc-500">{String(refund.CustomerName ?? refund.Order?.Customer?.Name ?? '—')}</td><td className="px-5 py-4 max-w-[220px] truncate text-zinc-500">{refund.Reason ?? '—'}</td><td className="px-5 py-4 font-semibold text-zinc-800"><Money value={refund.RefundAmount} /></td><td className="px-5 py-4"><Status value={refund.Status ?? 'Pending'} /></td><td className="px-5 py-4">{(refund.Status ?? '').toLowerCase() === 'pending' ? <div className="flex gap-1"><Button variant="secondary" className="h-8 text-xs" onClick={() => void runAction(() => ordersApi.confirmRefund(refund.RefundId))}>Duyệt</Button><Button variant="danger" className="h-8 text-xs" onClick={() => void runAction(() => refundsApi.process(refund.RefundId, { Status: 'rejected' }))}>Từ chối</Button></div> : <MoreHorizontal size={17} className="text-zinc-400" />}</td></tr>)}</tbody></table>
    )}
    </div></Card>
    <Drawer open={createOpen} onClose={() => { setCreateOpen(false); setEditingId(null); }} title={editingId != null ? `Sửa ${type === 'Promotions' ? 'khuyến mãi' : type === 'Suppliers' ? 'nhà cung cấp' : 'danh mục'}` : config.action} subtitle="Dữ liệu sẽ được lưu ngay vào hệ thống">
      <div className="space-y-4">
      {type === 'Promotions' ? <>
        <div className="grid grid-cols-2 gap-3"><Field label="Mã khuyến mãi"><input value={form.PromoCode} onChange={(e) => setField('PromoCode', e.target.value)} placeholder="SALE10" className={inputCls} /></Field><Field label="Kiểu giảm"><select value={form.DiscountType} onChange={(e) => setField('DiscountType', e.target.value)} className={inputCls}><option value="percent">Phần trăm (%)</option><option value="fixed">Số tiền (₫)</option></select></Field></div>
        <div className="grid grid-cols-2 gap-3"><Field label="Giá trị giảm"><input type="number" min="0" value={form.DiscountValue} onChange={(e) => setField('DiscountValue', e.target.value)} placeholder="10" className={inputCls} /></Field><Field label="Trạng thái"><select value={form.Status} onChange={(e) => setField('Status', e.target.value)} className={inputCls}><option value="active">Đang hoạt động</option><option value="inactive">Tạm dừng</option></select></Field></div>
        <div className="grid grid-cols-2 gap-3"><Field label="Từ ngày"><input type="date" value={form.StartDate} onChange={(e) => setField('StartDate', e.target.value)} className={inputCls} /></Field><Field label="Đến ngày"><input type="date" value={form.EndDate} onChange={(e) => setField('EndDate', e.target.value)} className={inputCls} /></Field></div>
        <div className="grid grid-cols-2 gap-3"><Field label="Đơn tối thiểu (₫)"><input type="number" min="0" value={form.MinOrderAmount} onChange={(e) => setField('MinOrderAmount', e.target.value)} placeholder="Không giới hạn" className={inputCls} /></Field><Field label="Giới hạn lượt dùng"><input type="number" min="0" value={form.UsageLimit} onChange={(e) => setField('UsageLimit', e.target.value)} placeholder="Không giới hạn" className={inputCls} /></Field></div>
      </> : <>
        <Field label={type === 'Suppliers' ? 'Tên nhà cung cấp' : 'Tên danh mục'}><input value={form.Name} onChange={(e) => setField('Name', e.target.value)} placeholder={type === 'Suppliers' ? 'VD: Công ty ABC' : 'VD: Đồ uống'} className={inputCls} /></Field>
        {type === 'Suppliers' && <>
          <div className="grid grid-cols-2 gap-3"><Field label="Điện thoại"><input value={form.Phone} onChange={(e) => setField('Phone', e.target.value)} className={inputCls} /></Field><Field label="Email"><input value={form.Email} onChange={(e) => setField('Email', e.target.value)} className={inputCls} /></Field></div>
          <Field label="Địa chỉ"><input value={form.Address} onChange={(e) => setField('Address', e.target.value)} className={inputCls} /></Field>
        </>}
      </>}
      {formError && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{formError}</p>}
      </div>
      <div className="mt-8 flex justify-end gap-2"><Button variant="secondary" onClick={() => { setCreateOpen(false); setEditingId(null); }}>Hủy</Button><Button disabled={creating} onClick={() => void saveItem()}>{creating ? 'Đang lưu…' : editingId != null ? 'Lưu thay đổi' : 'Tạo'}</Button></div>
    </Drawer>
    <ConfirmPrompt open={deleteTarget != null} onClose={() => setDeleteTarget(null)} onConfirm={() => void removeItem()} title={`Xóa “${deleteTarget?.label ?? ''}”?`} description="Bản ghi sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác từ trang quản trị." confirmLabel="Xóa" /></>; }
function renderAiInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return <code key={index} className="rounded bg-zinc-100 px-1 font-mono text-[12px]">{part.slice(1, -1)}</code>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={index}>{part.slice(1, -1)}</em>;
    return <span key={index}>{part}</span>;
  });
}

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

function aiChartStats(chart: AiChartData) {
  const total = chart.points.reduce((sum, p) => sum + p.value, 0);
  const avg = chart.points.length ? total / chart.points.length : 0;
  const peak = chart.points.reduce((best, p) => (p.value > best.value ? p : best), chart.points[0]);
  const money = chart.metric !== 'orders';
  const orders = chart.order_count ?? (money ? null : Math.round(total));
  const revenue = chart.revenue ?? (money ? total : null);
  return { total, avg, peak, orders, revenue, money };
}

function aiFullMoney(v: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
}

function AiChartBlock({ chart }: { chart: AiChartData }) {
  const data = chart.points.map((p) => ({ name: p.label.slice(5), value: p.value }));
  const stats = aiChartStats(chart);
  const fmt = (v: number) => stats.money ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0, notation: 'compact' }).format(v) : String(v);
  const tipFmt = (v: unknown) => [stats.money ? aiFullMoney(Number(v)) : String(v), chart.metric === 'orders' ? 'Số đơn' : 'Doanh thu'] as const;
  return <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200"><div className="border-b border-zinc-100 px-3 py-2"><p className="text-xs font-bold text-zinc-800">{chart.title}</p><div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">{stats.revenue != null ? <span className="rounded-lg bg-leaf-soft px-2 py-0.5 font-bold text-leaf">Tổng {aiFullMoney(stats.revenue)}</span> : <span className="rounded-lg bg-leaf-soft px-2 py-0.5 font-bold text-leaf">Tổng {stats.money ? aiFullMoney(stats.total) : `${Math.round(stats.total)} đơn`}</span>}{stats.orders != null && stats.money ? <span className="rounded-lg bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">{stats.orders} đơn</span> : null}<span className="rounded-lg bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">TB {stats.money ? aiFullMoney(Math.round(stats.avg)) : `${stats.avg.toFixed(1)} đơn`}/ngày</span><span className="rounded-lg bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">Đỉnh {stats.peak.label.slice(5)}: {stats.money ? aiFullMoney(Math.round(stats.peak.value)) : `${Math.round(stats.peak.value)} đơn`}</span></div></div><div className="h-[220px] p-2"><ResponsiveContainer width="100%" height="100%">{chart.type === 'bar' ? <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}><CartesianGrid stroke="#f1f1f4" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} interval="preserveStartEnd" /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} tickFormatter={(v: number) => fmt(Number(v))} /><Tooltip formatter={tipFmt} /><Bar dataKey="value" fill="#247448" radius={[4, 4, 0, 0]} /></BarChart> : <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}><defs><linearGradient id="ai-chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#247448" stopOpacity={0.25} /><stop offset="100%" stopColor="#247448" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#f1f1f4" vertical={false} /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} interval="preserveStartEnd" /><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#a1a1aa' }} tickFormatter={(v: number) => fmt(Number(v))} /><Tooltip formatter={tipFmt} /><Area type="monotone" dataKey="value" stroke="#247448" strokeWidth={2.5} fill="url(#ai-chart-fill)" /></AreaChart>}</ResponsiveContainer></div></div>;
}

function renderAiMarkdown(text: string) {
  const matches = [...text.matchAll(/```chart[\s\S]*?```/g)];
  if (matches.length > 1) {
    let seen = 0;
    text = text.replace(/```chart[\s\S]*?```/g, (m) => (++seen < matches.length ? '' : m));
  }
  const chart = parseAiChart(text);
  const stripped = text.replace(/```chart[\s\S]*?```/g, '').trim();
  const lines = stripped.replace(/\[ID:\d+(?:,QTY:\d+)?\]/g, '').replace(/(\d)(đ\b)/g, '$1 $2').split('\n');
  for (let i = lines.length - 1; i > 0; i--) {
    const cur = lines[i].trim();
    const prev = lines[i - 1].trim();
    if (/^\|/.test(cur) && !/\|\s*$/.test(cur) && /\|\s*$/.test(prev)) { lines[i - 1] = `${prev} ${cur}`; lines.splice(i, 1); }
    else if (/^\|/.test(cur) && /^#{1,4}\s/.test(prev) && /\|/.test(prev)) { lines[i - 1] = `${prev} ${cur}`; lines.splice(i, 1); }
  }
  const blocks: ReactNode[] = [];
  let table: string[][] = [];
  const hideTablesForChart = chart != null;
  const flushTable = (key: string) => {
    if (!table.length) return;
    if (hideTablesForChart) { table = []; return; }
    const header = table[0];
    const body = table.slice(1).filter((row) => !row.every((cell) => /^:?-{2,}:?$/.test(cell.trim())));
    blocks.push(<div key={key} className="overflow-x-auto"><table className="w-full border-collapse text-left text-[13px]"><thead><tr>{header.map((cell, i) => <th key={i} className="border-b border-zinc-200 px-2 py-1.5 font-bold text-zinc-800">{renderAiInline(cell.trim())}</th>)}</tr></thead><tbody>{body.map((row, r) => <tr key={r} className="odd:bg-zinc-50/70">{row.map((cell, i) => <td key={i} className="border-b border-zinc-100 px-2 py-1.5 text-zinc-700">{renderAiInline(cell.trim())}</td>)}</tr>)}</tbody></table></div>);
    table = [];
  };
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (/^#{1,4}\s/.test(trimmed) && trimmed.includes('|')) { const title = trimmed.replace(/\|.*$/, '').trim(); blocks.push(<p key={index} className="font-extrabold text-zinc-900">{renderAiInline(title)}</p>); const rest = trimmed.slice(title.length).trim().replace(/^\|+/, '').trim(); if (rest) table.push(`| ${rest}`.replace(/^\||\|$/g, '').split('|')); return; }
    if ((/^\|/.test(trimmed) || /\|.*\|/.test(trimmed)) && (table.length || trimmed.split('|').length >= 3)) { const row = trimmed.includes('|') ? trimmed : `${trimmed} |`; table.push(row.replace(/^\||\|$/g, '').split('|')); return; }
    flushTable(`t-${index}`);
    if (!trimmed) { blocks.push(<div key={index} className="h-2" />); return; }
    if (/^#{1,4}\s+/.test(trimmed)) { blocks.push(<p key={index} className="font-extrabold text-zinc-900">{renderAiInline(trimmed.replace(/^#{1,4}\s+/, ''))}</p>); return; }
    if (/^[-*]\s+/.test(trimmed)) { blocks.push(<div key={index} className="flex gap-2"><span className="text-leaf">•</span><span className="min-w-0 flex-1">{renderAiInline(trimmed.replace(/^[-*]\s+/, ''))}</span></div>); return; }
    if (/^\d+[.)]\s+/.test(trimmed)) { blocks.push(<div key={index} className="flex gap-2"><span className="font-bold text-leaf">{trimmed.match(/^\d+[.)]/)?.[0]}</span><span className="min-w-0 flex-1">{renderAiInline(trimmed.replace(/^\d+[.)]\s+/, ''))}</span></div>); return; }
    blocks.push(<p key={index}>{renderAiInline(line)}</p>);
  });
  flushTable('t-end');
  if (chart) blocks.push(<AiChartBlock key="ai-chart" chart={chart} />);
  return <div className="space-y-1">{blocks}</div>;
}

function AiChatPage() {
  const chatQueryClient = useQueryClient();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const sessionsQuery = useQuery({ queryKey: ['admin-ai-sessions'], queryFn: () => adminAiApi.sessions() });
  const openSession = async (id: number) => {
    setError('');
    try {
      const session = await adminAiApi.session(id);
      setSessionId(session.SessionId);
      setMessages((session.Messages ?? []).map((message) => ({ role: message.Role === 'user' ? 'user' : 'assistant', content: message.Content ?? '' })));
      setHistoryOpen(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không tải được đoạn chat.'); }
  };
  const newChat = () => { setSessionId(null); setMessages([]); setInput(''); setError(''); setHistoryOpen(false); };
  const deleteSession = async (id: number) => {
    try { await adminAiApi.removeSession(id); if (sessionId === id) { setSessionId(null); setMessages([]); } void chatQueryClient.invalidateQueries({ queryKey: ['admin-ai-sessions'] }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Xóa đoạn chat thất bại.'); }
  };
  const send = async (text: string) => {
    const content = text.trim();
    if (!content || busy) return;
    setMessages((current) => [...current, { role: 'user', content }, { role: 'assistant', content: '' }]);
    setInput(''); setBusy(true); setError('');
    try {
      for await (const event of adminAiApi.stream(content, sessionId ?? undefined)) {
        if (event.Type === 'error') { setError(event.Error ?? 'AI tạm thời không khả dụng.'); break; }
        if (event.SessionId && sessionId == null) setSessionId(event.SessionId);
        if (event.Type === 'chart' && event.ChartJson) setMessages((current) => { const copy = [...current]; const last = copy[copy.length - 1]; copy[copy.length - 1] = { ...last, content: last.content + `\n\`\`\`chart ${event.ChartJson}\`\`\`\n` }; return copy; });
        if (event.Text) setMessages((current) => { const copy = [...current]; const last = copy[copy.length - 1]; copy[copy.length - 1] = { ...last, content: last.content + (event.Text ?? '') }; return copy; });
      }
      void chatQueryClient.invalidateQueries({ queryKey: ['admin-ai-sessions'] });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không kết nối được AI.'); } finally { setBusy(false); }
  };
  const sessionTitle = (session: { Title?: string | null; Messages?: Array<{ Content?: string | null }> }) => session.Title?.trim() || session.Messages?.find((message) => (message.Content ?? '').trim())?.Content?.slice(0, 42) || 'Đoạn chat mới';
  return <div className="-mx-4 -my-6 flex h-[calc(100vh_-_72px)] w-auto min-w-0 flex-col bg-zinc-100/70 sm:-mx-6 lg:-mx-8 lg:-my-8"><div className="flex min-h-0 flex-1 overflow-hidden border-y border-zinc-200/80 bg-white">
  <aside className={`${historyOpen ? 'flex' : 'hidden'} w-[260px] shrink-0 flex-col border-r border-zinc-100 bg-zinc-50/60 lg:flex`}>
    <div className="flex items-center justify-between px-4 pb-2 pt-4"><p className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">Lịch sử chat</p><button onClick={newChat} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-leaf px-2.5 text-xs font-bold text-white transition hover:bg-leaf-dark"><Plus size={14} /> Mới</button></div>
    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 pb-4">{sessionsQuery.isLoading ? <p className="px-2 py-6 text-center text-xs text-zinc-400">Đang tải lịch sử…</p> : sessionsQuery.isError ? <div className="px-2 py-4 text-center"><p className="text-xs text-zinc-500">Không tải được lịch sử.</p><button onClick={() => void sessionsQuery.refetch()} className="mt-2 text-xs font-bold text-leaf hover:text-leaf-dark">Thử lại</button></div> : (sessionsQuery.data ?? []).length === 0 ? <p className="px-2 py-6 text-center text-xs text-zinc-400">Chưa có đoạn chat nào.</p> : (sessionsQuery.data ?? []).map((session) => <div key={session.SessionId} className={cx('group flex items-center gap-1 rounded-lg px-2 py-2 text-left transition', sessionId === session.SessionId ? 'bg-leaf-soft' : 'hover:bg-white')}><button onClick={() => void openSession(session.SessionId)} className="min-w-0 flex-1 text-left"><p className="truncate text-xs font-bold text-zinc-800">{sessionTitle(session)}</p><p className="mt-0.5 text-[11px] text-zinc-400">{session.MessageCount ?? session.Messages?.length ?? session.SummaryMessageCount ?? 0} tin nhắn</p></button><button onClick={() => void deleteSession(session.SessionId)} aria-label="Xóa đoạn chat" className="rounded p-1.5 text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"><Trash2 size={14} /></button></div>)}</div>
  </aside>
  <div className="flex min-h-0 min-w-0 flex-1 flex-col">
    <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-4 sm:px-6"><button onClick={() => setHistoryOpen((v) => !v)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 lg:hidden" aria-label="Lịch sử chat"><Clock3 size={17} /></button><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf text-white"><Sparkles size={17} /></div><div className="min-w-0 flex-1"><h1 className="font-display text-sm font-bold">Trợ lý cửa hàng</h1></div><Badge tone="success">Online</Badge><button onClick={newChat} className="hidden h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-600 hover:border-leaf hover:text-leaf-dark sm:inline-flex"><Plus size={14} /> Chat mới</button></div>
    <div className="flex-1 space-y-4 overflow-y-auto bg-zinc-50/60 p-5">{!messages.length && !busy ? <div className="flex h-full flex-col items-center justify-center text-center"><div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-leaf-soft text-leaf"><Sparkles size={24} /></div><h2 className="font-display text-2xl font-bold text-zinc-950">Bạn cần tìm gì?</h2><p className="mt-2 max-w-md text-sm text-zinc-500">Hỏi về tồn kho, đơn hàng, xu hướng bán hoặc hiệu suất sản phẩm.</p><div className="mt-7 grid w-full max-w-xl gap-2 sm:grid-cols-2"><button onClick={() => void send('Tồn kho mì gói hiện tại là bao nhiêu?')} className="rounded-xl border border-zinc-200 bg-white p-3 text-left text-xs font-semibold text-zinc-600 hover:border-leaf hover:bg-leaf-soft">“Tồn kho mì gói hiện tại?”</button><button onClick={() => void send('Doanh thu tuần này so với tuần trước như thế nào?')} className="rounded-xl border border-zinc-200 bg-white p-3 text-left text-xs font-semibold text-zinc-600 hover:border-leaf hover:bg-leaf-soft">“Doanh thu tuần này so với tuần trước?”</button></div></div> : messages.map((message, index) => <div key={index} className={cx('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}><div className={cx('max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6', message.role === 'user' ? 'whitespace-pre-wrap bg-leaf text-white' : 'border border-zinc-200 bg-white text-zinc-800')}>{message.role === 'assistant' && message.content ? renderAiMarkdown(message.content) : message.content || (busy && index === messages.length - 1 ? <span className="inline-flex gap-1"><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:.15s]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:.3s]" /></span> : '…')}</div></div>)}</div>
    {error && <p className="mx-5 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
    <div className="border-t border-zinc-100 p-4"><form onSubmit={(event) => { event.preventDefault(); void send(input); }} className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Hỏi về cửa hàng của bạn..." className="flex-1 bg-transparent text-sm outline-none" disabled={busy} /><button type="submit" disabled={busy || !input.trim()} className="flex h-8 w-8 items-center justify-center rounded-lg bg-leaf text-white disabled:opacity-40"><ArrowUpRight size={15} /></button></form></div>
  </div></div></div>;
}
/**
 * AGENTS MONITOR — timeline 2 cột: Sự kiện người dùng | Sự kiện LLM (concept giao diện mới),
 * dùng dữ liệu agent đã có: runs, session chat, agent events (SSE trực tiếp).
 */
function AgentMonitorPage() {
  const queryClient = useQueryClient();
  const agentsQuery = useAgents({ pageSize: 50 });
  const agents = agentsQuery.data?.items ?? [];
  const [agentId, setAgentId] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [agentMode, setAgentMode] = useState<'view' | 'edit' | 'create'>('view');
  const emptyAgentForm = { Name: '', Description: '', Model: '', Temperature: '0.3', MaxToolRounds: '8', SystemInstructions: '' };
  const [agentForm, setAgentForm] = useState(emptyAgentForm);
  const [agentSaving, setAgentSaving] = useState(false);
  const [agentFormError, setAgentFormError] = useState('');
  const setAgentField = (key: keyof typeof emptyAgentForm, value: string) => setAgentForm((current) => ({ ...current, [key]: value }));
  const [now, setNow] = useState(() => new Date());
  const [liveEvents, setLiveEvents] = useState<MonitorEvent[]>([]);
  const [triggering, setTriggering] = useState(false);
  const autoQuery = useAutoAnalysisStatus(true);
  const auto = (autoQuery.data ?? {}) as { Enabled?: boolean; IntervalSeconds?: number; LookbackSeconds?: number; LastRunAt?: string | null; LastStatus?: string | null; LastRunId?: number | null; LastReportId?: number | null; LastError?: string | null };
  const autoReportsQuery = useQuery({ queryKey: ['reports', { pageSize: 5, reportType: 'OPS_ANALYSIS' }], queryFn: () => reportsApi.list({ pageSize: 5, reportType: 'OPS_ANALYSIS' }), refetchInterval: 60000 });
  const autoReport = (autoReportsQuery.data?.items ?? [])[0];
  const autoAnchorMs = auto.LastRunAt != null ? new Date(auto.LastRunAt).getTime() : autoQuery.dataUpdatedAt;
  const autoCountdownS = Number.isFinite(autoAnchorMs) && autoAnchorMs > 0
    ? Math.max(0, (auto.IntervalSeconds ?? 30) - Math.floor((now.getTime() - autoAnchorMs) / 1000))
    : (auto.IntervalSeconds ?? 30);
  const triggerAuto = async () => {
    setTriggering(true);
    try {
      await reportsApi.autoTrigger();
      void autoQuery.refetch();
      void autoReportsQuery.refetch();
      void queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
    } catch { /* lỗi hiển thị qua LastError ở lần poll sau */ } finally { setTriggering(false); }
  };

  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);

  const activeAgentId = agentId ?? agents[0]?.AgentId ?? null;
  const runsQuery = useQuery({ queryKey: ['agent-runs', { pageSize: 50, agentId: activeAgentId, trigger: 'AUTO_ANALYSIS' }], queryFn: () => agentsApi.runs({ pageSize: 50, agentId: activeAgentId ?? undefined, trigger: 'AUTO_ANALYSIS' }), refetchInterval: 60000 });
  const runs = (runsQuery.data?.items ?? []).filter((item) => String(item.Trigger ?? '').toUpperCase() === 'AUTO_ANALYSIS');
  const analysisIds = [...runs]
    .sort((a, b) => String((b as unknown as Record<string, unknown>).CreatedAt ?? '').localeCompare(String((a as unknown as Record<string, unknown>).CreatedAt ?? '')))
    .map((item) => Number(item.AgentRunId));
  const activeRunId = auto.LastRunId ?? analysisIds[0] ?? null;

  const runQuery = useQuery({ queryKey: ['admin-agent-run', activeRunId], queryFn: () => agentsApi.run(activeRunId!), enabled: activeRunId != null, refetchInterval: 60000 });
  const run = (runQuery.data ?? null) as MonitorRun | null;
  const sessionQuery = useQuery({ queryKey: ['admin-ai-session', run?.SessionId], queryFn: () => adminAiApi.session(run!.SessionId!), enabled: run?.SessionId != null });

  // SSE: sự kiện mới nhất được đẩy vào timeline ngay khi chạy.
  // Khi có REPORT_CREATED / RUN_COMPLETED của run AUTO_ANALYSIS → refresh status + reports + runs.
  useEffect(() => {
    let active = true;
    let stop: (() => void) | undefined;
    let lastAutoRefresh = 0;
    agentsApi.streamActivity((event) => {
      if (!active) return;
      const item = event as unknown as MonitorEvent;
      setLiveEvents((previous) => [...previous.slice(-199), item]);
      const type = String(item.Type ?? '');
      if ((type === 'REPORT_CREATED' || type === 'RUN_COMPLETED') && Date.now() - lastAutoRefresh > 5000) {
        lastAutoRefresh = Date.now();
        void autoQuery.refetch();
        void autoReportsQuery.refetch();
        void queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
      }
    })
      .then((cleanup) => { if (active) stop = cleanup; else cleanup(); })
      .catch(() => { /* stream không khả dụng — dùng dữ liệu poll */ });
    return () => { active = false; stop?.(); };
  }, []);

  // Cột trái: tin nhắn người dùng (theo session) hoặc Input của run.
  const sessionMessages = sessionQuery.data?.Messages ?? [];
  const describeRunInput = (input?: string | null) => {
    if (!input) return '';
    try {
      const data = JSON.parse(input) as Record<string, unknown>;
      if (typeof data.window_seconds !== 'undefined') return `Cửa sổ ${String(data.window_seconds)}s · ${String(data.user_messages ?? 0)} tin nhắn · ${String(data.events ?? 0)} sự kiện · ${String(data.tool_calls ?? 0)} tool calls · ${String(data.runs ?? 0)} runs`;
    } catch { /* input là text thường */ }
    return input;
  };
  const sessionUserEvents = sessionMessages.filter((message) => message.Role === 'user').map((message, index) => ({ id: `u-${index}`, at: message.CreatedAt ?? null, detail: message.Content }));
  const userEvents = sessionUserEvents.length ? sessionUserEvents
    : (run?.Input ? [{ id: 'u-run', at: run.CreatedAt ?? null, detail: describeRunInput(run.Input) }] : []);

  // Cột phải: agent events của run + sự kiện live (không trùng id).
  const merged = new Map<number, MonitorEvent>();
  for (const event of [...(run?.Events ?? []), ...liveEvents.filter((event) => Number(event.AgentRunId) === Number(activeRunId))]) {
    const id = Number(event.AgentEventId);
    if (Number.isFinite(id) && !merged.has(id)) merged.set(id, event);
  }
  const llmEvents = [...merged.values()].sort((a, b) => String(a.CreatedAt ?? '').localeCompare(String(b.CreatedAt ?? '')));

  const activeAgent = agents.find((candidate) => candidate.AgentId === activeAgentId);
  const timeOf = (iso: string | null | undefined) => iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour12: false }) : '--:--:--';
  const payloadOf = (event: MonitorEvent) => {
    if (event.Payload) {
      try {
        const data = JSON.parse(event.Payload) as Record<string, unknown>;
        const parts = [data.toolName, data.tool, data.status, data.error, data.trigger].filter((value): value is string => typeof value === 'string' && value.length > 0);
        if (parts.length) return parts.join(' · ');
      } catch { /* payload không phải JSON */ }
    }
    return event.Message ?? '';
  };
  const toggleEnabled = async () => {
    if (!activeAgent) return;
    try { await agentsApi.setEnabled(activeAgent.AgentId, !activeAgent.Enabled); void queryClient.invalidateQueries({ queryKey: ['agents'] }); } catch { /* giữ nguyên trạng thái */ }
  };
  const openEditAgent = () => {
    if (!activeAgent) return;
    setAgentForm({ Name: activeAgent.Name, Description: activeAgent.Description ?? '', Model: activeAgent.Model, Temperature: String(activeAgent.Temperature), MaxToolRounds: String(activeAgent.MaxToolRounds), SystemInstructions: activeAgent.SystemInstructions ?? '' });
    setAgentFormError(''); setAgentMode('edit');
  };
  const saveAgent = async () => {
    setAgentFormError('');
    if (!agentForm.Name.trim()) { setAgentFormError('Nhập tên agent.'); return; }
    setAgentSaving(true);
    try {
      const input = { Name: agentForm.Name.trim(), Description: agentForm.Description.trim() || undefined, Model: agentForm.Model.trim() || undefined, Temperature: Number(agentForm.Temperature) || 0, MaxToolRounds: Number(agentForm.MaxToolRounds) || 8, SystemInstructions: agentForm.SystemInstructions.trim() };
      if (agentMode === 'create') {
        const created = await agentsApi.create({ ...input, SystemInstructions: input.SystemInstructions || 'Bạn là trợ lý vận hành cửa hàng. Hãy dùng công cụ chỉ đọc để trả lời chính xác.' });
        setSettingsOpen(false); setAgentMode('view');
        if (created?.AgentId) setAgentId(created.AgentId);
      } else if (activeAgent) {
        await agentsApi.update(activeAgent.AgentId, input);
        setAgentMode('view');
      }
      void queryClient.invalidateQueries({ queryKey: ['agents'] });
    } catch (cause) { setAgentFormError(cause instanceof Error ? cause.message : 'Lưu agent thất bại.'); } finally { setAgentSaving(false); }
  };

  return <div className="-mx-4 -my-6 flex h-[calc(100vh_-_72px)] min-w-0 flex-col sm:-mx-6 lg:-mx-8 lg:-my-8">
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden border border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-extrabold text-zinc-900">{activeAgent?.Name ?? agents[0]?.Name ?? 'Agent'}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />Trực tiếp</span>
          {activeRunId != null && <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-700">#{activeRunId} · AUTO_ANALYSIS{run?.Status ? ` · ${run.Status}` : ''}</span>}
        </div>
        <div className="flex items-center gap-2"><span className="text-xs font-medium tabular-nums text-zinc-400">{now.toLocaleString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span></div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 bg-leaf-soft/40 px-5 py-3 text-xs text-zinc-600">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-bold text-leaf-dark shadow-sm"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" />Phân tích tự động {auto.IntervalSeconds ?? 30}s · còn {autoCountdownS}s</span>
        <span>Cửa sổ: <b>{auto.LookbackSeconds ?? 300}s</b></span>
        <span>Trạng thái: <b>{auto.LastStatus ?? '—'}</b></span>
        {auto.LastRunId != null && <span>Run: <b>#{auto.LastRunId}</b></span>}
        {auto.LastReportId != null && <span>Báo cáo: <b>#{auto.LastReportId}</b></span>}
        {autoReport != null && <span className="hidden max-w-[520px] truncate text-zinc-500 xl:inline">Mới nhất: <b>{String((autoReport as unknown as Record<string, unknown>).Title ?? '')}</b> · {String((autoReport as unknown as Record<string, unknown>).Severity ?? '')}</span>}
        {auto.LastError != null && <span className="text-red-600">{auto.LastError}</span>}
        <span className="ml-auto flex items-center gap-2">
          {autoReport != null && <span className="hidden max-w-[420px] truncate text-zinc-500">{String((autoReport as unknown as Record<string, unknown>).Title ?? '')}</span>}
          <button disabled={triggering} onClick={() => void triggerAuto()} className="rounded-lg bg-leaf px-3 py-1.5 font-semibold text-white hover:bg-leaf-dark disabled:opacity-50">{triggering ? 'Đang chạy…' : 'Chạy ngay'}</button>
        </span>
      </div>

      {runQuery.isLoading || runsQuery.isLoading ? <TableSkeleton rows={8} />
        : runQuery.isError ? <ErrorCard onRetry={() => void runQuery.refetch()} />
        : !run ? <EmptyState title="Chưa có phiên chạy" copy="Chọn agent khác hoặc khởi chạy một run để xem timeline." />
        : <div className="grid min-h-0 flex-1 md:grid-cols-2">
          <section className="min-h-0 min-w-0 overflow-y-auto border-b border-zinc-100 px-5 pb-5 md:border-b-0 md:border-r">
            <div className="sticky top-0 z-10 -mx-5 mb-4 flex items-center justify-between bg-white/95 px-5 py-3 backdrop-blur"><h3 className="text-xs font-bold uppercase tracking-[.14em] text-blue-600">Sự kiện người dùng</h3><span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">{userEvents.length}</span></div>
            <ol className="space-y-4 pr-2">
              {userEvents.map((item) => <li key={item.id} className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500 ring-4 ring-blue-100" /><div className="min-w-0"><p className="font-mono text-[11px] text-zinc-400">{timeOf(item.at)}</p><p className="text-sm font-semibold text-zinc-800">Tin nhắn người dùng</p><p className="mt-0.5 break-words text-sm text-zinc-500">“{item.detail}”</p></div></li>)}
              {!userEvents.length && <li><EmptyState title="Chưa có tương tác" copy="Phiếu này chưa ghi nhận tin nhắn người dùng." /></li>}
            </ol>
          </section>
          <section className="min-h-0 min-w-0 overflow-y-auto px-5 pb-5">
            <div className="sticky top-0 z-10 -mx-5 mb-4 flex items-center justify-between bg-white/95 px-5 py-3 backdrop-blur"><h3 className="text-xs font-bold uppercase tracking-[.14em] text-leaf">Sự kiện LLM</h3><span className="rounded-full bg-leaf-soft px-2 py-0.5 text-[11px] font-bold text-leaf-dark">{llmEvents.length}</span></div>
            <ol className="space-y-4 pr-2">
              {llmEvents.map((event) => { const meta = llmMeta[event.Type ?? ''] ?? { icon: '🔵', title: event.Type ?? 'Sự kiện' }; return <li key={Number(event.AgentEventId)} className="flex gap-3"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm">{meta.icon}</span><div className="min-w-0"><p className="font-mono text-[11px] text-zinc-400">{timeOf(event.CreatedAt)}{event.DurationMs ? ` · ${event.DurationMs}ms` : ''}</p><p className="text-sm font-semibold text-zinc-800">{meta.title}</p>{payloadOf(event) && <p className="mt-0.5 break-words font-mono text-xs text-zinc-500">{payloadOf(event)}</p>}</div></li>; })}
              {!llmEvents.length && <li><EmptyState title="Chưa có sự kiện LLM" copy="Run này chưa phát sinh sự kiện nào." /></li>}
            </ol>
          </section>
        </div>}

    </div>

    <Drawer open={settingsOpen} onClose={() => { setSettingsOpen(false); setAgentMode('view'); }} title={agentMode === 'create' ? 'Tạo agent' : agentMode === 'edit' ? 'Sửa agent' : 'Cài đặt agent'} subtitle={agentMode === 'view' ? activeAgent?.Name : undefined}>
      {agentMode !== 'view' ? <div className="space-y-4">
        <Field label="Tên agent"><input value={agentForm.Name} onChange={(e) => setAgentField('Name', e.target.value)} placeholder="VD: Customer Support Agent" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field>
        <Field label="Mô tả"><input value={agentForm.Description} onChange={(e) => setAgentField('Description', e.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field>
        <Field label="Model"><input value={agentForm.Model} onChange={(e) => setAgentField('Model', e.target.value)} placeholder="gpt-4o-mini" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 font-mono text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Nhiệt độ (0–2)"><input type="number" step="0.1" min="0" max="2" value={agentForm.Temperature} onChange={(e) => setAgentField('Temperature', e.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field><Field label="Vòng công cụ tối đa"><input type="number" min="1" value={agentForm.MaxToolRounds} onChange={(e) => setAgentField('MaxToolRounds', e.target.value)} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field></div>
        {agentMode === 'create' && <Field label="System instructions"><textarea rows={4} value={agentForm.SystemInstructions} onChange={(e) => setAgentField('SystemInstructions', e.target.value)} placeholder="Để trống sẽ dùng mặc định…" className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field>}
        {agentFormError && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{agentFormError}</p>}
        <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => { setSettingsOpen(false); setAgentMode('view'); }}>Hủy</Button><Button disabled={agentSaving} onClick={() => void saveAgent()}>{agentSaving ? 'Đang lưu…' : agentMode === 'create' ? 'Tạo agent' : 'Lưu thay đổi'}</Button></div>
      </div> : !activeAgent ? <EmptyState title="Chưa chọn agent" copy="Chọn một agent ở thanh trên." /> : <div className="space-y-4">
        <div className="rounded-xl bg-zinc-50 p-4"><p className="text-xs text-zinc-500">Mô tả</p><p className="mt-1 text-sm font-medium text-zinc-800">{activeAgent.Description ?? '—'}</p></div>
        <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-zinc-50 p-4"><p className="text-xs text-zinc-500">Model</p><p className="mt-1 font-mono text-sm font-semibold text-zinc-800">{activeAgent.Model}</p></div><div className="rounded-xl bg-zinc-50 p-4"><p className="text-xs text-zinc-500">Nhiệt độ</p><p className="mt-1 font-mono text-sm font-semibold text-zinc-800">{activeAgent.Temperature}</p></div></div>
        <div className="rounded-xl bg-zinc-50 p-4"><p className="text-xs text-zinc-500">Công cụ được gán ({(activeAgent.Tools ?? []).length})</p><p className="mt-1 font-mono text-xs text-zinc-600">{(activeAgent.Tools ?? []).join(', ') || '—'}</p></div>
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-4"><div><p className="text-sm font-semibold text-zinc-800">Kích hoạt agent</p><p className="text-xs text-zinc-400">Tắt để tạm ngưng các run mới.</p></div><button onClick={() => void toggleEnabled()} className={cx('relative h-6 w-11 rounded-full transition', activeAgent.Enabled ? 'bg-leaf' : 'bg-zinc-300')}><span className={cx('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all', activeAgent.Enabled ? 'left-[22px]' : 'left-0.5')} /></button></div>
        <div className="flex justify-end"><Button icon={Settings2} onClick={openEditAgent}>Chỉnh sửa agent</Button></div>
      </div>}
    </Drawer>
  </div>;
}

type MonitorEvent = { AgentEventId?: number; AgentRunId?: number; Type?: string; Level?: string; Message?: string; Payload?: string | null; DurationMs?: number | null; CreatedAt?: string | null };
type MonitorRun = { AgentRunId: number; Status?: string; SessionId?: number | null; Input?: string | null; Model?: string | null; CreatedAt?: string | null; StartedAt?: string | null; CompletedAt?: string | null; InputTokens?: number | null; OutputTokens?: number | null; Events?: MonitorEvent[] };
const llmMeta: Record<string, { icon: string; title: string }> = {
  RUN_STARTED: { icon: '🧠', title: 'Agent nhận sự kiện' },
  CONTEXT_CREATED: { icon: '🧠', title: 'Tạo ngữ cảnh hội thoại' },
  LLM_REQUEST_STARTED: { icon: '🧠', title: 'Gửi yêu cầu đến LLM' },
  LLM_RESPONSE_RECEIVED: { icon: '🧠', title: 'Suy luận / Ra quyết định' },
  TOOL_CALL_STARTED: { icon: '🔧', title: 'Gọi công cụ' },
  TOOL_CALL_COMPLETED: { icon: '📦', title: 'Kết quả công cụ' },
  TOOL_CALL_FAILED: { icon: '⚠️', title: 'Công cụ thất bại' },
  REPORT_CREATED: { icon: '📄', title: 'Tạo báo cáo' },
  RUN_COMPLETED: { icon: '🤖', title: 'Phản hồi cuối được tạo' },
  RUN_FAILED: { icon: '❌', title: 'Run thất bại' },
  RUN_CANCELLED: { icon: '⏹', title: 'Run bị hủy' },
};

function AiPage({ page: requested }: { page: string }) {
  // 🔀 Gộp Analytics vào Reports: /ai/reports và /ai/analytics dùng chung một trang.
  const page = requested === 'analytics' ? 'reports' : requested;
  const titles: Record<string, [string, string]> = { chat: ['Trợ lý AI', 'Hỏi đáp về cửa hàng dựa trên dữ liệu thật.'], agents: ['Giám sát agent', 'Timeline sự kiện người dùng và LLM theo thời gian thực.'], runs: ['Lịch sử chạy', 'Theo dõi chạy model, lệnh công cụ và kết quả.'], activity: ['Hoạt động trực tiếp', 'Sự kiện thực thi công cụ và model theo thời gian thực.'], reports: ['Báo cáo & Phân tích', 'Báo cáo do agent tạo và các chỉ số vận hành AI trên cùng một màn hình.'], tools: ['Công cụ', 'Danh sách công cụ chỉ đọc đang khả dụng.'] };
  const [title, description] = titles[page] ?? titles.reports;
  const [listPage, setListPage] = useState(1);
  const listPageSize = 15;
  useEffect(() => { setListPage(1); }, [page]);
  const agentsQuery = useAgents({ page: listPage, pageSize: listPageSize });
  const runsQuery = useAgentRuns({ page: listPage, pageSize: listPageSize });
  const activityQuery = useAgentActivity({ page: listPage, pageSize: listPageSize });
  const reportsQuery = useReports({ page: listPage, pageSize: listPageSize });
  const analyticsQuery = useAgentAnalytics();
  const toolsQuery = useQuery({ queryKey: ['admin-agent-tools'], queryFn: () => agentsApi.tools(), enabled: page === 'tools' });
  const analytics = (analyticsQuery.data ?? {}) as Record<string, unknown>;
  const successRate = num(analytics.SuccessRate) ?? num(analytics.successRate);
  const listQuery = page === 'agents' ? agentsQuery : page === 'runs' ? runsQuery : page === 'activity' ? activityQuery : page === 'reports' ? reportsQuery : toolsQuery;
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  /** Tạo báo cáo bán hàng 30 ngày gần nhất (POST api/admin/agent-reports/generate). */
  const generateReport = async () => {
    setGenerating(true);
    try {
      const to = new Date();
      const from = new Date(Date.now() - 30 * 86400000);
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      // Backend chỉ chấp nhận online/offline hoặc bỏ trống (tất cả kênh).
      await reportsApi.generate({ From: iso(from), To: iso(to) });
      void queryClient.invalidateQueries({ queryKey: ['reports'] });
    } catch { /* lỗi đã hiển thị qua trạng thái list */ } finally { setGenerating(false); }
  };
  /** Tải PDF của một báo cáo đã tạo. */
  const downloadPdf = async (id: number | string) => {
    try {
      const blob = await reportsApi.pdf(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `bao-cao-${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch { /* bỏ qua lỗi tải file */ }
  };
  if (page === 'chat') return <AiChatPage />;
  const paged = (listQuery.data as ApiListResult<unknown> | undefined);
  const totalItems = paged?.totalCount ?? (paged?.items?.length ?? 0);
  const totalListPages = Math.max(1, Math.ceil(totalItems / listPageSize));
  const pager = (totalListPages > 1 || listPage > 1) ? <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-400"><span>Hiển thị {((paged?.items?.length ?? 0))} / {totalItems} · Trang {Math.min(listPage, totalListPages)}/{totalListPages}</span><div className="flex items-center gap-1"><button disabled={listPage <= 1} onClick={() => setListPage((v) => Math.max(1, v - 1))} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">‹</button><button disabled={listPage >= totalListPages} onClick={() => setListPage((v) => Math.min(totalListPages, v + 1))} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">›</button></div></div> : null;
  const statCards = [
    { label: 'Tổng runs', value: statValue(num(analytics.TotalRuns) ?? num(analytics.totalRuns) ?? num(analytics.Total)) },
    { label: 'Tỷ lệ thành công', value: typeof successRate === 'number' ? `${successRate.toFixed(1)}%` : '—' },
    { label: 'Runs thất bại', value: statValue(num(analytics.FailedRuns) ?? num(analytics.failedRuns)) },
    { label: 'Lượt gọi tool', value: statValue(num(analytics.ToolCalls) ?? num(analytics.toolCalls)) },
  ];
  if (page === 'agents') return <AgentMonitorPage />;
  return <><PageHeader eyebrow="Vận hành AI" title={title} description={description} action={page === 'reports' ? <Button icon={Plus} disabled={generating} onClick={() => void generateReport()}>{generating ? 'Đang tạo…' : 'Tạo báo cáo'}</Button> : <Button variant="secondary" icon={Download}>Xuất báo cáo</Button>} />
    {page === 'reports' && <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">{statCards.map(({ label, value }) => <Card key={label} className="p-5"><p className="text-xs font-semibold text-zinc-500">{label}</p><p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-zinc-950">{value}</p></Card>)}</div>}
    <div className="grid min-h-0 gap-4 sm:grid-cols-1 xl:grid-cols-[1.7fr_1fr]"><Card className="flex flex-col overflow-hidden">
      {listQuery.isLoading ? <TableSkeleton rows={6} /> : listQuery.isError ? <ErrorCard onRetry={() => void listQuery.refetch()} /> : !listQuery.data || (('items' in listQuery.data) && (listQuery.data as ApiListResult<unknown>).items.length === 0) || (page === 'tools' && ((listQuery.data as unknown as AgentTool[] | null)?.length ?? 0) === 0) ? <EmptyState title="Chưa có dữ liệu" copy="Hệ thống chưa ghi nhận dữ liệu nào." /> : <div className="divide-y divide-zinc-100 overflow-y-auto">{(page === 'agents' ? (agentsQuery.data?.items ?? []).map((agent) => ({ id: agent.AgentId, icon: 'agents', name: agent.Name, sub: `${agent.Model} · ${(agent.Tools ?? []).length} công cụ`, status: agent.Enabled ? 'Running' : 'Paused' })) : page === 'runs' ? (runsQuery.data?.items ?? []).map((run) => ({ id: run.AgentRunId, icon: 'runs', name: run.AgentName, sub: `RUN-${run.AgentRunId} · ${fmtDate((run as unknown as Record<string, unknown>).CreatedAt as string)}`, status: run.Status })) : page === 'activity' ? (activityQuery.data?.items ?? []).map((event) => ({ id: event.AgentEventId ?? Math.random(), icon: 'activity', name: `${event.Type} · ${event.Level}`, sub: event.Message, status: event.Level })) : page === 'reports' ? (reportsQuery.data?.items ?? []).map((report) => ({ id: report.AgentReportId, icon: 'reports', name: report.Title, sub: `${report.ReportType} · Run #${report.AgentRunId}`, status: 'Ready' })) : ((toolsQuery.data ?? []) as AgentTool[]).map((tool) => ({ id: tool.Name, icon: 'tools', name: tool.Name, sub: `${tool.Description} · ${tool.Category}`, status: tool.Enabled ? 'Available' : 'Disabled' }))).map((row) => <div key={`${row.icon}-${row.id}`} className="flex flex-wrap items-center gap-4 px-5 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-leaf-soft text-leaf">{row.icon === 'agents' ? <Sparkles size={16} /> : row.icon === 'tools' ? <Settings2 size={16} /> : <Activity size={16} />}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-zinc-800">{row.name}</p><p className="text-xs text-zinc-400">{row.sub}</p></div><Status value={row.status} /><button onClick={() => { if (page === 'reports') void downloadPdf(row.id); }} title={page === 'reports' ? 'Tải PDF' : undefined} className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-leaf-dark"><Download size={17} /></button></div>)}</div>}
      {pager}
    </Card>{page === 'reports' && <Card className="hidden flex-col overflow-hidden xl:flex"><div className="border-b border-zinc-100 px-5 py-4"><h2 className="font-display text-sm font-bold text-zinc-900">Chi tiết chỉ số</h2><p className="mt-0.5 text-xs text-zinc-500">Mức sử dụng, độ tin cậy và hiệu suất tool.</p></div><div className="flex-1 space-y-4 p-5">{[
      { label: 'Tổng runs', value: statValue(num(analytics.TotalRuns) ?? num(analytics.totalRuns) ?? num(analytics.Total)) },
      { label: 'Tỷ lệ thành công', value: typeof successRate === 'number' ? `${successRate.toFixed(1)}%` : '—' },
      { label: 'Runs thất bại', value: statValue(num(analytics.FailedRuns) ?? num(analytics.failedRuns)) },
      { label: 'Lượt gọi tool', value: statValue(num(analytics.ToolCalls) ?? num(analytics.toolCalls)) },
    ].map(({ label, value }) => <div key={label} className="flex items-start justify-between"><span className="text-sm font-semibold text-zinc-500">{label}</span><b className="font-display text-lg text-zinc-950">{value}</b></div>)}
      </div></Card>
    }
    </div></>;
}

function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [event, setEvent] = useState('');
  const [actor, setActor] = useState('');
  const [page, setPage] = useState(1);
  const auditQuery = useQuery({ queryKey: ['admin-audit-log', page, event, actor, search], queryFn: () => adminAuditApi.list({ page, pageSize: 25, event: event || undefined, actor: actor || undefined, search: search.trim() || undefined }) });
  const eventsQuery = useQuery({ queryKey: ['admin-audit-events'], queryFn: () => adminAuditApi.events(), staleTime: 30_000 });
  const actorsQuery = useQuery({ queryKey: ['admin-audit-actors'], queryFn: () => adminAuditApi.actors(), staleTime: 30_000 });
  const totalCount = auditQuery.data?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 25));
  const rows = (auditQuery.data?.items ?? []).map((raw) => {
    const row = raw as Record<string, unknown>;
    const str = (value: unknown): string | null => value == null ? null : String(value);
    const actor = str(row.ActorName ?? row.Username ?? row.UserName);
    return { id: String(row.EventId ?? ''), occurred: str(row.CreatedAt), actor, action: String(row.Action ?? ''), subject: str(row.Subject), subjectType: str(row.SubjectType), note: str(row.Note), status: str(row.Status) };
  });
  const eventLabel: Record<string, string> = {
    OrderCreated: 'Tạo đơn', OrderUpdated: 'Cập nhật đơn', OrderDelivered: 'Đánh dấu giao', OrderCancelled: 'Hủy đơn', OrderDeleted: 'Xóa đơn',
    RefundCreated: 'Yêu cầu hoàn tiền', RefundApproved: 'Duyệt hoàn tiền', RefundRejected: 'Từ chối hoàn tiền', RefundProcessed: 'Xử lý hoàn tiền', RefundUpdated: 'Cập nhật hoàn tiền', RefundDeleted: 'Xóa yêu cầu hoàn tiền',
    ProductCreated: 'Tạo sản phẩm', ProductUpdated: 'Cập nhật sản phẩm', ProductImageUpdated: 'Đổi ảnh sản phẩm', ProductDeleted: 'Xóa sản phẩm', InventoryChanged: 'Cập nhật tồn kho',
    CustomerCreated: 'Tạo khách hàng', CustomerUpdated: 'Cập nhật khách hàng', CustomerDeleted: 'Xóa khách hàng',
    CategoryCreated: 'Tạo danh mục', CategoryUpdated: 'Cập nhật danh mục', CategoryDeleted: 'Xóa danh mục',
    SupplierCreated: 'Tạo nhà cung cấp', SupplierUpdated: 'Cập nhật nhà cung cấp', SupplierDeleted: 'Xóa nhà cung cấp',
    PromotionCreated: 'Tạo khuyến mãi', PromotionUpdated: 'Cập nhật khuyến mãi', PromotionApplied: 'Áp dụng khuyến mãi', PromotionDeleted: 'Xóa khuyến mãi',
    BillCreated: 'Xuất hóa đơn', BillPaid: 'Thanh toán hóa đơn', BillCancelled: 'Hủy hóa đơn', BillStatusChanged: 'Đổi trạng thái hóa đơn', BillUpdated: 'Cập nhật hóa đơn', BillDeleted: 'Xóa hóa đơn',
    UserCreated: 'Tạo tài khoản', UserUpdated: 'Cập nhật tài khoản', UserDeleted: 'Xóa tài khoản',
    RoleCreated: 'Tạo vai trò', RoleUpdated: 'Cập nhật vai trò', RoleDeleted: 'Xóa vai trò',
    PermissionAssigned: 'Gán quyền', PermissionRevoked: 'Rút quyền', PermissionCreated: 'Tạo quyền', PermissionUpdated: 'Cập nhật quyền', PermissionDeleted: 'Xóa quyền',
    AgentCreated: 'Tạo agent', AgentUpdated: 'Cập nhật agent', AgentDeleted: 'Xóa agent', ReportGenerated: 'Tạo báo cáo', PaymentInitiated: 'Khởi tạo thanh toán',
  };
  const eventTone: Record<string, 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
    OrderCreated: 'success', OrderDelivered: 'info', OrderUpdated: 'info', OrderCancelled: 'warning', OrderDeleted: 'danger', RefundCreated: 'warning', RefundApproved: 'success', RefundRejected: 'danger',
    ProductCreated: 'success', ProductUpdated: 'info', ProductImageUpdated: 'info', ProductDeleted: 'danger', InventoryChanged: 'warning', CustomerCreated: 'info', CustomerUpdated: 'info', CustomerDeleted: 'danger', CategoryCreated: 'info', CategoryUpdated: 'info', CategoryDeleted: 'danger', SupplierCreated: 'info', SupplierUpdated: 'info', SupplierDeleted: 'danger', PromotionCreated: 'info', PromotionUpdated: 'info', PromotionApplied: 'info', PromotionDeleted: 'danger',
    BillCreated: 'info', BillPaid: 'success', BillCancelled: 'warning', BillStatusChanged: 'info', BillUpdated: 'info', BillDeleted: 'danger', UserCreated: 'warning', UserUpdated: 'info', UserDeleted: 'danger', RoleCreated: 'info', RoleUpdated: 'info', RoleDeleted: 'danger', PermissionAssigned: 'success', PermissionRevoked: 'warning', PermissionCreated: 'info', PermissionUpdated: 'info', PermissionDeleted: 'danger', AgentCreated: 'info', AgentUpdated: 'info', AgentDeleted: 'danger', ReportGenerated: 'success', PaymentInitiated: 'info',
  };
  const subjectLink = (row: (typeof rows)[number]) => {
    if (row.subjectType === 'order' && row.subject) return <Link to="/orders-detail" state={{ orderId: Number(row.subject) }} className="text-leaf-dark underline decoration-leaf/40 hover:decoration-leaf">#{row.subject}</Link>;
    if (row.subjectType === 'product' && row.subject) return <Link to="/products" className="text-leaf-dark underline decoration-leaf/40 hover:decoration-leaf">Sản phẩm #{row.subject}</Link>;
    if (row.subjectType === 'customer' && row.subject) return <Link to="/customers" className="text-leaf-dark underline decoration-leaf/40 hover:decoration-leaf">Khách hàng #{row.subject}</Link>;
    return row.subject ? <span className="font-mono text-zinc-700">#{row.subject}</span> : <span className="text-zinc-400">—</span>;
  };
  return <><PageHeader eyebrow="Giám sát" title="Nhật ký hoạt động" description="Mỗi thay đổi dữ liệu quan trọng đều được ghi lại ở đây để truy xuất sau này." /><Card><div className="border-b border-zinc-100 p-4"><Toolbar search={search} setSearch={setSearch} placeholder="Tìm theo sự kiện, người thực hiện, đối tượng..." onRefresh={() => void auditQuery.refetch()}><select value={event} onChange={(e) => { setEvent(e.target.value); setPage(1); }} className="h-9 max-w-[220px] rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 shadow-sm outline-none focus:border-leaf"><option value="">Tất cả sự kiện</option>{(eventsQuery.data ?? []).map((key) => <option key={key} value={key}>{eventLabel[key] ?? key}</option>)}</select><select value={actor} onChange={(e) => { setActor(e.target.value); setPage(1); }} className="h-9 max-w-[200px] rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-600 shadow-sm outline-none focus:border-leaf"><option value="">Tất cả người dùng</option>{(actorsQuery.data ?? []).map((name) => <option key={name} value={name}>{name}</option>)}</select></Toolbar></div>
    {auditQuery.isLoading ? <TableSkeleton rows={8} /> : auditQuery.isError ? <ErrorCard onRetry={() => void auditQuery.refetch()} /> : rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[880px] text-left"><thead className="bg-zinc-50/80 text-[11px] uppercase tracking-wide text-zinc-400"><tr>{['Sự kiện', 'Người thực hiện', 'Đối tượng', 'Thao tác', 'Thời gian', ''].map((h) => <th key={h} className="px-5 py-3 font-bold">{h}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{rows.map((row) => <tr key={row.id} className="text-sm hover:bg-zinc-50/60"><td className="px-5 py-4"><Badge tone={eventTone[row.action] ?? 'neutral'}>{eventLabel[row.action] ?? row.action}</Badge></td><td className="px-5 py-4">{row.actor ? <div className="flex items-center gap-2"><Avatar name={row.actor} /><span className="font-medium text-zinc-700">{row.actor}</span></div> : <span className="text-zinc-400">—</span>}</td><td className="px-5 py-4">{subjectLink(row)}</td><td className="px-5 py-4 text-zinc-500">{row.note ?? '—'}</td><td className="px-5 py-4 text-xs text-zinc-400">{fmtDate(row.occurred)}</td><td className="px-5 py-4"><MoreHorizontal size={17} className="text-zinc-400" /></td></tr>)}</tbody></table></div> : <EmptyState title="Không có nhật ký" copy="Chưa có sự kiện nào được ghi lại." />}
    <div className="flex items-center justify-between border-t border-zinc-100 px-5 py-3 text-xs text-zinc-400"><span>Hiển thị {rows.length} / {totalCount} sự kiện · Trang {page}/{totalPages}</span><div className="flex items-center gap-1"><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">‹</button><button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded border border-zinc-200 px-2 py-1 text-zinc-500 disabled:opacity-40">›</button></div></div></Card></>;
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
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [actionError, setActionError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null);
  const emptyForm = { Username: '', Password: '', FullName: '', Role: '1', RoleName: '', Description: '', PermissionName: '', ActionKey: '' };
  const [form, setForm] = useState(emptyForm);
  const inputCls = 'h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20';
  const setField = (key: keyof typeof emptyForm, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormError(''); setFormOpen(true); };
  const openEdit = (row: Record<string, unknown>) => {
    setEditingId(Number(row.UserId ?? row.RoleId ?? row.PermissionId ?? 0));
    setForm(page === 'users'
      ? { ...emptyForm, Username: String(row.Username ?? ''), Password: '', FullName: String(row.FullName ?? ''), Role: String(row.Role ?? 1) }
      : page === 'roles'
        ? { ...emptyForm, RoleName: String(row.RoleName ?? ''), Description: String(row.Description ?? '') }
        : { ...emptyForm, PermissionName: String(row.PermissionName ?? ''), ActionKey: String(row.ActionKey ?? ''), Description: String(row.Description ?? '') });
    setFormError(''); setFormOpen(true);
  };
  const invalidateAdmin = () => {
    void queryClient.invalidateQueries({ queryKey: ['users'] });
    void queryClient.invalidateQueries({ queryKey: ['roles'] });
    void queryClient.invalidateQueries({ queryKey: ['permissions'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-role-permissions'] });
  };
  const saveItem = async () => {
    setFormError('');
    if (page === 'users') {
      if (!form.Username.trim()) { setFormError('Nhập tên đăng nhập.'); return; }
      if (!form.FullName.trim()) { setFormError('Nhập họ tên.'); return; }
      if (editingId == null && !form.Password) { setFormError('Nhập mật khẩu.'); return; }
      setSaving(true);
      try {
        const input = { Username: form.Username.trim(), Password: form.Password || undefined, FullName: form.FullName.trim(), Role: Number(form.Role) };
        if (editingId != null) await usersApi.update(editingId, input);
        else await usersApi.create({ ...input, Password: form.Password });
        setFormOpen(false); setEditingId(null); invalidateAdmin();
      } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Lưu tài khoản thất bại.'); } finally { setSaving(false); }
      return;
    }
    if (page === 'roles') {
      if (!form.RoleName.trim()) { setFormError('Nhập tên vai trò.'); return; }
      setSaving(true);
      try {
        const input = { RoleName: form.RoleName.trim(), Description: form.Description.trim() || undefined };
        if (editingId != null) await rolesApi.update(editingId, input); else await rolesApi.create(input);
        setFormOpen(false); setEditingId(null); invalidateAdmin();
      } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Lưu vai trò thất bại.'); } finally { setSaving(false); }
      return;
    }
    if (!form.PermissionName.trim()) { setFormError('Nhập tên quyền.'); return; }
    if (!form.ActionKey.trim()) { setFormError('Nhập action key.'); return; }
    setSaving(true);
    try {
      const input = { PermissionName: form.PermissionName.trim(), ActionKey: form.ActionKey.trim(), Description: form.Description.trim() || undefined };
      if (editingId != null) await permissionsApi.update(editingId, input); else await permissionsApi.create(input);
      setFormOpen(false); setEditingId(null); invalidateAdmin();
    } catch (cause) { setFormError(cause instanceof Error ? cause.message : 'Lưu quyền thất bại.'); } finally { setSaving(false); }
  };
  const removeItem = async () => {
    if (!deleteTarget) return;
    setSaving(true); setActionError('');
    try {
      if (page === 'users') await usersApi.remove(deleteTarget.id);
      else if (page === 'roles') await rolesApi.remove(deleteTarget.id);
      else await permissionsApi.remove(deleteTarget.id);
      setDeleteTarget(null); invalidateAdmin();
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Xóa thất bại.'); setDeleteTarget(null); } finally { setSaving(false); }
  };
  const mappingSet = new Set((mappingsQuery.data?.items ?? []).map((mapping) => `${mapping.RoleId}-${mapping.PermissionId}`));
  const isAdminRole = (name?: string | null) => (name ?? '').trim().toLowerCase() === 'admin';
  const visibleRoles = (rolesQuery.data?.items ?? []).filter((role) => !roleFilter || String(role.RoleId) === roleFilter);
  const matrixRoles = visibleRoles.filter((role) => !isAdminRole(role.RoleName));
  const togglePermission = async (roleId: number, permissionId: number, has: boolean) => {
    setToggling(true); setActionError('');
    try {
      if (has) await permissionsApi.removeMapping({ RoleId: roleId, PermissionId: permissionId });
      else await permissionsApi.assign({ RoleId: roleId, PermissionId: permissionId });
      void queryClient.invalidateQueries({ queryKey: ['admin-role-permissions'] });
    } catch (cause) { setActionError(cause instanceof Error ? cause.message : 'Cập nhật quyền thất bại.'); } finally { setToggling(false); }
  };
  const roleLabel = (role: number | null | undefined) => role === 1 ? 'Admin' : role === 2 ? 'Manager' : role === 3 ? 'Staff' : `Vai trò ${role ?? '?'}`;
  return <><PageHeader eyebrow="Quản trị" title={title} description={description} action={<Button icon={Plus} onClick={openCreate}>{page === 'users' ? 'Thêm nhân sự' : page === 'roles' ? 'Thêm vai trò' : 'Thêm quyền'}</Button>} /><Card>{page === 'permissions' ? <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 p-4"><label className="text-xs font-semibold text-zinc-500">Vai trò</label><select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-9 min-w-[200px] rounded-lg border border-zinc-200 bg-white px-2.5 text-sm text-zinc-700 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"><option value="">Tất cả vai trò</option>{(rolesQuery.data?.items ?? []).filter((role) => !isAdminRole(role.RoleName)).map((role) => <option key={role.RoleId} value={role.RoleId}>{role.RoleName}</option>)}</select></div> : null}{actionError && <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{actionError}</p>}
    {page === 'permissions' ? (
      mappingsQuery.isLoading || permissionsQuery.isLoading || rolesQuery.isLoading ? <TableSkeleton rows={6} /> : mappingsQuery.isError ? <ErrorCard onRetry={() => void mappingsQuery.refetch()} /> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-400"><tr><th className="px-5 py-3">Quyền hạn</th>{matrixRoles.map((role) => <th key={role.RoleId} className="px-5 py-3 text-center">{role.RoleName}</th>)}<th className="px-5 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-zinc-100">{(permissionsQuery.data?.items ?? []).map((permission) => <tr key={permission.PermissionId}><td className="px-5 py-4 font-semibold text-zinc-700">{permission.PermissionName}<span className="ml-2 font-mono text-[10px] text-zinc-400">{permission.ActionKey}</span></td>{matrixRoles.map((role) => { const has = mappingSet.has(`${role.RoleId}-${permission.PermissionId}`); return <td key={role.RoleId} className="px-5 py-4"><span className="flex justify-center"><button disabled={toggling} onClick={() => void togglePermission(role.RoleId, permission.PermissionId, has)} className={cx('flex h-5 w-5 items-center justify-center rounded border transition', has ? 'border-leaf bg-leaf text-white' : 'border-zinc-300 bg-white text-transparent hover:border-leaf-dark')}><Check size={13} /></button></span></td>; })}<td className="px-5 py-4"><span className="flex justify-end gap-1"><button onClick={() => openEdit(permission)} className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-leaf hover:bg-leaf-soft">Sửa</button><button onClick={() => setDeleteTarget({ id: permission.PermissionId, label: permission.PermissionName })} className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-red-600 hover:bg-red-50">Xóa</button></span></td></tr>)}</tbody></table></div>
    ) : page === 'users' ? (
      usersQuery.isLoading ? <TableSkeleton rows={5} /> : usersQuery.isError ? <ErrorCard onRetry={() => void usersQuery.refetch()} /> : <div className="divide-y divide-zinc-100">{(usersQuery.data?.items ?? []).map((user) => <div key={user.UserId} className="flex items-center gap-3 px-5 py-4"><Avatar name={user.FullName ?? user.Username} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-zinc-800">{user.FullName ?? user.Username}</p><p className="text-xs text-zinc-400">{user.Username} · {user.RoleNavigation?.RoleName ?? roleLabel(user.Role)}</p></div><Status value="Active" /><RowActions onEdit={() => openEdit(user)} onDelete={() => setDeleteTarget({ id: user.UserId, label: user.FullName ?? user.Username })} /></div>)}</div>
    ) : (
      rolesQuery.isLoading ? <TableSkeleton rows={4} /> : rolesQuery.isError ? <ErrorCard onRetry={() => void rolesQuery.refetch()} /> : <div className="divide-y divide-zinc-100">{(rolesQuery.data?.items ?? []).map((role) => <div key={role.RoleId} className="flex items-center gap-3 px-5 py-4"><Avatar name={role.RoleName} /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-zinc-800">{role.RoleName}</p><p className="text-xs text-zinc-400">{role.Description ?? '—'}</p></div><Status value="Active" /><RowActions onEdit={() => openEdit(role)} onDelete={() => setDeleteTarget({ id: role.RoleId, label: role.RoleName })} /></div>)}</div>
    )}
  </Card>
    <Drawer open={formOpen} onClose={() => { setFormOpen(false); setEditingId(null); }} title={editingId != null ? (page === 'users' ? 'Sửa tài khoản' : page === 'roles' ? 'Sửa vai trò' : 'Sửa quyền') : (page === 'users' ? 'Thêm nhân sự' : page === 'roles' ? 'Thêm vai trò' : 'Thêm quyền')} subtitle="Dữ liệu sẽ được lưu ngay vào hệ thống">
      <div className="space-y-4">
      {page === 'users' ? <>
        <Field label="Tên đăng nhập"><input value={form.Username} onChange={(e) => setField('Username', e.target.value)} className={inputCls} /></Field>
        <Field label={editingId != null ? 'Mật khẩu mới (để trống = giữ nguyên)' : 'Mật khẩu'}><input type="password" autoComplete="new-password" value={form.Password} onChange={(e) => setField('Password', e.target.value)} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3"><Field label="Họ tên"><input value={form.FullName} onChange={(e) => setField('FullName', e.target.value)} className={inputCls} /></Field><Field label="Vai trò"><select value={form.Role} onChange={(e) => setField('Role', e.target.value)} className={inputCls}>{(rolesQuery.data?.items ?? []).map((role) => <option key={role.RoleId} value={role.RoleId}>{role.RoleName}</option>)}</select></Field></div>
      </> : page === 'roles' ? <>
        <Field label="Tên vai trò"><input value={form.RoleName} onChange={(e) => setField('RoleName', e.target.value)} className={inputCls} /></Field>
        <Field label="Mô tả"><input value={form.Description} onChange={(e) => setField('Description', e.target.value)} placeholder="Quyền hạn của vai trò này" className={inputCls} /></Field>
      </> : <>
        <Field label="Tên quyền"><input value={form.PermissionName} onChange={(e) => setField('PermissionName', e.target.value)} className={inputCls} /></Field>
        <Field label="Action key"><input value={form.ActionKey} onChange={(e) => setField('ActionKey', e.target.value)} placeholder="orders.update" className={inputCls} /></Field>
        <Field label="Mô tả"><input value={form.Description} onChange={(e) => setField('Description', e.target.value)} className={inputCls} /></Field>
      </>}
      {formError && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{formError}</p>}
      </div>
      <div className="mt-8 flex justify-end gap-2"><Button variant="secondary" onClick={() => { setFormOpen(false); setEditingId(null); }}>Hủy</Button><Button disabled={saving} onClick={() => void saveItem()}>{saving ? 'Đang lưu…' : editingId != null ? 'Lưu thay đổi' : page === 'users' ? 'Tạo nhân sự' : page === 'roles' ? 'Tạo vai trò' : 'Tạo quyền'}</Button></div>
    </Drawer>
    <ConfirmPrompt open={deleteTarget != null} onClose={() => setDeleteTarget(null)} onConfirm={() => void removeItem()} title={`Xóa “${deleteTarget?.label ?? ''}”?`} description="Bản ghi sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác từ trang quản trị." confirmLabel="Xóa" /></>;
}
export const pages = { DashboardPage, OrdersPage, ProductsPage, InventoryPage, PosPage, CustomersPage, ListPage, AiPage, AdminPage, AuditLogPage };
export function PlaceholderPage({ title }: { title: string }) { return <PageHeader title={title} description="Không gian này đã sẵn sàng cho thao tác kết nối tiếp theo." action={<Button icon={Plus}>Tạo</Button>} />; }
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
    case 'audit-log': return <AuditLogPage />;
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
    default: return <PlaceholderPage title="Không tìm thấy trang" />;
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
    if (!username || !password) { setError('Nhập tên đăng nhập và mật khẩu.'); return; }
    if (!auth) { navigate('/dashboard'); return; }
    setBusy(true);
    try { await auth.login(username, password); navigate('/dashboard'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Đăng nhập không thành công.'); } finally { setBusy(false); }
  }
  return <div className="flex min-h-screen bg-leaf"><div className="hidden w-[46%] flex-col justify-between overflow-hidden bg-leaf-dark p-10 text-white lg:flex"><div><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"><Store size={20} /></span><span className="font-display text-lg font-bold">GREEN BASKET</span></div><div className="mt-[18vh] max-w-md"><p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-leaf-soft">Vận hành cửa hàng</p><h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-[-.04em]">Vận hành cửa hàng rõ ràng và bình tĩnh.</h1><p className="mt-5 text-base leading-7 text-leaf-soft">Không gian quản lý đơn hàng, tồn kho, khách hàng và các quyết định quan trọng.</p></div></div><p className="text-xs text-leaf-soft">© 2026 Green Basket · Không gian quản trị</p></div><main className="flex flex-1 items-center justify-center bg-canvas p-6 sm:p-10"><div className="w-full max-w-[380px]"><div className="mb-10 lg:hidden"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf text-white"><Store size={20} /></span><span className="font-display text-lg font-bold">GREEN BASKET</span></div></div><div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[.16em] text-leaf">Xin chào trở lại</p><h1 className="font-display text-3xl font-extrabold tracking-[-.03em] text-zinc-950">Đăng nhập quản trị</h1><p className="mt-2 text-sm text-zinc-500">Sử dụng tài khoản cửa hàng để tiếp tục.</p></div><form onSubmit={submit} className="space-y-4"><Field label="Tên đăng nhập"><input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="you@store.vn" className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/20" /></Field><Field label="Mật khẩu"><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Nhập mật khẩu" className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-3 focus:ring-leaf/20" /></Field>{error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{error}</p>}<Button className="mt-2 h-11 w-full" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}<ChevronRight size={16} /></Button></form><div className="mt-8 rounded-xl border border-leaf/30 bg-leaf-soft p-4 text-xs leading-5 text-leaf-dark"><b>Xem trước cục bộ</b><br />Bảng điều khiển vẫn xem được khi không kết nối API. Đăng nhập sẽ kết nối với `/api/auth/login` khi backend đang chạy.</div></div></main></div>;
}
