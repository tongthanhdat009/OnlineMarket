<template>
  <div class="pagination">
    <div class="pagination-info">
      <span v-if="total > 0">Hiển thị {{ rangeStart }}-{{ rangeEnd }} / {{ total }}</span>
      <span v-else>Hiển thị 0 / 0</span>
      <label class="page-size-select">
        <span>Hiển thị</span>
        <select :value="pageSize" @change="onPageSizeChange($event)">
          <option v-for="opt in pageSizeOptions" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <span>/ trang</span>
      </label>
    </div>
    <div class="pagination-controls">
      <button class="page-btn" :disabled="page <= 1" @click="go(page - 1)">‹ Prev</button>
      <template v-for="(p, idx) in visiblePages" :key="idx">
        <span v-if="p === '...'" class="ellipsis">…</span>
        <button
          v-else
          class="page-btn"
          :class="{ active: p === page }"
          @click="go(p)"
        >{{ p }}</button>
      </template>
      <button class="page-btn" :disabled="page >= totalPages || totalPages === 0" @click="go(page + 1)">Next ›</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  page: { type: Number, required: true },
  pageSize: { type: Number, required: true },
  total: { type: Number, required: true },
  pageSizeOptions: { type: Array, default: () => [10, 20, 50] },
});

const emit = defineEmits(["update:page", "update:pageSize"]);

const totalPages = computed(() => {
  if (!props.total || !props.pageSize) return 0;
  return Math.ceil(props.total / props.pageSize);
});

const rangeStart = computed(() => {
  if (props.total === 0) return 0;
  return (props.page - 1) * props.pageSize + 1;
});
const rangeEnd = computed(() => Math.min(props.page * props.pageSize, props.total));

const visiblePages = computed(() => {
  const tp = totalPages.value;
  const cur = props.page;
  if (tp <= 0) return [];
  if (tp <= 5) return Array.from({ length: tp }, (_, i) => i + 1);
  if (cur <= 3) return [1, 2, 3, 4, "...", tp];
  if (cur >= tp - 2) return [1, "...", tp - 3, tp - 2, tp - 1, tp];
  return [1, "...", cur - 1, cur, cur + 1, "...", tp];
});

function go(p) {
  if (p === "...") return;
  const tp = totalPages.value;
  const clamped = Math.max(1, Math.min(p, tp || 1));
  if (clamped !== props.page) emit("update:page", clamped);
}
function onPageSizeChange(e) {
  const v = Number(e.target.value);
  emit("update:pageSize", v);
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
}
.pagination-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #2c3e50;
  flex-wrap: wrap;
}
.page-size-select {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.page-size-select select {
  padding: 4px 8px;
  border: 1px solid #d5dbdb;
  border-radius: 6px;
  background: #fff;
  color: #2c3e50;
  cursor: pointer;
}
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid #d5dbdb;
  background: #fff;
  color: #2c3e50;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
}
.page-btn:hover:not(:disabled):not(.active) {
  border-color: #27ae60;
  color: #27ae60;
}
.page-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.page-btn.active {
  background: #27ae60;
  border-color: #27ae60;
  color: #fff;
  font-weight: 700;
}
.ellipsis {
  padding: 0 4px;
  color: #7f8c8d;
  user-select: none;
}
</style>
