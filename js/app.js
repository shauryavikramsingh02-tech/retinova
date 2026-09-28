// RetinaScan AI - Master Application Controller & Reactive Store

import { PATIENTS, SPECIALISTS } from './patientData.js';
import { renderHeader } from './components/header.js';
import { renderIntakeStep } from './components/intakeStep.js';
import { renderQualityCheckStep } from './components/qualityCheckStep.js';
import { renderDiagnosisStep } from './components/diagnosisStep.js';
import { renderReferralStep } from './components/referralStep.js';
import { renderMobileCompanion } from './components/mobileCompanion.js';
import { RetinalCanvas } from './utils/retinalCanvas.js';
import { generateClinicalReport } from './utils/pdfReport.js';

class RetinaScanApp {
  constructor() {
    this.state = {
      patients: JSON.parse(JSON.stringify(PATIENTS)),
      currentPatient: null,
      currentStep: 'intake', // 'intake' | 'quality' | 'diagnosis' | 'referral'
      selectedEye: 'OD',
      specialists: SPECIALISTS,
      selectedSpecialist: SPECIALISTS[0],
      isMobileCompanion: false,
      mobileSubTab: 'capture',
      selectedRecallWeeks: 4
    };

    this.state.currentPatient = this.state.patients[0];
    this.activeCanvas = null;
    this.signaturePadCtx = null;
    this.isSigning = false;

    this.init();
  }

  init() {
    this.render();
    this.setupGlobalModals();
  }

  setStep(step) {
    this.state.currentStep = step;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setPatient(patientId) {
    const found = this.state.patients.find(p => p.id === patientId);
    if (found) {
      this.state.currentPatient = found;
      this.state.selectedEye = 'OD';
      this.render();
    }
  }

  toggleEye(eye) {
    this.state.selectedEye = eye;
    this.render();
  }

  render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    // 1. Render Header
    const headerHtml = renderHeader(
      this.state,
      (step) => this.setStep(step),
      (patId) => this.setPatient(patId),
      () => {
        this.state.isMobileCompanion = !this.state.isMobileCompanion;
        this.render();
      },
      () => this.handleExportPdf(),
      () => this.showEmergencyTriageModal()
    );

    // 2. Render Body based on State
    let bodyHtml = '';
    if (this.state.isMobileCompanion) {
      bodyHtml = renderMobileCompanion(
        this.state,
        (tab) => {
          this.state.mobileSubTab = tab;
          this.render();
        },
        () => {
          this.state.mobileSubTab = 'diagnosis';
          this.render();
        },
        () => {
          this.state.isMobileCompanion = false;
          this.render();
        }
      );
    } else {
      switch (this.state.currentStep) {
        case 'intake':
          bodyHtml = renderIntakeStep(
            this.state,
            () => this.setStep('quality'),
            (patId) => this.setPatient(patId)
          );
          break;
        case 'quality':
          bodyHtml = renderQualityCheckStep(
            this.state,
            () => this.executeInference(),
            (eye) => this.toggleEye(eye),
            (url) => this.handleCustomImageUpload(url)
          );
          break;
        case 'diagnosis':
          bodyHtml = renderDiagnosisStep(
            this.state,
            () => this.setStep('referral'),
            (loc) => this.focusBiomarkerLocation(loc),
            (type, active) => this.toggleBiomarkerLayer(type, active),
            (val) => this.setHeatmapOpacity(val)
          );
          break;
        case 'referral':
          bodyHtml = renderReferralStep(
            this.state,
            () => this.showReferralModal(),
            () => this.handleExportPdf(),
            (weeks) => { this.state.selectedRecallWeeks = weeks; }
          );
          break;
        default:
          bodyHtml = renderIntakeStep(this.state, () => this.setStep('quality'), (id) => this.setPatient(id));
      }
    }

    appEl.innerHTML = `
      <div class="min-h-screen flex flex-col bg-[#F8FAFC]">
        ${headerHtml}
        <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          ${bodyHtml}
        </main>
      </div>
    `;

    // 3. Post-Render Bindings
    this.bindHeaderEvents();
    this.bindStepEvents();
  }

  bindHeaderEvents() {
    // Nav step buttons
    document.querySelectorAll('[data-nav-step]').forEach(btn => {
      btn.addEventListener('click', () => {
        const step = btn.getAttribute('data-nav-step');
        this.setStep(step);
      });
    });

    // Patient Selector
    const selector = document.getElementById('patient-selector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        this.setPatient(e.target.value);
      });
    }

    // Companion Toggle
    const modeBtn = document.getElementById('mode-toggle-btn');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        this.state.isMobileCompanion = !this.state.isMobileCompanion;
        this.render();
      });
    }

    // Export PDF
    const exportBtn = document.getElementById('export-pdf-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExportPdf());
    }

    // Emergency Triage
    const triageBtn = document.getElementById('emergency-triage-btn');
    if (triageBtn) {
      triageBtn.addEventListener('click', () => this.showEmergencyTriageModal());
    }
  }

  bindStepEvents() {
    // === INTAKE STEP ===
    if (this.state.currentStep === 'intake' && !this.state.isMobileCompanion) {
      const proceedBtn = document.getElementById('btn-proceed-prescan');
      if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
          // Read form values and update current patient
          const p = this.state.currentPatient;
          const nameInput = document.getElementById('input-patient-name');
          const mrnInput = document.getElementById('input-patient-mrn');
          const hba1cInput = document.getElementById('input-hba1c');
          const bpSysInput = document.getElementById('input-bp-sys');
          const bpDiaInput = document.getElementById('input-bp-dia');
          if (nameInput) p.name = nameInput.value;
          if (mrnInput) p.mrn = mrnInput.value;
          if (hba1cInput) p.hba1c = parseFloat(hba1cInput.value) || p.hba1c;
          if (bpSysInput) p.bpSystolic = parseInt(bpSysInput.value, 10) || p.bpSystolic;
          if (bpDiaInput) p.bpDiastolic = parseInt(bpDiaInput.value, 10) || p.bpDiastolic;
          this.setStep('quality');
        });
      }

      // Queue patient clicks
      document.querySelectorAll('[data-queue-patient-id]').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-queue-patient-id');
          this.setPatient(id);
        });
      });
    }

    // === QUALITY CHECK STEP ===
    if (this.state.currentStep === 'quality' && !this.state.isMobileCompanion) {
      const canvasEl = document.getElementById('qc-retinal-canvas');
      if (canvasEl) {
        const scan = this.state.currentPatient.scans[this.state.selectedEye] || this.state.currentPatient.scans.OD;
        this.activeCanvas = new RetinalCanvas(canvasEl);
        this.activeCanvas.showHeatmap = false;
        this.activeCanvas.loadImage(scan.imageUrl, []);

        // Zoom controls
        document.getElementById('qc-zoom-in')?.addEventListener('click', () => this.activeCanvas.zoom(1.2));
        document.getElementById('qc-zoom-out')?.addEventListener('click', () => this.activeCanvas.zoom(0.8));
        document.getElementById('qc-zoom-reset')?.addEventListener('click', () => this.activeCanvas.resetTransform());

        // Optical adjustments
        const redFreeToggle = document.getElementById('qc-toggle-redfree');
        const brightnessSlider = document.getElementById('qc-slider-brightness');
        const contrastSlider = document.getElementById('qc-slider-contrast');

        const updateFilters = () => {
          this.activeCanvas.setFilters({
            brightness: parseInt(brightnessSlider?.value || 0, 10),
            contrast: parseInt(contrastSlider?.value || 0, 10),
            redFree: redFreeToggle?.checked || false
          });
        };

        redFreeToggle?.addEventListener('change', updateFilters);
        brightnessSlider?.addEventListener('input', updateFilters);
        contrastSlider?.addEventListener('input', updateFilters);

        // Eye toggle buttons
        document.getElementById('eye-toggle-od')?.addEventListener('click', () => this.toggleEye('OD'));
        document.getElementById('eye-toggle-os')?.addEventListener('click', () => this.toggleEye('OS'));

        // Custom image upload
        const fileInput = document.getElementById('qc-file-input');
        fileInput?.addEventListener('change', (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const url = URL.createObjectURL(file);
            this.handleCustomImageUpload(url);
          }
        });

        // Run AI Diagnosis with telemetry
        document.getElementById('btn-run-ai-diagnosis')?.addEventListener('click', () => this.executeInference());
        document.getElementById('btn-bypass-qc')?.addEventListener('click', () => this.setStep('diagnosis'));
        document.getElementById('btn-recapture-scan')?.addEventListener('click', () => {
          alert("Re-triggering camera motorized alignment and flash calibration...");
        });
      }
    }

    // === DIAGNOSIS STEP ===
    if (this.state.currentStep === 'diagnosis' && !this.state.isMobileCompanion) {
      const canvasEl = document.getElementById('diag-retinal-canvas');
      if (canvasEl) {
        const scan = this.state.currentPatient.scans[this.state.selectedEye] || this.state.currentPatient.scans.OD;
        const diag = scan.diagnosis;

        this.activeCanvas = new RetinalCanvas(canvasEl);
        this.activeCanvas.showHeatmap = true;
        this.activeCanvas.loadImage(scan.imageUrl, diag.biomarkers || []);

        // Zoom controls
        document.getElementById('diag-zoom-in')?.addEventListener('click', () => this.activeCanvas.zoom(1.2));
        document.getElementById('diag-zoom-out')?.addEventListener('click', () => this.activeCanvas.zoom(0.8));
        document.getElementById('diag-zoom-reset')?.addEventListener('click', () => this.activeCanvas.resetTransform());

        // Eye toggles
        document.getElementById('diag-eye-toggle-od')?.addEventListener('click', () => this.toggleEye('OD'));
        document.getElementById('diag-eye-toggle-os')?.addEventListener('click', () => this.toggleEye('OS'));

        // Heatmap slider
        const heatmapSlider = document.getElementById('diag-slider-heatmap');
        const heatmapVal = document.getElementById('diag-heatmap-val');
        heatmapSlider?.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          if (heatmapVal) heatmapVal.textContent = `${val}%`;
          this.activeCanvas.setHeatmapOpacity(val / 100);
        });

        // ETDRS toggle
        document.getElementById('diag-toggle-etdrs')?.addEventListener('change', (e) => {
          this.activeCanvas.toggleEtdrsGrid(e.target.checked);
        });

        // Red-free toggle
        document.getElementById('diag-toggle-redfree')?.addEventListener('change', (e) => {
          this.activeCanvas.setFilters({ redFree: e.target.checked });
        });

        // Layer toggles
        ['microaneurysm', 'hard_exudate', 'hemorrhage', 'cotton_wool'].forEach(type => {
          document.getElementById(`toggle-layer-${type}`)?.addEventListener('change', (e) => {
            this.activeCanvas.toggleBiomarker(type, e.target.checked);
          });
        });

        // Clickable finding targets
        document.querySelectorAll('.btn-finding-target').forEach(btn => {
          btn.addEventListener('click', () => {
            const x = parseFloat(btn.getAttribute('data-finding-x'));
            const y = parseFloat(btn.getAttribute('data-finding-y'));
            const label = btn.getAttribute('data-finding-label');
            this.activeCanvas.selectedFinding = { label, x, y };
            this.activeCanvas.focusOnLocation(x, y);
          });
        });

        // CTA buttons
        document.getElementById('btn-proceed-referral')?.addEventListener('click', () => this.setStep('referral'));
        document.getElementById('btn-rerun-inference')?.addEventListener('click', () => {
          alert("Re-running multi-scale ensemble model inference with test-time augmentation...");
          this.render();
        });
      }
    }

    // === REFERRAL STEP ===
    if (this.state.currentStep === 'referral' && !this.state.isMobileCompanion) {
      // Specialist selection
      document.querySelectorAll('[data-specialist-id]').forEach(card => {
        card.addEventListener('click', (e) => {
          const specId = card.getAttribute('data-specialist-id');
          const found = this.state.specialists.find(s => s.id === specId);
          if (found) {
            this.state.selectedSpecialist = found;
            this.render();
          }
        });
      });

      // Export PDF button
      document.getElementById('btn-quick-export-pdf')?.addEventListener('click', () => this.handleExportPdf());

      // Dispatch referral button
      document.getElementById('btn-dispatch-referral')?.addEventListener('click', () => this.showReferralModal());

      // Recall buttons
      document.querySelectorAll('.btn-recall-choice').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.btn-recall-choice').forEach(b => {
            b.classList.remove('border-teal-500', 'bg-teal-50/50', 'text-teal-900', 'font-bold');
            b.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-700', 'font-medium');
          });
          btn.classList.add('border-teal-500', 'bg-teal-50/50', 'text-teal-900', 'font-bold');
          btn.classList.remove('border-slate-200', 'bg-slate-50', 'text-slate-700', 'font-medium');
        });
      });

      // Signature Pad setup
      this.initSignaturePad();
    }

    // === MOBILE COMPANION ===
    if (this.state.isMobileCompanion) {
      document.getElementById('btn-exit-mobile')?.addEventListener('click', () => {
        this.state.isMobileCompanion = false;
        this.render();
      });

      document.getElementById('mobile-tab-capture')?.addEventListener('click', () => {
        this.state.mobileSubTab = 'capture';
        this.render();
      });

      document.getElementById('mobile-tab-diagnosis')?.addEventListener('click', () => {
        this.state.mobileSubTab = 'diagnosis';
        this.render();
      });

      document.getElementById('btn-mobile-snap')?.addEventListener('click', () => {
        this.state.mobileSubTab = 'diagnosis';
        this.render();
      });

      document.getElementById('btn-mobile-dispatch')?.addEventListener('click', () => {
        alert("Referral electronically transmitted to Dr. Sarah Jenkins (Metro VitreoRetinal Institute) via HL7/FHIR.");
      });

      document.getElementById('btn-mobile-sms')?.addEventListener('click', () => {
        alert("Patient summary and educational care guide dispatched via SMS to (555) 234-8901.");
      });
    }
  }

  initSignaturePad() {
    const canvas = document.getElementById('signature-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    this.signaturePadCtx = ctx;

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    // Pre-draw elegant sample signature
    ctx.beginPath();
    ctx.moveTo(30, 60);
    ctx.bezierCurveTo(50, 20, 70, 70, 90, 50);
    ctx.bezierCurveTo(110, 30, 130, 60, 170, 45);
    ctx.bezierCurveTo(200, 30, 240, 65, 290, 55);
    ctx.stroke();

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e) => {
      this.isSigning = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const moveDraw = (e) => {
      if (!this.isSigning) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const stopDraw = () => {
      this.isSigning = false;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', stopDraw);

    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDraw(e); }, { passive: false });
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); moveDraw(e); }, { passive: false });
    window.addEventListener('touchend', stopDraw);

    document.getElementById('btn-clear-signature')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }

  executeInference() {
    const progressEl = document.getElementById('ai-telemetry-progress');
    const barEl = document.getElementById('telemetry-bar');
    const labelEl = document.getElementById('telemetry-label');
    const percentEl = document.getElementById('telemetry-percent');
    const btnAi = document.getElementById('btn-run-ai-diagnosis');
    const btnText = document.getElementById('btn-ai-text');

    if (progressEl) progressEl.classList.remove('hidden');
    if (btnAi) btnAi.disabled = true;
    if (btnText) btnText.textContent = 'Inference in Progress...';

    const stages = [
      { p: 25, msg: 'Loading optical matrix & normalizing retinal illumination...' },
      { p: 55, msg: 'Segmenting microvasculature & extracting foveal coordinates...' },
      { p: 85, msg: 'Classifying ICDR severity & Macular Edema risk...' },
      { p: 100, msg: 'Diagnostic inference completed (Concordance: 94.2%).' }
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current >= stages.length) {
        clearInterval(interval);
        setTimeout(() => {
          this.setStep('diagnosis');
        }, 400);
        return;
      }
      const stage = stages[current];
      if (barEl) barEl.style.width = `${stage.p}%`;
      if (percentEl) percentEl.textContent = `${stage.p}%`;
      if (labelEl) labelEl.textContent = stage.msg;
      current++;
    }, 320);
  }

  handleCustomImageUpload(url) {
    const scan = this.state.currentPatient.scans[this.state.selectedEye] || this.state.currentPatient.scans.OD;
    scan.imageUrl = url;
    if (this.activeCanvas) {
      this.activeCanvas.loadImage(url, []);
    }
  }

  handleExportPdf() {
    generateClinicalReport(this.state.currentPatient, this.state.selectedSpecialist);
  }

  showReferralModal() {
    const modal = document.getElementById('referral-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.getElementById('btn-close-referral-modal')?.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }
  }

  showEmergencyTriageModal() {
    alert(
      "EMERGENCY RETINAL TRIAGE PROTOCOL ACTIVATED:\n\n" +
      "If the patient exhibits active vitreous hemorrhage, retinal detachment, or acute visual acuity drop:\n" +
      "1. Direct transfer to Emergency Ophthalmic Services immediately.\n" +
      "2. Notify on-call Vitreoretinal Fellow at (555) 911-EYES.\n" +
      "3. Export immediate STAT clinical packet via RetinaScan AI Hub."
    );
  }

  setupGlobalModals() {
    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.handleExportPdf();
      }
    });
  }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  window.retinaScanApp = new RetinaScanApp();
});
