<template>
  <div class="role-permission-page">
    <h2>🛡️ Quản lý Nhân quyền (Vai trò & Chức năng)</h2>

    <!-- ========== RÔLES ========== -->
    <div class="section">
      <h3>🎭 Danh sách Vai trò</h3>

      <!-- 🔍 Tìm kiếm -->
      <div class="search-bar">
        <label for="roleFilter">Tìm theo:</label>
        <select v-model="roleFilterType" id="roleFilter">
          <option value="role_id">ID</option>
          <option value="role_name">Tên vai trò</option>
        </select>
        <input type="text" v-model="roleSearch" placeholder="Nhập từ khóa..." />
      </div>

      <!-- 📝 Form vai trò -->
      <form class="form" @submit.prevent="confirmSaveRole">
        <div class="form-group">
          <label>ID</label>
          <input v-model="role.role_id" readonly />
        </div>

        <div class="form-group">
          <label>Tên vai trò</label>
          <input v-model="role.role_name" placeholder="Nhập tên vai trò..." required />
        </div>

        <div class="form-group">
          <label>Mô tả</label>
          <input v-model="role.description" placeholder="Mô tả..." />
        </div>

        <div class="form-actions">
          <button type="submit">{{ editRoleMode ? "Cập nhật" : "Thêm mới" }}</button>
          <button v-if="editRoleMode" type="button" @click="cancelEditRole">Hủy</button>
        </div>
      </form>

      <!-- 📋 Bảng vai trò -->
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên vai trò</th>
            <th>Mô tả</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="r in filteredRoles"
            :key="r.role_id"
            :class="{ active: role.role_id === r.role_id }"
            @click="viewRoleDetails(r)"
          >
            <td>{{ r.role_id }}</td>
            <td>{{ r.role_name }}</td>
            <td>{{ r.description }}</td>
            <td>
              <button @click.stop="editRole(r)">✏️</button>
              <button @click.stop="confirmDeleteRole(r)">🗑️</button>
            </td>
          </tr>
          <tr v-if="filteredRoles.length === 0">
            <td colspan="4">Không có dữ liệu phù hợp</td>
          </tr>
        </tbody>
      </table>
      <Pagination :page="rolePage" :pageSize="rolePageSize" :total="roleTotal" @update:page="rolePage = $event; fetchRoles()" @update:pageSize="rolePageSize = $event; rolePage = 1; fetchRoles()" />
    </div>

    <!-- ========== PERMISSIONS ========== -->
    <div class="section">
      <h3>🔐 Danh sách Quyền chức năng</h3>

      <!-- 🔍 Tìm kiếm -->
      <div class="search-bar">
        <label for="permFilter">Tìm theo:</label>
        <select v-model="permFilterType" id="permFilter">
          <option value="permission_id">ID</option>
          <option value="permission_name">Tên quyền</option>
        </select>
        <input type="text" v-model="permSearch" placeholder="Nhập từ khóa..." />
      </div>

      <!-- 📝 Form quyền -->
      <form class="form" @submit.prevent="confirmSavePermission">
        <div class="form-group">
          <label>ID</label>
          <input v-model="permission.permission_id" readonly />
        </div>

        <div class="form-group">
          <label>Tên quyền</label>
          <input v-model="permission.permission_name" required placeholder="Tên quyền..." />
        </div>

        <div class="form-group">
          <label>Action key</label>
          <input v-model="permission.action_key" required placeholder="action_key..." :disabled="editPermMode" />
        </div>

        <div class="form-group">
          <label>Mô tả</label>
          <input v-model="permission.description" placeholder="Mô tả..." />
        </div>

        <div class="form-actions">
          <button type="submit">{{ editPermMode ? "Cập nhật" : "Thêm mới" }}</button>
          <button v-if="editPermMode" type="button" @click="cancelEditPermission">Hủy</button>
        </div>
      </form>

      <!-- 📋 Bảng quyền -->
      <table class="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Tên quyền</th>
            <th>Action Key</th>
            <th>Mô tả</th>
            <th>Đã gán</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in filteredPermissions"
            :key="p.permission_id"
            :class="{ active: permission.permission_id === p.permission_id }"
            @click="viewPermissionDetails(p)"
          >
            <td>{{ p.permission_id }}</td>
            <td>{{ p.permission_name }}</td>
            <td>{{ p.action_key }}</td>
            <td>{{ p.description }}</td>
            <td>
              <input
                type="checkbox"
                :checked="isPermissionAssigned(p.permission_id)"
                @change="togglePermission(p.permission_id)"
              />
            </td>
            <td>
              <button @click.stop="editPermission(p)">✏️</button>
              <button @click.stop="confirmDeletePermission(p)">🗑️</button>
            </td>
          </tr>
          <tr v-if="filteredPermissions.length === 0">
            <td colspan="6">Không có dữ liệu phù hợp</td>
          </tr>
        </tbody>
      </table>
      <Pagination :page="permPage" :pageSize="permPageSize" :total="permTotal" @update:page="permPage = $event; fetchPermissions()" @update:pageSize="permPageSize = $event; permPage = 1; fetchPermissions()" />
    </div>

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
import { ref, computed, watch } from "vue";
import { toRaw } from 'vue';
import { parsePagedResponse, buildPagedParams } from "../utils/pagination.js";
import Pagination from "../components/Pagination.vue";

// ====== DỮ LIỆU GIẢ ======
import { getAllRoles, createRole, updateRole ,deleteRole } from "../api/Role.js";

const roles = ref([]);
async function fetchRoles() {
  try {
    const params = buildPagedParams({ page: rolePage.value, pageSize: rolePageSize.value, search: roleSearch.value, searchField: roleFilterType.value });
    const data = await getAllRoles(params);
    const { items, total: t } = parsePagedResponse(data);
    roleTotal.value = t;
    const arr = Array.isArray(items) ? items : (Array.isArray(data) ? data : []);
    let mapped = arr.map((s) => ({
      role_id: s.RoleId ?? s.roleId ?? s.role_id,
      role_name: s.RoleName ?? s.roleName ?? s.role_name,
      description: s.Description ?? s.description,
    }));
    if (Array.isArray(data) && mapped.length > rolePageSize.value) {
      roleTotal.value = mapped.length;
      const start = (rolePage.value - 1) * rolePageSize.value;
      mapped = mapped.slice(start, start + rolePageSize.value);
    }
    roles.value = mapped;
    console.log("Fetched roles:", toRaw(roles.value));
  } catch (err) {
    console.error("Lỗi khi fetch roles:", err);
  }
}
fetchRoles();
let _roleSearchTimer = null;
watch([roleSearch, roleFilterType], () => {
  clearTimeout(_roleSearchTimer);
  _roleSearchTimer = setTimeout(() => { rolePage.value = 1; fetchRoles(); }, 400);
});

const permissions = ref([]);

const rolePermissions = ref([]);

// ====== ROLE ======
const role = ref({ role_id: "", role_name: "", description: "" });
const editRoleMode = ref(false);
const roleSearch = ref("");
const roleFilterType = ref("role_name");
const rolePage = ref(1);
const rolePageSize = ref(10);
const roleTotal = ref(0);
const selectedRoleId = ref(null);
const selectedRoleName = computed(() => {
  const r = roles.value.find((r) => r.role_id === selectedRoleId.value);
  return r ? r.role_name : "";
});

async function saveRole() {
  try {
    const payload = {
      RoleName: role.value.role_name,
      Description: role.value.description,
    };

    if (editRoleMode.value) {
      const res = await updateRole(role.value.role_id, payload);
      if (res.status === 200) {
        const idx = roles.value.findIndex(r => r.role_id === role.value.role_id);
        if (idx !== -1) roles.value[idx] = { ...role.value };
      }
    } else {
      const res = await createRole(payload);
      if (res.status === 201 || res.status === 200) {
        await fetchRoles(); // nạp lại danh sách
      }
    }
  } catch (err) {
    console.error("Lỗi khi lưu role:", err.response?.data || err);
  } finally {
    resetRoleForm();
    showConfirm.value = false;
  }
}

const filteredRoles = computed(() => roles.value);

function viewRoleDetails(r) {
  selectedRoleId.value = r.role_id;
  role.value = { ...r }; // chỉ xem chi tiết, không bật edit mode
}

// ZZ

function confirmSaveRole() {
  confirmTitle.value = editRoleMode.value ? "Cập nhật vai trò" : "Thêm vai trò mới";
  confirmMessage.value = "Bạn có chắc muốn lưu thông tin này?";
  confirmAction = saveRole;
  showConfirm.value = true;
}

function editRole(r) {
  role.value = { ...r };
  editRoleMode.value = true;
}
function cancelEditRole() {
  editRoleMode.value = false;
  resetRoleForm();
}
function confirmDeleteRole(r) {
  confirmTitle.value = "Xác nhận xóa";
  confirmMessage.value = `Xóa vai trò "${r.role_name}"?`;
  confirmAction = () => deleteRole1(r.role_id);
  showConfirm.value = true;
}
async function deleteRole1(id) {
  try {
    await deleteRole(id);
    roles.value = roles.value.filter((r) => r.role_id !== id);
    rolePermissions.value = rolePermissions.value.filter((rp) => rp.role_id !== id);
    resetRoleForm();
    showConfirm.value = false;
  } catch (err) {
    console.error("Lỗi khi xóa role:", err.response?.data || err);
  }
}

function resetRoleForm() {
  fetchRoles();
}

// ====== PERMISSION ======
import { getAllPermissions, createPermission, updatePermission, deletePermission } from "../api/Permission.js";

const permission = ref({ permission_id: "", permission_name: "", action_key: "", description: "" });
const editPermMode = ref(false);
const permSearch = ref("");  
const permFilterType = ref("permission_name");
const permPage = ref(1);
const permPageSize = ref(10);
const permTotal = ref(0);
const filteredPermissions = computed(() => permissions.value);

async function fetchPermissions() {
  try {
    const params = buildPagedParams({ page: permPage.value, pageSize: permPageSize.value, search: permSearch.value, searchField: permFilterType.value });
    const data = await getAllPermissions(params);
    const { items, total: t } = parsePagedResponse(data);
    permTotal.value = t;
    const arr = Array.isArray(items) ? items : (Array.isArray(data) ? data : []);
    let mapped = arr.map((p) => ({
      permission_id: p.PermissionId ?? p.permissionId ?? p.permission_id,
      permission_name: p.PermissionName ?? p.permissionName ?? p.permission_name,
      action_key: p.ActionKey ?? p.actionKey ?? p.action_key,
      description: p.Description ?? p.description,
    }));
    if (Array.isArray(data) && mapped.length > permPageSize.value) {
      permTotal.value = mapped.length;
      const start = (permPage.value - 1) * permPageSize.value;
      mapped = mapped.slice(start, start + permPageSize.value);
    }
    permissions.value = mapped;
    console.log("Fetched permissions:", toRaw(permissions.value));
  } catch (err) {
    console.error("Lỗi khi fetch permissions:", err);
  }
}
fetchPermissions();
let _permSearchTimer = null;
watch([permSearch, permFilterType], () => {
  clearTimeout(_permSearchTimer);
  _permSearchTimer = setTimeout(() => { permPage.value = 1; fetchPermissions(); }, 400);
});

function viewPermissionDetails(p) {
  permission.value = { ...p }; // chỉ xem chi tiết
}

// function generateNextPermId() {
//   if (permissions.value.length === 0) return 1;
//   return Math.max(...permissions.value.map((p) => p.permission_id)) + 1;
// }
function confirmSavePermission() {
  confirmTitle.value = editPermMode.value ? "Cập nhật quyền" : "Thêm quyền mới";
  confirmMessage.value = "Bạn có chắc muốn lưu thông tin này?";
  confirmAction = savePermission;
  showConfirm.value = true;
}
// function savePermission() {
//   if (editPermMode.value) {
//     const idx = permissions.value.findIndex((p) => p.permission_id === permission.value.permission_id);
//     if (idx !== -1) permissions.value[idx] = { ...permission.value };
//   } else {
//     permission.value.permission_id = generateNextPermId();
//     permissions.value.push({ ...permission.value });
//   }
//   resetPermissionForm();
//   showConfirm.value = false;
// }
async function savePermission() {
  try {
    const payload = {
      PermissionId: permission.value.permission_id,
      PermissionName: permission.value.permission_name,
      ActionKey: permission.value.action_key,
      Description: permission.value.description,
    };

    if (editPermMode.value) {
      const res = await updatePermission(permission.value.permission_id, payload);
      if (res.status === 200) {
        const idx = permissions.value.findIndex(p => p.permission_id === permission.value.permission_id);
        if (idx !== -1) permissions.value[idx] = { ...permission.value };
      }
    } else {
      const res = await createPermission(payload);
      if (res.status === 201 || res.status === 200) {
        await resetPermissionForm(); // nạp lại danh sách
      }
    }
  } catch (err) {
    console.error("Lỗi khi lưu permission:", err.response?.data || err);
  } finally {
    resetPermissionForm();
    showConfirm.value = false;
  }
} 

function editPermission(p) {
  permission.value = { ...p };
  editPermMode.value = true;
}
function cancelEditPermission() {
  editPermMode.value = false;
  resetPermissionForm();
}
function confirmDeletePermission(p) {
  confirmTitle.value = "Xác nhận xóa";
  confirmMessage.value = `Xóa quyền "${p.permission_name}"?`;
  confirmAction = () => deletePermission1(p.permission_id);
  showConfirm.value = true;
}
// function deletePermission(id) {
//   permissions.value = permissions.value.filter((p) => p.permission_id !== id);
//   rolePermissions.value = rolePermissions.value.filter((rp) => rp.permission_id !== id);
//   resetPermissionForm();
//   showConfirm.value = false;
// }

function deletePermission1(id) {
  try {
    deletePermission(id);
    permissions.value = permissions.value.filter((p) => p.permission_id !== id);
    rolePermissions.value = rolePermissions.value.filter((rp) => rp.permission_id !== id);
    resetPermissionForm();
    showConfirm.value = false;
  } catch (err) {
    console.error("Lỗi khi xóa permission:", err.response?.data || err);
  }
}

function resetPermissionForm() {
  fetchPermissions();
}

// ====== GÁN QUYỀN ======
import { getAllRolePermissions, assignPermissionToRole, removePermissionFromRole } from "../api/RolePermission.js";


async function fetchRolePermissions() {
  try {
    const data = await getAllRolePermissions();
    console.log("Raw role-permissions data:", data);
    rolePermissions.value = data.map((rp) => ({
      role_id: rp.RoleId,
      permission_id: rp.PermissionId,
    }));
    console.log("Fetched role-permissions:", toRaw(rolePermissions.value));
  } catch (err) {
    console.error("Lỗi khi fetch role-permissions:", err);
  }
}
fetchRolePermissions();
  
function isPermissionAssigned(permId) {
  return rolePermissions.value.some((rp) => rp.role_id === selectedRoleId.value && rp.permission_id === permId);
}

async function togglePermission(permId) {
  if (!selectedRoleId.value) return;
  
  try {
    const index = rolePermissions.value.findIndex(
      (rp) => rp.role_id === selectedRoleId.value && rp.permission_id === permId
    );

    if (index === -1) {
      // Thêm quyền mới
      await assignPermissionToRole(selectedRoleId.value, permId);
      rolePermissions.value.push({ role_id: selectedRoleId.value, permission_id: permId });
    } else {
      // Xóa quyền
      await removePermissionFromRole(selectedRoleId.value, permId);
      rolePermissions.value.splice(index, 1);
    }
  } catch (err) {
    console.error("Lỗi khi cập nhật quyền:", err.response?.data || err);
  }
}

// ====== POPUP XÁC NHẬN ======
const showConfirm = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
let confirmAction = null;

function handleConfirm() {
  if (confirmAction) confirmAction();
}
function closeConfirm() {
  showConfirm.value = false;
}
</script>

<style scoped>
.role-permission-page {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
}
.section {
  margin-bottom: 30px;
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 10px;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
.data-table th,
.data-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
.data-table th {
  background-color: #2c3e50;
  color: white;
}
.data-table tr.active {
  background-color: #e7f1ff;
}
.form {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 10px;
}
.form-group {
  display: flex;
  flex-direction: column;
}
.form-actions {
  grid-column: span 3;
  display: flex;
  gap: 10px;
}
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.confirm-box {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  width: 300px;
}
.confirm-box .actions {
  margin-top: 15px;
  display: flex;
  justify-content: space-around;
}
</style>
