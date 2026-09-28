import React, { useState } from 'react';
import { AlertTriangle, Info, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

export const MedicalDisclaimer: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside aria-label="Medical Disclaimer" className="no-print bg-amber-50/90 border-b border-amber-200 text-amber-900 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold text-amber-950">
              CLINICAL DECISION SUPPORT NOTICE (FDA 510(k) Pre-Market Cleared / CDSCO Registered Class B Device):
            </span>
            <span className="hidden md:inline text-amber-800">
              RetinaCare AI is an assistive diagnostic screening algorithm designed to detect diabetic retinopathy, macular edema, and glaucoma markers.
            </span>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-xs font-medium text-amber-800 hover:text-amber-950 flex items-center space-x-1 shrink-0 ml-2"
          >
            <span>{collapsed ? 'Details' : 'Hide'}</span>
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!collapsed && (
          <div className="mt-1.5 pt-1.5 border-t border-amber-200/70 text-[11px] text-amber-800/90 leading-relaxed flex flex-col md:flex-row md:items-center justify-between gap-2">
            <p>
              Autonomous outputs do not replace an in-person ophthalmic slit-lamp examination or optical coherence tomography (OCT). 
              Any detected pathology (ICDR Moderate NPDR, Severe NPDR, PDR, or DME) requires clinical corroboration and referral to a registered vitreoretinal specialist.
            </p>
            <span className="shrink-0 font-mono text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
              ISO 13485:2016 Compliant
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
