'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, PlusCircle, LayoutDashboard, MapPin, Sparkles, Menu, X, Landmark, FileText } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthority = pathname.startsWith('/authority');
  const isCitizen = pathname.startsWith('/citizen') || pathname === '/';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
      {/* GovTech Top Bar Banner */}
      <div className="bg-slate-900 text-slate-300 text-[11px] px-4 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
          <span className="font-semibold text-white tracking-wider uppercase">
            SEWA SETU INNOVATION HACKATHON 2026
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 hidden sm:inline">
            Theme: Innovating Digital Public Service Delivery & Road Accountability
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live GovTech Node
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
                  KIZUNA
                </span>
                <span className="hidden md:inline-block ml-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  GovTech 2.0
                </span>
              </div>
            </Link>

            {/* Portal Switcher Tabs */}
            <div className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
              <Link
                href="/citizen"
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  isCitizen && !isAuthority
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>Citizen Portal</span>
              </Link>
              <Link
                href="/authority/dashboard"
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  isAuthority
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Authority Command</span>
              </Link>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm">
            {isAuthority ? (
              <>
                <Link
                  href="/authority/dashboard"
                  className={`font-medium transition flex items-center gap-1.5 ${
                    pathname === '/authority/dashboard'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link
                  href="/authority/cases"
                  className={`font-medium transition flex items-center gap-1.5 ${
                    pathname === '/authority/cases'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Case Docket
                </Link>
                <Link
                  href="/authority/map"
                  className={`font-medium transition flex items-center gap-1.5 ${
                    pathname === '/authority/map'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  GIS Map
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/citizen"
                  className={`font-medium transition ${
                    pathname === '/citizen'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Overview
                </Link>
                <Link
                  href="/citizen/reports"
                  className={`font-medium transition flex items-center gap-1.5 ${
                    pathname === '/citizen/reports'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Track Reports
                </Link>
              </>
            )}

            {/* Quick Demo Access Button */}
            <Link
              href="/citizen/reports/KZ-DEMO-001"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition"
              title="Experience live demo case"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Try Demo Case</span>
            </Link>

            {/* Notifications */}
            <NotificationDropdown currentRole={isAuthority ? 'authority' : 'citizen'} />

            {/* Report CTA */}
            <Link
              href="/citizen/report"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Issue</span>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <NotificationDropdown currentRole={isAuthority ? 'authority' : 'citizen'} />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold pb-2 border-b border-slate-200 dark:border-slate-800">
            <Link
              href="/citizen"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-2 rounded-lg border ${
                isCitizen && !isAuthority ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-700'
              }`}
            >
              Citizen Portal
            </Link>
            <Link
              href="/authority/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-2 rounded-lg border ${
                isAuthority ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-700'
              }`}
            >
              Authority Command
            </Link>
          </div>

          <div className="flex flex-col gap-2 pt-1 text-sm font-medium">
            <Link
              href="/citizen/report"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Report Road Issue
            </Link>
            <Link
              href="/citizen/reports/KZ-DEMO-001"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Open Demo Case (NH-30)
            </Link>
            <Link
              href="/citizen/reports"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              My Submitted Reports
            </Link>
            <Link
              href="/authority/cases"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              Authority Case Docket
            </Link>
            <Link
              href="/authority/map"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-700"
            >
              Authority GIS Command Map
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
