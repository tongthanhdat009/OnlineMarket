import apiClient from "./apiClient";

const BASE = "/api/promotion";

export async function getPromotions() {
  const res = await apiClient.get(`${BASE}`);
  return res.data;
}

export async function getPromotion(id) {
  const res = await apiClient.get(`${BASE}/${id}`);
  return res.data;
}

export async function createPromotion(payload) {
  const res = await apiClient.post(`${BASE}`, payload);
  return res.data;
}

export async function updatePromotion(id, payload) {
  const res = await apiClient.put(`${BASE}/${id}`, payload);
  return res.data;
}

export async function deletePromotion(id) {
  const res = await apiClient.delete(`${BASE}/${id}`);
  return res.data;
}

export async function applyPromotion(promoCode, totalAmount) {
  const res = await apiClient.post(`${BASE}/apply`, { promoCode, totalAmount });
  return res.data;
}

export async function giftVoucher(payload) {
  const res = await apiClient.post(`${BASE}/gift`, payload);
  return res.data;
}

export default {
  getPromotions,
  getPromotion,
  createPromotion,
  updatePromotion,
  deletePromotion,
  applyPromotion,
  giftVoucher,
};
