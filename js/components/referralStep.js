// RetinaScan AI - Step 4: Clinical Action Plan & Specialist Referral

export function renderReferralStep(state, onTransmitReferral, onExportReport, onScheduleRecall) {
  const p = state.currentPatient;
  const scan = p.scans.OD;
  const diag = scan.diagnosis;
  const selectedSpec = state.selectedSpecialist || state.specialists[0];

  return `
    <div class="space-y-8 pb-12 animate-fadeIn">
      
      <!-- Patient & Encounter Status Header -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
            <img src="${p.photoUrl}" alt="${p.name}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\'><rect width=\\'24\\' height=\\'24\\' fill=\\'%23CBD5E1\\'/></svg>'"/>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base font-bold text-slate-900 font-headline">Patient: #${p.id} • ${p.name}</h1>
              <span class="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold rounded">
                ${diag.icdrStage}
              </span>
            </div>
            <p class="text-xs text-slate-500">
              Primary Care: <strong>${p.pcp}</strong> • Encounter Date: <strong>${p.encounterDate}</strong> • MRN: <strong>${p.mrn}</strong>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            id="btn-quick-export-pdf"
            class="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <span class="material-symbols-outlined text-sm text-teal-400">picture_as_pdf</span>
            <span>Export Official PDF Report</span>
          </button>
        </div>
      </div>

      <!-- Clinical Action Protocol Card -->
      <section class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-base font-bold text-slate-900 font-headline">Clinical Recommendations & Care Protocol</h2>
            <p class="text-xs text-slate-500">Evidence-based clinical guidelines (AAO Preferred Practice Pattern & ADA Standards of Care)</p>
          </div>
          <span class="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-800 border border-red-200 rounded-full text-xs font-bold font-mono">
            <span class="material-symbols-outlined text-xs text-red-600">notification_important</span>
            ${diag.urgency} (${diag.timeframe})
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <h3 class="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <span class="material-symbols-outlined text-teal-600 text-base">local_hospital</span>
              Immediate Ophthalmic Management
            </h3>
            <ul class="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>Comprehensive dilated ophthalmic examination within <strong>${diag.timeframe}</strong>.</li>
              <li>Order <strong>Macular Optical Coherence Tomography (OCT)</strong> to evaluate subclinical cystoid retinal thickening.</li>
              <li>Assess indication for intravitreal Anti-VEGF pharmacotherapy or focal laser photocoagulation.</li>
            </ul>
          </div>

          <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <h3 class="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <span class="material-symbols-outlined text-teal-600 text-base">vital_signs</span>
              Systemic Metabolic Optimization
            </h3>
            <ul class="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>Referral to Endocrinology for intensive glycemic control (Current HbA1c: <strong>${p.hba1c}%</strong>).</li>
              <li>Blood pressure stabilization target of &lt;130/80 mmHg (Current: <strong>${p.bpSystolic}/${p.bpDiastolic} mmHg</strong>).</li>
              <li>Serum lipid panel assessment to mitigate circinate hard exudate formation.</li>
            </ul>
          </div>

        </div>
      </section>

      <!-- Specialist Referral Directory & Routing -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-bold text-slate-900 font-headline">Specialist Referral & Directory Routing</h2>
            <p class="text-xs text-slate-500">Verified regional vitreoretinal surgeons with direct DICOM/HL7 integration</p>
          </div>
          <span class="text-xs text-slate-500 font-semibold">${state.specialists.length} In-Network Specialists Found</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${state.specialists.map(spec => {
            const isSelected = spec.id === selectedSpec.id;
            return `
              <div
                data-specialist-id="${spec.id}"
                class="bg-white border rounded-xl p-5 shadow-sm transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow'
                }"
              >
                <div class="flex items-start gap-3.5">
                  <div class="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                    <img src="${spec.photoUrl}" alt="${spec.name}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\'><rect width=\\'24\\' height=\\'24\\' fill=\\'%23CBD5E1\\'/></svg>'"/>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                      <h3 class="font-bold text-slate-900 text-sm truncate">${spec.name}</h3>
                      <span class="text-xs text-slate-500 font-mono flex items-center gap-0.5">
                        <span class="material-symbols-outlined text-xs text-amber-500 fill-1">star</span>
                        ${spec.rating}
                      </span>
                    </div>
                    <p class="text-xs text-teal-700 font-semibold">${spec.title}</p>
                    <p class="text-[11px] text-slate-500 truncate">${spec.facility} • ${spec.distance}</p>

                    <div class="mt-2 flex items-center gap-2 text-[11px]">
                      <span class="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                        Next: ${spec.nextAvailable}
                      </span>
                      ${spec.acceptingUrgent ? `
                        <span class="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded font-semibold text-[10px]">
                          Accepts Urgent
                        </span>
                      ` : ''}
                    </div>
                  </div>
                </div>

                <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span class="text-slate-400 text-[11px]">Insurance: ${spec.insurance.slice(0, 2).join(', ')}...</span>
                  <button
                    class="btn-select-specialist px-3 py-1.5 rounded-lg font-semibold transition-all text-xs ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }"
                    data-spec-id="${spec.id}"
                  >
                    ${isSelected ? 'Selected Provider' : 'Select Specialist'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Referral Dispatch Box -->
        <div class="bg-slate-900 text-white rounded-xl p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-teal-400 text-xl">send</span>
              <h3 class="font-bold text-sm font-headline">Ready to Dispatch Referral</h3>
            </div>
            <p class="text-xs text-slate-400 mt-1">
              Target Provider: <strong class="text-white">${selectedSpec.name}</strong> (${selectedSpec.facility})
            </p>
          </div>

          <button
            id="btn-dispatch-referral"
            class="flex items-center gap-2 px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg shadow transition-all text-xs"
          >
            <span>Transmit Referral via DICOM / EHR</span>
            <span class="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </section>

      <!-- Documentation & Attestation Hub -->
      <section class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 class="text-base font-bold text-slate-900 font-headline">Clinical Documentation & Attestation Hub</h2>
            <p class="text-xs text-slate-500">Official physician review, digital e-signature, and patient recall scheduling</p>
          </div>
          <span class="material-symbols-outlined text-slate-400">verified_user</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          
          <!-- Recall Scheduler -->
          <div class="space-y-3">
            <h3 class="font-bold text-slate-900 text-xs uppercase tracking-wider">Automated Retinal Recall Scheduling</h3>
            <p class="text-slate-500 leading-relaxed">
              Programmatic follow-up timer configured based on ICDR clinical severity classification:
            </p>
            
            <div class="grid grid-cols-2 gap-2">
              <button class="btn-recall-choice p-2.5 rounded-lg border border-teal-500 bg-teal-50/50 text-teal-900 font-bold text-left text-xs" data-weeks="4">
                2 - 4 Weeks (Active DME)
              </button>
              <button class="btn-recall-choice p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-left text-xs" data-weeks="12">
                3 Months (Follow-up)
              </button>
              <button class="btn-recall-choice p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-left text-xs" data-weeks="26">
                6 Months (Mild NPDR)
              </button>
              <button class="btn-recall-choice p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-left text-xs" data-weeks="52">
                12 Months (Annual Exam)
              </button>
            </div>

            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <span class="text-slate-600 font-medium">Automatic Patient SMS & Recall Alert:</span>
              <span class="text-teal-700 font-bold font-mono">Enabled (Opt-in)</span>
            </div>
          </div>

          <!-- Digital Clinician Signature Pad -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-slate-900 text-xs uppercase tracking-wider">Physician Sign-Off Attestation</h3>
              <button id="btn-clear-signature" class="text-slate-500 hover:text-slate-800 text-[11px] underline">
                Clear Pad
              </button>
            </div>
            <p class="text-slate-500">
              Sign below to certify clinical review of AI inferences before committing to EHR:
            </p>

            <canvas id="signature-canvas" width="360" height="100" class="w-full h-24 block"></canvas>
            
            <div class="flex items-center justify-between text-[11px] text-slate-400">
              <span>Dr. Elizabeth Thorne, MD (Lic #MD-90482)</span>
              <span class="font-mono text-emerald-700 font-semibold">Attestation Recorded</span>
            </div>
          </div>

        </div>
      </section>

      <!-- Referral Transmission Confirmation Modal Container -->
      <div id="referral-modal" class="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
          <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <span class="material-symbols-outlined text-2xl">check_circle</span>
          </div>

          <div class="text-center">
            <h3 class="text-lg font-bold text-slate-900 font-headline">Clinical Referral Dispatched Successfully</h3>
            <p class="text-xs text-slate-500 mt-1">
              Encounter #${p.id} routed to <strong>${selectedSpec.name}</strong>
            </p>
          </div>

          <div class="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs space-y-1.5 font-mono">
            <p><span class="text-slate-400">HL7 / FHIR Message ID:</span> <strong>MSG-94029410</strong></p>
            <p><span class="text-slate-400">DICOM Study UID:</span> <strong>1.2.840.113619.2.55.3.2</strong></p>
            <p><span class="text-slate-400">Receiving Clinic:</span> <span>${selectedSpec.facility}</span></p>
            <p><span class="text-slate-400">Transmission Status:</span> <strong class="text-emerald-700">ACK RECEIVED (200 OK)</strong></p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              id="btn-close-referral-modal"
              class="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors"
            >
              Done & Return to Overview
            </button>
          </div>
        </div>
      </div>

    </div>
  `;
}
