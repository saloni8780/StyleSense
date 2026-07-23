const AI_BASE     = import.meta.env.VITE_AI_API_BASE     || "http://localhost:8005";
const DJANGO_BASE = import.meta.env.VITE_DJANGO_API_BASE || "http://localhost:8000";

// ---------- helpers ----------
function authHeader() {
  const token = localStorage.getItem("ss_token");
  return token ? { Authorization: `Token ${token}` } : {};
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.error || "Request failed");
  return data;
}

// ---------- auth ----------
export async function register(username, email, password) {
  const res = await fetch(`${DJANGO_BASE}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  localStorage.setItem("ss_token", data.token);
  localStorage.setItem("ss_user",  data.username);
  return data;
}

export async function login(username, password) {
  const res = await fetch(`${DJANGO_BASE}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  localStorage.setItem("ss_token", data.token);
  localStorage.setItem("ss_user",  data.username);
  return data;
}

export function logout() {
  fetch(`${DJANGO_BASE}/api/auth/logout/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
  }).catch(() => {});
  localStorage.removeItem("ss_token");
  localStorage.removeItem("ss_user");
}

export function getStoredUser() {
  return localStorage.getItem("ss_user") || null;
}

// ---------- AI service ----------
export async function getStyling({ occasion, stylePref, budget, notes }) {
  return apiFetch(`${AI_BASE}/api/style`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ occasion, style_pref: stylePref, budget, notes }),
  });
}

export async function getLookbookFeedback(files, notes) {
  const form = new FormData();
  files.forEach((f) => form.append("images", f));
  form.append("notes", notes || "");
  return apiFetch(`${AI_BASE}/api/feedback`, { method: "POST", body: form });
}

export function getWeatherStyle({ city, occasion, stylePref }) {
  return apiFetch(`${AI_BASE}/api/weather-style`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ city, occasion, style_pref: stylePref }),
  });
}

export function getStyleGrid({ items, count }) {
  return apiFetch(`${AI_BASE}/api/style-grid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, count }),
  });
}

export function getCompatibilityScore({ outfit, occasion, season, notes }) {
  return apiFetch(`${AI_BASE}/api/compatibility-score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ outfit_description: outfit, occasion, season, extra_notes: notes }),
  });
}

// ---------- Django backend ----------
export async function saveOutfit(outfit) {
  const res = await fetch(`${DJANGO_BASE}/api/outfits/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(outfit),
  });
  if (!res.ok) throw new Error("Saving failed");
  return res.json();
}

export async function getSavedOutfits() {
  const res = await fetch(`${DJANGO_BASE}/api/outfits/`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error("Could not fetch saved outfits");
  return res.json();
}

export async function deleteSavedOutfit(id) {
  await fetch(`${DJANGO_BASE}/api/outfits/${id}/`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

// ---------- Wardrobe (Django) ----------
export async function getWardrobe() {
  const res = await fetch(`${DJANGO_BASE}/api/wardrobe/`, {
    headers: authHeader(),
  });
  if (!res.ok) throw new Error("Could not fetch wardrobe");
  return res.json();
}

export async function addWardrobeItem(item) {
  const res = await fetch(`${DJANGO_BASE}/api/wardrobe/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Could not add wardrobe item");
  return res.json();
}

export async function deleteWardrobeItem(id) {
  await fetch(`${DJANGO_BASE}/api/wardrobe/${id}/`, {
    method: "DELETE",
    headers: authHeader(),
  });
}

// ---------- Wardrobe-aware styling (FastAPI) ----------
export async function getWardrobeStyle({ occasion, budget, notes, wardrobe_items }) {
  const res = await fetch(`${AI_BASE}/api/wardrobe-style`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ occasion, budget, notes, wardrobe_items }),
  });
  if (!res.ok) throw new Error("Wardrobe style request failed");
  return res.json();
}
