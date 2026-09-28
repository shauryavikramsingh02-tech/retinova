import React, { useState } from 'react';
import { 
  Eye, 
  PlusCircle, 
  Users, 
  Stethoscope, 
  FileText, 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  Menu, 
  X, 
  Activity, 
  Sparkles
} from 'lucide-react';
import { ClinicianUser } from '../types';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  user: ClinicianUser;
  onOpenAuth: () => void;
  onLogout: () => void;
  backendOnline: boolean;
  totalScreenings: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
  backendOnline,
  totalScreenings,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'screening', label: 'New Screening', icon: PlusCircle },
    { id: 'patients', label: 'Patients', icon: Users, badge: totalScreenings },
    { id: 'doctors', label: 'Nearby Doctors', icon: Stethoscope },
    { id: 'reports', label: 'Reports', icon: FileText },
    { 
      id: 'admin', 
      label: 'Admin Portal', 
      icon: ShieldCheck, 
      adminOnly: true,
      highlight: true 
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('screening')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Eye className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 font-headline">
                  RetinaCare<span className="text-teal-600">AI</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  Clinical 2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Bilateral Retinal Screening & Telemedicine
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isAdminTab = item.adminOnly;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : item.highlight
                      ? 'text-teal-700 bg-teal-50 hover:bg-teal-100/80 border border-teal-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : item.highlight ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-slate-800 text-teal-300' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isAdminTab && user.role === 'admin' && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Header Right Actions */}
          <div className="flex items-center space-x-3">
            {/* User Profile Pill & Auth Trigger */}
            <div className="flex items-center space-x-2">
              <div 
                onClick={onOpenAuth}
                className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                title="Manage Clinician Credentials & RBAC"
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  user.role === 'admin' 
                    ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                    : 'bg-teal-100 text-teal-800 border border-teal-300'
                }`}>
                  {user.displayName.charAt(0) || 'U'}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {user.displayName.replace('Administrator (', '').replace(')', '')}
                    </span>
                    {user.role === 'admin' && (
                      <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500 text-white">ADMIN</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 truncate max-w-[130px] block">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={onLogout}
                title="Sign Out / Switch Profile"
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
