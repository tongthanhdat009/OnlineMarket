import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { translator } from "../lib/translator";

const t = translator;

export function StoreFooter() {
  return (
    <footer className="border-t border-line bg-white pb-24 md:pb-10">
      <div className="container-store grid gap-8 py-10 sm:grid-cols-2 md:pt-12 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-leaf text-white shadow-sm">
              <ShoppingBag size={20} strokeWidth={2.5} />
            </span>
            <span className="display text-lg font-extrabold tracking-tight text-ink">
              Green<span className="text-leaf">Basket</span>
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
            {t("footer.tagline")}
          </p>
        </div>
        <nav aria-label={t("footer.shop")}>
          <p className="text-sm font-extrabold text-ink">{t("footer.shop")}</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-muted">
            <li>
              <Link to="/products" className="hover:text-leaf">
                {t("nav.allProducts")}
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-leaf">
                {t("nav.cart")}
              </Link>
            </li>
            <li>
              <Link to="/account/orders" className="hover:text-leaf">
                {t("nav.myOrders")}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={t("footer.account")}>
          <p className="text-sm font-extrabold text-ink">{t("footer.account")}</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-muted">
            <li>
              <Link to="/account/profile" className="hover:text-leaf">
                {t("nav.myAccount")}
              </Link>
            </li>
            <li>
              <Link to="/account/bills" className="hover:text-leaf">
                {t("account.bills")}
              </Link>
            </li>
            <li>
              <Link to="/account/refunds" className="hover:text-leaf">
                {t("account.refunds")}
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-leaf">
                {t("nav.signIn")}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={t("footer.help")}>
          <p className="text-sm font-extrabold text-ink">{t("footer.help")}</p>
          <ul className="mt-3 space-y-2 text-sm font-semibold text-muted">
            <li>
              <Link to="/checkout" className="hover:text-leaf">
                {t("footer.checkout")}
              </Link>
            </li>
            <li>
              <Link to="/payment-result" className="hover:text-leaf">
                {t("footer.paymentResult")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-line/70">
        <div className="container-store flex flex-col gap-1 py-4 text-xs font-semibold text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} GreenBasket. {t("footer.rights")}
          </span>
          <span>{t("footer.picked")}</span>
        </div>
      </div>
    </footer>
  );
}
