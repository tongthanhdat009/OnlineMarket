import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, ShoppingBag } from "lucide-react";
import { apiClient } from "../api";
import { useAuth, useToast } from "../app/providers";
import { errorMessage } from "../lib";
import { Button } from "../components/store-ui";
import { AuthLayout } from "../layouts/StoreLayout";
import { translator } from "../lib/translator";

const t = translator;

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = true,
  disabled = false,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  const password = type === "password";
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </span>
      <span className="relative block">
        <input
          required={required}
          disabled={disabled}
          type={password && show ? "text" : type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-12 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-[#a1afa4] focus:border-leaf focus:ring-4 focus:ring-[#e3f2e7] disabled:bg-canvas disabled:text-muted"
        />
        {password && (
          <button
            type="button"
            aria-label={show ? t("auth.hidePassword") : t("auth.showPassword")}
            onClick={() => setShow((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          >
            {show ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
    </label>
  );
}

function BrandMark() {
  return (
    <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-leaf text-white">
        <ShoppingBag size={22} />
      </span>
      <span className="display text-xl font-extrabold">
        Green<span className="text-leaf">Basket</span>
      </span>
    </Link>
  );
}

export function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const params = new URLSearchParams(location.search);
  const requestedReturnUrl = params.get("returnUrl") || "/";
  const returnUrl =
    requestedReturnUrl.startsWith("/") && !requestedReturnUrl.startsWith("//")
      ? requestedReturnUrl
      : "/";
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await login({ Email: email.trim(), Password: password });
      showToast(t("auth.welcomeToast"));
      navigate(returnUrl);
    } catch (error) {
      showToast(errorMessage(error, t("auth.signInFailed")), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthLayout>
      <BrandMark />
      <div className="rounded-3xl border border-line bg-white p-6 shadow-[0_20px_60px_rgba(32,62,42,.08)] sm:p-8">
        <h1 className="display text-2xl font-extrabold text-ink">
          {" "}
          {t("auth.welcomeBack")}
        </h1>
        <p className="mt-2 text-sm text-muted"> {t("auth.welcomeBody")}</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={t("auth.emailPlaceholder")}
          />
          <Field
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={t("auth.passwordPlaceholder")}
          />
          <Button disabled={busy} className="mt-2 h-12 w-full">
            {busy ? t("auth.signingIn") : t("nav.signIn")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {t("auth.haveNoAccount")}{" "}
          <Link
            to={`/register${returnUrl !== "/" ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
            className="font-bold text-leaf hover:text-leaf-dark"
          >
            {" "}
            {t("auth.createOne")}
          </Link>
        </p>
      </div>
      <Link
        to="/"
        className="mt-6 flex items-center justify-center gap-1 text-sm font-semibold text-muted hover:text-leaf"
      >
        <ArrowLeft size={15} /> {t("cart.continueShopping")}
      </Link>
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    Name: "",
    Email: "",
    Phone: "",
    Address: "",
    Password: "",
    Confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const set = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.Password.length < 6) {
      showToast(t("auth.shortPassword"), "error");
      return;
    }
    if (form.Password !== form.Confirm) {
      showToast(t("auth.mismatch"), "error");
      return;
    }
    setBusy(true);
    try {
      await register({
        Name: form.Name.trim(),
        Email: form.Email.trim(),
        Password: form.Password,
        Phone: form.Phone.trim() || null,
        Address: form.Address.trim() || null,
      });
      showToast(t("auth.accountCreated"));
      navigate("/login");
    } catch (error) {
      showToast(errorMessage(error, t("auth.createFailed")), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthLayout>
      <BrandMark />
      <div className="rounded-3xl border border-line bg-white p-6 shadow-[0_20px_60px_rgba(32,62,42,.08)] sm:p-8">
        <h1 className="display text-2xl font-extrabold text-ink">
          {" "}
          {t("auth.createAccount")}
        </h1>
        <p className="mt-2 text-sm text-muted"> {t("auth.createBody")}</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <Field
            label={t("auth.fullName")}
            value={form.Name}
            onChange={set("Name")}
            placeholder={t("auth.fullName")}
          />
          <Field
            label={t("auth.email")}
            type="email"
            value={form.Email}
            onChange={set("Email")}
            placeholder={t("auth.emailPlaceholder")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t("auth.phone")}
              value={form.Phone}
              onChange={set("Phone")}
              placeholder="090..."
              required={false}
            />
            <Field
              label={t("auth.address")}
              value={form.Address}
              onChange={set("Address")}
              placeholder={t("auth.address")}
              required={false}
            />
          </div>
          <Field
            label={t("auth.password")}
            type="password"
            value={form.Password}
            onChange={set("Password")}
            placeholder={t("auth.passwordPlaceholder")}
          />
          <Field
            label={t("auth.confirm")}
            type="password"
            value={form.Confirm}
            onChange={set("Confirm")}
            placeholder={t("auth.repeatPassword")}
          />
          <Button disabled={busy} className="mt-2 h-12 w-full">
            {busy ? t("auth.creating") : t("auth.createAccountBtn")}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted">
          {" "}
          {t("auth.haveAccount")}{" "}
          <Link
            to="/login"
            className="font-bold text-leaf hover:text-leaf-dark"
          >
            {" "}
            {t("nav.signIn")}
          </Link>
        </p>
      </div>
      <Link
        to="/"
        className="mt-6 flex items-center justify-center gap-1 text-sm font-semibold text-muted hover:text-leaf"
      >
        <ArrowLeft size={15} /> {t("cart.continueShopping")}
      </Link>
    </AuthLayout>
  );
}

export function AccountProfilePage() {
  const { customer, refresh } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    Name: customer?.Name ?? "",
    Phone: customer?.Phone ?? "",
    Address: customer?.Address ?? "",
  });
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await apiClient.auth.updateProfile({
        Name: form.Name.trim(),
        Phone: form.Phone.trim(),
        Address: form.Address.trim(),
      });
      await refresh();
      showToast(t("auth.profileUpdated"));
    } catch (error) {
      showToast(errorMessage(error, t("auth.profileFailed")), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="animate-float-in">
      <form
        onSubmit={submit}
        className="space-y-5 rounded-3xl border border-line bg-white p-6 sm:p-8"
      >
        <Field
          label={t("auth.fullName")}
          value={form.Name}
          onChange={(value) =>
            setForm((current) => ({ ...current, Name: value }))
          }
        />
        <Field
          label={t("auth.email")}
          value={customer?.Email ?? ""}
          onChange={() => undefined}
          required={false}
          disabled
        />
        <Field
          label={t("auth.phone")}
          value={form.Phone}
          onChange={(value) =>
            setForm((current) => ({ ...current, Phone: value }))
          }
          required={false}
        />
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-ink">
            {" "}
            {t("auth.address")}
          </span>
          <textarea
            value={form.Address}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                Address: event.target.value,
              }))
            }
            rows={3}
            className="w-full rounded-xl border border-line px-3.5 py-3 text-sm outline-none focus:border-leaf focus:ring-4 focus:ring-[#e3f2e7]"
          />
        </label>
        <Button disabled={busy}>
          {busy ? t("auth.saving") : t("auth.saveChanges")}
        </Button>
      </form>
    </div>
  );
}

export function SecurityPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ old: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.next.length < 6 || form.next !== form.confirm) {
      showToast(
        form.next.length < 6 ? t("auth.newShort") : t("auth.mismatch"),
        "error",
      );
      return;
    }
    setBusy(true);
    try {
      await apiClient.auth.changePassword({
        OldPassword: form.old,
        NewPassword: form.next,
      });
      showToast(t("auth.changed"));
      setForm({ old: "", next: "", confirm: "" });
    } catch (error) {
      showToast(errorMessage(error, t("auth.changeFailed")), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="animate-float-in">
      <form
        onSubmit={submit}
        className="space-y-5 rounded-3xl border border-line bg-white p-6 sm:p-8"
      >
        <Field
          label={t("auth.currentPassword")}
          type="password"
          value={form.old}
          onChange={(value) =>
            setForm((current) => ({ ...current, old: value }))
          }
        />
        <Field
          label={t("auth.newPassword")}
          type="password"
          value={form.next}
          onChange={(value) =>
            setForm((current) => ({ ...current, next: value }))
          }
        />
        <Field
          label={t("auth.confirmNew")}
          type="password"
          value={form.confirm}
          onChange={(value) =>
            setForm((current) => ({ ...current, confirm: value }))
          }
        />
        <Button disabled={busy}>
          {busy ? t("auth.updating") : t("auth.changePassword")}
        </Button>
      </form>
    </div>
  );
}
