import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, House, ListFilter, LogIn, Menu, Package, Search, ShoppingBag, Sparkles, UserRound, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { apiClient } from "../api";
import { useAuth, useCart, useToast } from "../app/providers";
import { categoryName } from "../app/types";
import { AiButton, SearchBar, Toast } from "../components/store-ui";
import { AiAssistant } from "../components/ai/AiAssistant";
import { StoreFooter } from "../components/StoreFooter";
import { translator } from "../lib/translator";

const t = translator;

export function StoreLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customer, isAuthenticated, logout } = useAuth();
  const { items } = useCart();
  const { toasts, dismissToast } = useToast();
  const [search, setSearch] = useState(new URLSearchParams(location.search).get("q") ?? "");
  const [aiOpen, setAiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: () => apiClient.products.categories(), staleTime: 300_000 });
  useEffect(() => { setSearch(new URLSearchParams(location.search).get("q") ?? ""); }, [location.search]);
  const submitSearch = () => { const value = search.trim(); navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/products"); setMenuOpen(false); };
  const navClass = ({ isActive }: { isActive: boolean }) => `whitespace-nowrap text-sm font-semibold transition ${isActive ? "text-leaf" : "text-muted hover:text-ink"}`;
  return (
    <div className="store-shell">
      <header className="sticky top-0 z-40 border-b border-line/80 bg-white/95 backdrop-blur">
        <div className="container-store flex h-[4.4rem] items-center gap-3">
          <button aria-label={t("common.openMenu")} onClick={() => setMenuOpen((value) => !value)} className="rounded-xl p-2 text-muted hover:bg-canvas md:hidden">
            <Menu size={21} />
          </button>
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-leaf text-white shadow-sm">
              <ShoppingBag size={20} strokeWidth={2.5} />
            </span>
            <span className="display hidden text-lg font-extrabold tracking-tight text-ink sm:block">
              Green<span className="text-leaf">Basket</span>
            </span>
          </Link>
          <div className="hidden max-w-xl flex-1 md:block">
            <SearchBar value={search} onChange={setSearch} onSubmit={submitSearch} />
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button onClick={() => setAiOpen(true)} className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink hover:bg-leaf-soft md:flex">
              <Sparkles size={17} className="text-leaf" /> {t("nav.askAi")}
            </button>
            {isAuthenticated ? (
              <div className="group relative">
                <button className="flex items-center gap-2 rounded-xl p-2 text-left hover:bg-canvas">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f5ec] text-sm font-extrabold text-leaf-dark">
                    {(customer?.Name ?? "A").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden max-w-24 truncate text-sm font-bold text-ink lg:block">{customer?.Name ?? "Account"}</span>
                </button>
                <div className="invisible absolute right-0 top-12 w-48 translate-y-1 rounded-2xl border border-line bg-white p-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <Link to="/account/profile" className="block rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:bg-canvas hover:text-ink">
                    {" "}
                    {t("nav.myAccount")}
                  </Link>
                  <Link to="/account/orders" className="block rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:bg-canvas hover:text-ink">
                    {" "}
                    {t("nav.myOrders")}
                  </Link>
                  <button onClick={logout} className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-red-50">
                    {" "}
                    {t("nav.signOut")}
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-ink hover:bg-canvas sm:flex">
                <LogIn size={17} /> {t("nav.signIn")}
              </Link>
            )}
            <Link to="/cart" aria-label={t("nav.cart")} className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-leaf-soft">
              <ShoppingBag size={20} />
              {items.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-leaf px-1 text-[10px] font-extrabold text-white">
                  {items.reduce((sum, item) => sum + item.Quantity, 0)}
                </span>
              )}
            </Link>
          </div>
        </div>
        <div className="container-store pb-3 md:hidden">
          <SearchBar value={search} onChange={setSearch} onSubmit={submitSearch} />
        </div>
        <div className="hidden border-t border-line/70 md:block">
          <div className="container-store flex h-11 items-center justify-center gap-6 overflow-x-auto">
            <NavLink to="/products" className={navClass}>
              {" "}
              {t("nav.allProducts")}
            </NavLink>
            {categories.slice(0, 7).map((category) => (
              <NavLink key={category.CategoryId} to={`/category/${category.CategoryId}`} className={navClass}>
                {categoryName(category)}
              </NavLink>
            ))}
          </div>
        </div>
        {menuOpen && (
          <div className="absolute inset-x-0 top-[4.4rem] border-b border-line bg-white p-4 shadow-xl md:hidden">
            <div className="flex items-center justify-between">
              <span className="display text-lg font-extrabold"> {t("nav.menuBrowse")}</span>
              <button onClick={() => setMenuOpen(false)} aria-label={t("common.closeMenu")}>
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 grid gap-1">
              <Link onClick={() => setMenuOpen(false)} to="/" className="rounded-xl px-3 py-3 font-semibold hover:bg-canvas">
                {" "}
                {t("nav.home")}
              </Link>
              <Link onClick={() => setMenuOpen(false)} to="/products" className="rounded-xl px-3 py-3 font-semibold hover:bg-canvas">
                {" "}
                {t("nav.allProducts")}
              </Link>
              {categories.map((category) => (
                <Link
                  onClick={() => setMenuOpen(false)}
                  key={category.CategoryId}
                  to={`/category/${category.CategoryId}`}
                  className="rounded-xl px-3 py-3 text-sm font-semibold text-muted hover:bg-canvas"
                >
                  {categoryName(category)}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
      <main className="container-store pb-24 pt-6 md:pb-12 md:pt-8">
        <Outlet />
      </main>
      <StoreFooter />
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          <MobileNav to="/" label={t("nav.home")} icon={<House size={19} />} />
          <MobileNav to="/products" label={t("nav.browse")} icon={<ListFilter size={19} />} />
          <button onClick={() => setAiOpen(true)} className="flex flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-bold text-leaf">
            <Sparkles size={19} />
            <span>{t("nav.askAi")}</span>
          </button>
          <MobileNav to="/account/orders" label={t("nav.orders")} icon={<Package size={19} />} />
          <MobileNav to="/cart" label={t("nav.cart")} icon={<ShoppingBag size={19} />} />
        </div>
      </nav>
      <AiButton onClick={() => setAiOpen(true)} />
      <AiAssistant open={aiOpen} onClose={() => setAiOpen(false)} />      <div className="fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col items-end gap-2 md:right-6 md:top-6 md:w-auto">{toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} kind={toast.kind} onClose={() => dismissToast(toast.id)} />
      ))}</div>
    </div>
  );
}

function MobileNav({ to, label, icon }: { to: string; label: string; icon: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-bold transition ${isActive ? "text-leaf" : "text-muted"}`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f8f2] px-4 py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
