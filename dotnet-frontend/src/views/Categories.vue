<template>
  <div class="categories-page">
    <h2>🏷️ Quản lý danh mục</h2>

    <!-- 🔍 Thanh tìm kiếm -->
    <div class="search-bar">
      <label for="filterType">Tìm theo:</label>
      <select v-model="filterType" id="filterType">
        <option value="id">ID</option>
        <option value="name">Tên danh mục</option>
      </select>

      <input type="text" v-model="searchText" placeholder="Nhập từ khóa..." />
    </div>

    <!-- 📝 Form thêm / sửa / xem -->
    <form class="category-form" @submit.prevent="confirmSave">
      <div class="form-group">
        <label>ID</label>
        <input v-model="category.id" type="text" readonly />
      </div>

      <div class="form-group">
        <label>Tên danh mục</label>
        <input
          v-model="category.name"
          type="text"
          :readonly="viewMode && !editMode"
          placeholder="Tên danh mục"
          required
        />
      </div>

      <button type="submit" v-if="!viewMode">{{ editMode ? "Cập nhật" : "Thêm mới" }}</button>
      <button type="button" v-if="editMode" @click="cancelEdit">Hủy</button>
      <button type="button" v-if="viewMode && !editMode" @click="closeView">Đóng</button>
    </form>

    <!-- 📋 Bảng hiển thị -->
    <div v-if="loading" class="loading">Đang tải danh mục...</div>
    <table v-else class="category-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Tên danh mục</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="c in filteredCategories"
          :key="c.id"
          :class="{ active: category.id === c.id && (editMode || viewMode) }"
          @click="viewCategory(c)"
        >
          <td>{{ c.id }}</td>
          <td>{{ c.name }}</td>
          <td>
            <button @click.stop="confirmEdit(c)">✏️</button>
            <button @click.stop="confirmDelete(c.id)">🗑️</button>
          </td>
        </tr>
        <tr v-if="filteredCategories.length === 0">
          <td colspan="3">Không có dữ liệu phù hợp</td>
        </tr>
      </tbody>
    </table>

    <!-- ✅ Hộp xác nhận -->
    <div v-if="showConfirm" class="confirm-overlay">
      <div class="confirm-box">
        <h3>{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="actions">
          <button class="btn-yes" @click="handleConfirmYes">Đồng ý</button>
          <button class="btn-no" @click="handleConfirmNo">Hủy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory as deleteCategoryAPI,
} from "../api/Category.js";

// 🧩 Dữ liệu
const categories = ref([]);
const loading = ref(true);

const category = ref({ id: "", name: "" });
const editMode = ref(false);
const viewMode = ref(false);

const searchText = ref("");
const filterType = ref("id");

// 🔍 Lọc danh mục
const filteredCategories = computed(() => {
  const keyword = searchText.value.toLowerCase().trim();
  if (!keyword) return categories.value;
  return categories.value.filter((c) =>
    c[filterType.value]?.toLowerCase().includes(keyword)
  );
});

// ✅ Biến xác nhận
const showConfirm = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
let confirmAction = null;

// ⚡ Lấy danh mục từ backend
async function fetchCategories() {
  try {
    const data = await getCategories();
    // Chuyển đổi key từ PascalCase sang camelCase nếu backend trả PascalCase
    categories.value = data.map((item) => ({
      id: item.CategoryId ?? item.id,
      name: item.CategoryName ?? item.name,
    }));
  } catch (err) {
    console.error("Lỗi khi tải danh mục:", err);
  } finally {
    loading.value = false;
  }
}

// 🔘 Xử lý xác nhận
function handleConfirmYes() {
  if (confirmAction) confirmAction();
  showConfirm.value = false;
}
function handleConfirmNo() {
  showConfirm.value = false;
}

// 💾 Lưu danh mục
async function saveCategory() {
  try {
    if (editMode.value) {
      // ✅ Chế độ cập nhật
      await updateCategory(category.value.id, category.value);
    } else {
      // ✅ Thêm mới: chỉ gửi name, backend tự sinh ID
      const created = await addCategory(category.value);
      // Gán lại ID vừa tạo để hiển thị luôn
      category.value.id = created.CategoryId ?? created.id;
    }

    // ✅ Sau khi thêm hoặc cập nhật, tải lại danh sách
    await fetchCategories();

    // ✅ Reset form về rỗng
    editMode.value = false;
    resetForm();
  } catch (err) {
    console.error("Lỗi khi lưu danh mục:", err);
  }
}


// 💾 Xác nhận trước khi lưu
function confirmSave() {
  confirmTitle.value = editMode.value ? "Xác nhận cập nhật" : "Xác nhận thêm mới";
  confirmMessage.value = editMode.value
    ? `Bạn có chắc muốn cập nhật danh mục "${category.value.name}" không?`
    : `Bạn có chắc muốn thêm danh mục "${category.value.name}" không?`;
  confirmAction = saveCategory;
  showConfirm.value = true;
}

// ✏️ Chỉnh sửa
function editCategory(c) {
  category.value = { ...c };
  editMode.value = true;
  viewMode.value = false;
}
function confirmEdit(c) {
  confirmTitle.value = "Xác nhận chỉnh sửa";
  confirmMessage.value = `Bạn muốn chỉnh sửa danh mục "${c.name}"?`;
  confirmAction = () => editCategory(c);
  showConfirm.value = true;
}

// 🗑️ Xóa
async function deleteCategory(id) {
  try {
    await deleteCategoryAPI(id);
    await fetchCategories();
  } catch (err) {
    console.error("Lỗi khi xóa danh mục:", err);
  }
  resetForm();
}
function confirmDelete(id) {
  const target = categories.value.find((c) => c.id === id);
  confirmTitle.value = "Xác nhận xóa";
  confirmMessage.value = `Bạn có chắc muốn xóa danh mục "${target?.name}"?`;
  confirmAction = () => deleteCategory(id);
  showConfirm.value = true;
}

// 👁️ Xem chi tiết
function viewCategory(c) {
  if (!editMode.value) {
    category.value = { ...c };
    viewMode.value = true;
  }
}

// 🔒 Đóng chế độ xem
function closeView() {
  viewMode.value = false;
  resetForm();
}

// ❌ Hủy
function cancelEdit() {
  editMode.value = false;
  resetForm();
}

// 🔄 Reset form
function resetForm() {
  category.value = { id: "", name: "" };
}

fetchCategories();
</script>

<style scoped>
.categories-page {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

/* 🔍 Thanh tìm kiếm */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}
.search-bar input {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.search-bar select {
  padding: 6px 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}

/* 📝 Form */
.category-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

/* 📋 Bảng */
.category-table {
  width: 100%;
  border-collapse: collapse;
}
.category-table th,
.category-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
}
.category-table th {
  background-color: #2c3e50;
  color: white;
}
.category-table tr:hover {
  background-color: #f8f8f8;
  cursor: pointer;
}
.category-table tr.active {
  background-color: #e7f1ff;
}

.loading {
  margin: 20px;
  font-weight: bold;
}
</style>
