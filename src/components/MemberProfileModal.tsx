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
  KeyRound,
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
import { PUBLIC_APP_URL } from '../data/initialData';
import { FaceTemplateCaptureBox } from './FaceTemplateCaptureBox';

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
  const [editPassword, setEditPassword] = useState('');
  const [editExam, setEditExam] = useState('');
  const [editShift, setEditShift] = useState<ShiftType>('Full Day (24x7)');
  const [editHourlyRate, setEditHourlyRate] = useState(15);
  const [editWalletBalance, setEditWalletBalance] = useState(0);
  const [editSeatMode, setEditSeatMode] = useState<'Auto' | 'Manual'>('Auto');
  const [editSeatId, setEditSeatId] = useState<string>('');
  const [editLockerId, setEditLockerId] = useState<string>('');
  const [editAddress, setEditAddress] = useState('');
  const [editIdProof, setEditIdProof] = useState('');
  const [editFaceTemplateId, setEditFaceTemplateId] = useState('');
  const [editFacePhotoUrl, setEditFacePhotoUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    setIsEditing(initialEditMode);
    if (member) {
      setEditName(member.name);
      setEditPhone(member.phone);
      setEditEmail(member.email);
      setEditPassword(member.password || '123456');
      setEditExam(member.examPrep);
      setEditShift(member.shift);
      setEditHourlyRate(member.hourlyRate);
      setEditWalletBalance(member.walletBalance);
      setEditSeatMode(member.seatAssignmentMode);
      setEditSeatId(member.seatId || '');
      setEditLockerId(member.lockerId || '');
      setEditAddress(member.address);
      setEditIdProof(member.idProof);
      setEditFaceTemplateId(member.faceTemplateId || '');
      setEditFacePhotoUrl(member.facePhotoUrl);
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

  const handleDirectFaceCapture = (newTemplateId: string, photoUrl?: string) => {
    setEditFaceTemplateId(newTemplateId);
    if (photoUrl) setEditFacePhotoUrl(photoUrl);
    const updated: Member = {
      ...member,
      faceRegistered: true,
      faceTemplateId: newTemplateId,
      facePhotoUrl: photoUrl || member.facePhotoUrl,
    };
    onSaveMemberEdit(updated);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editPhone.trim()) return;

    const updated: Member = {
      ...member,
      name: editName.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      password: editPassword.trim() || '123456',
      examPrep: editExam.trim() || 'Competitive Exam',
      shift: editShift,
      hourlyRate: Math.max(1, Number(editHourlyRate)),
      walletBalance: Math.max(0, Number(editWalletBalance)),
      seatAssignmentMode: editSeatMode,
      seatId: editSeatMode === 'Manual' ? editSeatId || null : member.seatId,
      lockerId: editLockerId || null,
      address: editAddress.trim(),
      idProof: editIdProof.trim(),
      faceRegistered: Boolean(editFaceTemplateId || member.faceTemplateId),
      faceTemplateId: editFaceTemplateId || member.faceTemplateId,
      facePhotoUrl: editFacePhotoUrl || member.facePhotoUrl,
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

  const gateQrUrl = `${PUBLIC_APP_URL}/?portal=member&gate=scan&memberId=${encodeURIComponent(
    member.id
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto animate-scale-in">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 via-white to-emerald-50/60 dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-white">
          <div className="flex items-center gap-3">
            {member.facePhotoUrl ? (
              <img
                src={member.facePhotoUrl}
                alt={member.name}
                className="w-11 h-11 rounded-xl object-cover border-2 border-indigo-500 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm font-mono shrink-0">
                {member.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {member.name}
                </h3>
                <span className="text-xs font-mono tabular-nums text-indigo-600 dark:text-amber-400 font-semibold">
                  {member.id}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      member.status === 'Active'
                        ? 'bg-emerald-500'
                        : member.status === 'Low Balance'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  {member.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {member.examPrep} · +91 {member.phone} · Login Pass:{' '}
                <span className="font-mono font-bold text-indigo-700 dark:text-amber-300">
                  {member.password || '123456'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                isEditing
                  ? 'bg-slate-800 text-white'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Member Details'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onOpenFaceScanForMember(member);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>
                {activeSession ? 'Face ID Exit Scan' : 'Face ID Entry Scan'}
              </span>
            </button>

            <button
              onClick={() => {
                onClose();
                onInitiateRenewal(member);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Recharge Wallet</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              aria-label="Close member profile"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* EDIT MEMBER DETAILS FORM */}
        {isEditing ? (
          <form
            onSubmit={handleSaveSubmit}
            className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Edit Member Record — {member.id}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update student profile, login password, face template, hourly rate, wallet balance, or seat assignment
                </p>
              </div>
              <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                Joined: {member.joinDate}
              </span>
            </div>

            {/* Capture Face Template inside Edit Mode */}
            <FaceTemplateCaptureBox
              memberId={member.id}
              currentTemplateId={editFaceTemplateId}
              currentPhotoUrl={editFacePhotoUrl}
              onCaptureComplete={(newId, photoUrl) => {
                setEditFaceTemplateId(newId);
                if (photoUrl) setEditFacePhotoUrl(photoUrl);
              }}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-indigo-500" />
                  <span>Member Portal Login Password</span>
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Exam Preparation Target
                </label>
                <input
                  type="text"
                  value={editExam}
                  onChange={(e) => setEditExam(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Study Shift
                </label>
                <select
                  value={editShift}
                  onChange={(e) => setEditShift(e.target.value as ShiftType)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Full Day (24x7)">Full Day (24x7)</option>
                  <option value="Morning (6 AM - 2 PM)">Morning (6 AM - 2 PM)</option>
                  <option value="Evening (2 PM - 10 PM)">Evening (2 PM - 10 PM)</option>
                  <option value="Night (10 PM - 6 AM)">Night (10 PM - 6 AM)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Hourly Deduction Rate (₹/hr)
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={editHourlyRate}
                  onChange={(e) => setEditHourlyRate(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Wallet Balance (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editWalletBalance}
                  onChange={(e) => setEditWalletBalance(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Seat Assignment Mode
                </label>
                <select
                  value={editSeatMode}
                  onChange={(e) =>
                    setEditSeatMode(e.target.value as 'Auto' | 'Manual')
                  }
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Auto">Auto (1-by-1 on Entry)</option>
                  <option value="Manual">Manual Fixed Seat</option>
                </select>
              </div>

              {editSeatMode === 'Manual' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Manual Seat Selection
                  </label>
                  <select
                    value={editSeatId}
                    onChange={(e) => setEditSeatId(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">-- Select Vacant Seat --</option>
                    {availableSeatsForEdit.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} ({s.rowZone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Locker
                </label>
                <select
                  value={editLockerId}
                  onChange={(e) => setEditLockerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
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
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  ID Proof Reference
                </label>
                <input
                  type="text"
                  value={editIdProof}
                  onChange={(e) => setEditIdProof(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Address / Hostel
                </label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Member Changes</span>
              </button>
            </div>
          </form>
        ) : (
          /* STANDARD OVERVIEW MODE */
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 max-h-[80vh] overflow-y-auto">
            {/* Left Column: Face ID + Common QR Pass & Wallet Info (5 cols) */}
            <div className="lg:col-span-5 p-5 sm:p-6 bg-slate-50/60 dark:bg-slate-900/50 space-y-5">
              {/* Capture Face Template Box directly in Member Profile */}
              <FaceTemplateCaptureBox
                memberId={member.id}
                currentTemplateId={member.faceTemplateId}
                currentPhotoUrl={member.facePhotoUrl}
                onCaptureComplete={handleDirectFaceCapture}
              />

              {/* Biometric + Common QR Pass */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      VidyaKosh Single-Floor Biometric Pass
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {member.name}
                    </p>
                  </div>
                  <ScanFace className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>

                <div className="flex items-center gap-4">
                  <div
                    onClick={() => {
                      onClose();
                      onOpenFaceScanForMember(member);
                    }}
                    title="Click to test scanning Gate QR for this member"
                    className="p-2 bg-white border border-slate-200 rounded-lg shrink-0 cursor-pointer hover:border-indigo-500 transition-colors"
                  >
                    <QrCodeSvg value={gateQrUrl} size={112} />
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-slate-400">Face ID Template:</span>{' '}
                      <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                        {member.faceTemplateId}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Seat Mode:</span>{' '}
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {member.seatAssignmentMode} (
                        {member.seatId || 'Auto on Entry'})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Hourly Fee Rate:</span>{' '}
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        ₹{member.hourlyRate}/hr
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Wallet Balance:</span>{' '}
                      <span
                        className={`font-mono tabular-nums font-bold ${
                          member.walletBalance < 100
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        ₹{member.walletBalance.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Hours Left:</span>{' '}
                      <span className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                        ~{(member.walletBalance / member.hourlyRate).toFixed(1)}{' '}
                        hrs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    Common Library QR + Face Verified
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Card</span>
                  </button>
                </div>
              </div>

              {/* Member Details & Wallet Summary */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    Usage & Prepaid Wallet Details
                  </h4>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <p className="text-slate-400">Total Hours Studied</p>
                    <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                      {member.totalHoursUsed.toFixed(1)} hrs
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Total Usage Deducted</p>
                    <p className="font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      ₹{member.totalDeducted.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Current Balance</p>
                    <p className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ₹{member.walletBalance.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400">Lifetime Recharged</p>
                    <p className="font-mono tabular-nums font-bold text-slate-900 dark:text-white mt-0.5">
                      ₹{totalPaidLifetime.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Status Control */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                  <p className="text-slate-400 mb-2">Update Member Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      ['Active', 'Low Balance', 'Suspended', 'Left'] as MemberStatus[]
                    ).map((st) => (
                      <button
                        key={st}
                        onClick={() => onUpdateStatus(member.id, st)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                          member.status === st
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Wallet Recharges & Face ID Attendance Logs (7 cols) */}
            <div className="lg:col-span-7 p-5 sm:p-6 space-y-6 bg-white dark:bg-slate-900">
              {/* Wallet Recharge History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Wallet Recharges & Digital Receipts ({memberPayments.length})
                    </h4>
                  </div>
                </div>

                {memberPayments.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">
                    No wallet recharges recorded for this member yet.
                  </p>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <th className="py-2.5 px-3">Receipt</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Mode</th>
                          <th className="py-2.5 px-3 text-right">Paid</th>
                          <th className="py-2.5 px-3 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
                        {memberPayments.map((pay) => (
                          <tr
                            key={pay.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-2.5 px-3 font-mono tabular-nums font-medium text-slate-900 dark:text-white">
                              {pay.id}
                            </td>
                            <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                              {pay.date}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                              {pay.mode}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                              +₹{pay.totalPaid.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => onOpenReceipt(pay)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                              >
                                <Receipt className="w-3 h-3" />
                                <span>Receipt</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Face ID Attendance & Hourly Fee Deduction Log */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Face ID Sessions & Hourly Balance Deductions (
                      {memberAttendance.length})
                    </h4>
                  </div>
                </div>

                {memberAttendance.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4">
                    No Face ID attendance sessions logged yet.
                  </p>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-60 overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          <th className="py-2 px-3">Date & Seat</th>
                          <th className="py-2 px-3">Entry → Exit</th>
                          <th className="py-2 px-3">Hours</th>
                          <th className="py-2 px-3 text-right">Fee Cut</th>
                          <th className="py-2 px-3 text-right">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
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
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                              <td className="py-2 px-3 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                <div>{att.date}</div>
                                <div className="text-[11px] text-slate-500">
                                  Seat {att.seatCode} ({att.seatAssignMode})
                                </div>
                              </td>
                              <td className="py-2 px-3 font-mono tabular-nums">
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                  <LogIn className="w-3 h-3" />
                                  {att.checkInDisplay}
                                </span>
                                <span className="mx-1.5 text-slate-300 dark:text-slate-600">
                                  →
                                </span>
                                {att.checkOutDisplay ? (
                                  <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                    <LogOut className="w-3 h-3 text-slate-400" />
                                    {att.checkOutDisplay}
                                  </span>
                                ) : (
                                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                    Inside Now
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 font-mono tabular-nums text-slate-800 dark:text-slate-200">
                                {att.durationMinutes
                                  ? `${hrs}h ${mins}m`
                                  : 'Running...'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                                {att.feeDeducted !== null
                                  ? `-₹${att.feeDeducted}`
                                  : `₹${att.hourlyRateApplied}/hr`}
                              </td>
                              <td className="py-2 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                                {att.balanceAfterExit !== null
                                  ? `₹${att.balanceAfterExit}`
                                  : 'Active'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
