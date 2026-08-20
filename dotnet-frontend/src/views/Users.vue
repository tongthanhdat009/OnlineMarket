<template>
  <div class="users-page">
    <h2>👤 Quản lý người dùng</h2>

    <!-- Trạng thái -->
    <div v-if="loading" class="status info">Đang tải danh sách người dùng...</div>
    <div v-if="errorMessage" class="status error">{{ errorMessage }}</div>

    <!-- 🔍 Thanh tìm kiếm -->
    <div class="search-bar">
      <label for="filterType">Tìm theo:</label>
      <select v-model="filterType" id="filterType">
        <option value="id">ID</option>
        <option value="name">Tên đăng nhập</option>
        <option value="full_name">Họ và tên</option>
      </select>
      <input type="text" v-model="searchText" placeholder="Nhập từ khóa..." />
    </div>

    <!-- 📝 Form thêm / sửa / xem -->
    <form class="user-form" @submit.prevent="confirmSave">
      <div class="form-group">
        <label>ID</label>
        <input v-model="user.id" type="text" readonly />
      </div>

      <div class="form-group">
        <label>Tên đăng nhập</label>
        <input
          v-model="user.name"
          type="text"
          :readonly="viewMode && !editMode"
          placeholder="Tên đăng nhập"
          required
        />
      </div>

      <div class="form-group">
        <label>Mật khẩu</label>
        <input
          v-model="user.password"
          type="text"
          :readonly="viewMode && !editMode"
          placeholder="Mật khẩu"
          required
        />
      </div>

      <div class="form-group">
        <label>Họ và tên</label>
        <input
          v-model="user.full_name"
          type="text"
          :readonly="viewMode && !editMode"
          placeholder="Họ và tên"
        />
      </div>

      <div class="form-group">
        <label>Vai trò</label>
        <select v-model="user.role" :disabled="viewMode && !editMode">
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>
      </div>

      <!-- Nút hành động -->
      <div class="form-actions">
        <button type="submit" v-if="!viewMode" :disabled="saving">
          {{ editMode ? (saving ? "Đang cập nhật..." : "Cập nhật") : (saving ? "Đang thêm..." : "Thêm mới") }}
        </button>
        <button type="button" v-if="editMode" @click="cancelEdit" :disabled="saving">Hủy</button>
        <button type="button" v-if="viewMode && !editMode" @click="closeView">Đóng</button>
      </div>
    </form>

    <!-- 📋 Bảng hiển thị -->
    <table class="user-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tên đăng nhập</th>
          <th>Mật khẩu</th>
          <th>Họ và tên</th>
          <th>Vai trò</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="u in filteredUsers"
          :key="u.id"
          :class="{ active: user.id === u.id && (editMode || viewMode) }"
          @click="viewUser(u)"
        >
          <td>{{ u.id }}</td>
          <td>{{ u.name }}</td>
          <td>{{ u.password }}</td>
          <td>{{ u.full_name }}</td>
          <td>{{ u.role }}</td>
          <td>
            <button @click.stop="confirmEdit(u)">✏️</button>
            <button @click.stop="confirmDelete(u)">🗑️</button>
          </td>
        </tr>
        <tr v-if="filteredUsers.length === 0">
          <td colspan="6">Không có dữ liệu phù hợp</td>
        </tr>
      </tbody>
    </table>

    <Pagination :page="page" :pageSize="pageSize" :total="total" @update:page="page = $event; loadUsers()" @update:pageSize="pageSize = $event; page = 1; loadUsers()" />

    <!-- ⚡ Popup xác nhận -->
    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="actions">
          <button @click="handleConfirm" class="btn-yes">Xác nhận</button>
          <button @click="closeConfirm" class="btn-no">Hủy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { getUsers, addUser, updateUser, deleteUser } from "../api/Users.js";
import { parsePagedResponse, buildPagedParams } from "../utils/pagination.js";
import Pagination from "../components/Pagination.vue";

// ===== State =====
const users = ref([]); // danh sách hiển thị (UI model)
const user  = ref({ id: "", name: "", password: "", full_name: "", role: "staff" });

const editMode = ref(false);
const viewMode = ref(false);
const searchText = ref("");
const filterType = ref("id");
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

const loading = ref(true);
const errorMessage = ref("");
const saving = ref(false);

// ===== Mapping DTO <-> UI =====
const roleIdToName = (id) => (id === 1 ? "admin" : "staff");
const roleNameToId = (name) => (name === "admin" ? 1 : 2);

function toUi(dto) {
  return {
    id:        String(dto.UserId ?? ""),
    name:      dto.Username ?? "",
    // ⚠️ API thật KHÔNG nên trả Password; giữ nguyên theo DTO bạn đang dùng
    password:  dto.Password ?? "",
    full_name: dto.FullName ?? "",
    role:      roleIdToName(dto.Role ?? 2),
  };
}

function toDto(u) {
  return {
    // UserId để backend tự sinh -> không gửi khi create
    Username: u.name?.trim(),
    Password: u.password?.trim(),
    FullName: u.full_name?.trim() || null,
    Role:     roleNameToId(u.role),
  };
}

// ===== Fetch (server-side pagination) =====
async function loadUsers() {
  try {
    loading.value = true;
    errorMessage.value = "";
    const params = buildPagedParams({ page: page.value, pageSize: pageSize.value, search: searchText.value, searchField: filterType.value });
    const data = await getUsers(params);
    const { items, total: t } = parsePagedResponse(data);
    total.value = t;
    // items are DTOs -> map to UI
    const arr = Array.isArray(items) ? items : [];
    // fallback: if backend returned full array despite paged params, slice client-side
    if (Array.isArray(data) && arr.length > pageSize.value) {
      const kw = (searchText.value || "").toLowerCase().trim();
      let filtered = arr.map(toUi);
      if (kw) filtered = filtered.filter((u) => String(u[filterType.value] ?? "").toLowerCase().includes(kw));
      total.value = filtered.length;
      const start = (page.value - 1) * pageSize.value;
      users.value = filtered.slice(start, start + pageSize.value);
    } else {
      users.value = arr.map(toUi);
    }
    // sau khi nạp xong -> set gợi ý ID cho form
    setSuggestedId();
  } catch (err) {
    console.error("Get users error:", err);
    errorMessage.value = err?.response?.data?.message || "Không thể tải danh sách người dùng.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadUsers);

let _searchTimer = null;
watch([searchText, filterType], () => {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => { page.value = 1; loadUsers(); }, 400);
});

// ===== Gợi ý ID: max(UserId) + 1 =====
function getNextIdSuggestion() {
  const list = Array.isArray(users.value) ? users.value : [];
  if (list.length === 0) return "1";
  const maxNum = Math.max(
    ...list
      .map(u => Number(u.id))
      .filter(n => Number.isFinite(n))
  );
  return String(maxNum + 1);
}

function setSuggestedId() {
  user.value.id = getNextIdSuggestion(); // readonly, chỉ hiển thị
}

// ===== Server-side pagination: search is done on backend =====
const filteredUsers = computed(() => users.value);

// ===== Popup xác nhận =====
const showConfirm = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
let confirmAction = null;

// Thêm hoặc sửa
function confirmSave() {
  confirmTitle.value = editMode.value ? "Xác nhận cập nhật" : "Xác nhận thêm mới";
  confirmMessage.value = editMode.value
    ? "Bạn có chắc muốn cập nhật thông tin người dùng này?"
    : "Bạn có chắc muốn thêm người dùng mới?";
  confirmAction = saveUser;
  showConfirm.value = true;
}

async function saveUser() {
  try {
    errorMessage.value = "";
    saving.value = true;

    if (!editMode.value) {
      // === CREATE ===
      // Validate cơ bản
      if (!user.value.name?.trim()) {
        errorMessage.value = "Tên đăng nhập là bắt buộc.";
        return;
      }
      if (!user.value.password?.trim()) {
        errorMessage.value = "Mật khẩu là bắt buộc.";
        return;
      }

      const dto = toDto(user.value);
      await addUser(dto);      // gọi API

      // ✅ RELOAD lại danh sách từ backend thay vì update local
      console.log("✅ Thêm user thành công! Đang tải lại danh sách...");
      page.value = 1;
      await loadUsers();

      // reset form & gợi ý id mới
      resetForm();
      setSuggestedId();
    } else {
      // === UPDATE ===
      // Validate cơ bản
      if (!user.value.name?.trim()) {
        errorMessage.value = "Tên đăng nhập là bắt buộc.";
        return;
      }
      if (!user.value.password?.trim()) {
        errorMessage.value = "Mật khẩu là bắt buộc.";
        return;
      }

      const idNum = Number(user.value.id);
      if (!Number.isFinite(idNum)) {
        errorMessage.value = "ID không hợp lệ.";
        return;
      }

      // [FIX: include UserId để khớp route]
      const dto = { ...toDto(user.value), UserId: idNum };

      await updateUser(idNum, dto);

      // ✅ RELOAD lại danh sách từ backend thay vì update local
      console.log("✅ Cập nhật user thành công! Đang tải lại danh sách...");
      await loadUsers();

      // Đóng chế độ edit
      editMode.value = false;
      viewMode.value = false;
      resetForm();
      setSuggestedId();
    }

    showConfirm.value = false;
  } catch (err) {
    console.error("Save user error:", err);
    const status = err?.response?.status;
    const msg = err?.response?.data?.message;
    if (status === 409)        errorMessage.value = msg || "Tên đăng nhập đã được sử dụng.";
    else if (status === 400) errorMessage.value = msg || "Dữ liệu không hợp lệ.";
    else                     errorMessage.value = "Có lỗi xảy ra khi lưu người dùng.";
  } finally {
    saving.value = false;
  }
}

// Sửa (chỉ bật form edit)
function confirmEdit(u) {
  confirmTitle.value = "Xác nhận chỉnh sửa";
  confirmMessage.value = "Bạn có chắc muốn chỉnh sửa thông tin người dùng này?";
  confirmAction = () => editUser(u);
  showConfirm.value = true;
}
function editUser(u) {
  user.value = { ...u };
  editMode.value = true;
  viewMode.value = false;
  showConfirm.value = false;
}

// Xem
function viewUser(u) {
  if (!editMode.value) {
    user.value = { ...u };
    viewMode.value = true;
  }
}
function closeView() {
  viewMode.value = false;
  resetForm();
  setSuggestedId();
}

// Xóa
function confirmDelete(u) {
  confirmTitle.value = "Xác nhận xóa";
  confirmMessage.value = `Bạn có chắc muốn xóa người dùng "${u.name}" không?`;
  confirmAction = () => doDelete(u.id);
  showConfirm.value = true;
}
async function doDelete(id) {
  try {
    errorMessage.value = "";
    const idNum = Number(id);
    if (!Number.isFinite(idNum)) {
      errorMessage.value = "ID không hợp lệ.";
      return;
    }

    await deleteUser(idNum);

    // ✅ RELOAD lại danh sách từ backend thay vì xóa local
    console.log("✅ Xóa user thành công! Đang tải lại danh sách...");
    await loadUsers();

    // Nếu đang xem/sửa đúng user vừa xóa -> reset form
    if (String(user.value.id) === String(id)) {
      editMode.value = false;
      viewMode.value = false;
      resetForm();
      setSuggestedId();
    }
  } catch (err) {
    console.error("Delete user error:", err);
    const msg = err?.response?.data?.message;
    errorMessage.value = msg || "Có lỗi xảy ra khi xóa người dùng.";
  } finally {
    showConfirm.value = false;
  }
}

// Hủy sửa
function cancelEdit() {
  editMode.value = false;
  resetForm();
  setSuggestedId();
}

// Popup controls
function handleConfirm() {
  if (confirmAction) confirmAction();
}
function closeConfirm() {
  showConfirm.value = false;
}

// Reset form
function resetForm() {
  user.value = { id: "", name: "", password: "", full_name: "", role: "staff" };
}
</script>

<style scoped>
.users-page {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.status {
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
}
.status.info {
  background: #f0f9ff;
  color: #055160;
  border: 1px solid #b6effb;
}
.status.error {
  background: #fff5f5;
  color: #b42318;
  border: 1px solid #f8d7da;
}

.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
}

.no-permission-box {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: center;
}

.no-permission-box p {
  margin: 4px 0;
  color: #856404;
}

.no-permission-box strong {
  color: #d32f2f;
}

.user-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-actions {
  grid-column: span 2;
  display: flex;
  gap: 10px;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}

.user-table th {
  background-color: #2c3e50;
  color: white;
}

.user-table tr:hover {
  background-color: #f8f8f8;
  cursor: pointer;
}

.user-table tr.active {
  background-color: #e7f1ff;
}

/* Popup xác nhận */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  display: grid;
  place-items: center;
  z-index: 1000;
}

.confirm-box {
  width: min(480px, 92vw);
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 10px 24px rgba(0,0,0,0.18);
}

.confirm-box h3 {
  margin: 0 0 8px 0;
}

.confirm-box p {
  margin: 0 0 12px 0;
  color: #444;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-yes {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-no {
  background: #e5e7eb;
  color: #111827;
  border: none;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-yes:hover { opacity: 0.9; }
.btn-no:hover { opacity: 0.9; }
</style>
