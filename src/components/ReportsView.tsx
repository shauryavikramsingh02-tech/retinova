import React, { useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  Users, 
  ArrowUpRight, 
  FileText, 
  Printer, 
  TrendingUp, 
  CheckCircle,
  ShieldCheck,
  Calendar,
  Search,
  Download,
  Eye,
  SlidersHorizontal,
  Clock
} from 'lucide-react';
import { ScreeningRecord } from '../types';

interface ReportsViewProps {
  screenings: ScreeningRecord[];
  onSelectScreeningForPrint: (screening: ScreeningRecord) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  screenings,
  onSelectScreeningForPrint,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');

  // KPI Calculations
  const totalScreenings = screenings.length;
  const highRiskCount = screenings.filter((s) => s.od.drStage >= 3 || s.os.drStage >= 3).length;
  const referredCount = screenings.filter((s) => s.status === 'Referred' || s.od.drStage >= 2 || s.os.drStage >= 2).length;
  const referralRate = totalScreenings > 0 ? Math.round((referredCount / totalScreenings) * 100) : 0;
  
  const avgAsymmetry = totalScreenings > 0 
    ? Math.round((screenings.reduce((acc, s) => acc + s.asymmetryIndex, 0) / totalScreenings) * 10) / 10 
    : 0;

  // Filtered reports
  const filteredReports = screenings.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.patient.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.patient.id.toLowerCase().includes(q) ||
      s.od.drGrade.toLowerCase().includes(q) ||
      s.os.drGrade.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (filterTier === 'all') return true;
    return s.urgencyTier.toLowerCase() === filterTier.toLowerCase();
  });

  // Severity Breakdown Counts
  const normalCount = screenings.filter((s) => s.od.drStage === 0 && s.os.drStage === 0).length;
  const mildCount = screenings.filter((s) => Math.max(s.od.drStage, s.os.drStage) === 1).length;
  const modCount = screenings.filter((s) => Math.max(s.od.drStage, s.os.drStage) === 2).length;
  const severePdrCount = screenings.filter((s) => Math.max(s.od.drStage, s.os.drStage) >= 3).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-wider font-mono">
            Clinical Population Health & Documentation Registry
          </span>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-headline">
            Clinical Audit & Screening Reports Portal
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Aggregated institutional records, triage metrics, and formal physical patient report generation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Executive Brief</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1 */}
        <div className="clinical-card p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Screenings</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{totalScreenings}</span>
            <span className="text-xs text-emerald-600 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Bilateral studies recorded</p>
        </div>

        {/* KPI 2 */}
        <div className="clinical-card p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High Risk / PDR</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-rose-600 font-mono">{highRiskCount}</span>
            <span className="text-xs font-mono text-slate-500">
              ({totalScreenings > 0 ? Math.round((highRiskCount / totalScreenings) * 100) : 0}%)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires urgent specialist referral</p>
        </div>

        {/* KPI 3 */}
        <div className="clinical-card p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Asymmetry Index</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{avgAsymmetry}</span>
            <span className="text-xs font-mono text-slate-400">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Inter-ocular concordance score</p>
        </div>

        {/* KPI 4 */}
        <div className="clinical-card p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Referral Rate</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-teal-700 font-mono">{referralRate}%</span>
            <span className="text-xs text-slate-500 font-mono">({referredCount} patients)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Referred to vitreoretinal tertiary care</p>
        </div>

      </div>

      {/* Clinical Severity Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">No Apparent DR</span>
            <span className="text-xs text-emerald-700">Annual Rescreening</span>
          </div>
          <span className="text-xl font-mono font-bold text-emerald-900">{normalCount}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide block">Mild NPDR</span>
            <span className="text-xs text-amber-700">6-12 Mo. Review</span>
          </div>
          <span className="text-xl font-mono font-bold text-amber-900">{mildCount}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-orange-800 uppercase tracking-wide block">Moderate NPDR</span>
            <span className="text-xs text-orange-700">8-12 Wk Consult</span>
          </div>
          <span className="text-xl font-mono font-bold text-orange-900">{modCount}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wide block">Severe / PDR</span>
            <span className="text-xs text-rose-700">Urgent Tertiary Triage</span>
          </div>
          <span className="text-xl font-mono font-bold text-rose-900">{severePdrCount}</span>
        </div>
      </div>

      {/* Printable Clinical Reports Table & Search */}
      <div className="clinical-card p-5 bg-white border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reports by patient, ID, or grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Triage Tier Filter */}
          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 font-semibold mr-1 shrink-0">Filter:</span>
            {['all', 'normal', 'routine', 'elevated', 'urgent', 'emergency'].map((tier) => (
              <button
                key={tier}
                onClick={() => setFilterTier(tier)}
                className={`px-2.5 py-1 rounded text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  filterTier === tier
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Reports Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Report ID</th>
                <th className="py-3 px-3">Patient Name</th>
                <th className="py-3 px-3">Age / Sex</th>
                <th className="py-3 px-3">OD (Right Eye)</th>
                <th className="py-3 px-3">OS (Left Eye)</th>
                <th className="py-3 px-3">Asymmetry</th>
                <th className="py-3 px-3">Triage Urgency</th>
                <th className="py-3 px-3">Screening Date</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    No reports match the current filter.
                  </td>
                </tr>
              ) : (
                filteredReports.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-medium text-teal-700">{s.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{s.patient.name}</td>
                    <td className="py-3 px-3 text-slate-600">{s.patient.age}y / {s.patient.sex}</td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{s.od.drGrade}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{s.os.drGrade}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      {s.asymmetryIndex} / 100
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        s.urgencyTier === 'Emergency'
                          ? 'bg-rose-100 text-rose-800'
                          : s.urgencyTier === 'Urgent'
                          ? 'bg-amber-100 text-amber-800'
                          : s.urgencyTier === 'Elevated'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {s.urgencyTier}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(s.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectScreeningForPrint(s)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Full PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1">
          <span>Showing {filteredReports.length} of {screenings.length} total patient screening reports</span>
          <span>ISO 13485:2016 Compliant Report Archive</span>
        </div>
      </div>

    </div>
  );
};
