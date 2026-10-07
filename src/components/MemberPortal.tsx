import React, { useState, useEffect, useMemo } from 'react';
import {
  LogIn,
  LogOut,
  ScanFace,
  Wallet,
  Clock,
  KeyRound,
  ShieldCheck,
  Wind,
  Plug,
  Receipt,
  QrCode,
  User,
  BookOpen,
  Armchair,
  ArrowRight,
  Globe,
} from 'lucide-react';
import {
  Member,
  Seat,
  AttendanceRecord,
  FeePayment,
} from '../types';
import { PUBLIC_APP_URL } from '../data/initialData';
import { FaceTemplateCaptureBox } from './FaceTemplateCaptureBox';
import { QrCodeSvg } from './QrCodeSvg';
import { AppLang, TRANSLATIONS } from '../utils/i18n';

interface MemberPortalProps {
  lang: AppLang;
  onChangeLang: (lang: AppLang) => void;
  members: Member[];
  seats: Seat[];
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  nextAutoSeat: Seat | null;
  loggedInMemberId: string | null;
  onSetLoggedInMemberId: (id: string | null) => void;
  onUnlockAdminConsole: () => void;
  onOpenFaceScanner: (member: Member) => void;
  onOpenReceipt: (payment: FeePayment) => void;
  onUpdateMember: (updated: Member) => void;
}

export const MemberPortal: React.FC<MemberPortalProps> = ({
  lang,
  onChangeLang,
  members,
  seats,
  attendance,
  payments,
  nextAutoSeat,
  loggedInMemberId,
  onSetLoggedInMemberId,
  onUnlockAdminConsole,
  onOpenFaceScanner,
  onOpenReceipt,
  onUpdateMember,
}) => {
  const t = TRANSLATIONS[lang];
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Live ticker for active study timer
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const loggedInMember = useMemo(
    () => members.find((m) => m.id === loggedInMemberId) || null,
    [members, loggedInMemberId]
  );

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const rawId = loginIdentifier.trim();
    const rawPass = loginPassword.trim();

    // Stealth Admin Login inside the exact same Member Login form (no UI hint shown)
    if (rawId.toLowerCase() === 'admin' && rawPass === 'Admin@321') {
      setLoginIdentifier('');
      setLoginPassword('');
      onUnlockAdminConsole();
      return;
    }

    const q = rawId.toLowerCase();
    const matched = members.find(
      (m) =>
        m.id.toLowerCase() === q ||
        m.phone.trim() === q ||
        m.email.toLowerCase() === q
    );

    if (!matched) {
      setLoginError(
        lang === 'gu'
          ? 'અમાન્ય સભ્ય ID અથવા મોબાઇલ નંબર. કૃપા કરીને તમારી વિગતો તપાસો.'
          : 'Invalid Member ID or Mobile Number. Please check your credentials or contact the Library Desk.'
      );
      return;
    }

    const expectedPass = matched.password || '123456';
    if (rawPass !== expectedPass) {
      setLoginError(
        lang === 'gu'
          ? 'ખોટો પાસવર્ડ. કૃપા કરીને સાચો પાસવર્ડ દાખલ કરો.'
          : 'Incorrect password. Please enter your valid password.'
      );
      return;
    }

    setLoginIdentifier('');
    setLoginPassword('');
    onSetLoggedInMemberId(matched.id);
  };

  const formatElapsed = (startMs: number) => {
    const totalSec = Math.max(
      0,
      Math.floor((Date.now() - startMs) / 1000) + tick * 0
    );
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return {
      formatted: `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(
        2,
        '0'
      )}m ${String(secs).padStart(2, '0')}s`,
      hoursFloat: totalSec / 3600,
    };
  };

  const gateQrUrl = `${PUBLIC_APP_URL}/?portal=member&gate=scan`;

  return (
    <div className="w-full">
      {/* IF NOT LOGGED IN -> CLEAN ATTRACTIVE LIGHT-THEME MEMBER LOGIN PAGE */}
      {!loggedInMember ? (
        <div className="min-h-[82vh] flex items-center justify-center px-4 py-8 animate-fade-in">
          <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
            {/* Left Brand & Feature Showcase Panel (Light Editorial Surface) */}
            <div className="lg:col-span-6 p-7 sm:p-10 bg-gradient-to-br from-indigo-50 via-sky-50/70 to-emerald-50/60 dark:from-slate-900 dark:via-indigo-950/50 dark:to-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-mono font-bold text-sm flex items-center justify-center shadow-sm">
                      VK
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                        {t.libraryTitle}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t.libraryTagline}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {t.portalHeroTitle}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t.portalHeroDesc}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 bg-white/90 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 rounded-2xl flex items-start gap-3 shadow-2xs transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Armchair className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {t.featureSeatTitle}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      {t.featureSeatDesc}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white/90 dark:bg-slate-800/80 border border-emerald-100 dark:border-slate-700 rounded-2xl flex items-start gap-3 shadow-2xs transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <ScanFace className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {t.featureFaceTitle}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      {t.featureFaceDesc}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white/90 dark:bg-slate-800/80 border border-amber-100 dark:border-slate-700 rounded-2xl flex items-start gap-3 shadow-2xs transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {t.featureWalletTitle}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                      {t.featureWalletDesc}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-indigo-100/80 dark:border-slate-800">
                <span>Single-Floor AC Study Hall</span>
                <span>Open 24×7</span>
              </div>
            </div>

            {/* Right Login Form Panel */}
            <div className="lg:col-span-6 p-7 sm:p-10 flex flex-col justify-between bg-white dark:bg-slate-900">
              {/* Language Switcher at Top Right of Login Panel */}
              <div className="flex items-center justify-end mb-4">
                <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ml-2 mr-1" />
                  <button
                    type="button"
                    onClick={() => onChangeLang('en')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      lang === 'en'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeLang('gu')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      lang === 'gu'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    ગુજરાતી
                  </button>
                </div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5 max-w-sm mx-auto w-full my-auto">
                <div className="space-y-1.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {t.memberLoginHeading}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.memberLoginSub}
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
                    {loginError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.loginIdLabel}
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        autoComplete="username"
                        placeholder={t.loginIdPlaceholder}
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {t.passwordLabel}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="password"
                        required
                        autoComplete="current-password"
                        placeholder={t.passwordPlaceholder}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] rounded-xl shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t.signInBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-2">
                  {t.contactDeskNote}
                </p>
              </form>

              <div className="h-4" />
            </div>
          </div>
        </div>
      ) : (
        /* LOGGED-IN MEMBER PERSONAL PORTAL VIEW */
        (() => {
          const memberAttendance = attendance.filter(
            (a) => a.memberId === loggedInMember.id
          );
          const activeSession =
            memberAttendance.find((a) => a.status === 'Inside') || null;
          const memberPayments = payments.filter(
            (p) => p.memberId === loggedInMember.id
          );

          const assignedSeatCode = activeSession
            ? activeSession.seatCode
            : loggedInMember.seatId || nextAutoSeat?.code || 'S-01';
          const assignedSeatObj = seats.find((s) => s.code === assignedSeatCode);

          const liveInfo = activeSession
            ? formatElapsed(activeSession.checkInTimestamp)
            : null;
          const liveAccruedFee =
            liveInfo && activeSession
              ? Math.round(liveInfo.hoursFloat * activeSession.hourlyRateApplied)
              : 0;
          const liveWalletBalance = Math.max(
            0,
            loggedInMember.walletBalance - liveAccruedFee
          );
          const remainingStudyHours = (
            liveWalletBalance / Math.max(1, loggedInMember.hourlyRate)
          ).toFixed(1);

          return (
            <div className="max-w-5xl mx-auto py-4 space-y-6 animate-fade-in">
              {/* Top Member Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
                <div className="flex items-center gap-3.5">
                  {loggedInMember.facePhotoUrl ? (
                    <img
                      src={loggedInMember.facePhotoUrl}
                      alt={loggedInMember.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-mono font-bold text-base flex items-center justify-center shrink-0">
                      {loggedInMember.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                        {loggedInMember.name}
                      </h1>
                      <span className="text-xs font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        · {loggedInMember.id}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          activeSession
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            activeSession
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-amber-500'
                          }`}
                        />
                        {activeSession
                          ? t.currentlyInsideSeat(activeSession.seatCode || 'S-01')
                          : t.currentlyOutside}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                      {loggedInMember.examPrep} · {loggedInMember.shift} · Face ID:{' '}
                      {loggedInMember.faceTemplateId}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Language Switcher inside Member Dashboard */}
                  <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => onChangeLang('en')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        lang === 'en'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeLang('gu')}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                        lang === 'gu'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      ગુજ
                    </button>
                  </div>

                  <button
                    onClick={() => onSetLoggedInMemberId(null)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.logout}</span>
                  </button>
                </div>
              </div>

              {/* HERO BANNER: Konsi Seat Mein Bethna Hain + Live Check-In / Check-Out Action */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 bg-gradient-to-br from-indigo-50/90 via-white to-emerald-50/60 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-indigo-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-5 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {activeSession
                          ? 'Active Study Session & Seat Assignment'
                          : 'Library Gate Check-In & Seat Assignment'}
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {activeSession
                          ? t.sitAtSeat(activeSession.seatCode || 'S-01')
                          : t.assignedSeatOnEntry(assignedSeatCode || 'S-01')}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                        {assignedSeatObj
                          ? `Single Ground Floor · ${assignedSeatObj.rowZone} · ${
                              assignedSeatObj.hasAC ? 'AC Hall' : 'Standard'
                            } · ${
                              assignedSeatObj.hasSocket
                                ? 'Individual Power Socket'
                                : 'Reading Desk'
                            }`
                          : 'Single-Floor Study Hall · Auto 1-by-1 Sequential Seat'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                      {assignedSeatObj?.hasAC && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sky-700 dark:text-sky-300">
                          <Wind className="w-3.5 h-3.5" /> AC Zone
                        </span>
                      )}
                      {assignedSeatObj?.hasSocket && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-amber-300">
                          <Plug className="w-3.5 h-3.5" /> Socket
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 4-Card Live Status Strip inside Hero */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                    <div className="p-3.5 bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-xl shadow-2xs">
                      <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                        {activeSession ? t.checkedInAt : t.lastStatus}
                      </p>
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {activeSession
                          ? activeSession.checkInDisplay
                          : memberAttendance[0]?.checkOutDisplay || 'Outside'}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {activeSession
                          ? `Date: ${activeSession.date}`
                          : 'Ready to Enter'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-xl shadow-2xs">
                      <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                        {activeSession
                          ? t.liveRunningDuration
                          : t.totalHoursStudied}
                      </p>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {liveInfo
                          ? liveInfo.formatted
                          : `${loggedInMember.totalHoursUsed.toFixed(1)} hrs`}
                      </p>
                      <p className="text-[10px] text-indigo-600 dark:text-amber-400 mt-0.5">
                        Total: {loggedInMember.totalHoursUsed.toFixed(1)} hrs
                      </p>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-xl shadow-2xs">
                      <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                        {t.liveWalletBalance}
                      </p>
                      <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        ₹{liveWalletBalance.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Rate: ₹{loggedInMember.hourlyRate}/hr
                      </p>
                    </div>

                    <div className="p-3.5 bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 rounded-xl shadow-2xs">
                      <p className="text-[11px] font-sans text-slate-500 dark:text-slate-400">
                        {t.studyHoursLeft}
                      </p>
                      <p className="text-base font-bold text-indigo-600 dark:text-amber-400 mt-1">
                        {remainingStudyHours} hrs
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Used: ₹{loggedInMember.totalDeducted}
                      </p>
                    </div>
                  </div>

                  {/* Primary Check-In / Check-Out Trigger */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-indigo-100 dark:border-slate-800">
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      {activeSession ? (
                        <span>
                          Currently studying at{' '}
                          <strong>Seat {activeSession.seatCode}</strong>. Scan
                          Gate QR & Face ID when leaving.
                        </span>
                      ) : (
                        <span>
                          Scan Common Gate QR & verify your Face ID to check in
                          and sit at <strong>Seat {assignedSeatCode}</strong>.
                        </span>
                      )}
                    </div>

                    {activeSession ? (
                      <button
                        onClick={() => onOpenFaceScanner(loggedInMember)}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t.markExitBtn}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenFaceScanner(loggedInMember)}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
                      >
                        <ScanFace className="w-4 h-4" />
                        <span>{t.scanToCheckIn(assignedSeatCode || 'S-01')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Right: Student's Face Template & Gate QR Pass */}
                <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xs">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          My Biometric Face ID & Gate QR
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          1-to-1 Face verification at library entrance
                        </p>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    </div>

                    <div className="flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <div
                        onClick={() => onOpenFaceScanner(loggedInMember)}
                        className="p-2 bg-white border border-slate-200 rounded-lg shrink-0 cursor-pointer hover:scale-105 transition-transform"
                      >
                        <QrCodeSvg value={gateQrUrl} size={80} />
                      </div>
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                          <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Common Gate QR</span>
                        </p>
                        <p className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                          {loggedInMember.faceTemplateId}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Seat Policy: {loggedInMember.seatAssignmentMode}
                        </p>
                      </div>
                    </div>

                    <FaceTemplateCaptureBox
                      memberId={loggedInMember.id}
                      currentTemplateId={loggedInMember.faceTemplateId}
                      currentPhotoUrl={loggedInMember.facePhotoUrl}
                      onCaptureComplete={(newTemplateId, photoUrl) =>
                        onUpdateMember({
                          ...loggedInMember,
                          faceRegistered: true,
                          faceTemplateId: newTemplateId,
                          facePhotoUrl: photoUrl || loggedInMember.facePhotoUrl,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Member's Complete In / Out / Duration / Seat / Wallet History Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>{t.attendanceHistoryHeading}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Every study session logged via Common Gate QR + 1-to-1 Face ID verification
                    </p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    Total Sessions: {memberAttendance.length}
                  </span>
                </div>

                {memberAttendance.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No attendance sessions recorded yet. Click "Scan Gate QR & Face ID to Check In" above to start your first session!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Assigned Seat</th>
                          <th className="py-3 px-4">Check-In Time</th>
                          <th className="py-3 px-4">Check-Out Time</th>
                          <th className="py-3 px-4">Study Duration</th>
                          <th className="py-3 px-4 text-right">Hourly Fee Cut</th>
                          <th className="py-3 px-4 text-right">Wallet Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs font-mono tabular-nums">
                        {memberAttendance.map((att) => {
                          const hrs = att.durationMinutes
                            ? Math.floor(att.durationMinutes / 60)
                            : 0;
                          const mins = att.durationMinutes
                            ? att.durationMinutes % 60
                            : 0;

                          return (
                            <tr
                              key={att.id}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                                {att.date}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                  Seat {att.seatCode || 'S-01'}
                                </span>
                                <span className="ml-1.5 text-[11px] text-slate-400 font-sans">
                                  · {att.seatAssignMode}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                                {att.checkInDisplay}
                              </td>
                              <td className="py-3 px-4">
                                {att.checkOutDisplay ? (
                                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                                    {att.checkOutDisplay}
                                  </span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                                    Currently Inside
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                {att.status === 'Inside' ? (
                                  <span className="text-emerald-600 dark:text-emerald-400">
                                    {formatElapsed(att.checkInTimestamp).formatted}
                                  </span>
                                ) : (
                                  `${hrs}h ${mins}m`
                                )}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                                {att.feeDeducted !== null
                                  ? `-₹${att.feeDeducted}`
                                  : `₹${att.hourlyRateApplied}/hr`}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                {att.balanceAfterExit !== null
                                  ? `₹${att.balanceAfterExit.toLocaleString('en-IN')}`
                                  : `₹${liveWalletBalance.toLocaleString('en-IN')}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Member's Wallet Recharge Receipts */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>
                      {t.walletReceiptsHeading} ({memberPayments.length})
                    </span>
                  </h2>
                </div>

                {memberPayments.length === 0 ? (
                  <p className="p-5 text-xs text-slate-500">
                    No wallet recharge receipts found.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          <th className="py-2.5 px-4">Receipt No.</th>
                          <th className="py-2.5 px-4">Date</th>
                          <th className="py-2.5 px-4">Plan / Mode</th>
                          <th className="py-2.5 px-4 text-right">
                            Amount Credited
                          </th>
                          <th className="py-2.5 px-4 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs font-mono tabular-nums">
                        {memberPayments.map((p) => (
                          <tr key={p.id}>
                            <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                              {p.id}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                              {p.date}
                            </td>
                            <td className="py-2.5 px-4 font-sans text-slate-700 dark:text-slate-300">
                              {p.plan} · {p.mode}
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              +₹{p.totalPaid.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-4 text-right font-sans">
                              <button
                                onClick={() => onOpenReceipt(p)}
                                className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>View Receipt</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
};
