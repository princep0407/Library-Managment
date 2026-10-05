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
}

export const QrFaceAttendanceSection: React.FC<
  QrFaceAttendanceSectionProps
> = ({
  members,
  attendance,
  nextAutoSeat,
  onOpenFaceScanner,
  onOpenMemberProfile,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    members[0]?.id || 'LIB-1001'
  );
  const [quickSearch, setQuickSearch] = useState<string>('');
  const [tick, setTick] = useState<number>(0);

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

  // Real scannable URL for the Common Library Gate QR code
  const scannableGateUrl = `${window.location.origin}/?gate=scan`;

  const formatElapsed = (startMs: number) => {
    const totalSec = Math.max(
      0,
      Math.floor((Date.now() - startMs) / 1000) + (tick * 0)
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
        a.balanceAfterExit !== null ? `INR ${a.balanceAfterExit}` : 'Active',
      ];
    });
    triggerPrintPdfReport(
      'Biometric Attendance & Hourly Balance Deduction Report',
      `Total Logged Sessions: ${attendance.length} · Currently Inside: ${currentlyInsideList.length}`,
      headers,
      rows
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Common Gate QR + Face ID Entry, Exit & Member Live Balance
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Scan the common Library Gate QR with any phone camera (or click QR below) · Member sees live study hours completed & remaining wallet balance
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2 rounded-lg">
            Next Auto Seat:{' '}
            <strong className="text-indigo-600 dark:text-indigo-400">
              {nextAutoSeat ? nextAutoSeat.code : 'Full'}
            </strong>
          </div>
          <div className="text-xs font-mono tabular-nums bg-slate-900 dark:bg-indigo-600 text-white px-3.5 py-2 rounded-lg">
            Inside Now:{' '}
            <strong className="text-amber-300">
              {currentlyInsideList.length} Students
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Scannable Common Library Gate QR Poster + Student Phone Live View (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Master Library Entrance QR Code
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% Scannable ISO QR · Scan with phone camera or click QR to test
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Gate Poster</span>
            </button>
          </div>

          {/* Printable & Clickable Scannable Common QR Card */}
          <div
            onClick={() => selectedMember && onOpenFaceScanner(selectedMember)}
            title="Click QR Code or scan with mobile camera to open Student Face ID & Live Balance Portal"
            className="p-5 bg-slate-900 dark:bg-slate-950 text-white rounded-xl flex flex-col items-center text-center space-y-3 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all border border-slate-800"
          >
            <div className="text-[11px] font-mono tabular-nums text-amber-400 tracking-wider">
              VIDYAKOSH SINGLE-FLOOR STUDY HALL
            </div>
            <h3 className="text-sm font-bold">
              Scan on Phone or Click QR for Face ID Entry / Exit
            </h3>
            <div className="p-3 bg-white rounded-xl shadow-md">
              <QrCodeSvg value={scannableGateUrl} size={144} />
            </div>
            <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
              One Common QR for all members · Tap QR above or scan from mobile camera to verify Face ID, auto-assign seat & check your live hours & balance.
            </p>
          </div>

          {/* Student Live Hours & Balance Inspector */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Student Mobile Portal — Check Hours & Balance</span>
              </span>
            </div>

            <input
              type="text"
              placeholder="Search student by Name or ID (LIB-1001)..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />

            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium text-slate-900 dark:text-white"
            >
              {members
                .filter((m) =>
                  !quickSearch.trim()
                    ? true
                    : m.name
                        .toLowerCase()
                        .includes(quickSearch.toLowerCase()) ||
                      m.id.toLowerCase().includes(quickSearch.toLowerCase())
                )
                .map((m) => {
                  const isInside = attendance.some(
                    (a) => a.memberId === m.id && a.status === 'Inside'
                  );
                  return (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.id}) · {m.totalHoursUsed.toFixed(1)}h done · Bal: ₹
                      {m.walletBalance}{' '}
                      {isInside ? `· [INSIDE - ${m.seatId}]` : '· [OUTSIDE]'}
                    </option>
                  );
                })}
            </select>

            {/* Member's Live Study Hours & Balance Card */}
            {selectedMember && (
              <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white rounded-xl space-y-3.5 border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <p className="text-xs font-bold text-white">
                      {selectedMember.name} ({selectedMember.id})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {selectedMember.examPrep} · Rate: ₹{selectedMember.hourlyRate}/hr
                    </p>
                  </div>
                  <span
                    className={`text-xs font-mono tabular-nums font-semibold ${
                      activeSession ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {activeSession
                      ? `Inside (Seat ${activeSession.seatCode})`
                      : 'Outside Hall'}
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
                          {liveAccruedFee > 0
                            ? `-₹${liveAccruedFee} running`
                            : `₹${selectedMember.hourlyRate}/hr tariff`}
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-800/90 rounded-lg">
                        <p className="text-[10px] font-sans text-slate-400 flex items-center gap-1">
                          <Armchair className="w-3 h-3 text-indigo-400" />
                          <span>Balance Hours</span>
                        </p>
                        <p className="text-sm font-bold text-amber-400 mt-1">
                          {hoursRemaining} hrs
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Left in wallet
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <button
                  onClick={() => onOpenFaceScanner(selectedMember)}
                  className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeSession
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <ScanFace className="w-4 h-4" />
                  <span>
                    {activeSession
                      ? `Mark as Exit on Phone & Scan Face ID (Seat ${activeSession.seatCode})`
                      : `Scan Common QR & Face ID for Entry (Auto Seat ${
                          nextAutoSeat?.code || 'Next'
                        })`}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Active Sessions (with Live Hours & Balance) + Admin Ledger with Export PDF/CSV (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Students Currently Inside */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Students Currently Inside — Live Hours & Balance Monitor (
                  {currentlyInsideList.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time study duration, running fee & remaining wallet balance for every active student
                </p>
              </div>
            </div>

            {currentlyInsideList.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No students currently inside. Scan the Common QR + Face ID on the left to log entry.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentlyInsideList.map((rec) => {
                  const mObj = members.find((m) => m.id === rec.memberId);
                  const live = formatElapsed(rec.checkInTimestamp);
                  const accrued = Math.round(
                    live.hoursFloat * rec.hourlyRateApplied
                  );
                  const remBal = Math.max(
                    0,
                    (mObj?.walletBalance || 0) - accrued
                  );

                  return (
                    <div
                      key={rec.id}
                      className="p-3.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-between gap-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <button
                            onClick={() => onOpenMemberProfile(rec.memberId)}
                            className="text-xs font-bold text-slate-900 dark:text-white hover:underline truncate block"
                          >
                            {rec.memberName} ({rec.memberId})
                          </button>
                          <p className="text-[11px] font-mono tabular-nums text-indigo-600 dark:text-indigo-400 font-semibold">
                            Seat {rec.seatCode} ({rec.seatAssignMode}) · In{' '}
                            {rec.checkInDisplay}
                          </p>
                        </div>
                        {mObj && (
                          <button
                            onClick={() => onOpenFaceScanner(mObj)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
                          >
                            <LogOut className="w-3 h-3" />
                            <span>Exit Scan</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-[11px] font-mono tabular-nums">
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                          Timer: {live.formatted}
                        </span>
                        <span className="text-slate-600 dark:text-slate-300">
                          Total: {mObj?.totalHoursUsed.toFixed(1)}h
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          Bal: ₹{remBal}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Complete Admin Attendance & Per-Hour Fee Deduction Ledger (with Contextual Export CSV & PDF) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Admin Biometric Log & Hourly Balance Deduction Ledger (
                  {attendance.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Complete record of Entry/Exit Face ID scans, study hours & wallet balance cuts
                </p>
              </div>

              {/* Contextual Export PDF & CSV buttons for Attendance Logs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportAttendanceToCsv(attendance)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleExportAttendancePdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-[340px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3 font-medium">Member & Face ID</th>
                    <th className="py-2.5 px-3 font-medium">Seat & Mode</th>
                    <th className="py-2.5 px-3 font-medium">Entry → Exit</th>
                    <th className="py-2.5 px-3 font-medium">Duration</th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      Hourly Cut
                    </th>
                    <th className="py-2.5 px-3 font-medium text-right">
                      Rem. Bal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {attendance.map((att) => {
                    const hrs = att.durationMinutes
                      ? Math.floor(att.durationMinutes / 60)
                      : 0;
                    const mins = att.durationMinutes
                      ? att.durationMinutes % 60
                      : 0;
                    const mObj = members.find((m) => m.id === att.memberId);

                    return (
                      <tr
                        key={att.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => onOpenMemberProfile(att.memberId)}
                            className="font-semibold text-slate-900 dark:text-white hover:underline text-left"
                          >
                            {att.memberName}
                          </button>
                          <p className="text-[11px] font-mono tabular-nums text-slate-500">
                            {att.memberId} · Face {att.faceMatchScore}%
                          </p>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">
                            {att.seatCode || '—'}
                          </span>
                          <p className="text-[10px] text-slate-500">
                            {att.seatAssignMode}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          <div>{att.date}</div>
                          <div>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {att.checkInDisplay}
                            </span>
                            {' → '}
                            <span>{att.checkOutDisplay || 'Active'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums">
                          {att.status === 'Inside' ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              Running
                            </span>
                          ) : (
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {hrs}h {mins}m
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                          {att.feeDeducted !== null ? (
                            <span className="font-bold text-rose-600 dark:text-rose-400">
                              -₹{att.feeDeducted}
                            </span>
                          ) : (
                            <span className="text-slate-500">
                              ₹{att.hourlyRateApplied}/hr
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-emerald-600 dark:text-emerald-400">
                          {att.balanceAfterExit !== null
                            ? `₹${att.balanceAfterExit}`
                            : mObj
                            ? `₹${mObj.walletBalance}`
                            : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
