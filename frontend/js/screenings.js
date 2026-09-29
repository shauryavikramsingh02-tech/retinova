document.addEventListener("DOMContentLoaded", async () => {
  if (typeof Auth !== "undefined" && !Auth.protectPage(['doctor', 'admin'], "/pages/login-doctor.html")) {
    return;
  }
  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get("patient_id") || "";

  await loadScreenings(patientId);

  // Setup filter buttons
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const statusFilter = btn.dataset.status;
      filterScreenings(statusFilter);
    });
  });
});

let allScreenings = [];

async function loadScreenings(patientId = "") {
  const tbody = document.getElementById("screenings-tbody");
  if (!tbody) return;

  try {
    allScreenings = await ScreeningAPI.list(patientId);

    if (patientId && allScreenings.length > 0) {
      const headerSubtitle = document.getElementById("screenings-subtitle");
      if (headerSubtitle) {
        headerSubtitle.textContent = `Showing screening history for Patient ${allScreenings[0].patient_name} (${allScreenings[0].patient_code})`;
      }
    }

    renderScreeningsTable(allScreenings);

  } catch (err) {
    console.error("Failed to load screenings list:", err);
    showToast("Error loading screenings from local database", "error");
  }
}

function filterScreenings(statusFilter) {
  if (statusFilter === "all") {
    renderScreeningsTable(allScreenings);
  } else {
    const filtered = allScreenings.filter(s => s.quality_status.toLowerCase() === statusFilter.toLowerCase());
    renderScreeningsTable(filtered);
  }
}

function renderScreeningsTable(screenings) {
  const tbody = document.getElementById("screenings-tbody");
  if (!tbody) return;

  if (!screenings || screenings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-dim); padding: 2.5rem;">
          No retinal screenings match the selected criteria.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = screenings.map(s => {
    const leftThumbnail = s.left_eye_image_url
      ? `<img src="${s.left_eye_image_url}" alt="OS" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-cyan);" />`
      : `<span style="color: var(--text-dim);">No OS</span>`;

    const rightThumbnail = s.right_eye_image_url
      ? `<img src="${s.right_eye_image_url}" alt="OD" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 2px solid var(--accent-cyan);" />`
      : `<span style="color: var(--text-dim);">No OD</span>`;

    return `
      <tr>
        <td>
          <a href="/pages/screening_detail.html?id=${s.screening_id}" style="color: var(--accent-cyan); font-weight: 700; text-decoration: none;">
            ${s.screening_id}
          </a>
        </td>
        <td>
          <div style="font-weight: 600;">${s.patient_name || 'Patient'}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.patient_code || ''}</div>
        </td>
        <td>
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <div style="text-align: center;" title="Left Eye (OS)">
              ${leftThumbnail}
              <div style="font-size: 0.65rem; color: var(--text-muted);">OS</div>
            </div>
            <div style="text-align: center;" title="Right Eye (OD)">
              ${rightThumbnail}
              <div style="font-size: 0.65rem; color: var(--text-muted);">OD</div>
            </div>
          </div>
        </td>
        <td>${formatDate(s.screening_date)}</td>
        <td>${renderQualityBadge(s.quality_status)}</td>
        <td>${renderClassBadge(s.overall_predicted_class || s.ai_status)}</td>
        <td style="max-width: 200px; font-size: 0.8rem; color: var(--text-muted);">
          ${s.clinical_notes || 'No notes entered'}
        </td>
        <td>
          <a href="/pages/screening_detail.html?id=${s.screening_id}" class="btn btn-secondary btn-sm">
            Inspect Details
          </a>
        </td>
      </tr>
    `;
  }).join("");
}
