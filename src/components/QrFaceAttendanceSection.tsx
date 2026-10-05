import React, { useState, useEffect } from 'react';
import {
  ScanFace,
  Printer,
  LogOut,
  Smartphone,
  Wallet,
  Clock,
  Download,
  FileText,
  Armchair,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { Member, Seat, AttendanceRecord } from '../types';
import { QrCodeSvg } from './QrCodeSvg';
import {
  exportAttendanceToCsv,
  triggerPrintPdfReport,
} from '../utils/exportUtils';

interface QrFaceAttendanceSectionProps {
  members: Member[];
  seats: Seat[];
  attendance: AttendanceRecord[];
  nextAutoSeat: Seat | null;
  onOpenFaceScanner: (member: Member) => void;
  onOpenMemberProfile: (memberId: string) => void;
  onOpenMemberPortal?: () => void;
}

export const QrFaceAttendanceSection: React.FC<
  QrFaceAttendanceSectionProps
> = ({
  members,
  attendance,
  nextAutoSeat,
  onOpenFaceScanner,
  onOpenMemberProfile,
  onOpenMemberPortal,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    members[0]?.id || 'LIB-1001'
  );
  const [quickSearch, setQuickSearch] = useState<string>('');
  const [tick, setTick] = useState<number>(0);
  const [gateTokenId, setGateTokenId] = useState<string>('VIDYAKOSH-MAIN-GATE-01');
  const [copiedGateUrl, setCopiedGateUrl] = useState<boolean>(false);

  // Live 1-second ticker so active session timers update in real time
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const currentlyInsideList = attendance.filter((a) => a.status === 'Inside');
  const selectedMember =
    members.find((m) => m.id === selectedMemberId) || members[0];
  const activeSession = selectedMember
    ? attendance.find(
        (a) => a.memberId === selectedMember.id && a.status === 'Inside'
      ) || null
    : null;

  // Universal scannable URL for the Common Library Gate QR code
  const scannableGateUrl = `${window.location.origin}/?gate=scan&token=${encodeURIComponent(
    gateTokenId
  )}`;

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

  const handleRegenerateUniversalGateQr = () => {
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    setGateTokenId(`VIDYAKOSH-GATE-${suffix}`);
  };

  const handlePrintEntranceGatePoster = () => {
    const existing = document.getElementById('printable-area');
    if (existing) {
      existing.removeAttribute('id');
    }

    const container = document.createElement('div');
    container.id = 'printable-area';
    container.className = 'hidden print:block bg-white text-slate-900 p-8';
    const qrSvgHtml =
      document.getElementById('universal-gate-qr-svg-wrapper')?.innerHTML || '';

    container.innerHTML = `
      <div style="max-width: 620px; margin: 0 auto; border: 3px solid #0f172a; border-radius: 20px; padding: 32px; text-align: center; font-family: sans-serif;">
        <div style="display: inline-block; background: #0f172a; color: #fbbf24; font-family: monospace; font-size: 12px; font-weight: 700; padding: 6px 14px; border-radius: 999px; text-transform: uppercase;">
          Universal Library Entrance Gate
        </div>
        <h1 style="font-size: 26px; margin: 14px 0 6px; font-weight: 800;">VidyaKosh Study Hall</h1>
        <p style="font-size: 13px; color: #475569; margin-bottom: 20px;">Single-Floor AC Reading Room · Common Gate QR + Face ID Attendance</p>
        <div style="display: flex; justify-content: center; margin: 18px 0;">
          ${qrSvgHtml}
        </div>
        <div style="margin-top: 16px; font-family: monospace; font-size: 12px; color: #334155; background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
          Gate ID: <strong>${gateTokenId}</strong><br/>
          Scan URL: ${scannableGateUrl}
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; text-align: left; margin-top: 20px; font-size: 11px;">
          <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px;"><strong>1. Scan Gate QR</strong><br/>Scan this single Common QR at the entrance with your phone.</div>
          <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px;"><strong>2. Verify Face ID</strong><br/>Match your enrolled Face Template to start timer & get your seat.</div>
          <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px;"><strong>3. Scan on Exit</strong><br/>Scan again when leaving to stop timer & settle hourly wallet balance.</div>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    window.print();
    setTimeout(() => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }, 800);
  };

  const handleExportAttendancePdf = () => {
    const headers = [
      'Date',
      'Member',
      'Seat & Mode',
      'Entry → Exit',
      'Hours',
      'Fee Cut',
      'Rem. Balance',
    ];
    const rows = attendance.map((a) => {
      const hrs = a.durationMinutes ? Math.floor(a.durationMinutes / 60) : 0;
      const mins = a.durationMinutes ? a.durationMinutes % 60 : 0;
      return [
        a.date,
        `${a.memberName} (${a.memberId})`,
        `${a.seatCode || 'Auto'} (${a.seatAssignMode})`,
        `${a.checkInDisplay} -> ${a.checkOutDisplay || 'Active'}`,
        a.status === 'Inside' ? 'Running' : `${hrs}h ${mins}m`,
        a.feeDeducted !== null
          ? `-INR ${a.feeDeducted}`
          : `INR ${a.hourlyRateApplied}/hr`,
        a.balanceAfterExit !== null
          ? `INR ${a.balanceAfterExit}`
          : 'In Library',
      ];
    });

    triggerPrintPdfReport(
      'VidyaKosh — Biometric Face ID Attendance & Hourly Fee Ledger',
      `Currently Inside: ${currentlyInsideList.length} Students · Total Logged Sessions: ${attendance.length}`,
      headers,
      rows
    );
  };

  const filteredMembers = members.filter((m) => {
    if (m.status === 'Left') return false;
    if (!quickSearch.trim()) return true;
    const q = quickSearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      m.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Common Library Gate QR + Face ID Biometric Attendance
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Universal entrance QR code for all members · Verified against stored{' '}
            <code className="font-mono text-indigo-600 dark:text-indigo-400">
              faceTemplateId
            </code>{' '}
            with automatic 1-by-1 seat assignment & hourly wallet settlement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenMemberPortal && (
            <button
              onClick={onOpenMemberPortal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Open Student Login & Self-Check-In Portal</span>
            </button>
          )}
          <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-mono tabular-nums text-emerald-900 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Currently Studying Inside: {currentlyInsideList.length}</span>
          </div>
        </div>
      </div>

      {/* Top Grid: Universal Common Gate QR Generator (5 cols) + Gate Face ID Terminal (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Dedicated Universal Common Gate QR Code Generator & Print Card */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                  Universal Entrance Standee
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  Common Gate QR Code Generator
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Place this single QR poster at the library entrance for all students
                </p>
              </div>
              <button
                type="button"
                onClick={handleRegenerateUniversalGateQr}
                title="Generate new Gate QR Token"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate QR</span>
              </button>
            </div>

            {/* Real Scannable QR Code Display */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center text-center space-y-3">
              <div
                id="universal-gate-qr-svg-wrapper"
                onClick={() =>
                  selectedMember && onOpenFaceScanner(selectedMember)
                }
                title="Click or Scan with Phone Camera to launch Gate Face ID Check-In"
                className="p-3 bg-white border-2 border-slate-900 rounded-xl shadow-sm cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <QrCodeSvg value={scannableGateUrl} size={172} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>VIDYAKOSH UNIVERSAL GATE QR</span>
                </p>
                <p className="text-[11px] font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-0.5 font-semibold">
                  Token: {gateTokenId}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
                  Next Auto Seat Queue: {nextAutoSeat ? nextAutoSeat.code : 'Full'}
                </p>
              </div>
            </div>

            {/* Copyable Gate Link */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono">
              <span className="truncate text-slate-600 dark:text-slate-300">
                {scannableGateUrl}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(scannableGateUrl);
                  setCopiedGateUrl(true);
                  setTimeout(() => setCopiedGateUrl(false), 2000);
                }}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-sans font-semibold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-700 shrink-0 cursor-pointer"
              >
                {copiedGateUrl ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handlePrintEntranceGatePoster}
              className="w-full py-2.5 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Entrance QR Poster</span>
            </button>
            <button
              type="button"
              onClick={() => selectedMember && onOpenFaceScanner(selectedMember)}
              className="w-full py-2.5 px-3 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ScanFace className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Launch Gate Scanner</span>
            </button>
          </div>
        </div>

        {/* Right: Gate Face ID Check-In / Check-Out Terminal */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Entrance Gate Biometric Check-In / Check-Out Console
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a member to verify their stored Face Template, assign a seat, and view live study hours & wallet balance
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">
                1-by-1 Seat + Hourly Balance Cut
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Search Member (Name / ID / Phone)
                </label>
                <input
                  type="text"
                  placeholder="Type name or LIB-1001..."
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Member at Entrance Gate
                </label>
                <select
                  value={selectedMember?.id || ''}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {filteredMembers.map((m) => {
                    const isInside = currentlyInsideList.some(
                      (a) => a.memberId === m.id
                    );
                    return (
                      <option key={m.id} value={m.id}>
                        {m.id} · {m.name} · Bal: ₹{m.walletBalance}{' '}
                        {isInside ? `· [INSIDE - ${m.seatId}]` : '· [OUTSIDE]'}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Member's Live Study Hours, Stored Face Template & Balance Card */}
            {selectedMember && (
              <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-xl space-y-3.5 border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <p className="text-xs font-bold text-white flex items-center gap-2">
                      <span>
                        {selectedMember.name} ({selectedMember.id})
                      </span>
                      <span className="text-[11px] font-mono text-indigo-300 bg-indigo-950/80 border border-indigo-800 px-2 py-0.5 rounded">
                        {selectedMember.faceTemplateId}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedMember.examPrep} · Rate: ₹
                      {selectedMember.hourlyRate}/hr · Policy:{' '}
                      {selectedMember.seatAssignmentMode}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold ${
                      activeSession ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {activeSession
                      ? `Seated at ${activeSession.seatCode}`
                      : `Next Seat: ${
                          selectedMember.seatId || nextAutoSeat?.code || 'S-01'
                        }`}
                  </span>
                </div>

                {/* Live Hours & Balance Readout */}
                {(() => {
                  const liveInfo = activeSession
                    ? formatElapsed(activeSession.checkInTimestamp)
                    : null;
                  const liveAccruedFee =
                    liveInfo && activeSession
                      ? Math.round(
                          liveInfo.hoursFloat * activeSession.hourlyRateApplied
                        )
                      : 0;
                  const effectiveRemainingBal = Math.max(
                    0,
                    selectedMember.walletBalance - liveAccruedFee
                  );
                  const hoursRemaining = (
                    effectiveRemainingBal / selectedMember.hourlyRate
                  ).toFixed(1);

                  return (
                    <div className="grid grid-cols-3 gap-2.5 text-xs font-mono tabular-nums">
                      <div className="p-2.5 bg-slate-800/90 rounded-lg">
                        <p className="text-[10px] font-sans text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>
                            {activeSession ? 'Live Session' : 'Hours Studied'}
                          </span>
                        </p>
                        <p className="text-sm font-bold text-white mt-1">
                          {liveInfo
                            ? liveInfo.formatted
                            : `${selectedMember.totalHoursUsed.toFixed(1)} hrs`}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Total: {selectedMember.totalHoursUsed.toFixed(1)}h
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-800/90 rounded-lg">
                        <p className="text-[10px] font-sans text-slate-400 flex items-center gap-1">
                          <Wallet className="w-3 h-3 text-emerald-400" />
                          <span>Wallet Balance</span>
                        </p>
                        <p className="text-sm font-bold text-emerald-400 mt-1">
                          ₹{effectiveRemainingBal.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {activeSession
                            ? `Accrued: -₹${liveAccruedFee}`
                            : `Rate: ₹${selectedMember.hourlyRate}/hr`}
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-800/90 rounded-lg">
                        <p className="text-[10px] font-sans text-slate-400 flex items-center gap-1">
                          <Armchair className="w-3 h-3 text-indigo-400" />
                          <span>Hours Remaining</span>
                        </p>
                        <p className="text-sm font-bold text-amber-400 mt-1">
                          {hoursRemaining} hrs left
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Seat:{' '}
                          {activeSession
                            ? activeSession.seatCode
                            : selectedMember.seatId ||
                              nextAutoSeat?.code ||
                              'Auto'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          {selectedMember && (
            <div className="pt-2">
              {activeSession ? (
                <button
                  onClick={() => onOpenFaceScanner(selectedMember)}
                  className="w-full py-3 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>
                    Scan Gate QR + Verify Face ({selectedMember.faceTemplateId}) to Exit & Settle Fee
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => onOpenFaceScanner(selectedMember)}
                  className="w-full py-3 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
                >
                  <ScanFace className="w-4 h-4" />
                  <span>
                    Scan Gate QR + Verify Face ({selectedMember.faceTemplateId}) to Enter & Assign Seat
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Live Currently Inside Members Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Live Members Inside Single-Floor Hall ({currentlyInsideList.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time study timer, assigned seat, and accrued hourly wallet deduction
            </p>
          </div>
        </div>

        {currentlyInsideList.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">
            No students currently checked in. Use the Gate Face ID console above to check in a member.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentlyInsideList.map((sess) => {
              const mem = members.find((m) => m.id === sess.memberId);
              const elapsed = formatElapsed(sess.checkInTimestamp);
              const accrued = Math.max(
                5,
                Math.round(elapsed.hoursFloat * sess.hourlyRateApplied)
              );
              const liveBal = Math.max(
                0,
                (mem?.walletBalance || 0) - accrued
              );
              return (
                <div
                  key={sess.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <button
                        onClick={() => onOpenMemberProfile(sess.memberId)}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left"
                      >
                        {sess.memberName}
                      </button>
                      <p className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {sess.memberId} · In at {sess.checkInDisplay}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 rounded">
                      Seat {sess.seatCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700 text-[11px] font-mono tabular-nums">
                    <div>
                      <span className="text-slate-400 block">Timer</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">
                        {elapsed.formatted}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Fee Accrued</span>
                      <strong className="text-amber-600 dark:text-amber-400">
                        ₹{accrued}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Live Bal</span>
                      <strong className="text-slate-900 dark:text-white">
                        ₹{liveBal}
                      </strong>
                    </div>
                  </div>

                  <button
                    onClick={() => mem && onOpenFaceScanner(mem)}
                    className="w-full py-1.5 px-3 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Mark Exit & Scan Face ID</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Biometric Attendance & Hourly Fee Deduction Ledger with Contextual CSV + PDF Export */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Admin Biometric Attendance & Hourly Wallet Deduction Ledger
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete log of every student's Common QR + Face ID entry, exit, assigned seat, study hours, and fee deducted
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportAttendanceToCsv(attendance)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportAttendancePdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Seat & Policy</th>
                <th className="py-3 px-4">Face ID Verification</th>
                <th className="py-3 px-4">Entry → Exit</th>
                <th className="py-3 px-4">Study Hours</th>
                <th className="py-3 px-4 text-right">Fee Deducted</th>
                <th className="py-3 px-4 text-right">Rem. Balance</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
              {attendance.map((att) => {
                const mem = members.find((m) => m.id === att.memberId);
                const hrs = att.durationMinutes
                  ? Math.floor(att.durationMinutes / 60)
                  : 0;
                const mins = att.durationMinutes
                  ? att.durationMinutes % 60
                  : 0;

                return (
                  <tr
                    key={att.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {att.date}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onOpenMemberProfile(att.memberId)}
                        className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left"
                      >
                        {att.memberName}
                      </button>
                      <div className="text-[11px] font-mono tabular-nums text-slate-500">
                        {att.memberId} · {mem?.faceTemplateId || 'FACE-BIO'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {att.seatCode || 'S-01'}
                      </span>
                      <div className="text-[11px] text-slate-500">
                        {att.seatAssignMode}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {att.faceMatchScore}% Match
                      </span>
                      <div className="text-[11px] text-slate-500">
                        {att.exitFaceVerified
                          ? 'In & Out Verified'
                          : 'Entry Verified'}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums">
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        {att.checkInDisplay}
                      </span>
                      <span className="mx-1.5 text-slate-400">→</span>
                      {att.checkOutDisplay ? (
                        <span className="text-slate-800 dark:text-slate-200 font-medium">
                          {att.checkOutDisplay}
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">
                          Studying Now
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {att.status === 'Inside' ? (
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {formatElapsed(att.checkInTimestamp).formatted}
                        </span>
                      ) : (
                        `${hrs}h ${mins}m`
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                      {att.feeDeducted !== null ? (
                        <span className="text-rose-600 dark:text-rose-400">
                          -₹{att.feeDeducted}
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          ₹{att.hourlyRateApplied}/hr
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      {att.balanceAfterExit !== null ? (
                        `₹${att.balanceAfterExit.toLocaleString('en-IN')}`
                      ) : (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {att.status === 'Inside' && mem ? (
                        <button
                          onClick={() => onOpenFaceScanner(mem)}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors cursor-pointer"
                        >
                          Face Exit
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">
                          Settled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
