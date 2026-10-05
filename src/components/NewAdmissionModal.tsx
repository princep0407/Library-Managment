import React, { useState, useMemo } from 'react';
import { X, UserPlus, CheckCircle2, ScanFace, KeyRound } from 'lucide-react';
import {
  Member,
  Seat,
  Locker,
  PlanType,
  ShiftType,
  PaymentMode,
} from '../types';
import { TODAY_STR } from '../data/initialData';
import { FaceTemplateCaptureBox } from './FaceTemplateCaptureBox';

interface NewAdmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextMemberId: string;
  seats: Seat[];
  lockers: Locker[];
  preselectedSeatId?: string | null;
  onCreateAdmission: (payload: {
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

const PLAN_MONTHS: Record<PlanType, number> = {
  Monthly: 1,
  Quarterly: 3,
  'Half-Yearly': 6,
  Custom: 2,
};

const SHIFT_BASE_FEE: Record<ShiftType, number> = {
  'Morning (6 AM - 2 PM)': 800,
  'Evening (2 PM - 10 PM)': 900,
  'Night (10 PM - 6 AM)': 850,
  'Full Day (24x7)': 1200,
};

const SHIFT_HOURLY_RATE: Record<ShiftType, number> = {
  'Morning (6 AM - 2 PM)': 12,
  'Evening (2 PM - 10 PM)': 14,
  'Night (10 PM - 6 AM)': 12,
  'Full Day (24x7)': 15,
};

function addMonthsToDate(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

export const NewAdmissionModal: React.FC<NewAdmissionModalProps> = ({
  isOpen,
  onClose,
  nextMemberId,
  seats,
  lockers,
  preselectedSeatId,
  onCreateAdmission,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('123456');
  const [examPrep, setExamPrep] = useState('UPSC CSE');
  const [idProof, setIdProof] = useState('Aadhaar Verified');
  const [address, setAddress] = useState('');
  const [shift, setShift] = useState<ShiftType>('Full Day (24x7)');
  const [plan, setPlan] = useState<PlanType>('Monthly');
  const [customMonths] = useState<number>(2);
  const [seatAssignmentMode, setSeatAssignmentMode] = useState<'Auto' | 'Manual'>(
    preselectedSeatId ? 'Manual' : 'Auto'
  );
  const [seatId, setSeatId] = useState<string>(preselectedSeatId || '');
  const [lockerId, setLockerId] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<number>(15);
  const [faceTemplateId, setFaceTemplateId] = useState<string>('');
  const [collectFeeNow, setCollectFeeNow] = useState<boolean>(true);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [discount, setDiscount] = useState<number>(0);
  const [transactionRef] = useState<string>('');

  const vacantSeats = useMemo(
    () => seats.filter((s) => s.status === 'Vacant' || s.id === preselectedSeatId),
    [seats, preselectedSeatId]
  );

  const vacantLockers = useMemo(
    () => lockers.filter((l) => l.status === 'Vacant'),
    [lockers]
  );

  if (!isOpen) return null;

  const selectedLockerObj = lockers.find((l) => l.id === lockerId);
  const months = plan === 'Custom' ? Math.max(1, customMonths) : PLAN_MONTHS[plan];
  const monthlyRate = SHIFT_BASE_FEE[shift];
  const baseAmount = monthlyRate * months;
  const lockerFee = selectedLockerObj ? selectedLockerObj.monthlyRent * months : 0;
  const autoDiscount =
    plan === 'Quarterly' ? 150 : plan === 'Half-Yearly' ? 500 : 0;
  const effectiveDiscount = discount > 0 ? discount : autoDiscount;
  const totalPaid = Math.max(0, baseAmount + lockerFee - effectiveDiscount);
  const expiryDate = addMonthsToDate(TODAY_STR, months);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const chosenSeat =
      seatAssignmentMode === 'Manual'
        ? seatId || preselectedSeatId || null
        : null;

    const finalFaceTemplateId =
      faceTemplateId.trim() ||
      `FACE-BIO-${nextMemberId.replace(/\D+/g, '')}-${Math.random()
        .toString(16)
        .substring(2, 6)
        .toUpperCase()}`;

    const newMember: Member = {
      id: nextMemberId,
      name: name.trim(),
      phone: phone.trim(),
      email:
        email.trim() ||
        `${name.trim().toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
      password: password.trim() || '123456',
      examPrep: examPrep.trim() || 'Competitive Exams',
      plan,
      shift,
      hourlyRate: hourlyRate || SHIFT_HOURLY_RATE[shift],
      walletBalance: collectFeeNow ? baseAmount - effectiveDiscount : 0,
      totalHoursUsed: 0,
      totalDeducted: 0,
      monthlyFee: monthlyRate,
      joinDate: TODAY_STR,
      expiryDate,
      status: collectFeeNow ? 'Active' : 'Low Balance',
      seatId: chosenSeat,
      seatAssignmentMode,
      lockerId: lockerId || null,
      faceRegistered: true,
      faceTemplateId: finalFaceTemplateId,
      idProof: idProof.trim() || 'Aadhaar Verified',
      address: address.trim() || 'Local Study Hostel',
    };

    onCreateAdmission({
      member: newMember,
      collectFeeNow,
      paymentDetails: collectFeeNow
        ? {
            plan,
            months,
            baseAmount,
            lockerFee,
            discount: effectiveDiscount,
            totalPaid,
            mode: paymentMode,
            transactionRef:
              transactionRef.trim() ||
              `${paymentMode.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
          }
        : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold">
              New Admission & Face Template Enrollment
            </h3>
            <span className="text-xs font-mono tabular-nums text-amber-400 font-semibold">
              · {nextMemberId}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Capture Face Template Section */}
          <FaceTemplateCaptureBox
            memberId={nextMemberId}
            currentTemplateId={faceTemplateId}
            onCaptureComplete={(newTemplateId) => setFaceTemplateId(newTemplateId)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Aditya Narayan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Mobile Number (10-digit) *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g., 9811445566"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address (for Member Login)
              </label>
              <input
                type="email"
                placeholder="student@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-indigo-500" />
                <span>Member Login Password *</span>
              </label>
              <input
                type="text"
                required
                placeholder="Set password for student login"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Exam / Course
              </label>
              <select
                value={examPrep}
                onChange={(e) => setExamPrep(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="UPSC CSE">UPSC CSE</option>
                <option value="SSC CGL">SSC CGL / CHSL</option>
                <option value="CA Final">CA Final / Inter</option>
                <option value="NEET PG">NEET PG / UG</option>
                <option value="JEE Advanced">JEE Main / Advanced</option>
                <option value="IBPS PO / SBI PO">IBPS / SBI Banking</option>
                <option value="GATE CS">GATE / ESE</option>
                <option value="Judiciary (PCS-J)">Judiciary (PCS-J)</option>
                <option value="CAT / MBA">CAT / GMAT</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Hourly Deduction Rate (₹/hr)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Seat Assignment Policy (Auto 1-by-1 vs Manual) */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Single-Floor Seat Assignment Policy
              </label>
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSeatAssignmentMode('Auto')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    seatAssignmentMode === 'Auto'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Auto 1-by-1 on Entry
                </button>
                <button
                  type="button"
                  onClick={() => setSeatAssignmentMode('Manual')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    seatAssignmentMode === 'Manual'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Manual Fixed Seat
                </button>
              </div>
            </div>

            {seatAssignmentMode === 'Manual' ? (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pick Vacant Seat ({vacantSeats.length} Free on Single Floor)
                </label>
                <select
                  value={seatId || preselectedSeatId || ''}
                  onChange={(e) => setSeatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="">-- Choose Seat --</option>
                  {vacantSeats.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} · {s.rowZone} {s.hasAC ? '(AC)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-lg text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <ScanFace className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  Next vacant seat (S-01, S-02...) will automatically assign when student scans Gate QR + Face ID.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Study Shift Timing
              </label>
              <select
                value={shift}
                onChange={(e) => {
                  const s = e.target.value as ShiftType;
                  setShift(s);
                  setHourlyRate(SHIFT_HOURLY_RATE[s]);
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Full Day (24x7)">Full Day (24x7) — ₹15/hr</option>
                <option value="Morning (6 AM - 2 PM)">Morning (6 AM - 2 PM) — ₹12/hr</option>
                <option value="Evening (2 PM - 10 PM)">Evening (2 PM - 10 PM) — ₹14/hr</option>
                <option value="Night (10 PM - 6 AM)">Night (10 PM - 6 AM) — ₹12/hr</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Assign Vacant Locker ({vacantLockers.length} Available)
              </label>
              <select
                value={lockerId}
                onChange={(e) => setLockerId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="">-- No Locker Needed --</option>
                {vacantLockers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} (+₹{l.monthlyRent}/month)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Wallet Recharge */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={collectFeeNow}
                  onChange={(e) => setCollectFeeNow(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Add Initial Wallet Balance & Open Digital Receipt
                </span>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                Wallet Credit: ₹{(baseAmount - effectiveDiscount).toLocaleString('en-IN')}
              </span>
            </label>

            {collectFeeNow && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Recharge Package
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as PlanType)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="Monthly">Monthly Pack (₹{monthlyRate})</option>
                      <option value="Quarterly">Quarterly Pack (3x)</option>
                      <option value="Half-Yearly">Half-Yearly Pack (6x)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Payment Mode
                    </label>
                    <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                      {(['UPI', 'Cash', 'Online'] as const).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setPaymentMode(m)}
                          className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                            paymentMode === m
                              ? 'bg-indigo-600 text-white'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder={String(autoDiscount)}
                      value={discount || ''}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs font-mono tabular-nums">
                  <span className="text-slate-600 dark:text-slate-400">
                    Wallet Credit: ₹{baseAmount - effectiveDiscount} · Rate: ₹{hourlyRate}/hr
                  </span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                    Total Payable: ₹{totalPaid.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {collectFeeNow
                  ? `Admit & Credit ₹${totalPaid.toLocaleString('en-IN')}`
                  : 'Register Member'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
