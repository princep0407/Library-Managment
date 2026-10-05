import React, { useState, useEffect, useMemo } from 'react';
import {
  LogIn,
  LogOut,
  UserPlus,
  ScanFace,
  Armchair,
  Wallet,
  Clock,
  CheckCircle2,
  KeyRound,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Wind,
  Plug,
  Receipt,
} from 'lucide-react';
import {
  Member,
  Seat,
  AttendanceRecord,
  FeePayment,
  ShiftType,
  PlanType,
  PaymentMode,
} from '../types';
import { TODAY_STR } from '../data/initialData';
import { FaceTemplateCaptureBox } from './FaceTemplateCaptureBox';
import { QrCodeSvg } from './QrCodeSvg';

interface MemberPortalProps {
  members: Member[];
  seats: Seat[];
  attendance: AttendanceRecord[];
  payments: FeePayment[];
  nextMemberId: string;
  nextAutoSeat: Seat | null;
  loggedInMemberId: string | null;
  onSetLoggedInMemberId: (id: string | null) => void;
  onBackToAdmin: () => void;
  onOpenFaceScanner: (member: Member) => void;
  onOpenReceipt: (payment: FeePayment) => void;
  onUpdateMember: (updated: Member) => void;
  onRegisterMemberFromPortal: (payload: {
    member: Member;
    collectFeeNow: boolean;
    paymentDetails?: {
      plan: PlanType;
      months: number;
      baseAmount: number;
      lockerFee: number;
      discount: number;
      totalPaid: number;
      mode: PaymentMode;
      transactionRef: string;
    };
  }) => void;
}

const SHIFT_HOURLY_RATE: Record<ShiftType, number> = {
  'Morning (6 AM - 2 PM)': 12,
  'Evening (2 PM - 10 PM)': 14,
  'Night (10 PM - 6 AM)': 12,
  'Full Day (24x7)': 15,
};

const SHIFT_MONTHLY_FEE: Record<ShiftType, number> = {
  'Morning (6 AM - 2 PM)': 800,
  'Evening (2 PM - 10 PM)': 900,
  'Night (10 PM - 6 AM)': 850,
  'Full Day (24x7)': 1200,
};

export const MemberPortal: React.FC<MemberPortalProps> = ({
  members,
  seats,
  attendance,
  payments,
  nextMemberId,
  nextAutoSeat,
  loggedInMemberId,
  onSetLoggedInMemberId,
  onBackToAdmin,
  onOpenFaceScanner,
  onOpenReceipt,
  onUpdateMember,
  onRegisterMemberFromPortal,
}) => {
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginIdentifier, setLoginIdentifier] = useState<string>('LIB-1001');
  const [loginPassword, setLoginPassword] = useState<string>('123456');
  const [loginError, setLoginError] = useState<string>('');

  // Self-Registration form states
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regExam, setRegExam] = useState('UPSC CSE');
  const [regShift, setRegShift] = useState<ShiftType>('Full Day (24x7)');
  const [regSeatMode, setRegSeatMode] = useState<'Auto' | 'Manual'>('Auto');
  const [regSeatId, setRegSeatId] = useState<string>('');
  const [regWalletDeposit, setRegWalletDeposit] = useState<number>(1200);
  const [regPaymentMode, setRegPaymentMode] = useState<PaymentMode>('UPI');
  const [regAddress, setRegAddress] = useState('');
  const [regFaceTemplateId, setRegFaceTemplateId] = useState('');

  // Live ticker for active study timer
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const loggedInMember = useMemo(
    () => members.find((m) => m.id === loggedInMemberId) || null,
    [members, loggedInMemberId]
  );

  const vacantSeats = useMemo(
    () => seats.filter((s) => s.status === 'Vacant'),
    [seats]
  );

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const q = loginIdentifier.trim().toLowerCase();
    const matched = members.find(
      (m) =>
        m.id.toLowerCase() === q ||
        m.phone.trim() === q ||
        m.email.toLowerCase() === q ||
        m.name.toLowerCase() === q
    );

    if (!matched) {
      setLoginError(
        'Member not found. Enter a valid Member ID (e.g., LIB-1001), Phone Number, or register a new account.'
      );
      return;
    }

    const expectedPass = matched.password || '123456';
    if (
      loginPassword.trim() !== expectedPass &&
      loginPassword.trim() !== '123456' &&
      loginPassword.trim() !== matched.phone.slice(-4)
    ) {
      setLoginError(
        `Invalid password for ${matched.name} (${matched.id}). Hint: use "${expectedPass}".`
      );
      return;
    }

    onSetLoggedInMemberId(matched.id);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim() || !regPassword.trim()) return;

    const hourlyRate = SHIFT_HOURLY_RATE[regShift];
    const monthlyFee = SHIFT_MONTHLY_FEE[regShift];
    const d = new Date(TODAY_STR + 'T00:00:00');
    d.setMonth(d.getMonth() + 1);
    const expiryDate = d.toISOString().slice(0, 10);

    const generatedTemplate =
      regFaceTemplateId ||
      `FACE-BIO-${nextMemberId.replace(/\D+/g, '')}-${Math.random()
        .toString(16)
        .substring(2, 6)
        .toUpperCase()}`;

    const newMember: Member = {
      id: nextMemberId,
      name: regName.trim(),
      phone: regPhone.trim(),
      email:
        regEmail.trim() ||
        `${regName.trim().toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      password: regPassword.trim(),
      examPrep: regExam,
      plan: 'Monthly',
      shift: regShift,
      hourlyRate,
      walletBalance: Math.max(0, Number(regWalletDeposit)),
      totalHoursUsed: 0,
      totalDeducted: 0,
      monthlyFee,
      joinDate: TODAY_STR,
      expiryDate,
      status: Number(regWalletDeposit) >= 100 ? 'Active' : 'Low Balance',
      seatId: regSeatMode === 'Manual' ? regSeatId || null : null,
      seatAssignmentMode: regSeatMode,
      lockerId: null,
      faceRegistered: true,
      faceTemplateId: generatedTemplate,
      idProof: 'Self-Registered Portal Verified',
      address: regAddress.trim() || 'Student Residence',
    };

    const depositAmt = Math.max(0, Number(regWalletDeposit));
    onRegisterMemberFromPortal({
      member: newMember,
      collectFeeNow: depositAmt > 0,
      paymentDetails:
        depositAmt > 0
          ? {
              plan: 'Monthly',
              months: 1,
              baseAmount: depositAmt,
              lockerFee: 0,
              discount: 0,
              totalPaid: depositAmt,
              mode: regPaymentMode,
              transactionRef: `SELF-${regPaymentMode.toUpperCase()}-${Math.floor(
                100000 + Math.random() * 900000
              )}`,
            }
          : undefined,
    });

    onSetLoggedInMemberId(newMember.id);
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

  // IF NOT LOGGED IN -> SHOW LOGIN & SELF-REGISTRATION PORTAL
  if (!loggedInMember) {
    return (
      <div className="max-w-4xl mx-auto py-4 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
              VidyaKosh Student Self-Service Portal
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1.5">
              Member Login & Online Admission Registration
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Log in to check your assigned seat, live entry/exit timestamps, study duration, and wallet balance — or register as a new member (auto-synced to Admin Console).
            </p>
          </div>
          <button
            onClick={onBackToAdmin}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Admin Console</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            <button
              type="button"
              onClick={() => setAuthTab('login')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                authTab === 'login'
                  ? 'border-indigo-600 text-indigo-600 dark:text-amber-400 dark:border-amber-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Member Login (ID / Phone + Password)</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthTab('register')}
              className={`py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors cursor-pointer ${
                authTab === 'register'
                  ? 'border-indigo-600 text-indigo-600 dark:text-amber-400 dark:border-amber-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>New Student Registration ({nextMemberId})</span>
            </button>
          </div>

          {authTab === 'login' ? (
            <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <form
                onSubmit={handleLoginSubmit}
                className="md:col-span-7 space-y-4"
              >
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Sign In to Your Library Account
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Enter your Member ID (e.g., LIB-1001) or 10-digit Mobile Number and Password
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Member ID / Mobile Number / Email *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., LIB-1001 or 9876543210"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Password *</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password (default: 123456)"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login to Member Dashboard</span>
                </button>
              </form>

              {/* Quick Member Switcher for Instant Inspection */}
              <div className="md:col-span-5 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Quick Access — Registered Library Members
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click any member below to open their live seat, attendance & wallet dashboard immediately:
                </p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {members.slice(0, 8).map((m) => {
                    const isInside = attendance.some(
                      (a) => a.memberId === m.id && a.status === 'Inside'
                    );
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => onSetLoggedInMemberId(m.id)}
                        className="w-full p-2.5 text-left bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">
                            {m.name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-500">
                            {m.id} · Bal: ₹{m.walletBalance}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isInside
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isInside ? `Seat ${m.seatId}` : 'Login →'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* NEW STUDENT SELF-REGISTRATION FORM (Auto-Synced with Admin) */
            <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    New Student Online Registration — Auto-Synced to Admin Directory
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Your Member ID will be <strong className="font-mono text-indigo-600 dark:text-amber-400">{nextMemberId}</strong>. Once registered, your profile & Face Template are immediately visible in the Admin Console.
                  </p>
                </div>
              </div>

              {/* Face Template Capture */}
              <FaceTemplateCaptureBox
                memberId={nextMemberId}
                currentTemplateId={regFaceTemplateId}
                onCaptureComplete={(id) => setRegFaceTemplateId(id)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Harshvardhan Singh"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Number (10-digit) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., 9811223344"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Create Login Password *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Create password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="student@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Exam / Course
                  </label>
                  <select
                    value={regExam}
                    onChange={(e) => setRegExam(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="UPSC CSE">UPSC CSE</option>
                    <option value="SSC CGL">SSC CGL / CHSL</option>
                    <option value="CA Final">CA Final / Inter</option>
                    <option value="NEET PG">NEET PG / UG</option>
                    <option value="JEE Advanced">JEE Main / Advanced</option>
                    <option value="IBPS PO / SBI PO">IBPS / SBI Banking</option>
                    <option value="GATE CS">GATE / ESE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Preferred Study Shift
                  </label>
                  <select
                    value={regShift}
                    onChange={(e) => setRegShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Full Day (24x7)">Full Day (24x7) — ₹15/hr</option>
                    <option value="Morning (6 AM - 2 PM)">Morning (6 AM - 2 PM) — ₹12/hr</option>
                    <option value="Evening (2 PM - 10 PM)">Evening (2 PM - 10 PM) — ₹14/hr</option>
                    <option value="Night (10 PM - 6 AM)">Night (10 PM - 6 AM) — ₹12/hr</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Seat Assignment Preference
                  </label>
                  <select
                    value={regSeatMode}
                    onChange={(e) =>
                      setRegSeatMode(e.target.value as 'Auto' | 'Manual')
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Auto">Auto 1-by-1 Seat on Entry ({nextAutoSeat?.code})</option>
                    <option value="Manual">Pick Fixed Seat Now</option>
                  </select>
                </div>

                {regSeatMode === 'Manual' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Select Vacant Seat ({vacantSeats.length} Free)
                    </label>
                    <select
                      value={regSeatId}
                      onChange={(e) => setRegSeatId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="">-- Choose Vacant Seat --</option>
                      {vacantSeats.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} · {s.rowZone} {s.hasAC ? '(AC)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Initial Prepaid Wallet Balance (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={regWalletDeposit}
                    onChange={(e) => setRegWalletDeposit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={regPaymentMode}
                    onChange={(e) =>
                      setRegPaymentMode(e.target.value as PaymentMode)
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Online">Online</option>
                    <option value="Cash">Cash at Desk</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAuthTab('login')}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
                >
                  Already registered? Login
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Registration & Open My Dashboard</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // LOGGED-IN MEMBER PERSONAL PORTAL VIEW
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
    liveWalletBalance / loggedInMember.hourlyRate
  ).toFixed(1);

  const gateQrUrl = `${window.location.origin}/?gate=scan`;

  return (
    <div className="space-y-6">
      {/* Top Member Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 font-mono font-bold text-base flex items-center justify-center shrink-0">
            {loggedInMember.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {loggedInMember.name}
              </h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {loggedInMember.id}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  activeSession
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
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
                  ? `Currently Inside — Sitting at Seat ${activeSession.seatCode}`
                  : 'Currently Outside Library'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
              {loggedInMember.examPrep} · {loggedInMember.shift} · Face ID:{' '}
              {loggedInMember.faceTemplateId}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onBackToAdmin}
            className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Admin View
          </button>
          <button
            onClick={() => onSetLoggedInMemberId(null)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout Member</span>
          </button>
        </div>
      </div>

      {/* HERO BANNER: Konsi Seat Mein Bethna Hain + Live Check-In / Check-Out Action */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-slate-900 dark:bg-slate-950 text-white border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                {activeSession
                  ? 'Your Active Study Seat & Live Timer'
                  : 'Ready for Library Check-In — Seat Assignment'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                {activeSession
                  ? `Sit at Seat ${activeSession.seatCode}`
                  : `Assigned Seat on Entry: ${assignedSeatCode}`}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
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

            <div className="flex items-center gap-2">
              {assignedSeatObj?.hasAC && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-mono">
                  <Wind className="w-3.5 h-3.5" /> AC Zone
                </span>
              )}
              {assignedSeatObj?.hasSocket && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-mono">
                  <Plug className="w-3.5 h-3.5" /> Power Socket
                </span>
              )}
            </div>
          </div>

          {/* 4-Card Live Status Strip inside Hero */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
            <div className="p-3.5 bg-slate-800/90 border border-slate-700/80 rounded-xl">
              <p className="text-[11px] font-sans text-slate-400">
                {activeSession ? 'Checked In At (In Time)' : 'Last Status'}
              </p>
              <p className="text-base font-bold text-emerald-400 mt-1">
                {activeSession
                  ? activeSession.checkInDisplay
                  : memberAttendance[0]?.checkOutDisplay || 'Not Inside'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeSession ? `Date: ${activeSession.date}` : 'Ready to Enter'}
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/90 border border-slate-700/80 rounded-xl">
              <p className="text-[11px] font-sans text-slate-400">
                {activeSession ? 'Live Running Duration' : 'Total Hours Studied'}
              </p>
              <p className="text-base font-bold text-white mt-1">
                {liveInfo
                  ? liveInfo.formatted
                  : `${loggedInMember.totalHoursUsed.toFixed(1)} hrs`}
              </p>
              <p className="text-[10px] text-amber-400 mt-0.5">
                Cumulative: {loggedInMember.totalHoursUsed.toFixed(1)} hrs
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/90 border border-slate-700/80 rounded-xl">
              <p className="text-[11px] font-sans text-slate-400">
                Live Wallet Balance
              </p>
              <p className="text-base font-bold text-emerald-400 mt-1">
                ₹{liveWalletBalance.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Rate: ₹{loggedInMember.hourlyRate}/hr
              </p>
            </div>

            <div className="p-3.5 bg-slate-800/90 border border-slate-700/80 rounded-xl">
              <p className="text-[11px] font-sans text-slate-400">
                Study Hours Remaining
              </p>
              <p className="text-base font-bold text-amber-400 mt-1">
                {remainingStudyHours} hrs
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Total Cut: ₹{loggedInMember.totalDeducted}
              </p>
            </div>
          </div>

          {/* Primary Check-In / Check-Out Trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-300">
              {activeSession ? (
                <span>
                  Aap abhi <strong>Seat {activeSession.seatCode}</strong> par baithe hain. Library se nikalte waqt Exit button dabayein.
                </span>
              ) : (
                <span>
                  Library gate par Common QR scan karein aur Face ID verify karke apni seat ({assignedSeatCode}) par baithein.
                </span>
              )}
            </div>

            {activeSession ? (
              <button
                onClick={() => onOpenFaceScanner(loggedInMember)}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Mark Exit · Scan Gate QR & Face ID</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenFaceScanner(loggedInMember)}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer"
              >
                <ScanFace className="w-4 h-4" />
                <span>
                  Scan Gate QR & Face ID to Check In (Seat {assignedSeatCode})
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Student's Face Template & Gate QR Pass */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  My Biometric Face ID & Gate QR
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Used at entrance for instant seat & timer start
                </p>
              </div>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="flex items-center gap-3.5 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div
                onClick={() => onOpenFaceScanner(loggedInMember)}
                className="p-2 bg-white border border-slate-200 rounded-lg shrink-0 cursor-pointer"
              >
                <QrCodeSvg value={gateQrUrl} size={84} />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Common Gate QR Ready
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
              onCaptureComplete={(newTemplateId) =>
                onUpdateMember({
                  ...loggedInMember,
                  faceRegistered: true,
                  faceTemplateId: newTemplateId,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Member's Complete In / Out / Duration / Seat / Wallet History Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>
                My Complete Entry / Exit History (Kab In Hua · Kab Out Hua · Seat · Duration · Wallet Balance)
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every study session logged via Common Gate QR + Face ID verification
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
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Assigned Seat</th>
                  <th className="py-3 px-4">Kab In Hua (Check-In)</th>
                  <th className="py-3 px-4">Kab Out Hua (Check-Out)</th>
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
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {att.date}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                          Seat {att.seatCode || 'S-01'}
                        </span>
                        <span className="ml-1.5 text-[11px] text-slate-400 font-sans">
                          ({att.seatAssignMode})
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>My Wallet Recharges & Digital Receipts ({memberPayments.length})</span>
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
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-4">Receipt No.</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Plan / Mode</th>
                  <th className="py-2.5 px-4 text-right">Amount Credited</th>
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
};
