document.addEventListener("DOMContentLoaded", async () => {
  if (typeof Auth !== "undefined") {
    // If not logged in, redirect to portal selector
    if (!Auth.isLoggedIn()) {
      window.location.href = "/pages/login.html";
      return;
    }
    // If logged in as patient, redirect to patient health portal
    const user = Auth.getUser();
    if (user && user.role === "patient") {
      window.location.href = "/pages/patient_portal.html";
      return;
    }
  }
  await loadDashboard();
});

async function loadDashboard() {
  try {
    // 1. Fetch System Health & Stats concurrently
    const [health, stats, recentScreenings] = await Promise.all([
      SystemAPI.health().catch(() => null),
      SystemAPI.stats().catch(() => null),
      ScreeningAPI.list().catch(() => [])
    ]);

    // Update Stats Cards
    if (stats) {
      document.getElementById("stat-total-patients").textContent = stats.total_patients ?? "0";
      document.getElementById("stat-total-screenings").textContent = stats.total_screenings ?? "0";
      document.getElementById("stat-today-screenings").textContent = stats.recent_screenings_today ?? "0";
      document.getElementById("stat-pass-rate").textContent = `${stats.quality_pass_rate ?? 100}%`;
    }

    // Update Health Status Banner
    if (health) {
      const banner = document.getElementById("system-status-indicator");
      if (banner) {
        banner.innerHTML = `
          <div class="status-dot"></div>
          <span>Local Mode: SQLite Active (${health.database?.patient_records ?? 0} records) | OpenCV Active</span>
        `;
      }
    }

    // Render Recent Screenings
    renderRecentScreenings(recentScreenings.slice(0, 6));

  } catch (err) {
    console.error("Failed to load dashboard:", err);
    showToast("Failed to connect to local RetinaCare backend. Ensure server is running.", "error");
  }
}

function renderRecentScreenings(screenings) {
  const tbody = document.getElementById("recent-screenings-tbody");
  if (!tbody) return;

  if (!screenings || screenings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-dim); padding: 2rem;">
          No retinal screenings recorded yet. Click "Start New Screening" to begin.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = screenings.map(s => {
    const leftThumbnail = s.left_eye_image_url
      ? `<img src="${s.left_eye_image_url}" alt="OS" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--accent-cyan);" />`
      : `<span style="color: var(--text-dim);">No OS</span>`;

    const rightThumbnail = s.right_eye_image_url
      ? `<img src="${s.right_eye_image_url}" alt="OD" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1px solid var(--accent-cyan);" />`
      : `<span style="color: var(--text-dim);">No OD</span>`;

    return `
      <tr>
        <td>
          <a href="/pages/screening_detail.html?id=${s.screening_id}" style="color: var(--accent-cyan); font-weight: 600; text-decoration: none;">
            ${s.screening_id}
          </a>
        </td>
        <td>
          <div style="font-weight: 600;">${s.patient_name || 'Patient'}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.patient_code || ''}</div>
        </td>
        <td>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <div title="OS (Left Eye)">${leftThumbnail}</div>
            <div title="OD (Right Eye)">${rightThumbnail}</div>
          </div>
        </td>
        <td>${formatDate(s.screening_date)}</td>
        <td>${renderQualityBadge(s.quality_status)}</td>
        <td>
          ${renderClassBadge(s.overall_predicted_class || s.ai_status)}
        </td>
        <td>
          <a href="/pages/screening_detail.html?id=${s.screening_id}" class="btn btn-secondary btn-sm">
            View Report
          </a>
        </td>
      </tr>
    `;
  }).join("");
}
