import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  Bot,
  Boxes,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileBarChart,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelRight,
  ReceiptText,
  RotateCcw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Store,
  Tags,
  Truck,
  UserCog,
  UsersRound,
  Wrench,
  X,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Drawer, IconButton, ShortcutHint } from '../components/primitives';
import type { ReactNode } from 'react';

export type PermissionValue = string[] | Set<string>;

export interface AppShellProps {
  /** Permission list controls menu visibility. Omit while auth is loading to show the complete navigation. */
  permissions?: PermissionValue;
  storeName?: string;
  storeSubtitle?: string;
  user?: { name?: string; email?: string; role?: string };
  onSignOut?: () => void;
}

type NavItem = { label: string; to: string; icon: typeof LayoutDashboard; permissions?: string[] };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  { label: 'Tổng quan', items: [{ label: 'Bảng điều khiển', to: '/dashboard', icon: LayoutDashboard, permissions: ['dashboard_view', 'dashboard'] }] },
  { label: 'Bán hàng', items: [
    { label: 'Đơn hàng', to: '/orders', icon: Truck, permissions: ['order_view', 'order_manage'] },
    { label: 'Điểm bán', to: '/pos', icon: Store, permissions: ['order_manage', 'pos_view'] },
    { label: 'Khách hàng', to: '/customers', icon: UsersRound, permissions: ['customer_view', 'customer_manage'] },
    { label: 'Khuyến mãi', to: '/promotions', icon: Tags, permissions: ['promotion_view', 'promotion_manage'] },
  ] },
  { label: 'Danh mục', items: [
    { label: 'Sản phẩm', to: '/products', icon: Package, permissions: ['product_view', 'product_manage'] },
    { label: 'Danh mục', to: '/categories', icon: Boxes, permissions: ['category_view', 'category_manage', 'product_manage'] },
    { label: 'Nhà cung cấp', to: '/suppliers', icon: Truck, permissions: ['supplier_view', 'supplier_manage', 'product_manage'] },
    { label: 'Tồn kho', to: '/inventory', icon: Boxes, permissions: ['inventory_view', 'inventory_manage'] },
  ] },
  { label: 'Tài chính', items: [
    { label: 'Hóa đơn', to: '/bills', icon: ReceiptText, permissions: ['bill_view', 'bill_manage'] },
    { label: 'Hoàn tiền', to: '/refunds', icon: RotateCcw, permissions: ['refund_view', 'refund_manage'] },
  ] },
  { label: 'Vận hành AI', items: [
    { label: 'Trợ lý AI', to: '/ai/chat', icon: Sparkles, permissions: ['ai_view', 'agent_view'] },
    { label: 'Giám sát Agents', to: '/ai/agents', icon: Bot, permissions: ['agent_view', 'agent_manage'] },
    { label: 'Chạy & Hoạt động', to: '/ai/runs', icon: Activity, permissions: ['agent_view'] },
    { label: 'Báo cáo & Phân tích', to: '/ai/reports', icon: FileBarChart, permissions: ['report_view', 'analytics_view', 'agent_view'] },
    { label: 'Công cụ', to: '/ai/tools', icon: Wrench, permissions: ['agent_tool_manage', 'agent_manage'] },
  ] },
  { label: 'Quản trị', items: [
    { label: 'Nhân sự', to: '/admin/users', icon: UserCog, permissions: ['user_view', 'user_manage'] },
    { label: 'Vai trò', to: '/admin/roles', icon: ShieldCheck, permissions: ['role_view', 'role_manage'] },
    { label: 'Quyền', to: '/admin/permissions', icon: Settings2, permissions: ['permission_view', 'role_manage'] },
    { label: 'Nhật ký hoạt động', to: '/audit-log', icon: FileText },
  ] },
];

function canSee(item: NavItem, permissions?: PermissionValue) {
  if (!permissions) return true;
  const values = permissions instanceof Set ? permissions : new Set(permissions);
  if (values.has('*') || values.has('admin')) return true;
  return !item.permissions?.length || item.permissions.some((permission) => values.has(permission));
}

function initials(name?: string) {
  return (name ?? 'Store Admin').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'SA';
}

export function AppShell({ permissions, storeName = 'NOVA MART', storeSubtitle = 'Vận hành cửa hàng', user = { name: 'Quản trị viên', role: 'Quản trị' }, onSignOut }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const visibleGroups = useMemo(() => navGroups.map((group) => ({ ...group, items: group.items.filter((item) => canSee(item, permissions)) })).filter((group) => group.items.length > 0), [permissions]);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); }
      if (event.key === 'Escape') { setSearchOpen(false); setProfileOpen(false); }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  return <div className="min-h-screen bg-canvas text-ink">
    <div className={`fixed inset-0 z-30 bg-zinc-950/25 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setSidebarOpen(false)} aria-hidden="true" />
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-zinc-200/90 bg-white transition-[width,transform] duration-200 lg:translate-x-0 ${collapsed ? 'w-[76px]' : 'w-[252px]'} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
      <div className={`flex h-[72px] items-center border-b border-zinc-100 px-4 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white shadow-sm"><Store size={18} strokeWidth={2.4} /></span>
        {!collapsed ? <div className="min-w-0"><p className="truncate font-display text-[15px] font-extrabold tracking-tight text-zinc-950">{storeName}</p><p className="truncate text-[11px] text-zinc-400">{storeSubtitle}</p></div> : null}
        <IconButton label="Đóng menu" onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden"><X size={18} /></IconButton>
      </div>
      <nav className={`min-h-0 flex-1 overflow-y-auto px-3 py-4 ${collapsed ? 'px-2' : ''}`} aria-label="Điều hướng chính">
        {visibleGroups.map((group) => <div key={group.label} className="mb-5 last:mb-0"><p className={`mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 ${collapsed ? 'sr-only' : ''}`}>{group.label}</p><div className="space-y-0.5">{group.items.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/dashboard'} title={collapsed ? item.label : undefined} className={({ isActive }) => `group flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition ${collapsed ? 'justify-center px-0' : ''} ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950'}`}><item.icon size={18} strokeWidth={1.9} className="shrink-0" /><span className={collapsed ? 'sr-only' : ''}>{item.label}</span>{!collapsed && item.label === 'Orders' ? <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">7</span> : null}</NavLink>)}</div></div>)}
      </nav>
      <div className={`border-t border-zinc-100 p-3 ${collapsed ? 'flex justify-center' : ''}`}><button type="button" onClick={() => setCollapsed((value) => !value)} className="hidden h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700 lg:flex">{collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Thu gọn menu</span></>}</button></div>
    </aside>

    <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-[252px]'}`}>
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-3 border-b border-zinc-200/90 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2"><IconButton label="Mở menu" onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu size={20} /></IconButton><button type="button" onClick={() => setSearchOpen(true)} className="hidden h-10 min-w-0 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 text-sm text-zinc-400 transition hover:border-zinc-300 hover:bg-white sm:flex sm:w-[280px] lg:w-[360px]"><Search size={16} /><span className="flex-1 text-left">Tìm kiếm mọi thứ...</span><ShortcutHint>⌘ K</ShortcutHint></button></div>
        <div className="flex items-center gap-1 sm:gap-2"><button type="button" onClick={() => setAiOpen(true)} className="group inline-flex h-9 items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 text-xs font-bold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-100 sm:px-3"><Sparkles size={15} className="transition group-hover:rotate-12" /><span className="hidden sm:inline">Hỏi AI</span></button><IconButton label="Thông báo" className="relative"><Bell size={18} /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-red-500 ring-2 ring-white" /></IconButton><div className="relative ml-1"><button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-lg p-1.5 pr-2 transition hover:bg-zinc-100"><span className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white">{initials(user.name)}</span><span className="hidden max-w-[120px] text-left sm:block"><span className="block truncate text-xs font-bold text-zinc-800">{user.name ?? 'Quản trị viên'}</span><span className="block truncate text-[10px] text-zinc-400">{user.role ?? 'Quản trị'}</span></span></button>{profileOpen ? <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl"><div className="border-b border-zinc-100 px-3 py-2.5"><p className="truncate text-xs font-bold text-zinc-800">{user.name ?? 'Quản trị viên'}</p><p className="truncate text-[11px] text-zinc-400">{user.email ?? 'Tài khoản quản trị'}</p></div><button type="button" onClick={() => navigate('/admin/users')} className="mt-1 flex h-9 w-full items-center gap-2 rounded-lg px-3 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"><CircleUserRound size={15} /> Hồ sơ & nhân sự</button><button type="button" onClick={onSignOut} className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-xs font-semibold text-red-600 hover:bg-red-50"><LogOut size={15} /> Đăng xuất</button></div> : null}</div></div>
      </header>
      <main className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8"><Outlet /></main>
    </div>

    <Drawer open={aiOpen} onClose={() => setAiOpen(false)} title="Trợ lý cửa hàng" description="Hỏi về doanh thu, đơn hàng, sản phẩm hoặc tồn kho." width="max-w-[430px]" footer={<AiComposer />}>
      <div className="space-y-5"><div className="flex gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700"><Sparkles size={16} /></span><div className="rounded-xl rounded-tl-none bg-zinc-50 px-3.5 py-3 text-sm leading-6 text-zinc-700">Chào bạn! Mình có thể giải thích những gì đang diễn ra trong cửa hàng. Hãy hỏi về sắp hết hàng, doanh thu hôm nay hoặc một đơn hàng cụ thể.</div></div><div className="space-y-2"><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-zinc-400">Câu hỏi gợi ý</p>{['Sản phẩm nào sắp hết hàng?', 'Doanh thu tuần này như thế nào?', 'Cho xem các đơn đang chờ'].map((question) => <button key={question} type="button" className="flex w-full items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2.5 text-left text-xs font-semibold text-zinc-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"><Search size={14} className="text-zinc-400" />{question}</button>)}</div><p className="text-center text-[11px] text-zinc-400"><PanelRight size={13} className="mr-1 inline" />Câu trả lời dựa trên dữ liệu cửa hàng và các công cụ chỉ đọc.</p></div>
    </Drawer>

    {searchOpen ? <div className="fixed inset-0 z-[60] flex items-start justify-center bg-zinc-950/25 px-4 pt-[14vh] backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Search"><button type="button" className="absolute inset-0" onClick={() => setSearchOpen(false)} aria-label="Đóng tìm kiếm" /><div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"><div className="flex items-center gap-3 border-b border-zinc-100 px-4"><Search size={18} className="text-zinc-400" /><input autoFocus placeholder="Tìm đơn hàng, sản phẩm, khách hàng..." className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400" onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); if (event.key === 'Enter') { setSearchOpen(false); navigate('/orders'); } }} /><ShortcutHint>ESC</ShortcutHint></div><div className="p-3"><p className="px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Điều hướng nhanh</p>{quickNavigation.map(({ label, to, icon: Icon }) => <button type="button" key={to} onClick={() => { setSearchOpen(false); navigate(to); }} className="flex h-10 w-full items-center gap-3 rounded-lg px-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950"><Icon size={16} />{label}<ChevronRight size={14} className="ml-auto text-zinc-300" /></button>)}</div></div></div> : null}
  </div>;
}

function AiComposer() {
  return <form className="flex items-center gap-2" onSubmit={(event) => event.preventDefault()}><input className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100" placeholder="Hỏi về cửa hàng của bạn..." /><button type="submit" aria-label="Gửi tin nhắn" className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-950 text-white transition hover:bg-zinc-800"><Send size={16} /></button></form>;
}

const quickNavigation: { label: string; to: string; icon: typeof Truck }[] = [
  { label: 'Đơn hàng', to: '/orders', icon: Truck },
  { label: 'Sản phẩm', to: '/products', icon: Package },
  { label: 'Khách hàng', to: '/customers', icon: UsersRound },
  { label: 'Tồn kho', to: '/inventory', icon: Boxes },
];

export { navGroups };
