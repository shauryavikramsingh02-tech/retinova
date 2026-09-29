document.addEventListener("DOMContentLoaded", async () => {
  if (typeof Auth !== "undefined" && !Auth.protectPage(['doctor', 'admin', 'patient'], "/pages/login.html")) {
    return;
  }
  const urlParams = new URLSearchParams(window.location.search);
  const screeningId = urlParams.get("id");

  if (!screeningId) {
    showToast("No screening ID provided in URL", "error");
    return;
  }

  await loadScreeningDetails(screeningId);

  // Setup Re-run AI & Grad-CAM button
  const btnRerun = document.getElementById("btn-rerun-ai");
  if (btnRerun) {
    btnRerun.addEventListener("click", async () => {
      btnRerun.disabled = true;
      const originalText = btnRerun.innerHTML;
      btnRerun.innerHTML = "Computing Grad-CAM...";
      try {
        showToast("Running PyTorch backpropagation and generating Grad-CAM heatmaps...", "info");
        await ScreeningAPI.runAI(screeningId);
        showToast("Grad-CAM heatmaps and overlays updated successfully!", "success");
        await loadScreeningDetails(screeningId);
      } catch (err) {
        console.error("Failed to re-run AI:", err);
        showToast(`AI inference error: ${err.message}`, "error");
      } finally {
        btnRerun.disabled = false;
        btnRerun.innerHTML = originalText;
      }
    });
  }
});

async function loadScreeningDetails(id) {
  try {
    const s = await ScreeningAPI.get(id);

    // Page title and ID
    document.getElementById("detail-screening-id").textContent = s.screening_id;
    document.getElementById("detail-screening-date").textContent = formatDate(s.screening_date);
    document.getElementById("detail-quality-badge").innerHTML = renderQualityBadge(s.quality_status);

    if (s.overall_predicted_class) {
      document.getElementById("detail-ai-badge").innerHTML = renderClassBadge(s.overall_predicted_class);
    }

    // Patient Demographics
    const p = s.patient || {};
    document.getElementById("p-name").textContent = p.full_name || "N/A";
    document.getElementById("p-code").textContent = p.patient_id || "N/A";
    document.getElementById("p-age-gender").textContent = `${p.age || '?'} yrs / ${p.gender || 'N/A'}`;
    document.getElementById("p-diabetes").textContent = p.diabetes_type && p.diabetes_type !== "None"
      ? `${p.diabetes_type} (${p.diabetes_duration_years ?? '?'} yrs)`
      : "Non-Diabetic";
    document.getElementById("p-htn").textContent = p.hypertension ? "Hypertensive" : "Normal BP";
    document.getElementById("p-notes").textContent = s.clinical_notes || "None documented";

    // Visual Acuity
    document.getElementById("va-os-display").textContent = s.visual_acuity_left || "Not recorded";
    document.getElementById("va-od-display").textContent = s.visual_acuity_right || "Not recorded";

    // Populate Left Eye (OS) Visuals & AI
    renderEyeAIAndImages("os", s.left_eye_image_url, s.left_eye_ai);
    // Populate Right Eye (OD) Visuals & AI
    renderEyeAIAndImages("od", s.right_eye_image_url, s.right_eye_ai);

    // Populate Quality Metrics for both eyes
    renderEyeQualityCard("os", s.left_eye_quality);
    renderEyeQualityCard("od", s.right_eye_quality);

  } catch (err) {
    console.error("Failed to load screening detail:", err);
    showToast(`Error loading screening details: ${err.message}`, "error");
  }
}

function renderEyeAIAndImages(eyeSide, originalUrl, aiData) {
  const imgOriginal = document.getElementById(`img-${eyeSide}-original`);
  const imgHeatmap = document.getElementById(`img-${eyeSide}-heatmap`);
  const imgOverlay = document.getElementById(`img-${eyeSide}-overlay`);

  if (imgOriginal && originalUrl) {
    imgOriginal.src = originalUrl;
  }

  const badgeElem = document.getElementById(`${eyeSide}-prediction-badge`);
  const nameElem = document.getElementById(`${eyeSide}-predicted-class-name`);
  const confElem = document.getElementById(`${eyeSide}-confidence-value`);
  const barElem = document.getElementById(`${eyeSide}-confidence-bar`);
  const probList = document.getElementById(`${eyeSide}-prob-breakdown`);

  if (!aiData) {
    if (badgeElem) badgeElem.innerHTML = `<span class="badge badge-neutral">Inference Pending</span>`;
    if (nameElem) nameElem.textContent = "Click 'Re-run PyTorch & Grad-CAM' above";
    if (confElem) confElem.textContent = "--%";
    if (barElem) barElem.style.width = "0%";
    if (imgHeatmap) imgHeatmap.src = originalUrl || "";
    if (imgOverlay) imgOverlay.src = originalUrl || "";
    return;
  }

  // Populate Tri-view images
  if (imgHeatmap && aiData.heatmap_url) {
    imgHeatmap.src = `${aiData.heatmap_url}?t=${Date.now()}`;
  }
  if (imgOverlay && aiData.overlay_url) {
    imgOverlay.src = `${aiData.overlay_url}?t=${Date.now()}`;
  }

  // Populate Predicted Class & Confidence
  if (badgeElem) {
    badgeElem.innerHTML = renderClassBadge(aiData.predicted_class_name);
  }
  if (nameElem) {
    nameElem.textContent = aiData.predicted_class_name;
  }
  if (confElem) {
    confElem.textContent = `${aiData.confidence_percent ?? (aiData.confidence * 100).toFixed(1)}%`;
  }
  if (barElem) {
    const pct = aiData.confidence_percent ?? (aiData.confidence * 100);
    barElem.style.width = `${Math.min(100, Math.max(5, pct))}%`;
  }

  // Populate Class Probability Distribution
  if (probList && aiData.class_probabilities) {
    const entries = Object.entries(aiData.class_probabilities);
    probList.innerHTML = `
      <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-bottom: 0.2rem;">
        Class Probability Distribution:
      </div>
      ${entries.map(([cls, prob]) => {
        const pct = (prob * 100).toFixed(1);
        const isTarget = cls === aiData.predicted_class_short;
        const barColor = isTarget ? "var(--accent-cyan)" : "#475569";
        return `
          <div class="prob-row">
            <span class="prob-label" title="${cls}">${cls}</span>
            <div class="prob-track">
              <div class="prob-fill" style="width: ${pct}%; background: ${barColor};"></div>
            </div>
            <span class="prob-percent">${pct}%</span>
          </div>
        `;
      }).join("")}
    `;
  }
}

function renderEyeQualityCard(eyeSide, q) {
  const container = document.getElementById(`quality-metrics-${eyeSide}`);
  if (!container || !q) return;

  const sharpnessBadge = q.sharpness_status === "Sharp"
    ? `<span class="badge badge-success">Sharp (${q.sharpness_score})</span>`
    : q.sharpness_status === "Acceptable"
    ? `<span class="badge badge-warning">Acceptable (${q.sharpness_score})</span>`
    : `<span class="badge badge-danger">Blurry (${q.sharpness_score})</span>`;

  const brightnessBadge = q.brightness_status === "Normal"
    ? `<span class="badge badge-success">Normal (${q.brightness_mean})</span>`
    : `<span class="badge badge-danger">${q.brightness_status} (${q.brightness_mean})</span>`;

  const contrastBadge = q.contrast_status === "Good"
    ? `<span class="badge badge-success">Good (${q.contrast_score})</span>`
    : q.contrast_status === "Moderate"
    ? `<span class="badge badge-warning">Moderate (${q.contrast_score})</span>`
    : `<span class="badge badge-danger">Low (${q.contrast_score})</span>`;

  const resBadge = q.resolution_status === "Adequate"
    ? `<span class="badge badge-success">${q.resolution_width}x${q.resolution_height}</span>`
    : `<span class="badge badge-danger">Low (${q.resolution_width}x${q.resolution_height})</span>`;

  let issuesHtml = "";
  if (q.issues && q.issues.length > 0) {
    issuesHtml = `
      <div style="margin-top: 0.75rem; padding: 0.75rem; background: var(--status-danger-bg); border-radius: var(--radius-sm); border: 1px solid rgba(239, 68, 68, 0.3);">
        <div style="font-weight: 600; color: #f87171; font-size: 0.8rem; margin-bottom: 0.25rem;">Quality Warnings:</div>
        <ul style="padding-left: 1.2rem; font-size: 0.8rem; color: #fca5a5;">
          ${q.issues.map(iss => `<li>${iss}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  let recsHtml = "";
  if (q.recommendations && q.recommendations.length > 0) {
    recsHtml = `
      <div style="margin-top: 0.5rem; padding: 0.75rem; background: rgba(56, 189, 248, 0.08); border-radius: var(--radius-sm); border: 1px solid rgba(56, 189, 248, 0.2);">
        <div style="font-weight: 600; color: #38bdf8; font-size: 0.8rem; margin-bottom: 0.25rem;">Technician Recommendations:</div>
        <ul style="padding-left: 1.2rem; font-size: 0.8rem; color: #bae6fd;">
          ${q.recommendations.map(rec => `<li>${rec}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="quality-metrics-list">
      <div class="metric-row">
        <span class="metric-name">Sharpness (Laplacian var)</span>
        <span class="metric-val">${sharpnessBadge}</span>
      </div>
      <div class="metric-row">
        <span class="metric-name">Illumination / Exposure</span>
        <span class="metric-val">${brightnessBadge}</span>
      </div>
      <div class="metric-row">
        <span class="metric-name">Vascular Contrast</span>
        <span class="metric-val">${contrastBadge}</span>
      </div>
      <div class="metric-row">
        <span class="metric-name">Pixel Resolution</span>
        <span class="metric-val">${resBadge}</span>
      </div>
      <div class="metric-row">
        <span class="metric-name">Retinal FOV Coverage</span>
        <span class="metric-val">${q.retinal_mask_coverage ?? 0}%</span>
      </div>
    </div>
    ${issuesHtml}
    ${recsHtml}
  `;
}
