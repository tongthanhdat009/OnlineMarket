import { NavLink, Outlet } from "react-router-dom";
import { FileText, LockKeyhole, Receipt, UserRound } from "lucide-react";
import { useAuth } from "../app/providers";
import { translator } from "../lib/translator";

const t = translator;

export function AccountLayout() {
  const { customer } = useAuth();
  return (
    <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="h-fit rounded-3xl border border-line bg-white p-3 lg:sticky lg:top-32">
        <div className="mb-3 flex items-center gap-3 border-b border-line px-3 pb-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf-soft font-extrabold text-leaf">
            {(customer?.Name ?? "A").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-ink">{customer?.Name ?? t("account.myAccount")}</p>
            <p className="truncate text-xs text-muted">{customer?.Email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1 lg:grid-cols-1">
          {[
            ["/account/profile", t("account.profile"), <UserRound size={16} />],
            ["/account/orders", t("account.orders"), <Receipt size={16} />],
            ["/account/bills", t("account.bills"), <FileText size={16} />],
            ["/account/refunds", t("account.refunds"), <FileText size={16} />],
            ["/account/security", t("account.security"), <LockKeyhole size={16} />],
          ].map(([to, label, icon]) => (
            <NavLink
              key={to as string}
              to={to as string}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-leaf-soft text-leaf-dark" : "text-muted hover:bg-canvas hover:text-ink"}`
              }
            >
              {icon}
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
