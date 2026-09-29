/**
 * RetinaCare Shared API Client & Helper Utilities
 */

const API_BASE = "/api";

// --- Notification Toast Manager ---
function showToast(message, type = "info", duration = 4000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- Fetch Wrapper ---
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const token = localStorage.getItem("retinacare_token");
    const headers = Object.assign({}, options.headers || {});
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    options.headers = headers;

    const response = await fetch(url, options);

    if (!response.ok) {
      let errorMsg = `Server error (${response.status})`;
      try {
        const errJson = await response.json();
        errorMsg = errJson.detail || errorMsg;
      } catch (e) {
        // Fallback to text
        const errText = await response.text();
        if (errText) errorMsg = errText;
      }
      throw new Error(errorMsg);
    }

    if (response.status === 204) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`API Error on ${url}:`, error);
    throw error;
  }
}

// --- Auth Endpoints ---
const AuthAPI = {
  login: (username, password, portal) => apiRequest("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, portal })
  }),
  me: () => apiRequest("/auth/me"),
  logout: () => apiRequest("/auth/logout", { method: "POST" }),
  registerPatient: (data) => apiRequest("/auth/register-patient", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }),
  getMyRecords: () => apiRequest("/auth/my-records"),
  listUsers: () => apiRequest("/auth/users"),
  createUser: (data) => apiRequest("/auth/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }),
  deleteUser: (userId) => apiRequest(`/auth/users/${userId}`, { method: "DELETE" })
};

// --- Patient Endpoints ---
const PatientAPI = {
  list: (search = "", limit = 100) => {
    const params = new URLSearchParams();
    if (search) params.append("q", search);
    if (limit) params.append("limit", limit.toString());
    return apiRequest(`/patients?${params.toString()}`);
  },
  get: (id) => apiRequest(`/patients/${id}`),
  create: (data) => apiRequest("/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }),
  update: (id, data) => apiRequest(`/patients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  }),
  delete: (id) => apiRequest(`/patients/${id}`, { method: "DELETE" })
};

// --- Screening Endpoints ---
const ScreeningAPI = {
  list: (patientId = "") => {
    const params = new URLSearchParams();
    if (patientId) params.append("patient_id", patientId);
    return apiRequest(`/screenings?${params.toString()}`);
  },
  get: (id) => apiRequest(`/screenings/${id}`),
  create: (formData) => apiRequest("/screenings", {
    method: "POST",
    body: formData // multipart/form-data sent natively
  }),
  analyzePreview: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiRequest("/screenings/analyze-quality-preview", {
      method: "POST",
      body: formData
    });
  },
  analyzeAIPreview: (file) => {
    const formData = new FormData();
    formData.append("image", file);
    return apiRequest("/screenings/analyze-ai-preview", {
      method: "POST",
      body: formData
    });
  },
  runAI: (id) => apiRequest(`/screenings/${id}/run-ai`, {
    method: "POST"
  })
};

// --- System & Stats Endpoints ---
const SystemAPI = {
  health: () => apiRequest("/health"),
  stats: () => apiRequest("/dashboard/stats")
};

// --- Formatting Helpers ---
function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderQualityBadge(status) {
  switch (status) {
    case "Passed":
      return `<span class="badge badge-success">✓ Quality Passed</span>`;
    case "Warning":
      return `<span class="badge badge-warning">⚠ Warning</span>`;
    case "Retake Required":
      return `<span class="badge badge-danger">✗ Retake Required</span>`;
    default:
      return `<span class="badge badge-neutral">${status || "Pending"}</span>`;
  }
}

function renderClassBadge(className) {
  if (!className || className.includes("Pending") || className.includes("Error")) {
    return `<span class="badge badge-neutral">${className || "Unclassified"}</span>`;
  }

  const lower = className.toLowerCase();
  if (lower.includes("no diabetic retinopathy") || lower.includes("class 0") || lower.includes("no dr")) {
    return `<span class="badge badge-success" style="font-weight: 700;">● ${className}</span>`;
  } else if (lower.includes("mild")) {
    return `<span class="badge badge-info" style="font-weight: 700;">● ${className}</span>`;
  } else if (lower.includes("moderate")) {
    return `<span class="badge badge-warning" style="font-weight: 700;">● ${className}</span>`;
  } else if (lower.includes("severe") || lower.includes("proliferative")) {
    return `<span class="badge badge-danger" style="font-weight: 700;">● ${className}</span>`;
  }
  return `<span class="badge badge-info">${className}</span>`;
}
