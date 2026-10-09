import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CircleUserRound, KeyRound } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { usersApi } from "../api";
import { Field, PageHeader, PrimaryButton } from "../components/primitives";

function roleLabel(role?: number | string | null) {
  if (role === 1 || role === "1") return "Quản trị viên";
  if (role === 2 || role === "2") return "Quản lý";
  if (role === 3 || role === "3") return "Nhân viên";
  return "Quản trị";
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(user?.FullName ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  const userId = Number(user?.UserId);
  const saveProfile = async () => {
    if (!Number.isInteger(userId) || userId <= 0) { setError("Không xác định được tài khoản."); return; }
    if (!fullName.trim()) { setError("Nhập họ tên."); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      await usersApi.update(userId, { FullName: fullName.trim() });
      await refreshUser();
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setMessage("Đã lưu hồ sơ.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lưu hồ sơ thất bại.");
    } finally { setSaving(false); }
  };

  const changePassword = async () => {
    setPwError(""); setPwMessage("");
    if (!passwords.current || !passwords.next) { setPwError("Nhập mật khẩu hiện tại và mật khẩu mới."); return; }
    if (passwords.next.length < 6) { setPwError("Mật khẩu mới tối thiểu 6 ký tự."); return; }
    if (passwords.next !== passwords.confirm) { setPwError("Xác nhận mật khẩu chưa khớp."); return; }
    setPwBusy(true);
    try {
      await usersApi.update(userId, { Password: passwords.next } as never);
      setPasswords({ current: "", next: "", confirm: "" });
      setPwMessage("Đã đổi mật khẩu.");
    } catch (cause) {
      setPwError(cause instanceof Error ? cause.message : "Đổi mật khẩu thất bại.");
    } finally { setPwBusy(false); }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow="Tài khoản" title="Hồ sơ cá nhân" description="Xem và cập nhật thông tin tài khoản đang đăng nhập." />
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-leaf text-white"><CircleUserRound size={22} /></span>
          <div>
            <p className="text-sm font-extrabold text-zinc-900">{user?.FullName || user?.Username}</p>
            <p className="text-xs text-zinc-500">{user?.Username} · {roleLabel(user?.Role)}</p>
          </div>
        </div>
        <div className="grid gap-4">
          <Field label="Tên đăng nhập"><input value={user?.Username ?? ""} disabled className="h-10 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500" /></Field>
          <Field label="Họ tên" error={error || undefined}>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Họ tên" className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" />
          </Field>
          {message && <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">{message}</p>}
          <div><PrimaryButton disabled={saving} onClick={() => void saveProfile()}>{saving ? "Đang lưu…" : "Lưu hồ sơ"}</PrimaryButton></div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-extrabold text-zinc-900"><KeyRound size={16} /> Đổi mật khẩu</h2>
        <p className="mb-4 text-xs text-zinc-500">Mật khẩu mới tối thiểu 6 ký tự.</p>
        <div className="grid gap-4">
          <Field label="Mật khẩu hiện tại"><input type="password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mật khẩu mới"><input type="password" value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field>
            <Field label="Nhập lại mật khẩu mới"><input type="password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20" /></Field>
          </div>
          {pwError && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">{pwError}</p>}
          {pwMessage && <p className="rounded-lg bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700">{pwMessage}</p>}
          <div><PrimaryButton disabled={pwBusy} onClick={() => void changePassword()}>{pwBusy ? "Đang đổi…" : "Đổi mật khẩu"}</PrimaryButton></div>
        </div>
      </div>
    </div>
  );
}
