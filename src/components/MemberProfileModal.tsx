import React, { useState, useEffect } from 'react';
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
  Pencil,
  Save,
} from 'lucide-react';
import {
  Member,
  MemberStatus,
  ShiftType,
  FeePayment,
  AttendanceRecord,
  Seat,
  Locker,
} from '../types';
import { QrCodeSvg } from './QrCodeSvg';

interface MemberProfileModalProps {
  member: Member | null;
  initialEditMode?: boolean;
  onClose: () => void;
  payments: FeePayment[];
  attendance: AttendanceRecord[];
  seats: Seat[];
  lockers: Locker[];
  onOpenReceipt: (payment: FeePayment) => void;
  onInitiateRenewal: (member: Member) => void;
  onUpdateStatus: (memberId: string, status: MemberStatus) => void;
  onSaveMemberEdit: (updated: Member) => void;
  onOpenFaceScanForMember: (member: Member) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  initialEditMode = false,
  onClose,
  payments,
  attendance,
  seats,
  lockers,
  onOpenReceipt,
  onInitiateRenewal,
  onUpdateStatus,
  onSaveMemberEdit,
  onOpenFaceScanForMember,
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editExam, setEditExam] = useState('');
  const [editShift, setEditShift] = useState<ShiftType>('Full Day (24x7)');
  const [editHourlyRate, setEditHourlyRate] = useState(15);
  const [editWalletBalance, setEditWalletBalance] = useState(0);
  const [editSeatMode, setEditSeatMode] = useState<'Auto' | 'Manual'>('Auto');
  const [editSeatId, setEditSeatId] = useState<string>('');
  const [editLockerId, setEditLockerId] = useState<string>('');
  const [editAddress, setEditAddress] = useState('');
  const [editIdProof, setEditIdProof] = useState('');

  useEffect(() => {
    setIsEditing(initialEditMode);
    if (member) {
      setEditName(member.name);
      setEditPhone(member.phone);
      setEditEmail(member.email);
      setEditExam(member.examPrep);
      setEditShift(member.shift);
      setEditHourlyRate(member.hourlyRate);
      setEditWalletBalance(member.walletBalance);
      setEditSeatMode(member.seatAssignmentMode);
      setEditSeatId(member.seatId || '');
      setEditLockerId(member.lockerId || '');
      setEditAddress(member.address);
      setEditIdProof(member.idProof);
    }
  }, [member, initialEditMode]);

  if (!member) return null;

  const memberPayments = payments.filter((p) => p.memberId === member.id);
  const memberAttendance = attendance.filter((a) => a.memberId === member.id);
  const activeSession = memberAttendance.find((a) => a.status === 'Inside');

  const totalPaidLifetime = memberPayments.reduce(
    (sum, p) => sum + p.totalPaid,
    0
  );

  const availableSeatsForEdit = seats.filter(
    (s) => s.status === 'Vacant' || s.id === member.seatId
  );
  const availableLockersForEdit = lockers.filter(
    (l) => l.status === 'Vacant' || l.id === member.lockerId
  );

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) return;

    const updated: Member = {
      ...member,
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      examPrep: editExam.trim() || 'Competitive Exam',
      shift: editShift,
      hourlyRate: Math.max(1, Number(editHourlyRate)),
      walletBalance: Math.max(0, Number(editWalletBalance)),
      seatAssignmentMode: editSeatMode,
      seatId: editSeatMode === 'Manual' ? editSeatId || null : member.seatId,
      lockerId: editLockerId || null,
      address: editAddress.trim(),
      idProof: editIdProof.trim(),
      status:
        Number(editWalletBalance) < 100 && member.status === 'Active'
          ? 'Low Balance'
          : Number(editWalletBalance) >= 100 && member.status === 'Low Balance'
          ? 'Active'
          : member.status,
    };

    onSaveMemberEdit(updated);
    setIsEditing(false);
  };

  const gateQrUrl = `${window.location.origin}/?gate=scan&memberId=${encodeURIComponent(
    member.id
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-white">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">{member.name}</h3>
              <span className="text-xs font-mono tabular-nums text-slate-300">
                · {member.id} · {member.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {member.examPrep} · +91 {member.phone} · Face ID:{' '}
              <span className="font-mono tabular-nums text-emerald-400">
                {member.faceTemplateId}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Member Details'}</span>
            </button>
            <button
              onClick={() => onInitiateRenewal(member)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 rounded-lg hover:bg-amber-300 transition-colors whitespace-nowrap"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Recharge Wallet</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              aria-label="Close member profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edit Member Form Mode */}
        {isEditing ? (
          <form
            onSubmit={handleSaveSubmit}
            className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h4 className="text-sm font-bold">
                Edit Member Record ({member.id})
              </h4>
              <span className="text-xs text-slate-500">
                Changes save immediately to member directory & seat board
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Target Exam / Course
                </label>
                <input
                  type="text"
                  value={editExam}
                  onChange={(e) => setEditExam(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Study Shift
                </label>
                <select
                  value={editShift}
                  onChange={(e) => setEditShift(e.target.value as ShiftType)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="Full Day (24x7)">Full Day (24x7)</option>
                  <option value="Morning (6 AM - 2 PM)">
                    Morning (6 AM - 2 PM)
                  </option>
                  <option value="Evening (2 PM - 10 PM)">
                    Evening (2 PM - 10 PM)
                  </option>
                  <option value="Night (10 PM - 6 AM)">
                    Night (10 PM - 6 AM)
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Hourly Fee Rate (₹/hr)
                </label>
                <input
                  type="number"
                  min={1}
                  value={editHourlyRate}
                  onChange={(e) => setEditHourlyRate(Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Wallet Balance (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editWalletBalance}
                  onChange={(e) =>
                    setEditWalletBalance(Number(e.target.value))
                  }
                  className="w-full px-3 py-2 font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Seat Assignment Mode
                </label>
                <select
                  value={editSeatMode}
                  onChange={(e) =>
                    setEditSeatMode(e.target.value as 'Auto' | 'Manual')
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="Auto">Auto (1-by-1 on Entry)</option>
                  <option value="Manual">Manual Fixed Seat</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Manual Seat / Current Seat
                </label>
                <select
                  disabled={editSeatMode === 'Auto'}
                  value={editSeatId}
                  onChange={(e) => setEditSeatId(e.target.value)}
                  className="w-full px-3 py-2 font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg disabled:opacity-50"
                >
                  <option value="">-- Auto Assigned on Entry --</option>
                  {availableSeatsForEdit.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} ({s.rowZone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Assigned Locker
                </label>
                <select
                  value={editLockerId}
                  onChange={(e) => setEditLockerId(e.target.value)}
                  className="w-full px-3 py-2 font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="">-- No Locker --</option>
                  {availableLockersForEdit.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.code} (₹{l.monthlyRent}/m)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  ID Proof Details
                </label>
                <input
                  type="text"
                  value={editIdProof}
                  onChange={(e) => setEditIdProof(e.target.value)}
                  className="w-full px-3 py-2 font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Residential Address
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Member Changes</span>
              </button>
            </div>
          </form>
        ) : (
          /* Standard Profile View */
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 max-h-[80vh] overflow-y-auto">
            {/* Left Column (5 cols) */}
            <div className="lg:col-span-5 p-6 space-y-5 bg-slate-50/70 dark:bg-slate-900/50">
              {/* Wallet Balance & Hours Summary Card */}
              <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-xl p-4 space-y-3 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    <span>Prepaid Wallet & Hours Summary</span>
                  </span>
                  <span className="text-xs font-mono tabular-nums text-amber-400">
                    ₹{member.hourlyRate}/hr
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <p className="text-[11px] text-slate-400">
                      Available Balance
                    </p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                      ₹{member.walletBalance.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] font-mono tabular-nums text-slate-400">
                      ~{Math.floor(member.walletBalance / member.hourlyRate)}{' '}
                      hrs remaining
                    </p>
                  </div>
                  <div className="border-l border-slate-800 pl-3">
                    <p className="text-[11px] text-slate-400">
                      Total Hours Studied
                    </p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-white">
                      {member.totalHoursUsed.toFixed(1)}h
                    </p>
                    <p className="text-[11px] font-mono tabular-nums text-slate-400">
                      ₹{member.totalDeducted} total used
                    </p>
                  </div>
                </div>
              </div>

              {/* Scannable Gate QR + Face ID Card */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      COMMON GATE QR + FACE ID BIOMETRIC
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Click QR or scan with phone to launch Entry/Exit & Live Hours view
                    </p>
                  </div>
                  <ScanFace className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>

                <div className="flex items-center gap-4">
                  <div
                    onClick={() => onOpenFaceScanForMember(member)}
                    title="Click to simulate scanning this QR code"
                    className="p-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                  >
                    <QrCodeSvg value={gateQrUrl} size={96} />
                  </div>

                  <div className="space-y-1 min-w-0 text-xs">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {member.name} ({member.id})
                    </p>
                    <p className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">
                      Face ID: {member.faceTemplateId}
                    </p>
                    <p className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      Seat:{' '}
                      <strong>
                        {member.seatId
                          ? `${member.seatId} (${member.seatAssignmentMode})`
                          : 'Auto 1-by-1 on Entry'}
                      </strong>
                    </p>
                    <p className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      Locker: {member.lockerId || 'None'} · {member.idProof}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => onOpenFaceScanForMember(member)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
                    activeSession
                      ? 'text-slate-950 bg-amber-400 hover:bg-amber-300'
                      : 'text-white bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {activeSession ? (
                    <>
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Exit Face Scan</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Entry Face Scan</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status Management */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Update Account Status
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(['Active', 'Low Balance', 'Suspended', 'Left'] as const).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => onUpdateStatus(member.id, st)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                          member.status === st
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Logs (7 cols) */}
            <div className="lg:col-span-7 p-6 space-y-6 text-slate-900 dark:text-slate-100">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-sm font-semibold">
                      Attendance & Hourly Balance Deduction Logs (
                      {memberAttendance.length})
                    </h4>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    Total: {member.totalHoursUsed.toFixed(1)} hrs
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-2.5 px-3 font-medium">Date & Seat</th>
                        <th className="py-2.5 px-3 font-medium">Entry → Exit</th>
                        <th className="py-2.5 px-3 font-medium">Hours</th>
                        <th className="py-2.5 px-3 font-medium text-right">
                          Fee Cut
                        </th>
                        <th className="py-2.5 px-3 font-medium text-right">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
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
                            <td className="py-2.5 px-3 font-mono tabular-nums">
                              {att.date} · <strong>{att.seatCode || 'Auto'}</strong>
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums">
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {att.checkInDisplay}
                              </span>
                              {' → '}
                              <span>{att.checkOutDisplay || 'Inside Now'}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums">
                              {att.status === 'Inside' ? (
                                <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                  Running
                                </span>
                              ) : (
                                `${hrs}h ${mins}m`
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums text-right text-rose-600 dark:text-rose-400 font-semibold">
                              {att.feeDeducted !== null
                                ? `-₹${att.feeDeducted}`
                                : `₹${att.hourlyRateApplied}/hr`}
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums text-right font-medium">
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
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-sm font-semibold">
                      Wallet Recharge Receipts ({memberPayments.length})
                    </h4>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    Total Recharged: ₹{totalPaidLifetime.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                        <th className="py-2.5 px-3 font-medium">Receipt</th>
                        <th className="py-2.5 px-3 font-medium">Date</th>
                        <th className="py-2.5 px-3 font-medium">Package</th>
                        <th className="py-2.5 px-3 font-medium">Mode</th>
                        <th className="py-2.5 px-3 font-medium text-right">
                          Recharged
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {memberPayments.map((pay) => (
                        <tr
                          key={pay.id}
                          onClick={() => onOpenReceipt(pay)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                        >
                          <td className="py-2.5 px-3 font-mono tabular-nums font-medium text-indigo-600 dark:text-indigo-400 underline">
                            {pay.id}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums">
                            {pay.date}
                          </td>
                          <td className="py-2.5 px-3">{pay.plan}</td>
                          <td className="py-2.5 px-3">{pay.mode}</td>
                          <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-right text-emerald-600 dark:text-emerald-400">
                            +₹{pay.totalPaid.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
