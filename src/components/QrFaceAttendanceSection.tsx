import React, { useState } from 'react';
import {
  ScanFace,
  Printer,
  LogIn,
  LogOut,
  Smartphone,
  Wallet,
  Armchair,
} from 'lucide-react';
import { Member, Seat, AttendanceRecord } from '../types';
import { COMMON_LIBRARY_QR_PAYLOAD } from '../data/initialData';
import { QrCodeSvg } from './QrCodeSvg';

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

  const currentlyInsideList = attendance.filter((a) => a.status === 'Inside');
  const selectedMember =
    members.find((m) => m.id === selectedMemberId) || members[0];
  const activeSession = selectedMember
    ? attendance.find(
        (a) => a.memberId === selectedMember.id && a.status === 'Inside'
      ) || null
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Common Gate QR + Face ID Biometric Entry & Exit
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Ek hi common Library QR code sabhi members ke liye · Entry par Face ID scan hote hi sequential seat (1-by-1) assign hogi aur Exit par hourly usage ke hisab se wallet balance cut hoga
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono tabular-nums bg-white border border-stone-200 px-3.5 py-2 rounded-lg">
            Next Auto Seat:{' '}
            <strong className="text-indigo-700">
              {nextAutoSeat ? nextAutoSeat.code : 'Full'}
            </strong>
          </div>
          <div className="text-xs font-mono tabular-nums bg-stone-900 text-white px-3.5 py-2 rounded-lg">
            Inside Now:{' '}
            <strong className="text-amber-400">
              {currentlyInsideList.length} Students
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Common Library Gate QR Poster + Student Phone Face ID Kiosk (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <div>
              <h2 className="text-base font-bold text-stone-900">
                Master Library Entrance QR Poster
              </h2>
              <p className="text-xs text-stone-500">
                Single common QR code placed at library gate for all students
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Gate QR</span>
            </button>
          </div>

          {/* Printable Common QR Card */}
          <div
            id="printable-area"
            className="p-5 bg-stone-900 text-white rounded-xl flex flex-col items-center text-center space-y-3"
          >
            <div className="text-xs font-mono tabular-nums text-amber-400 tracking-wider">
              VIDYAKOSH SINGLE-FLOOR STUDY HALL
            </div>
            <h3 className="text-sm font-bold">
              Scan on Phone for Face ID Entry & Exit
            </h3>
            <div className="p-3 bg-white rounded-xl shadow-md">
              <QrCodeSvg value={COMMON_LIBRARY_QR_PAYLOAD} size={136} />
            </div>
            <p className="text-[11px] text-stone-300 max-w-xs leading-relaxed">
              1. Scan this Common Library QR from your phone · 2. Verify Face ID · 3. Seat assigns automatically (1-by-1) & timer starts · 4. Scan & Verify Face ID on Exit to deduct hourly fee.
            </p>
          </div>

          {/* Student Phone Simulator / Gate Selector */}
          <div className="pt-2 border-t border-stone-200 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
              <Smartphone className="w-4 h-4 text-indigo-700" />
              <span>Simulate Student Phone QR Scan + Face ID Verification</span>
            </div>

            <input
              type="text"
              placeholder="Filter member by Name or ID (LIB-1001)..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
            />

            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg font-medium"
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
                      {m.name} ({m.id}) · Bal: ₹{m.walletBalance} (₹{m.hourlyRate}/hr){' '}
                      {isInside ? `· [INSIDE - Seat ${m.seatId}]` : '· [OUTSIDE]'}
                    </option>
                  );
                })}
            </select>

            {selectedMember && (
              <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900">
                    {selectedMember.name} ({selectedMember.id})
                  </span>
                  <span className="font-mono tabular-nums text-emerald-700 font-semibold">
                    Wallet: ₹{selectedMember.walletBalance} (₹
                    {selectedMember.hourlyRate}/hr)
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-600 font-mono tabular-nums">
                  <span>
                    Gate State:{' '}
                    <strong className="text-stone-900">
                      {activeSession
                        ? `Inside on Seat ${activeSession.seatCode} since ${activeSession.checkInDisplay}`
                        : 'Outside Hall'}
                    </strong>
                  </span>
                </div>

                <button
                  onClick={() => onOpenFaceScanner(selectedMember)}
                  className={`w-full mt-2 py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${
                    activeSession
                      ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                      : 'bg-indigo-700 text-white hover:bg-indigo-800'
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

        {/* Right: Admin Live Session & Hourly Fee Deduction Log (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Students Currently Inside */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-stone-900">
                  Live Active Sessions Inside Single-Floor Hall ({currentlyInsideList.length})
                </h2>
                <p className="text-xs text-stone-500">
                  Students who scanned Common Gate QR + Face ID · Timer running · Click "Exit + Face ID" when leaving
                </p>
              </div>
            </div>

            {currentlyInsideList.length === 0 ? (
              <p className="text-xs text-stone-500 py-6 text-center">
                No students currently inside. Use the QR + Face ID scanner on the left to log entry.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentlyInsideList.map((rec) => {
                  const mObj = members.find((m) => m.id === rec.memberId);
                  return (
                    <div
                      key={rec.id}
                      className="p-3.5 bg-stone-50 border border-stone-200 rounded-lg flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <button
                          onClick={() => onOpenMemberProfile(rec.memberId)}
                          className="text-xs font-bold text-stone-900 hover:underline truncate block"
                        >
                          {rec.memberName} ({rec.memberId})
                        </button>
                        <p className="text-[11px] font-mono tabular-nums text-indigo-700 font-medium">
                          Seat {rec.seatCode} ({rec.seatAssignMode}) · In:{' '}
                          {rec.checkInDisplay}
                        </p>
                        <p className="text-[11px] font-mono tabular-nums text-stone-500">
                          Face Match {rec.faceMatchScore}% · Rate: ₹
                          {rec.hourlyRateApplied}/hr · Bal: ₹
                          {mObj?.walletBalance ?? 0}
                        </p>
                      </div>

                      {mObj && (
                        <button
                          onClick={() => onOpenFaceScanner(mObj)}
                          className="px-3 py-1.5 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Exit Scan</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Complete Admin Attendance & Per-Hour Fee Deduction Log */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Admin Biometric Log & Hourly Balance Deduction Ledger ({attendance.length})
                </h3>
                <p className="text-xs text-stone-500">
                  Every Entry & Exit Face ID scan, auto-assigned seat, study duration, and exact hourly fee deducted from balance
                </p>
              </div>
            </div>

            <div className="border border-stone-200 rounded-lg overflow-hidden max-h-[340px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-stone-600">
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
                <tbody className="divide-y divide-stone-100">
                  {attendance.map((att) => {
                    const hrs = att.durationMinutes
                      ? Math.floor(att.durationMinutes / 60)
                      : 0;
                    const mins = att.durationMinutes
                      ? att.durationMinutes % 60
                      : 0;
                    const mObj = members.find((m) => m.id === att.memberId);

                    return (
                      <tr key={att.id} className="hover:bg-stone-50">
                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => onOpenMemberProfile(att.memberId)}
                            className="font-semibold text-stone-900 hover:underline text-left"
                          >
                            {att.memberName}
                          </button>
                          <p className="text-[11px] font-mono tabular-nums text-stone-500">
                            {att.memberId} · Face {att.faceMatchScore}%
                          </p>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums">
                          <span className="font-bold text-indigo-800">
                            {att.seatCode || '—'}
                          </span>
                          <p className="text-[10px] text-stone-500">
                            {att.seatAssignMode}
                          </p>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-stone-600">
                          <div>{att.date}</div>
                          <div>
                            <span className="text-emerald-700">
                              {att.checkInDisplay}
                            </span>
                            {' → '}
                            <span>{att.checkOutDisplay || 'Active'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums">
                          {att.status === 'Inside' ? (
                            <span className="text-indigo-700 font-semibold">
                              Timer Running
                            </span>
                          ) : (
                            <span className="font-semibold text-stone-900">
                              {hrs}h {mins}m
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right">
                          {att.feeDeducted !== null ? (
                            <span className="font-bold text-rose-600">
                              -₹{att.feeDeducted}
                            </span>
                          ) : (
                            <span className="text-stone-500">
                              ₹{att.hourlyRateApplied}/hr
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-right font-semibold text-emerald-700">
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
