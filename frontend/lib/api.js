// lib/api.js
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("habit_token");
}

function defaultHeaders(needsAuth = true) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };
  if (needsAuth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  return headers;
}

async function handleRes(res) {
  const txt = await res.text();
  const isJson = txt && (txt.trim().startsWith("{") || txt.trim().startsWith("["));
  const body = isJson ? JSON.parse(txt) : txt;
  if (!res.ok) {
    const err = new Error("API error");
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export async function apiGet(path, { auth = true } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: defaultHeaders(auth),
  });
  return handleRes(res);
}

export async function apiPost(path, body = {}, { auth = true } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: defaultHeaders(auth),
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function apiPut(path, body = {}, { auth = true } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: defaultHeaders(auth),
    body: JSON.stringify(body),
  });
  return handleRes(res);
}

export async function apiDelete(path, { auth = true } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "DELETE",
    headers: defaultHeaders(auth),
  });
  return handleRes(res);
}
