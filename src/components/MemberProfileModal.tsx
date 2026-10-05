import React from 'react';
import {
  X,
  Printer,
  CreditCard,
  ScanFace,
  Clock,
  Receipt,
  LogIn,
  LogOut,
  Wallet,
} from 'lucide-react';
import {
  Member,
  MemberStatus,
  FeePayment,
  AttendanceRecord,
} from '../types';
import { COMMON_LIBRARY_QR_PAYLOAD } from '../data/initialData';
import { QrCodeSvg } from './QrCodeSvg';

interface MemberProfileModalProps {
  member: Member | null;
  onClose: () => void;
  payments: FeePayment[];
  attendance: AttendanceRecord[];
  onOpenReceipt: (payment: FeePayment) => void;
  onInitiateRenewal: (member: Member) => void;
  onUpdateStatus: (memberId: string, status: MemberStatus) => void;
  onOpenFaceScanForMember: (member: Member) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  onClose,
  payments,
  attendance,
  onOpenReceipt,
  onInitiateRenewal,
  onUpdateStatus,
  onOpenFaceScanForMember,
}) => {
  if (!member) return null;

  const memberPayments = payments.filter((p) => p.memberId === member.id);
  const memberAttendance = attendance.filter((a) => a.memberId === member.id);
  const activeSession = memberAttendance.find((a) => a.status === 'Inside');

  const totalPaidLifetime = memberPayments.reduce(
    (sum, p) => sum + p.totalPaid,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-900 text-white">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">{member.name}</h3>
              <span className="text-xs font-mono tabular-nums text-stone-300">
                · {member.id} · {member.status}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {member.examPrep} Aspirant · +91 {member.phone} · Face ID:{' '}
              <span className="font-mono tabular-nums text-emerald-400">
                {member.faceTemplateId}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onInitiateRenewal(member)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Recharge Wallet Balance</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
              aria-label="Close member profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200 max-h-[80vh] overflow-y-auto">
          {/* Left Column: Biometric Face ID & Wallet Status (5 cols) */}
          <div className="lg:col-span-5 p-6 space-y-5 bg-stone-50/70">
            {/* Wallet Balance & Hourly Rate Card */}
            <div className="bg-stone-900 text-white rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-amber-400" />
                  <span>Prepaid Library Wallet Balance</span>
                </span>
                <span className="text-xs font-mono tabular-nums text-amber-400">
                  Rate: ₹{member.hourlyRate}/hr
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold font-mono tabular-nums">
                  ₹{member.walletBalance.toLocaleString('en-IN')}
                </p>
                <p className="text-xs font-mono tabular-nums text-stone-400">
                  ~{Math.floor(member.walletBalance / member.hourlyRate)} hrs left
                </p>
              </div>
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-[11px] font-mono tabular-nums text-stone-400">
                <span>Used: {member.totalHoursUsed.toFixed(1)} hrs</span>
                <span>Total Cut: ₹{member.totalDeducted.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Common Gate QR + Face ID Biometric Card */}
            <div
              id="printable-area"
              className="bg-white border border-stone-200 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                <div>
                  <p className="text-xs font-bold text-stone-900">
                    COMMON GATE QR + FACE ID BIOMETRIC
                  </p>
                  <p className="text-[11px] text-stone-500">
                    All members scan this common library QR & verify Face ID
                  </p>
                </div>
                <ScanFace className="w-4 h-4 text-indigo-700" />
              </div>

              <div className="flex items-center gap-4">
                <div className="p-1.5 border border-stone-200 rounded-lg bg-white shrink-0">
                  <QrCodeSvg value={COMMON_LIBRARY_QR_PAYLOAD} size={96} />
                </div>

                <div className="space-y-1 min-w-0 text-xs">
                  <p className="font-bold text-stone-900 truncate">
                    {member.name} ({member.id})
                  </p>
                  <p className="font-mono tabular-nums text-emerald-700 font-medium">
                    Face ID: {member.faceTemplateId} (Active)
                  </p>
                  <p className="font-mono tabular-nums text-stone-700">
                    Seat:{' '}
                    <strong>
                      {member.seatId
                        ? `${member.seatId} (${member.seatAssignmentMode})`
                        : 'Auto 1-by-1 on Entry'}
                    </strong>
                  </p>
                  <p className="font-mono tabular-nums text-stone-500">
                    Locker: {member.lockerId || 'None'} · ₹{member.hourlyRate}/hr
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Gate Scan / Print Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print ID Record</span>
              </button>

              <button
                onClick={() => onOpenFaceScanForMember(member)}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  activeSession
                    ? 'text-amber-950 bg-amber-400 hover:bg-amber-300'
                    : 'text-white bg-indigo-700 hover:bg-indigo-800'
                }`}
              >
                {activeSession ? (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Face ID Exit Scan</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Face ID Entry Scan</span>
                  </>
                )}
              </button>
            </div>

            {/* Status Management */}
            <div className="pt-3 border-t border-stone-200 space-y-2">
              <p className="text-xs font-medium text-stone-700">
                Update Member Account Status
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(['Active', 'Low Balance', 'Suspended', 'Left'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => onUpdateStatus(member.id, st)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                        member.status === st
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Payment History & Face ID Usage Deduction Logs (7 cols) */}
          <div className="lg:col-span-7 p-6 space-y-6">
            {/* Attendance & Per-Hour Fee Deduction Logs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-700" />
                  <h4 className="text-sm font-semibold text-stone-900">
                    Face ID Entry/Exit & Hourly Balance Deduction Logs ({memberAttendance.length})
                  </h4>
                </div>
                <span className="text-xs font-mono tabular-nums text-stone-600">
                  Total Studied: {member.totalHoursUsed.toFixed(1)} hrs
                </span>
              </div>

              {memberAttendance.length === 0 ? (
                <div className="p-4 border border-stone-200 rounded-lg text-xs text-stone-500">
                  No Face ID attendance sessions recorded yet.
                </div>
              ) : (
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500">
                        <th className="py-2.5 px-3 font-medium">Date & Seat</th>
                        <th className="py-2.5 px-3 font-medium">Entry → Exit</th>
                        <th className="py-2.5 px-3 font-medium">Hours</th>
                        <th className="py-2.5 px-3 font-medium text-right">Fee Cut</th>
                        <th className="py-2.5 px-3 font-medium text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {memberAttendance.map((att) => {
                        const hrs = att.durationMinutes
                          ? Math.floor(att.durationMinutes / 60)
                          : 0;
                        const mins = att.durationMinutes
                          ? att.durationMinutes % 60
                          : 0;
                        return (
                          <tr key={att.id} className="hover:bg-stone-50">
                            <td className="py-2.5 px-3 font-mono tabular-nums text-stone-700">
                              {att.date} · <strong>{att.seatCode || 'Auto'}</strong>
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums text-stone-600">
                              <span className="text-emerald-700">{att.checkInDisplay}</span>
                              {' → '}
                              <span>{att.checkOutDisplay || 'Inside Now'}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums text-stone-800">
                              {att.status === 'Inside' ? (
                                <span className="text-indigo-700 font-semibold">
                                  Running
                                </span>
                              ) : (
                                `${hrs}h ${mins}m`
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums text-right text-rose-600 font-semibold">
                              {att.feeDeducted !== null
                                ? `-₹${att.feeDeducted}`
                                : `₹${att.hourlyRateApplied}/hr`}
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums text-right text-stone-900 font-medium">
                              {att.balanceAfterExit !== null
                                ? `₹${att.balanceAfterExit}`
                                : `₹${member.walletBalance}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Wallet Recharge & Fee Payment History */}
            <div className="space-y-3 pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-700" />
                  <h4 className="text-sm font-semibold text-stone-900">
                    Wallet Recharge & Fee Receipts ({memberPayments.length})
                  </h4>
                </div>
                <span className="text-xs font-mono tabular-nums text-stone-600">
                  Total Recharged: ₹{totalPaidLifetime.toLocaleString('en-IN')}
                </span>
              </div>

              {memberPayments.length === 0 ? (
                <div className="p-4 border border-stone-200 rounded-lg text-xs text-stone-500 flex items-center justify-between">
                  <span>No wallet recharges logged for this member yet.</span>
                  <button
                    onClick={() => onInitiateRenewal(member)}
                    className="text-indigo-700 font-semibold underline"
                  >
                    Recharge Wallet Now
                  </button>
                </div>
              ) : (
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-50 border-b border-stone-200 text-stone-500">
                        <th className="py-2.5 px-3 font-medium">Receipt</th>
                        <th className="py-2.5 px-3 font-medium">Date</th>
                        <th className="py-2.5 px-3 font-medium">Package</th>
                        <th className="py-2.5 px-3 font-medium">Mode</th>
                        <th className="py-2.5 px-3 font-medium text-right">Recharged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {memberPayments.map((pay) => (
                        <tr
                          key={pay.id}
                          onClick={() => onOpenReceipt(pay)}
                          className="hover:bg-stone-50 cursor-pointer transition-colors"
                        >
                          <td className="py-2.5 px-3 font-mono tabular-nums font-medium text-indigo-700 underline">
                            {pay.id}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums text-stone-600">
                            {pay.date}
                          </td>
                          <td className="py-2.5 px-3 text-stone-700">
                            {pay.plan} Recharge
                          </td>
                          <td className="py-2.5 px-3 text-stone-600">{pay.mode}</td>
                          <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-right text-emerald-700">
                            +₹{pay.totalPaid.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
