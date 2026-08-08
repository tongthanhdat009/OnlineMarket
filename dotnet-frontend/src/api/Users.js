import apiClient from "./apiClient.js";

// Named exports
export async function getUsers() {
  try {
    console.log("📞 Calling GET /api/users");
    const res = await apiClient.get("/api/users");
    console.log("✅ getUsers success:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ getUsers failed:", error);
    throw error;
  }
}

export async function getTotalUsers() {
  const res = await apiClient.get("/api/users/total");
  return res.data;
}

export async function addUser(user) {
  try {
    console.log("📞 Calling POST /api/users with data:", user);
    const res = await apiClient.post("/api/users", user);
    console.log("✅ addUser success:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ addUser failed:", error);
    console.error("Error details:", error.response?.data);
    throw error;
  }
}

export async function updateUser(id, user) {
  try {
    console.log(`📞 Calling PUT /api/users/${id} with data:`, user);
    const res = await apiClient.put(`/api/users/${id}`, user);
    console.log("✅ updateUser success:", res.data);
    return res.data;
  } catch (error) {
    console.error(`❌ updateUser(${id}) failed:`, error);
    console.error("Error details:", error.response?.data);
    throw error;
  }
}

export async function deleteUser(id) {
  try {
    console.log(`📞 Calling DELETE /api/users/${id}`);
    const res = await apiClient.delete(`/api/users/${id}`);
    console.log("✅ deleteUser success");
    return res.data;
  } catch (error) {
    console.error(`❌ deleteUser(${id}) failed:`, error);
    console.error("Error details:", error.response?.data);
    throw error;
  }
}
