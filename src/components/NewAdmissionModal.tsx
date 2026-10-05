import React, { useState, useMemo } from 'react';
import { X, UserPlus, CheckCircle2, ScanFace } from 'lucide-react';
import {
  Member,
  Seat,
  Locker,
  PlanType,
  ShiftType,
  PaymentMode,
} from '../types';
import { TODAY_STR } from '../data/initialData';

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
  const [examPrep, setExamPrep] = useState('UPSC CSE');
  const [idProof, setIdProof] = useState('Aadhaar · ');
  const [address, setAddress] = useState('');
  const [shift, setShift] = useState<ShiftType>('Full Day (24x7)');
  const [plan, setPlan] = useState<PlanType>('Monthly');
  const [customMonths, setCustomMonths] = useState<number>(2);
  const [seatAssignmentMode, setSeatAssignmentMode] = useState<'Auto' | 'Manual'>(
    preselectedSeatId ? 'Manual' : 'Auto'
  );
  const [seatId, setSeatId] = useState<string>(preselectedSeatId || '');
  const [lockerId, setLockerId] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<number>(15);
  const [collectFeeNow, setCollectFeeNow] = useState<boolean>(true);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [discount, setDiscount] = useState<number>(0);
  const [transactionRef, setTransactionRef] = useState<string>('');

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

    const newMember: Member = {
      id: nextMemberId,
      name: name.trim(),
      phone: phone.trim(),
      email:
        email.trim() ||
        `${name.trim().toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
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
      faceTemplateId: `FACE-BIO-${nextMemberId.replace(/\D+/g, '')}`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-900 text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-bold">
              New Student Admission & Face ID Enrollment
            </h3>
            <span className="text-xs font-mono tabular-nums text-amber-400 font-semibold">
              · {nextMemberId}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Aditya Narayan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Mobile Number (10-digit) *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g., 9811445566"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-700"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Target Exam / Course
              </label>
              <select
                value={examPrep}
                onChange={(e) => setExamPrep(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
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
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Hourly Deduction Rate (₹/hr)
              </label>
              <input
                type="number"
                min={5}
                max={100}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-stone-300 rounded-lg"
              />
            </div>
          </div>

          {/* Seat Assignment Policy (Auto 1-by-1 vs Manual) */}
          <div className="pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Single-Floor Seat Assignment Policy
              </label>
              <div className="flex gap-1 p-1 bg-stone-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSeatAssignmentMode('Auto')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    seatAssignmentMode === 'Auto'
                      ? 'bg-indigo-700 text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Auto 1-by-1 on Entry
                </button>
                <button
                  type="button"
                  onClick={() => setSeatAssignmentMode('Manual')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    seatAssignmentMode === 'Manual'
                      ? 'bg-indigo-700 text-white'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Manual Fixed Seat
                </button>
              </div>
            </div>

            {seatAssignmentMode === 'Manual' ? (
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Pick Vacant Seat ({vacantSeats.length} Free on Single Floor)
                </label>
                <select
                  value={seatId || preselectedSeatId || ''}
                  onChange={(e) => setSeatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-stone-300 rounded-lg"
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
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs text-indigo-950 flex items-center gap-2">
                <ScanFace className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>
                  Next vacant seat (S-01, S-02...) will automatically assign when student scans Gate QR + Face ID.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Study Shift Timing
              </label>
              <select
                value={shift}
                onChange={(e) => {
                  const s = e.target.value as ShiftType;
                  setShift(s);
                  setHourlyRate(SHIFT_HOURLY_RATE[s]);
                }}
                className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
              >
                <option value="Full Day (24x7)">Full Day (24x7) — ₹15/hr</option>
                <option value="Morning (6 AM - 2 PM)">Morning (6 AM - 2 PM) — ₹12/hr</option>
                <option value="Evening (2 PM - 10 PM)">Evening (2 PM - 10 PM) — ₹14/hr</option>
                <option value="Night (10 PM - 6 AM)">Night (10 PM - 6 AM) — ₹12/hr</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Assign Vacant Locker ({vacantLockers.length} Available)
              </label>
              <select
                value={lockerId}
                onChange={(e) => setLockerId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-stone-300 rounded-lg"
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
          <div className="pt-4 border-t border-stone-200 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={collectFeeNow}
                  onChange={(e) => setCollectFeeNow(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-indigo-700"
                />
                <span className="text-xs font-semibold text-stone-900">
                  Add Initial Wallet Balance & Open Digital Receipt
                </span>
              </div>
              <span className="text-xs font-mono tabular-nums text-emerald-700 font-semibold">
                Wallet Credit: ₹{(baseAmount - effectiveDiscount).toLocaleString('en-IN')}
              </span>
            </label>

            {collectFeeNow && (
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-lg space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Recharge Package
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => setPlan(e.target.value as PlanType)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                    >
                      <option value="Monthly">Monthly Pack (₹{monthlyRate})</option>
                      <option value="Quarterly">Quarterly Pack (3x)</option>
                      <option value="Half-Yearly">Half-Yearly Pack (6x)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Payment Mode
                    </label>
                    <div className="flex gap-1 p-1 bg-white border border-stone-200 rounded-lg">
                      {(['UPI', 'Cash', 'Online'] as const).map((m) => (
                        <button
                          type="button"
                          key={m}
                          onClick={() => setPaymentMode(m)}
                          className={`flex-1 py-1 text-xs font-medium rounded-md transition-colors ${
                            paymentMode === m
                              ? 'bg-stone-900 text-white'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder={String(autoDiscount)}
                      value={discount || ''}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-xs font-mono tabular-nums bg-white border border-stone-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-200 text-xs font-mono tabular-nums">
                  <span className="text-stone-600">
                    Wallet Credit: ₹{baseAmount - effectiveDiscount} · Rate: ₹{hourlyRate}/hr
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    Total Payable: ₹{totalPaid.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors whitespace-nowrap"
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
