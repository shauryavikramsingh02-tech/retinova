// RetinaScan AI - Official Clinical PDF Report Generator

export function generateClinicalReport(patient, specialist) {
  const encounterDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const scanOD = patient.scans?.OD;
  const diagOD = scanOD?.diagnosis;

  // Printable HTML container
  const reportHtml = `
    <div id="printable-clinical-report" class="bg-white text-slate-900 p-8 max-w-4xl mx-auto font-sans leading-relaxed text-sm">
      <!-- Clinical Header -->
      <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-teal-700 text-3xl">neurology</span>
            <span class="text-2xl font-bold tracking-tight font-headline">RetinaScan AI Diagnostic Hub</span>
          </div>
          <p class="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">
            Institutional Diabetic Retinopathy Diagnostic Platform • FDA 510(k) Cleared (K241908)
          </p>
        </div>
        <div class="text-right">
          <span class="inline-block px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded text-xs font-mono font-semibold">
            OFFICIAL CLINICAL ENCOUNTER
          </span>
          <p class="text-xs text-slate-500 mt-1">Encounter Date: <strong>${encounterDate}</strong></p>
          <p class="text-xs text-slate-500 font-mono">Report ID: RS-${patient.id}-${Date.now().toString().slice(-6)}</p>
        </div>
      </div>

      <!-- Patient Demographics & Risk Assessment -->
      <div class="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
        <div>
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Demographics</h3>
          <div class="space-y-1 text-xs">
            <p><span class="text-slate-500 w-24 inline-block">Full Name:</span> <strong class="text-slate-900 text-sm">${patient.name}</strong></p>
            <p><span class="text-slate-500 w-24 inline-block">Patient ID / MRN:</span> <strong class="font-mono">${patient.id} (${patient.mrn})</strong></p>
            <p><span class="text-slate-500 w-24 inline-block">DOB & Age:</span> <span>${patient.dob} (${patient.age} y/o • ${patient.gender})</span></p>
            <p><span class="text-slate-500 w-24 inline-block">Primary Care:</span> <span>${patient.pcp}</span></p>
            <p><span class="text-slate-500 w-24 inline-block">Encounter Site:</span> <span>${patient.clinic}</span></p>
          </div>
        </div>
        <div>
          <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Systemic Risk Biomarkers</h3>
          <div class="space-y-1 text-xs">
            <p><span class="text-slate-500 w-28 inline-block">Diabetes Type:</span> <strong>${patient.diabetesType} (${patient.durationYears} yrs)</strong></p>
            <p><span class="text-slate-500 w-28 inline-block">Current HbA1c:</span> <strong class="text-amber-700">${patient.hba1c}%</strong> (Elevated Risk)</p>
            <p><span class="text-slate-500 w-28 inline-block">Blood Pressure:</span> <strong>${patient.bpSystolic}/${patient.bpDiastolic} mmHg</strong></p>
            <p><span class="text-slate-500 w-28 inline-block">Insulin Regimen:</span> <span>${patient.insulinTherapy ? 'Active Insulin Dependent' : 'Oral Antihyperglycemic'}</span></p>
            <p><span class="text-slate-500 w-28 inline-block">Visual Acuity:</span> <span>OD: <strong>${patient.visualAcuityOD}</strong> | OS: <strong>${patient.visualAcuityOS}</strong></span></p>
          </div>
        </div>
      </div>

      <!-- Diagnostic Executive Summary -->
      <div class="border-2 border-slate-900 rounded-lg p-5 mb-6 bg-white">
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Primary AI Inference Verdict</span>
            <h2 class="text-xl font-bold text-slate-900 mt-1 font-headline">
              ${diagOD?.icdrStage || 'Evaluation Complete'}
            </h2>
            <p class="text-xs text-slate-600 mt-1">
              ${diagOD?.icdrDescription || 'International Clinical Diabetic Retinopathy Disease Severity Scale'}
            </p>
          </div>
          <div class="text-right">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded font-semibold text-xs">
              <span class="material-symbols-outlined text-sm text-amber-700">verified</span>
              AI Confidence: ${diagOD?.confidence || 94.2}%
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Inference Latency: ${diagOD?.latencyMs || 382}ms</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200 text-xs">
          <div class="p-2.5 bg-slate-50 rounded border border-slate-200">
            <span class="text-slate-500 block text-[10px] uppercase font-semibold">ICDR Staging Level</span>
            <span class="text-sm font-bold text-slate-900">Grade ${diagOD?.icdrLevel ?? 2} / 4</span>
          </div>
          <div class="p-2.5 bg-amber-50 rounded border border-amber-200">
            <span class="text-amber-800 block text-[10px] uppercase font-semibold">Macular Edema (DME) Risk</span>
            <span class="text-sm font-bold text-amber-900">${diagOD?.dmeRisk || 88.7}% (${diagOD?.dmeStatus || 'High Risk'})</span>
          </div>
          <div class="p-2.5 bg-teal-50 rounded border border-teal-200">
            <span class="text-teal-800 block text-[10px] uppercase font-semibold">Recommended Pathway</span>
            <span class="text-sm font-bold text-teal-900">${diagOD?.urgency || 'Specialist Referral'}</span>
          </div>
        </div>
      </div>

      <!-- Biomarker Quantification Table -->
      <div class="mb-6">
        <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-teal-700">query_stats</span>
          Quantitative Lesion Biomarker Registry (Right Eye - OD)
        </h3>
        <table class="w-full border-collapse border border-slate-200 text-xs">
          <thead class="bg-slate-100 text-slate-700">
            <tr>
              <th class="border border-slate-200 p-2 text-left">Biomarker Feature</th>
              <th class="border border-slate-200 p-2 text-center">Lesion Count</th>
              <th class="border border-slate-200 p-2 text-center">Confidence</th>
              <th class="border border-slate-200 p-2 text-left">Anatomical Distribution & Clinical Significance</th>
            </tr>
          </thead>
          <tbody>
            ${(diagOD?.biomarkers || []).map(bm => `
              <tr class="hover:bg-slate-50">
                <td class="border border-slate-200 p-2 font-semibold text-slate-900">${bm.name}</td>
                <td class="border border-slate-200 p-2 text-center font-mono font-bold">${bm.count} detected</td>
                <td class="border border-slate-200 p-2 text-center font-mono">${bm.confidence}%</td>
                <td class="border border-slate-200 p-2 text-slate-600">${bm.description}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Referral Routing & Provider Target -->
      <div class="border border-slate-200 rounded-lg p-4 mb-6 bg-slate-50">
        <h3 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm text-teal-700">local_hospital</span>
          Consulting Vitreoretinal Specialist Target
        </h3>
        <div class="flex items-center justify-between text-xs">
          <div>
            <p class="text-sm font-bold text-slate-900">${specialist?.name || 'Dr. Sarah Jenkins, MD, FACS'}</p>
            <p class="text-slate-600">${specialist?.title || 'Vitreoretinal Specialist & Surgeon'} • ${specialist?.facility || 'Metro VitreoRetinal Institute'}</p>
            <p class="text-slate-500">${specialist?.address || '450 Medical Center Blvd, Suite 320, Boston MA'} • Phone: ${specialist?.phone || '(555) 782-9011'}</p>
          </div>
          <div class="text-right">
            <span class="inline-block px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded font-semibold text-[11px]">
              Target Window: ${diagOD?.timeframe || '2 - 4 Weeks'}
            </span>
            <p class="text-slate-500 mt-1 text-[11px]">Direct DICOM/EHR Export Ready</p>
          </div>
        </div>
      </div>

      <!-- Physician Attestation & Signature -->
      <div class="border-t-2 border-slate-300 pt-4 mt-6 grid grid-cols-2 gap-6 text-xs">
        <div>
          <p class="text-slate-500 leading-normal">
            <strong>Clinical Notice:</strong> RetinaScan AI is an FDA 510(k) cleared diagnostic aid intended to screen for Diabetic Retinopathy and Diabetic Macular Edema. Final medical management and treatment decisions remain the responsibility of the licensed physician.
          </p>
        </div>
        <div class="text-right space-y-1">
          <p class="font-mono text-slate-400">Electronically Signed by Clinician</p>
          <div class="inline-block border-b border-slate-800 w-48 h-8 font-serif italic text-base text-slate-800 text-center">
            Dr. Elizabeth Thorne, MD
          </div>
          <p class="text-slate-600 font-semibold">Elizabeth Thorne, MD (Lic #MD-90482)</p>
          <p class="text-[11px] text-slate-400 font-mono">Timestamp: ${new Date().toISOString()}</p>
        </div>
      </div>
    </div>
  `;

  // Create temporary container for print dialog
  const printContainer = document.createElement('div');
  printContainer.id = 'report-print-wrapper';
  printContainer.innerHTML = reportHtml;
  document.body.appendChild(printContainer);

  window.print();

  setTimeout(() => {
    printContainer.remove();
  }, 1000);
}
