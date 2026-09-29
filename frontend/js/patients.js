document.addEventListener("DOMContentLoaded", () => {
  if (typeof Auth !== "undefined" && !Auth.protectPage(['doctor', 'admin'], "/pages/login-doctor.html")) {
    return;
  }
  loadPatients();

  // Search input with debounce
  const searchInput = document.getElementById("patient-search");
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        loadPatients(e.target.value.trim());
      }, 300);
    });
  }

  // Modal open / close
  const openModalBtn = document.getElementById("btn-open-patient-modal");
  const closeModalBtn = document.getElementById("btn-close-modal");
  const modal = document.getElementById("patient-modal");

  if (openModalBtn && modal) {
    openModalBtn.addEventListener("click", () => modal.classList.add("active"));
  }
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener("click", () => modal.classList.remove("active"));
  }
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  }

  // Patient Registration Form Submit
  const patientForm = document.getElementById("register-patient-form");
  if (patientForm) {
    patientForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      await handlePatientRegistration(patientForm, modal);
    });
  }
});

async function loadPatients(searchQuery = "") {
  const tbody = document.getElementById("patients-tbody");
  if (!tbody) return;

  try {
    const patients = await PatientAPI.list(searchQuery);

    if (!patients || patients.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-dim); padding: 2.5rem;">
            ${searchQuery ? 'No matching patients found.' : 'No patients registered yet. Click "Register Patient" to add.'}
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = patients.map(p => {
      const dmBadge = p.diabetes_type && p.diabetes_type !== "None"
        ? `<span class="badge badge-warning">${p.diabetes_type} (${p.diabetes_duration_years ?? '?'} yrs)</span>`
        : `<span class="badge badge-neutral">No Diabetes</span>`;

      const htnBadge = p.hypertension
        ? `<span class="badge badge-danger">HTN</span>`
        : ``;

      return `
        <tr>
          <td>
            <span style="font-weight: 700; color: var(--accent-cyan);">${p.patient_id}</span>
          </td>
          <td>
            <div style="font-weight: 600;">${p.full_name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${p.contact_phone || 'No phone'}</div>
          </td>
          <td>${p.age} yrs / ${p.gender}</td>
          <td>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              ${dmBadge}
              ${htnBadge}
            </div>
          </td>
          <td>
            <span class="badge badge-info">${p.screening_count} Screenings</span>
          </td>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${formatDate(p.created_at)}</td>
          <td>
            <div style="display: flex; gap: 0.5rem;">
              <a href="/pages/new_screening.html?patient_id=${p.patient_id}" class="btn btn-primary btn-sm">
                + New Screening
              </a>
              <a href="/pages/screenings.html?patient_id=${p.patient_id}" class="btn btn-secondary btn-sm">
                History
              </a>
            </div>
          </td>
        </tr>
      `;
    }).join("");

  } catch (err) {
    console.error("Error loading patients:", err);
    showToast("Error loading patients list from local SQLite", "error");
  }
}

async function handlePatientRegistration(form, modal) {
  const formData = new FormData(form);
  const data = {
    full_name: formData.get("full_name"),
    age: parseInt(formData.get("age"), 10),
    gender: formData.get("gender"),
    contact_phone: formData.get("contact_phone") || null,
    contact_email: formData.get("contact_email") || null,
    diabetes_type: formData.get("diabetes_type") || "None",
    diabetes_duration_years: formData.get("diabetes_duration_years") ? parseFloat(formData.get("diabetes_duration_years")) : null,
    hypertension: formData.get("hypertension") === "on",
    medical_history: formData.get("medical_history") || null
  };

  try {
    const newPatient = await PatientAPI.create(data);
    showToast(`Patient ${newPatient.full_name} registered successfully (${newPatient.patient_id})`, "success");
    form.reset();
    if (modal) modal.classList.remove("active");
    await loadPatients();
  } catch (err) {
    console.error("Failed to register patient:", err);
    showToast(`Registration failed: ${err.message}`, "error");
  }
}
