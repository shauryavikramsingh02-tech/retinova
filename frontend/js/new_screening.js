let leftEyeFile = null;
let rightEyeFile = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof Auth !== "undefined" && !Auth.protectPage(['doctor', 'admin'], "/pages/login-doctor.html")) {
    return;
  }
  // Check URL query parameters for pre-selected patient
  const urlParams = new URLSearchParams(window.location.search);
  const preselectedPatientId = urlParams.get("patient_id");

  await loadPatientsDropdown(preselectedPatientId);

  // Setup Left Eye Dropzone (OS)
  setupDropzone(
    "dropzone-os",
    "file-input-os",
    "preview-os",
    (file) => { leftEyeFile = file; }
  );

  // Setup Right Eye Dropzone (OD)
  setupDropzone(
    "dropzone-od",
    "file-input-od",
    "preview-od",
    (file) => { rightEyeFile = file; }
  );

  // Load Demo Samples Button
  const btnDemoSamples = document.getElementById("btn-load-demo-samples");
  if (btnDemoSamples) {
    btnDemoSamples.addEventListener("click", loadDemoSamples);
  }

  // Live Pre-check Quality Button
  const btnPrecheck = document.getElementById("btn-precheck-quality");
  if (btnPrecheck) {
    btnPrecheck.addEventListener("click", runQualityPrecheck);
  }

  // Form submission
  const form = document.getElementById("new-screening-form");
  if (form) {
    form.addEventListener("submit", handleScreeningSubmit);
  }
});

async function loadPatientsDropdown(selectedId = null) {
  const select = document.getElementById("patient-select");
  if (!select) return;

  try {
    const patients = await PatientAPI.list();
    if (!patients || patients.length === 0) {
      select.innerHTML = `<option value="">No registered patients. Please register a patient first.</option>`;
      return;
    }

    select.innerHTML = `
      <option value="">-- Select Patient for Screening --</option>
      ${patients.map(p => `
        <option value="${p.patient_id}" ${selectedId === p.patient_id ? "selected" : ""}>
          ${p.patient_id} - ${p.full_name} (${p.age}y, ${p.diabetes_type || 'No DM'})
        </option>
      `).join("")}
    `;
  } catch (err) {
    console.error("Failed to load patients dropdown:", err);
    showToast("Error loading patients dropdown", "error");
  }
}

function setupDropzone(dropzoneId, inputId, previewContainerId, onFileSelect) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  const previewContainer = document.getElementById(previewContainerId);

  if (!dropzone || !input || !previewContainer) return;

  dropzone.addEventListener("click", () => input.click());

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  input.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  });

  function handleFile(file) {
    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file (JPEG or PNG)", "warning");
      return;
    }

    onFileSelect(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      dropzone.classList.add("has-file");
      dropzone.querySelector(".dropzone-default").style.display = "none";

      previewContainer.innerHTML = `
        <div class="dropzone-preview">
          <img src="${event.target.result}" class="preview-img" alt="Fundus preview" />
          <div class="preview-filename">${file.name} (${Math.round(file.size / 1024)} KB)</div>
          <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 0.5rem;" onclick="event.stopPropagation(); resetDropzone('${dropzoneId}', '${inputId}', '${previewContainerId}', ${dropzoneId.includes('os')})">
            Change Image
          </button>
        </div>
      `;
    };
    reader.readAsDataURL(file);
  }
}

window.resetDropzone = function(dropzoneId, inputId, previewContainerId, isLeftEye) {
  const dropzone = document.getElementById(dropzoneId);
  const input = document.getElementById(inputId);
  const previewContainer = document.getElementById(previewContainerId);

  if (dropzone) {
    dropzone.classList.remove("has-file");
    const defaultView = dropzone.querySelector(".dropzone-default");
    if (defaultView) defaultView.style.display = "flex";
  }
  if (input) input.value = "";
  if (previewContainer) previewContainer.innerHTML = "";

  if (isLeftEye) {
    leftEyeFile = null;
  } else {
    rightEyeFile = null;
  }
};

async function loadDemoSamples() {
  try {
    showToast("Fetching high-quality synthetic demo fundus images...", "info");

    // Fetch OD (Right Eye) demo
    const odResp = await fetch("/data/demo/sample_OD_normal.jpg");
    const odBlob = await odResp.blob();
    rightEyeFile = new File([odBlob], "sample_OD_normal.jpg", { type: "image/jpeg" });

    // Fetch OS (Left Eye) demo
    const osResp = await fetch("/data/demo/sample_OS_normal.jpg");
    const osBlob = await osResp.blob();
    leftEyeFile = new File([osBlob], "sample_OS_normal.jpg", { type: "image/jpeg" });

    // Update OD dropzone UI
    const odDropzone = document.getElementById("dropzone-od");
    const odPreview = document.getElementById("preview-od");
    odDropzone.classList.add("has-file");
    odDropzone.querySelector(".dropzone-default").style.display = "none";
    odPreview.innerHTML = `
      <div class="dropzone-preview">
        <img src="/data/demo/sample_OD_normal.jpg" class="preview-img" alt="OD normal demo" />
        <div class="preview-filename">sample_OD_normal.jpg (Synthetic OD Normal)</div>
        <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 0.5rem;" onclick="event.stopPropagation(); resetDropzone('dropzone-od', 'file-input-od', 'preview-od', false)">
          Change Image
        </button>
      </div>
    `;

    // Update OS dropzone UI
    const osDropzone = document.getElementById("dropzone-os");
    const osPreview = document.getElementById("preview-os");
    osDropzone.classList.add("has-file");
    osDropzone.querySelector(".dropzone-default").style.display = "none";
    osPreview.innerHTML = `
      <div class="dropzone-preview">
        <img src="/data/demo/sample_OS_normal.jpg" class="preview-img" alt="OS normal demo" />
        <div class="preview-filename">sample_OS_normal.jpg (Synthetic OS Normal)</div>
        <button type="button" class="btn btn-secondary btn-sm" style="margin-top: 0.5rem;" onclick="event.stopPropagation(); resetDropzone('dropzone-os', 'file-input-os', 'preview-os', true)">
          Change Image
        </button>
      </div>
    `;

    showToast("Demo fundus images loaded! Ready for quality gate screening.", "success");

  } catch (err) {
    console.error("Failed to load demo fundus files:", err);
    showToast("Could not load demo samples. Ensure sample files exist in data/demo/.", "error");
  }
}

async function runQualityPrecheck() {
  if (!leftEyeFile && !rightEyeFile) {
    showToast("Please upload at least one eye image to run quality pre-check.", "warning");
    return;
  }

  showToast("Running OpenCV Image-Quality analysis...", "info");

  const resultsDiv = document.getElementById("quality-precheck-results");
  if (resultsDiv) resultsDiv.style.display = "block";

  try {
    let html = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">`;

    if (leftEyeFile) {
      const [qOS, aiOS] = await Promise.all([
        ScreeningAPI.analyzePreview(leftEyeFile).catch(e => ({ passed: false, sharpness_score: 0, sharpness_status: 'Err' })),
        ScreeningAPI.analyzeAIPreview(leftEyeFile).catch(e => null)
      ]);

      const aiHtml = aiOS ? `
        <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">PyTorch AI Prediction (OS):</div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem;">
            ${renderClassBadge(aiOS.predicted_class_name)}
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--accent-cyan);">${aiOS.confidence_percent}%</span>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; justify-content: center;">
            <img src="${aiOS.overlay_url}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 1px solid var(--accent-cyan);" title="Grad-CAM Overlay" />
            <img src="${aiOS.heatmap_url}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 1px solid var(--accent-teal);" title="Grad-CAM Heatmap" />
          </div>
        </div>
      ` : '';

      html += `
        <div class="card" style="padding: 1rem; background: var(--bg-surface-elevated);">
          <div style="font-weight: 600; margin-bottom: 0.5rem; color: #38bdf8;">Left Eye (OS) Quality &amp; AI Check</div>
          <div>Quality Gate: ${qOS.passed ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</div>
          <div style="font-size: 0.85rem; margin-top: 0.4rem;">Sharpness: <strong>${qOS.sharpness_score}</strong> (${qOS.sharpness_status})</div>
          <div style="font-size: 0.85rem;">Exposure: <strong>${qOS.brightness_mean}</strong> (${qOS.brightness_status})</div>
          <div style="font-size: 0.85rem;">Contrast: <strong>${qOS.contrast_score}</strong> (${qOS.contrast_status})</div>
          ${aiHtml}
        </div>
      `;
    }

    if (rightEyeFile) {
      const [qOD, aiOD] = await Promise.all([
        ScreeningAPI.analyzePreview(rightEyeFile).catch(e => ({ passed: false, sharpness_score: 0, sharpness_status: 'Err' })),
        ScreeningAPI.analyzeAIPreview(rightEyeFile).catch(e => null)
      ]);

      const aiHtml = aiOD ? `
        <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
          <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600;">PyTorch AI Prediction (OD):</div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem;">
            ${renderClassBadge(aiOD.predicted_class_name)}
            <span style="font-size: 0.85rem; font-weight: 700; color: var(--accent-teal);">${aiOD.confidence_percent}%</span>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; justify-content: center;">
            <img src="${aiOD.overlay_url}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 1px solid var(--accent-cyan);" title="Grad-CAM Overlay" />
            <img src="${aiOD.heatmap_url}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 1px solid var(--accent-teal);" title="Grad-CAM Heatmap" />
          </div>
        </div>
      ` : '';

      html += `
        <div class="card" style="padding: 1rem; background: var(--bg-surface-elevated);">
          <div style="font-weight: 600; margin-bottom: 0.5rem; color: #06b6d4;">Right Eye (OD) Quality &amp; AI Check</div>
          <div>Quality Gate: ${qOD.passed ? '<span class="badge badge-success">Passed</span>' : '<span class="badge badge-danger">Failed</span>'}</div>
          <div style="font-size: 0.85rem; margin-top: 0.4rem;">Sharpness: <strong>${qOD.sharpness_score}</strong> (${qOD.sharpness_status})</div>
          <div style="font-size: 0.85rem;">Exposure: <strong>${qOD.brightness_mean}</strong> (${qOD.brightness_status})</div>
          <div style="font-size: 0.85rem;">Contrast: <strong>${qOD.contrast_score}</strong> (${qOD.contrast_status})</div>
          ${aiHtml}
        </div>
      `;
    }

    html += `</div>`;
    if (resultsDiv) resultsDiv.innerHTML = html;

  } catch (err) {
    console.error("Quality pre-check failed:", err);
    showToast(`Quality check error: ${err.message}`, "error");
  }
}

async function handleScreeningSubmit(e) {
  e.preventDefault();

  const patientSelect = document.getElementById("patient-select");
  if (!patientSelect || !patientSelect.value) {
    showToast("Please select a registered patient for this screening session.", "warning");
    return;
  }

  if (!leftEyeFile || !rightEyeFile) {
    showToast("Please provide both Left Eye (OS) and Right Eye (OD) fundus images.", "warning");
    return;
  }

  const submitBtn = document.getElementById("btn-submit-screening");
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span>Saving & Running OpenCV Quality Gate...</span>`;

  try {
    const formData = new FormData();
    formData.append("patient_id", patientSelect.value);
    formData.append("left_eye_image", leftEyeFile);
    formData.append("right_eye_image", rightEyeFile);

    const notes = document.getElementById("clinical-notes")?.value;
    if (notes) formData.append("clinical_notes", notes);

    const vaOD = document.getElementById("va-od")?.value;
    if (vaOD) formData.append("visual_acuity_right", vaOD);

    const vaOS = document.getElementById("va-os")?.value;
    if (vaOS) formData.append("visual_acuity_left", vaOS);

    const screening = await ScreeningAPI.create(formData);

    showToast(`Screening ${screening.screening_id} created successfully! Redirecting...`, "success");

    setTimeout(() => {
      window.location.href = `/pages/screening_detail.html?id=${screening.screening_id}`;
    }, 1000);

  } catch (err) {
    console.error("Screening upload error:", err);
    showToast(`Upload failed: ${err.message}`, "error");
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}
