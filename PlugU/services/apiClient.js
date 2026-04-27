// services/apiClient.js
const BASE_URL = "https://gcsjuzsolhjsnaiitosx.supabase.co/functions/v1";

export const apiClient = async (endpoint, method = "GET", body = null, token = null) => {
  try {
    const headers = { "Content-Type": "application/json" };
    // Only add Authorization header if we have a valid user JWT
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) }),
    });

    let data;
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      data = { message: await res.text() };
    }

    if (!res.ok) {
      console.error("API Error Response:", { status: res.status, data });
      throw new Error(data.message || data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (error) {
    console.error("API ERROR:", error);
    throw error;
  }
};