// RetinaScan AI - Step 3: AI Diagnostic & Biomarker Analysis

export function renderDiagnosisStep(state, onProceedToReferral, onSelectFinding, onToggleBiomarker, onHeatmapChange) {
  const p = state.currentPatient;
  const currentEye = state.selectedEye || 'OD';
  const scan = p.scans[currentEye] || p.scans.OD;
  const diag = scan.diagnosis;

  // ICDR severity styling
  let severityBadgeClass = "bg-amber-50 text-amber-900 border-amber-300";
  if (diag.icdrLevel >= 3) severityBadgeClass = "bg-red-50 text-red-900 border-red-300";
  if (diag.icdrLevel === 0) severityBadgeClass = "bg-emerald-50 text-emerald-900 border-emerald-300";

  return `
    <div class="space-y-6 pb-12 animate-fadeIn">
      
      <!-- Patient & Encounter Status Header -->
      <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
            <img src="${p.photoUrl}" alt="${p.name}" class="w-full h-full object-cover" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' viewBox=\\'0 0 24 24\\'><rect width=\\'24\\' height=\\'24\\' fill=\\'%23CBD5E1\\'/></svg>'"/>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base font-bold text-slate-900 font-headline">Patient: #${p.id} • ${p.name}</h1>
              <span class="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded">
                ${p.age}y / ${p.gender}
              </span>
              <span class="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-bold rounded">
                Eye: ${currentEye} (${scan.label})
              </span>
            </div>
            <p class="text-xs text-slate-500">
              HbA1c: <strong class="text-slate-700">${p.hba1c}%</strong> • BP: <strong>${p.bpSystolic}/${p.bpDiastolic} mmHg</strong> • Diabetes Duration: <strong>${p.durationYears} Years</strong>
            </p>
          </div>
        </div>

        <!-- Eye Switcher -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-500">Viewing Eye:</span>
          <div class="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
            <button
              id="diag-eye-toggle-od"
              class="px-3 py-1.5 rounded-md transition-all ${
                currentEye === 'OD'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }"
            >
              OD (Right)
            </button>
            <button
              id="diag-eye-toggle-os"
              class="px-3 py-1.5 rounded-md transition-all ${
                currentEye === 'OS'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }"
            >
              OS (Left)
            </button>
          </div>
        </div>
      </div>

      <!-- Primary Diagnostic Verdict Banner -->
      <div class="bg-white border-2 border-slate-900 rounded-xl p-6 shadow-md">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Autonomous ICDR Staging Classification</span>
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${severityBadgeClass}">
                Grade ${diag.icdrLevel} / 4
              </span>
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-900 font-headline">
              ${diag.icdrStage}: ${diag.icdrDescription}
            </h2>
            <p class="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Consensus standard based on AAO International Clinical Diabetic Retinopathy Disease Severity Scale. Deep convolutional feature extraction confirms multiple retinal microvascular lesions.
            </p>
          </div>

          <div class="flex sm:flex-col items-end gap-2 text-right">
            <div class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-900 border border-teal-300 rounded-lg text-xs font-bold shadow-sm">
              <span class="material-symbols-outlined text-sm text-teal-700">verified</span>
              <span>AI Confidence: ${diag.confidence}%</span>
            </div>
            <span class="text-[11px] text-slate-400 font-mono">Inference Latency: ${diag.latencyMs}ms</span>
          </div>
        </div>

        <!-- Key Metrics Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100 text-xs">
          <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div class="flex items-center justify-between text-slate-500 font-semibold mb-1">
              <span>Macular Edema Risk</span>
              <span class="material-symbols-outlined text-sm text-amber-600">visibility</span>
            </div>
            <p class="text-lg font-bold text-slate-900">${diag.dmeRisk}% Probability</p>
            <p class="text-[11px] text-amber-700 font-semibold mt-0.5">${diag.dmeStatus}</p>
          </div>

          <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div class="flex items-center justify-between text-slate-500 font-semibold mb-1">
              <span>Triage Urgency</span>
              <span class="material-symbols-outlined text-sm text-teal-600">alarm</span>
            </div>
            <p class="text-lg font-bold text-slate-900">${diag.urgency}</p>
            <p class="text-[11px] text-teal-700 font-semibold mt-0.5">Target Window: ${diag.timeframe}</p>
          </div>

          <div class="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <div class="flex items-center justify-between text-slate-500 font-semibold mb-1">
              <span>Total Biomarkers Logged</span>
              <span class="material-symbols-outlined text-sm text-slate-600">format_list_numbered</span>
            </div>
            <p class="text-lg font-bold text-slate-900">
              ${(diag.biomarkers || []).reduce((acc, b) => acc + b.count, 0)} Discrete Lesions
            </p>
            <p class="text-[11px] text-slate-500 mt-0.5">4 Feature Categories Evaluated</p>
          </div>
        </div>
      </div>

      <!-- Main Workspace: Interactive Retinal Inspection Canvas (8 Cols) & Biomarker Registry (4 Cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Canvas Viewport (8 Cols) -->
        <div class="lg:col-span-8 space-y-4">
          <div class="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col">
            
            <!-- Canvas HUD Header -->
            <div class="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-300">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-teal-400 text-base">neurology</span>
                <span class="font-semibold text-white">Interactive Retinal Canvas</span>
                <span class="text-[11px] text-slate-400 font-mono">Heatmap Blending Active</span>
              </div>

              <!-- Controls: Zoom & Reset -->
              <div class="flex items-center gap-1.5">
                <button id="diag-zoom-in" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200" title="Zoom In">
                  <span class="material-symbols-outlined text-sm">zoom_in</span>
                </button>
                <button id="diag-zoom-out" class="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200" title="Zoom Out">
                  <span class="material-symbols-outlined text-sm">zoom_out</span>
                </button>
                <button id="diag-zoom-reset" class="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono" title="Reset View">
                  Reset
                </button>
              </div>
            </div>

            <!-- Canvas Viewport Element -->
            <div class="retinal-viewport-container relative w-full h-[480px] sm:h-[540px] flex items-center justify-center bg-black">
              <canvas id="diag-retinal-canvas" class="retinal-canvas w-full h-full block"></canvas>
            </div>

            <!-- Canvas Bottom Controls: Biomarker Toggles & Heatmap Slider -->
            <div class="bg-slate-900 border-t border-slate-800 p-4 space-y-3 text-xs">
              
              <!-- Heatmap Slider & ETDRS Toggle -->
              <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                
                <!-- Heatmap Density Slider -->
                <div class="flex items-center gap-3">
                  <span class="text-slate-300 font-medium flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm text-teal-400">blur_on</span>
                    Lesion Heatmap Opacity:
                  </span>
                  <input
                    type="range"
                    id="diag-slider-heatmap"
                    min="0"
                    max="100"
                    value="65"
                    class="w-28 accent-teal-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
                  />
                  <span id="diag-heatmap-val" class="font-mono text-teal-400 font-bold w-9">65%</span>
                </div>

                <!-- ETDRS Macular Grid Overlay Toggle -->
                <label class="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-medium">
                  <input type="checkbox" id="diag-toggle-etdrs" class="rounded border-slate-700 text-teal-600 focus:ring-teal-500 bg-slate-800"/>
                  <span>ETDRS Macular Grid (1-3-6mm)</span>
                </label>

                <!-- Red-Free Optical Filter -->
                <label class="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-medium">
                  <input type="checkbox" id="diag-toggle-redfree" class="rounded border-slate-700 text-teal-600 focus:ring-teal-500 bg-slate-800"/>
                  <span>Red-Free Filter</span>
                </label>

              </div>

              <!-- Biomarker Overlay Filters -->
              <div class="flex flex-wrap items-center gap-4 text-[11px]">
                <span class="text-slate-400 uppercase font-semibold">Biomarker Layers:</span>
                
                <label class="flex items-center gap-1.5 cursor-pointer text-slate-200">
                  <input type="checkbox" id="toggle-layer-microaneurysm" checked class="rounded text-red-500 focus:ring-red-400 bg-slate-800 border-slate-700"/>
                  <span class="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                  <span>Microaneurysms</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer text-slate-200">
                  <input type="checkbox" id="toggle-layer-hard_exudate" checked class="rounded text-amber-500 focus:ring-amber-400 bg-slate-800 border-slate-700"/>
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  <span>Hard Exudates</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer text-slate-200">
                  <input type="checkbox" id="toggle-layer-hemorrhage" checked class="rounded text-red-700 focus:ring-red-600 bg-slate-800 border-slate-700"/>
                  <span class="w-2.5 h-2.5 rounded-full bg-red-700 inline-block"></span>
                  <span>Hemorrhages</span>
                </label>

                <label class="flex items-center gap-1.5 cursor-pointer text-slate-200">
                  <input type="checkbox" id="toggle-layer-cotton_wool" checked class="rounded text-slate-300 focus:ring-slate-400 bg-slate-800 border-slate-700"/>
                  <span class="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
                  <span>Cotton Wool Spots</span>
                </label>
              </div>

            </div>

          </div>
        </div>

        <!-- Biomarker Quantification & Finding Registry (4 Cols) -->
        <div class="lg:col-span-4 space-y-4">
          <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 class="text-sm font-bold text-slate-900 font-headline">Biomarker Finding Registry</h3>
                <p class="text-[11px] text-slate-500">Click a finding to pan and focus canvas</p>
              </div>
              <span class="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                ${diag.biomarkers?.length || 0} Categories
              </span>
            </div>

            <!-- Finding Groups List -->
            <div class="space-y-3">
              ${(diag.biomarkers || []).map(bm => `
                <div class="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="w-3 h-3 rounded-full" style="background-color: ${bm.color}"></span>
                      <span class="font-bold text-slate-900 text-xs">${bm.name}</span>
                    </div>
                    <span class="font-mono text-xs font-bold text-slate-700">${bm.count} detected</span>
                  </div>

                  <p class="text-[11px] text-slate-500 mt-1.5 leading-relaxed">${bm.description}</p>

                  <div class="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span class="text-slate-400">Confidence: <strong class="text-slate-700">${bm.confidence}%</strong></span>
                    <span class="text-slate-400">Severity: <strong class="text-slate-700">${bm.severity}</strong></span>
                  </div>

                  <!-- Discrete coordinate chips -->
                  <div class="mt-2 flex flex-wrap gap-1.5">
                    ${bm.locations.map(loc => `
                      <button
                        data-finding-x="${loc.x}"
                        data-finding-y="${loc.y}"
                        data-finding-label="${loc.label}"
                        class="btn-finding-target px-2 py-0.5 bg-white hover:bg-teal-50 hover:border-teal-400 border border-slate-200 rounded text-[10px] font-mono text-slate-700 font-semibold transition-colors flex items-center gap-1"
                        title="Center Canvas on ${loc.label}"
                      >
                        <span class="material-symbols-outlined text-[10px] text-teal-600">my_location</span>
                        <span>${loc.label}</span>
                      </button>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Action CTA -->
            <div class="pt-2 space-y-2">
              <button
                id="btn-proceed-referral"
                class="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-md hover:shadow transition-all text-xs"
              >
                <span>Generate Action Plan & Referral</span>
                <span class="material-symbols-outlined text-base">arrow_forward</span>
              </button>

              <button
                id="btn-rerun-inference"
                class="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors text-xs"
              >
                <span class="material-symbols-outlined text-sm text-teal-600">refresh</span>
                <span>Request Ensemble Second Opinion</span>
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  `;
}
