<template>
  <div class="suppliers-page">
    <h2>🏢 Quản lý nhà cung cấp</h2>

    <!-- 🔍 Thanh tìm kiếm -->
    <div class="search-bar">
      <label for="filterType">Tìm theo:</label>
      <select v-model="filterType" id="filterType">
        <option value="id">ID</option>
        <option value="name">Tên nhà cung cấp</option>
      </select>
      <input type="text" v-model="searchText" placeholder="Nhập từ khóa..." />
    </div>

    <!-- 📝 Form thêm / sửa / xem -->
    <form class="supplier-form" @submit.prevent="confirmSave">
      <div class="form-group">
        <label>ID</label>
        <input v-model="supplier.id" type="text" readonly />
      </div>

      <div class="form-group">
        <label>Tên nhà cung cấp</label>
        <input
          v-model="supplier.name"
          type="text"
          :readonly="viewMode && !editMode"
          required
          placeholder="Nhập tên nhà cung cấp"
        />
      </div>

      <div class="form-group">
        <label>Phone</label>
        <input
          v-model="supplier.phone"
          type="text"
          :readonly="viewMode && !editMode"
          placeholder="Nhập số điện thoại"
        />
      </div>

      <div class="form-group">
        <label>Email</label>
        <input
          v-model="supplier.email"
          type="email"
          :readonly="viewMode && !editMode"
          placeholder="Nhập email"
        />
      </div>

      <div class="form-group">
        <label>Address</label>
        <input
          v-model="supplier.address"
          type="text"
          :readonly="viewMode && !editMode"
          placeholder="Nhập địa chỉ"
        />
      </div>

      <button type="submit" v-if="!viewMode">{{ editMode ? "Cập nhật" : "Thêm mới" }}</button>
      <button type="button" v-if="editMode" @click="cancelEdit">Hủy</button>
      <button type="button" v-if="viewMode && !editMode" @click="closeView">Đóng</button>
    </form>

    <!-- 📋 Bảng hiển thị -->
    <div v-if="loading" class="loading">Đang tải dữ liệu...</div>
    <table v-else class="supplier-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tên nhà cung cấp</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Address</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="s in filteredSuppliers"
          :key="s.id"
          :class="{ active: supplier.id === s.id && (editMode || viewMode) }"
          @click="viewSupplier(s)"
        >
          <td>{{ s.id }}</td>
          <td>{{ s.name }}</td>
          <td>{{ s.phone }}</td>
          <td>{{ s.email }}</td>
          <td>{{ s.address }}</td>
          <td>
            <button @click.stop="confirmEdit(s)">✏️</button>
            <button @click.stop="confirmDelete(s.id)">🗑️</button>
          </td>
        </tr>
        <tr v-if="filteredSuppliers.length === 0">
          <td colspan="6">Không có dữ liệu phù hợp</td>
        </tr>
      </tbody>
    </table>

    <Pagination :page="page" :pageSize="pageSize" :total="total" @update:page="page = $event; fetchSuppliers()" @update:pageSize="pageSize = $event; page = 1; fetchSuppliers()" />

    <!-- ⚡ Popup xác nhận -->
    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="actions">
          <button @click="handleConfirmYes" class="btn-yes">Xác nhận</button>
          <button @click="handleConfirmNo" class="btn-no">Hủy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import {
  getSuppliers,
  addSupplier,
  updateSupplier,
  deleteSupplier,
} from "../api/Suppliers.js";
import { parsePagedResponse, buildPagedParams } from "../utils/pagination.js";
import Pagination from "../components/Pagination.vue";

const suppliers = ref([]);
const supplier = ref({ id: "", name: "", phone: "", email: "", address: "" });
const loading = ref(true);
const editMode = ref(false);
const viewMode = ref(false);

const searchText = ref("");
const filterType = ref("id");
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);

// Server-side pagination: direct display
const filteredSuppliers = computed(() => suppliers.value);

// ⚙️ Tải dữ liệu từ backend (server-side pagination)
async function fetchSuppliers() {
  try {
    loading.value = true;
    const params = buildPagedParams({ page: page.value, pageSize: pageSize.value, search: searchText.value, searchField: filterType.value });
    const data = await getSuppliers(params);
    const { items, total: t } = parsePagedResponse(data);
    total.value = t;
    const arr = Array.isArray(items) ? items : [];
    let mapped = arr.map((s) => ({
      id: s.SupplierId ?? s.supplierId ?? s.id,
      name: s.Name ?? s.name ?? s.SupplierName,
      phone: s.Phone ?? s.phone,
      email: s.Email ?? s.email,
      address: s.Address ?? s.address,
    }));
    if (Array.isArray(data) && mapped.length > pageSize.value) {
      total.value = mapped.length;
      const start = (page.value - 1) * pageSize.value;
      mapped = mapped.slice(start, start + pageSize.value);
    }
    suppliers.value = mapped;
  } catch (err) {
    console.error("Lỗi khi tải nhà cung cấp:", err);
  } finally {
    loading.value = false;
  }
}


// ✅ Popup xác nhận
const showConfirm = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
let confirmAction = null;

function handleConfirmYes() {
  if (confirmAction) confirmAction();
  showConfirm.value = false;
}
function handleConfirmNo() {
  showConfirm.value = false;
}

// 💾 Lưu (Thêm hoặc Sửa)
async function saveSupplier() {
  try {
    if (editMode.value) {
      await updateSupplier(supplier.value.id, supplier.value);
    } else {
      const created = await addSupplier(supplier.value);
      supplier.value.id = created.supplierId ?? created.id;
    }
    await fetchSuppliers();
let _searchTimer3 = null;
watch([searchText, filterType], () => {
  clearTimeout(_searchTimer3);
  _searchTimer3 = setTimeout(() => { page.value = 1; fetchSuppliers(); }, 400);
});
    resetForm();
  } catch (err) {
    console.error("Lỗi khi lưu nhà cung cấp:", err);
  }
}

function confirmSave() {
  confirmTitle.value = editMode.value ? "Xác nhận cập nhật" : "Xác nhận thêm mới";
  confirmMessage.value = editMode.value
    ? `Bạn có chắc muốn cập nhật nhà cung cấp "${supplier.value.name}" không?`
    : `Bạn có chắc muốn thêm nhà cung cấp "${supplier.value.name}" không?`;
  confirmAction = saveSupplier;
  showConfirm.value = true;
}

// ✏️ Sửa
function confirmEdit(s) {
  confirmTitle.value = "Xác nhận chỉnh sửa";
  confirmMessage.value = `Bạn có muốn chỉnh sửa nhà cung cấp "${s.name}"?`;
  confirmAction = () => {
    supplier.value = { ...s };
    editMode.value = true;
    viewMode.value = false;
  };
  showConfirm.value = true;
}

// 🗑️ Xóa
async function deleteSupplierById(id) {
  try {
    await deleteSupplier(id);
    await fetchSuppliers();
let _searchTimer3 = null;
watch([searchText, filterType], () => {
  clearTimeout(_searchTimer3);
  _searchTimer3 = setTimeout(() => { page.value = 1; fetchSuppliers(); }, 400);
});
    resetForm();
  } catch (err) {
    console.error("Lỗi khi xóa:", err);
  }
}

function confirmDelete(id) {
  const target = suppliers.value.find((s) => s.id === id);
  confirmTitle.value = "Xác nhận xóa";
  confirmMessage.value = `Bạn có chắc muốn xóa nhà cung cấp "${target?.name}" không?`;
  confirmAction = () => deleteSupplierById(id);
  showConfirm.value = true;
}

// 👁️ Xem chi tiết
function viewSupplier(s) {
  if (!editMode.value) {
    supplier.value = { ...s };
    viewMode.value = true;
  }
}

// 🔙 Hủy / Đóng
function closeView() {
  viewMode.value = false;
  resetForm();
}
function cancelEdit() {
  editMode.value = false;
  resetForm();
}

// 🔄 Reset form
function resetForm() {
  supplier.value = { id: "", name: "", phone: "", email: "", address: "" };
}

fetchSuppliers();
let _searchTimer3 = null;
watch([searchText, filterType], () => {
  clearTimeout(_searchTimer3);
  _searchTimer3 = setTimeout(() => { page.value = 1; fetchSuppliers(); }, 400);
});
</script>

<style scoped>


.suppliers-page {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.supplier-form {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.supplier-table {
  width: 100%;
  border-collapse: collapse;
}
.supplier-table th,
.supplier-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
.supplier-table th {
  background-color: #2c3e50;
  color: white;
}
.supplier-table tr:hover {
  background-color: #f8f8f8;
  cursor: pointer;
}
.supplier-table tr.active {
  background-color: #e7f1ff;
}

.loading {
  margin: 20px;
  font-weight: bold;
  text-align: center;
}
</style>
