import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Download,
  ScanFace,
  Receipt,
  Lock,
  Trash2,
  Pin,
  CheckCircle2,
  RotateCcw,
  LayoutDashboard,
  Users,
  Armchair,
  Wallet,
  Menu,
  X,
} from 'lucide-react';
import {
  Member,
  MemberStatus,
  Seat,
  SingleFloorRow,
  Locker,
  FeePayment,
  Expense,
  ExpenseCategory,
  AttendanceRecord,
  LibraryNotice,
  PlanType,
  PaymentMode,
} from './types';
import {
  TODAY_STR,
  INITIAL_MEMBERS,
  INITIAL_SEATS,
  INITIAL_LOCKERS,
  INITIAL_PAYMENTS,
  INITIAL_EXPENSES,
  INITIAL_ATTENDANCE,
  INITIAL_NOTICES,
} from './data/initialData';
import {
  MonthlyIncomeExpenseChart,
  LiveSeatOccupancyDonut,
} from './components/CanvasCharts';
import { DigitalReceiptModal } from './components/DigitalReceiptModal';
import { LockerDialog } from './components/LockerDialog';
import { MemberProfileModal } from './components/MemberProfileModal';
import { NewAdmissionModal } from './components/NewAdmissionModal';
import { FaceScannerModal } from './components/FaceScannerModal';
import { QrFaceAttendanceSection } from './components/QrFaceAttendanceSection';
import { SeatBoardSection } from './components/SeatBoardSection';

type NavTab = 'dashboard' | 'members' | 'seats' | 'finance' | 'attendance';
type ReportRange = 'Weekly' | 'Monthly' | 'Quarterly' | '6M / Yearly';

const STORAGE_KEY = 'vidyakosh_library_state_v2';

function addMonthsToDate(dateStr: string, months: number): string {
  const base =
    dateStr < TODAY_STR
      ? new Date(TODAY_STR + 'T00:00:00')
      : new Date(dateStr + 'T00:00:00');
  base.setMonth(base.getMonth() + months);
  return base.toISOString().slice(0, 10);
}

export default function App() {
  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).members || INITIAL_MEMBERS;
    } catch {
      // ignore
    }
    return INITIAL_MEMBERS;
  });

  const [seats, setSeats] = useState<Seat[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).seats || INITIAL_SEATS;
    } catch {
      // ignore
    }
    return INITIAL_SEATS;
  });

  const [lockers, setLockers] = useState<Locker[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).lockers || INITIAL_LOCKERS;
    } catch {
      // ignore
    }
    return INITIAL_LOCKERS;
  });

  const [payments, setPayments] = useState<FeePayment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).payments || INITIAL_PAYMENTS;
    } catch {
      // ignore
    }
    return INITIAL_PAYMENTS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).expenses || INITIAL_EXPENSES;
    } catch {
      // ignore
    }
    return INITIAL_EXPENSES;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).attendance || INITIAL_ATTENDANCE;
    } catch {
      // ignore
    }
    return INITIAL_ATTENDANCE;
  });

  const [notices, setNotices] = useState<LibraryNotice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).notices || INITIAL_NOTICES;
    } catch {
      // ignore
    }
    return INITIAL_NOTICES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          members,
          seats,
          lockers,
          payments,
          expenses,
          attendance,
          notices,
        })
      );
    } catch {
      // ignore
    }
  }, [members, seats, lockers, payments, expenses, attendance, notices]);

  // Navigation & Modal States
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [profileMemberId, setProfileMemberId] = useState<string | null>(null);
  const [isLockerDialogOpen, setIsLockerDialogOpen] = useState(false);
  const [isAdmissionOpen, setIsAdmissionOpen] = useState(false);
  const [admissionPreselectedSeat, setAdmissionPreselectedSeat] = useState<
    string | null
  >(null);
  const [faceScanMember, setFaceScanMember] = useState<Member | null>(null);

  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Member Management Filter States
  const [memberSearch, setMemberSearch] = useState('');
  const [memberStatusFilter, setMemberStatusFilter] = useState<
    'All' | MemberStatus
  >('All');

  // Seat Action Modal States
  const [activeSeatModalId, setActiveSeatModalId] = useState<string | null>(null);
  const [seatAssignMemberId, setSeatAssignMemberId] = useState<string>('');
  const [reserveName, setReserveName] = useState('');
  const [reservePhone, setReservePhone] = useState('');
  const [reserveNote, setReserveNote] = useState('');
  const [reserveUntil, setReserveUntil] = useState('2026-10-08');
  const [isAddSeatOpen, setIsAddSeatOpen] = useState(false);
  const [newSeatRow, setNewSeatRow] =
    useState<SingleFloorRow>('Row A (AC Prime)');
  const [newSeatHasAC, setNewSeatHasAC] = useState(true);
  const [newSeatHasSocket, setNewSeatHasSocket] = useState(true);

  // Fast Fee / Wallet Recharge States
  const [feeMemberId, setFeeMemberId] = useState<string>(INITIAL_MEMBERS[1].id);
  const [feePlan, setFeePlan] = useState<PlanType>('Monthly');
  const [feeCustomMonths, setFeeCustomMonths] = useState<number>(2);
  const [feeDiscount, setFeeDiscount] = useState<number>(0);
  const [feeMode, setFeeMode] = useState<PaymentMode>('UPI');
  const [feeRef, setFeeRef] = useState<string>('');
  const [reportRange, setReportRange] = useState<ReportRange>('6M / Yearly');

  // New Expense Form State
  const [expTitle, setExpTitle] = useState('');
  const [expCategory, setExpCategory] =
    useState<ExpenseCategory>('Electricity & AC');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expMode, setExpMode] = useState<PaymentMode>('UPI');

  // Notice Board State
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] =
    useState<LibraryNotice['category']>('General');
  const [isAddingNotice, setIsAddingNotice] = useState(false);

  // Next Sequential Vacant Seat (1-by-1 on Single Floor)
  const nextAutoSeat = useMemo(() => {
    const vacant = seats
      .filter((s) => s.status === 'Vacant')
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    return vacant[0] || null;
  }, [seats]);

  const vacantSeatsList = useMemo(
    () =>
      seats
        .filter((s) => s.status === 'Vacant')
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder),
    [seats]
  );

  // Next Member ID
  const nextMemberId = useMemo(() => {
    const nums = members
      .map((m) => parseInt(m.id.replace(/\D+/g, ''), 10))
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 1000;
    return `LIB-${maxNum + 1}`;
  }, [members]);

  const getNextReceiptId = () => {
    const nums = payments
      .map((p) => {
        const parts = p.id.split('-');
        return parseInt(parts[parts.length - 1], 10);
      })
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 100;
    return `RCP-2026-${maxNum + 1}`;
  };

  // Export Entire Member List as CSV
  const handleExportMembersCsv = () => {
    const headers = [
      'Member ID',
      'Full Name',
      'Mobile Number',
      'Email',
      'Target Exam',
      'Shift',
      'Hourly Rate (INR/hr)',
      'Wallet Balance (INR)',
      'Total Hours Studied',
      'Total Fee Deducted (INR)',
      'Assigned Seat',
      'Seat Assignment Mode',
      'Locker Code',
      'Face ID Template',
      'Status',
      'Join Date',
      'Expiry Date',
      'Address',
    ];

    const escapeCsv = (val: string | number | null | undefined) => {
      const s = val === null || val === undefined ? '' : String(val);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const rows = members.map((m) =>
      [
        m.id,
        m.name,
        m.phone,
        m.email,
        m.examPrep,
        m.shift,
        m.hourlyRate,
        m.walletBalance,
        m.totalHoursUsed,
        m.totalDeducted,
        m.seatId || 'Unassigned',
        m.seatAssignmentMode,
        m.lockerId || 'None',
        m.faceTemplateId,
        m.status,
        m.joinDate,
        m.expiryDate,
        m.address,
      ]
        .map(escapeCsv)
        .join(',')
    );

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `vidyakosh_members_backup_${TODAY_STR}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    triggerToast(`Exported ${members.length} members to CSV backup file`);
  };

  // Handler: Confirm Entry After Common QR + Face ID Scan
  const handleConfirmEntryAfterFaceScan = (payload: {
    memberId: string;
    seatId: string | null;
    assignMode: 'Auto (1-by-1)' | 'Manual';
    faceScore: number;
  }) => {
    const member = members.find((m) => m.id === payload.memberId);
    if (!member) return;

    const assignedSeatCode = payload.seatId || nextAutoSeat?.id || null;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const hr12 = String(now.getHours() % 12 || 12).padStart(2, '0');
    const displayTime = `${hr12}:${mm} ${ampm}`;

    const newRec: AttendanceRecord = {
      id: `ATT-2026-${attendance.length + 520}`,
      memberId: member.id,
      memberName: member.name,
      examPrep: member.examPrep,
      seatCode: assignedSeatCode,
      seatAssignMode: payload.assignMode,
      shift: member.shift,
      date: TODAY_STR,
      checkInTime: `${hh}:${mm}`,
      checkInDisplay: displayTime,
      checkInTimestamp: Date.now(),
      checkOutTime: null,
      checkOutDisplay: null,
      durationMinutes: null,
      hourlyRateApplied: member.hourlyRate,
      feeDeducted: null,
      balanceAfterExit: null,
      entryFaceVerified: true,
      exitFaceVerified: false,
      faceMatchScore: payload.faceScore,
      deviceSource: 'Student Mobile QR + Face ID',
      status: 'Inside',
    };

    setAttendance((prev) => [newRec, ...prev]);

    if (assignedSeatCode) {
      setSeats((prev) =>
        prev.map((s) =>
          s.id === assignedSeatCode
            ? {
                ...s,
                status: 'Occupied',
                memberId: member.id,
                assignmentType:
                  payload.assignMode === 'Auto (1-by-1)'
                    ? 'Auto-Entry'
                    : 'Manual',
                reservedFor: undefined,
              }
            : s
        )
      );
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id
            ? {
                ...m,
                seatId: assignedSeatCode,
                seatAssignmentMode:
                  payload.assignMode === 'Auto (1-by-1)' ? 'Auto' : 'Manual',
              }
            : m
        )
      );
    }

    triggerToast(
      `Face ID Verified! ${member.name} assigned Seat ${assignedSeatCode} (${payload.assignMode}) & Timer Started`
    );
  };

  // Handler: Confirm Exit After Common QR + Face ID Scan (Deducts Hourly Fee from Balance & Frees Auto Seat)
  const handleConfirmExitAfterFaceScan = (payload: {
    memberId: string;
    overrideDurationMinutes?: number;
    faceScore: number;
  }) => {
    const member = members.find((m) => m.id === payload.memberId);
    const openSession = attendance.find(
      (a) => a.memberId === payload.memberId && a.status === 'Inside'
    );
    if (!member || !openSession) return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const hr12 = String(now.getHours() % 12 || 12).padStart(2, '0');
    const displayTime = `${hr12}:${mm} ${ampm}`;

    const durationMins =
      payload.overrideDurationMinutes ||
      Math.max(60, Math.round((Date.now() - openSession.checkInTimestamp) / 60000));

    const hoursUsed = durationMins / 60;
    const feeDeducted = Math.max(
      5,
      Math.round(hoursUsed * openSession.hourlyRateApplied)
    );
    const updatedBalance = Math.max(0, member.walletBalance - feeDeducted);
    const newStatus: MemberStatus =
      updatedBalance < 100 ? 'Low Balance' : 'Active';

    // Update attendance record
    setAttendance((prev) =>
      prev.map((a) =>
        a.id === openSession.id
          ? {
              ...a,
              checkOutTime: `${hh}:${mm}`,
              checkOutDisplay: displayTime,
              durationMinutes: durationMins,
              feeDeducted,
              balanceAfterExit: updatedBalance,
              exitFaceVerified: true,
              faceMatchScore: payload.faceScore,
              status: 'Completed',
            }
          : a
      )
    );

    // Release seat if Auto-assigned so next student gets it 1-by-1
    if (openSession.seatCode) {
      setSeats((prev) =>
        prev.map((s) =>
          s.id === openSession.seatCode && s.assignmentType !== 'Manual'
            ? {
                ...s,
                status: 'Vacant',
                memberId: null,
                assignmentType: undefined,
              }
            : s
        )
      );
    }

    // Deduct balance from member wallet
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              walletBalance: updatedBalance,
              totalHoursUsed: Number((m.totalHoursUsed + hoursUsed).toFixed(1)),
              totalDeducted: m.totalDeducted + feeDeducted,
              status: newStatus,
              seatId:
                m.seatAssignmentMode === 'Auto' ? null : m.seatId,
            }
          : m
      )
    );

    triggerToast(
      `Exit Face ID Verified · ${Math.floor(durationMins / 60)}h ${
        durationMins % 60
      }m used · ₹${feeDeducted} deducted · New Bal: ₹${updatedBalance}`
    );
  };

  // One-Tap Instant Wallet Top-up
  const handleOneTapWalletRecharge = (member: Member) => {
    const lockerObj = member.lockerId
      ? lockers.find((l) => l.id === member.lockerId)
      : null;
    const lockerFee = lockerObj ? lockerObj.monthlyRent : 0;
    const baseAmount = member.monthlyFee;
    const totalPaid = baseAmount + lockerFee;
    const newBalance = member.walletBalance + baseAmount;
    const newValidUntil = addMonthsToDate(member.expiryDate, 1);

    const newReceipt: FeePayment = {
      id: getNextReceiptId(),
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      seatCode: member.seatId,
      lockerCode: member.lockerId,
      plan: 'Monthly',
      months: 1,
      baseAmount,
      lockerFee,
      discount: 0,
      totalPaid,
      walletBalanceAfter: newBalance,
      mode: 'UPI',
      transactionRef: `UPI/${Math.floor(400000000000 + Math.random() * 99999999999)}`,
      date: TODAY_STR,
      validFrom: TODAY_STR,
      validUntil: newValidUntil,
      remarks: `Wallet Recharged +₹${baseAmount} (New Balance: ₹${newBalance})`,
    };

    setPayments((prev) => [newReceipt, ...prev]);
    setMembers((prev) =>
      prev.map((m) =>
        m.id === member.id
          ? {
              ...m,
              walletBalance: newBalance,
              status: 'Active',
              expiryDate: newValidUntil,
            }
          : m
      )
    );
    setSelectedReceipt(newReceipt);
    triggerToast(`Recharged ₹${baseAmount} to ${member.name}'s wallet!`);
  };

  const handleJumpToFeeCollection = (member: Member) => {
    setFeeMemberId(member.id);
    setFeePlan(member.plan);
    setProfileMemberId(null);
    setActiveTab('finance');
  };

  // Locker Handlers
  const handleAssignLocker = (lockerId: string, memberId: string) => {
    setLockers((prev) =>
      prev.map((l) =>
        l.id === lockerId
          ? { ...l, status: 'Occupied', memberId, notes: undefined }
          : l.memberId === memberId
          ? { ...l, status: 'Vacant', memberId: null }
          : l
      )
    );
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, lockerId } : m))
    );
    triggerToast(`Assigned Locker ${lockerId} to ${memberId}`);
  };

  const handleReleaseLocker = (lockerId: string) => {
    setLockers((prev) =>
      prev.map((l) =>
        l.id === lockerId ? { ...l, status: 'Vacant', memberId: null } : l
      )
    );
    setMembers((prev) =>
      prev.map((m) => (m.lockerId === lockerId ? { ...m, lockerId: null } : m))
    );
    triggerToast(`Released Locker ${lockerId}`);
  };

  const handleToggleLockerMaintenance = (lockerId: string, note?: string) => {
    setLockers((prev) =>
      prev.map((l) => {
        if (l.id !== lockerId) return l;
        const nextStatus =
          l.status === 'Maintenance' ? 'Vacant' : 'Maintenance';
        return {
          ...l,
          status: nextStatus,
          memberId: null,
          notes: nextStatus === 'Maintenance' ? note : undefined,
        };
      })
    );
  };

  const handleAddLocker = (monthlyRent: number) => {
    const nextIdx = lockers.length + 1;
    const code = `L-${String(nextIdx).padStart(2, '0')}`;
    setLockers((prev) => [
      ...prev,
      { id: code, code, status: 'Vacant', memberId: null, monthlyRent },
    ]);
    triggerToast(`Added Locker ${code}`);
  };

  // Admission Handler
  const handleCreateAdmission = (payload: {
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
  }) => {
    const { member, collectFeeNow, paymentDetails } = payload;
    setMembers((prev) => [member, ...prev]);

    if (member.seatId) {
      setSeats((prev) =>
        prev.map((s) =>
          s.id === member.seatId
            ? {
                ...s,
                status: 'Occupied',
                memberId: member.id,
                assignmentType: 'Manual',
                reservedFor: undefined,
              }
            : s
        )
      );
    }

    if (member.lockerId) {
      setLockers((prev) =>
        prev.map((l) =>
          l.id === member.lockerId
            ? { ...l, status: 'Occupied', memberId: member.id }
            : l
        )
      );
    }

    if (collectFeeNow && paymentDetails) {
      const receipt: FeePayment = {
        id: getNextReceiptId(),
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        seatCode: member.seatId,
        lockerCode: member.lockerId,
        plan: paymentDetails.plan,
        months: paymentDetails.months,
        baseAmount: paymentDetails.baseAmount,
        lockerFee: paymentDetails.lockerFee,
        discount: paymentDetails.discount,
        totalPaid: paymentDetails.totalPaid,
        walletBalanceAfter: member.walletBalance,
        mode: paymentDetails.mode,
        transactionRef: paymentDetails.transactionRef,
        date: TODAY_STR,
        validFrom: member.joinDate,
        validUntil: member.expiryDate,
        remarks: `New Admission + Face ID Enrolled (${member.faceTemplateId})`,
      };
      setPayments((prev) => [receipt, ...prev]);
      setSelectedReceipt(receipt);
    }
    triggerToast(`Admitted ${member.name} (${member.id})`);
  };

  // Manual Seat Assignment / Reservation / Release
  const handleManualAssignSeat = (seatId: string, memberId: string) => {
    const mObj = members.find((m) => m.id === memberId);
    if (!mObj) return;

    setSeats((prev) =>
      prev.map((s) => {
        if (s.id === seatId) {
          return {
            ...s,
            status: 'Occupied',
            memberId,
            assignmentType: 'Manual',
            reservedFor: undefined,
          };
        }
        if (s.memberId === memberId) {
          return { ...s, status: 'Vacant', memberId: null, assignmentType: undefined };
        }
        return s;
      })
    );

    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, seatId, seatAssignmentMode: 'Manual' }
          : m
      )
    );
    setActiveSeatModalId(null);
    triggerToast(`Manually assigned Seat ${seatId} to ${mObj.name}`);
  };

  const handleReserveSeat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeatModalId || !reserveName.trim()) return;
    setSeats((prev) =>
      prev.map((s) =>
        s.id === activeSeatModalId
          ? {
              ...s,
              status: 'Reserved',
              memberId: null,
              reservedFor: {
                name: reserveName.trim(),
                phone: reservePhone.trim() || '9811000000',
                note: reserveNote.trim() || 'Held on single floor',
                until: reserveUntil || '2026-10-08',
              },
            }
          : s
      )
    );
    setReserveName('');
    setReservePhone('');
    setReserveNote('');
    setActiveSeatModalId(null);
    triggerToast(`Reserved Seat ${activeSeatModalId}`);
  };

  const handleVacateSeat = (seatId: string) => {
    const seatObj = seats.find((s) => s.id === seatId);
    if (!seatObj) return;
    if (seatObj.memberId) {
      setMembers((prev) =>
        prev.map((m) => (m.id === seatObj.memberId ? { ...m, seatId: null } : m))
      );
    }
    setSeats((prev) =>
      prev.map((s) =>
        s.id === seatId
          ? {
              ...s,
              status: 'Vacant',
              memberId: null,
              assignmentType: undefined,
              reservedFor: undefined,
            }
          : s
      )
    );
    setActiveSeatModalId(null);
    triggerToast(`Seat ${seatId} marked Vacant`);
  };

  const handleCreateNewSeat = (e: React.FormEvent) => {
    e.preventDefault();
    const nextNum = seats.length + 1;
    const code = `S-${String(nextNum).padStart(2, '0')}`;
    const created: Seat = {
      id: code,
      code,
      sequenceOrder: nextNum,
      rowZone: newSeatRow,
      status: 'Vacant',
      memberId: null,
      hasAC: newSeatHasAC,
      hasSocket: newSeatHasSocket,
      hourlyRateAddon: newSeatRow === 'Row D (Cabin Desk)' ? 3 : 0,
    };
    setSeats((prev) => [...prev, created]);
    setIsAddSeatOpen(false);
    triggerToast(`Added Seat ${code} on Single Floor (${newSeatRow})`);
  };

  // Fast Fee / Wallet Recharge Submit
  const selectedFeeMember =
    members.find((m) => m.id === feeMemberId) || members[0];
  const feeMonths =
    feePlan === 'Monthly'
      ? 1
      : feePlan === 'Quarterly'
      ? 3
      : feePlan === 'Half-Yearly'
      ? 6
      : Math.max(1, feeCustomMonths);

  const feeBaseAmount = (selectedFeeMember?.monthlyFee || 1000) * feeMonths;
  const feeLockerObj = selectedFeeMember?.lockerId
    ? lockers.find((l) => l.id === selectedFeeMember.lockerId)
    : null;
  const feeLockerTotal =
    (feeLockerObj ? feeLockerObj.monthlyRent : 0) * feeMonths;
  const feeAutoDiscount =
    feePlan === 'Quarterly' ? 150 : feePlan === 'Half-Yearly' ? 500 : 0;
  const effectiveFeeDiscount = feeDiscount > 0 ? feeDiscount : feeAutoDiscount;
  const feeNetTotal = Math.max(
    0,
    feeBaseAmount + feeLockerTotal - effectiveFeeDiscount
  );

  const handleCollectFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeeMember) return;
    const validUntil = addMonthsToDate(selectedFeeMember.expiryDate, feeMonths);
    const walletCreditAdded = Math.max(0, feeBaseAmount - effectiveFeeDiscount);
    const newWalletBal = selectedFeeMember.walletBalance + walletCreditAdded;

    const newPayment: FeePayment = {
      id: getNextReceiptId(),
      memberId: selectedFeeMember.id,
      memberName: selectedFeeMember.name,
      memberPhone: selectedFeeMember.phone,
      seatCode: selectedFeeMember.seatId,
      lockerCode: selectedFeeMember.lockerId,
      plan: feePlan,
      months: feeMonths,
      baseAmount: feeBaseAmount,
      lockerFee: feeLockerTotal,
      discount: effectiveFeeDiscount,
      totalPaid: feeNetTotal,
      walletBalanceAfter: newWalletBal,
      mode: feeMode,
      transactionRef:
        feeRef.trim() ||
        `${feeMode.toUpperCase()}/${Math.floor(100000000 + Math.random() * 900000000)}`,
      date: TODAY_STR,
      validFrom: TODAY_STR,
      validUntil,
      remarks: `Wallet Credited +₹${walletCreditAdded} · New Balance: ₹${newWalletBal}`,
    };

    setPayments((prev) => [newPayment, ...prev]);
    setMembers((prev) =>
      prev.map((m) =>
        m.id === selectedFeeMember.id
          ? {
              ...m,
              plan: feePlan,
              walletBalance: newWalletBal,
              expiryDate: validUntil,
              status: 'Active',
            }
          : m
      )
    );
    setFeeRef('');
    setFeeDiscount(0);
    setSelectedReceipt(newPayment);
    triggerToast(
      `Credited ₹${walletCreditAdded} to ${selectedFeeMember.name}'s wallet`
    );
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmt = Number(expAmount);
    if (!expTitle.trim() || !numericAmt || numericAmt <= 0) return;
    const newExp: Expense = {
      id: `EXP-2026-${expenses.length + 15}`,
      title: expTitle.trim(),
      category: expCategory,
      amount: numericAmt,
      date: TODAY_STR,
      mode: expMode,
    };
    setExpenses((prev) => [newExp, ...prev]);
    setExpTitle('');
    setExpAmount('');
    triggerToast(`Logged expense ₹${numericAmt.toLocaleString('en-IN')}`);
  };

  // Filtered Members
  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    return members.filter((m) => {
      const matchesStatus =
        memberStatusFilter === 'All' ? true : m.status === memberStatusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        (m.seatId && m.seatId.toLowerCase().includes(q)) ||
        m.examPrep.toLowerCase().includes(q)
      );
    });
  }, [members, memberSearch, memberStatusFilter]);

  // Low Balance Members
  const lowBalanceMembers = useMemo(
    () =>
      members
        .filter((m) => m.status !== 'Left' && m.walletBalance < 120)
        .sort((a, b) => a.walletBalance - b.walletBalance),
    [members]
  );

  // Financial Report Data
  const filteredReportData = useMemo(() => {
    const cutoffMap: Record<ReportRange, number> = {
      Weekly: 7,
      Monthly: 31,
      Quarterly: 92,
      '6M / Yearly': 365,
    };
    const maxDays = cutoffMap[reportRange];
    const tToday = new Date(TODAY_STR + 'T00:00:00').getTime();
    const withinDays = (dStr: string) => {
      const t = new Date(dStr + 'T00:00:00').getTime();
      const diff = Math.round((tToday - t) / (1000 * 60 * 60 * 24));
      return diff >= 0 && diff <= maxDays;
    };

    const repPayments = payments.filter((p) => withinDays(p.date));
    const repExpenses = expenses.filter((e) => withinDays(e.date));
    const totalInc = repPayments.reduce((s, p) => s + p.totalPaid, 0);
    const totalExp = repExpenses.reduce((s, e) => s + e.amount, 0);

    const categories: ExpenseCategory[] = [
      'Electricity & AC',
      'Rent & Maintenance',
      'Wi-Fi & Newspapers',
      'Staff Salary',
      'Drinking Water & Cleaning',
      'Furniture & Electrical',
    ];

    const categoryBreakdown = categories.map((cat) => {
      const amt = repExpenses
        .filter((e) => e.category === cat)
        .reduce((s, e) => s + e.amount, 0);
      const pct = totalExp > 0 ? Math.round((amt / totalExp) * 100) : 0;
      return { category: cat, amount: amt, pct };
    });

    return {
      payments: repPayments,
      expenses: repExpenses,
      totalIncome: totalInc,
      totalExpense: totalExp,
      netProfit: totalInc - totalExp,
      categoryBreakdown,
    };
  }, [payments, expenses, reportRange]);

  const activeMembersCount = members.filter((m) => m.status === 'Active').length;
  const occupiedSeatsCount = seats.filter((s) => s.status === 'Occupied').length;
  const vacantSeatsCount = seats.filter((s) => s.status === 'Vacant').length;
  const occupiedLockersCount = lockers.filter(
    (l) => l.status === 'Occupied'
  ).length;
  const vacantLockersCount = lockers.filter((l) => l.status === 'Vacant').length;
  const totalAllTimeIncome = payments.reduce((s, p) => s + p.totalPaid, 0);
  const totalAllTimeExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfitAllTime = totalAllTimeIncome - totalAllTimeExpenses;
  const currentlyInsideList = attendance.filter((a) => a.status === 'Inside');

  const activeProfileMember = profileMemberId
    ? members.find((m) => m.id === profileMemberId) || null
    : null;

  const activeSeatModalObj = activeSeatModalId
    ? seats.find((s) => s.id === activeSeatModalId) || null
    : null;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members & CSV', icon: Users },
    { id: 'seats', label: 'Single-Floor Seats', icon: Armchair },
    { id: 'finance', label: 'Wallet & Finance', icon: Wallet },
    { id: 'attendance', label: 'QR + Face ID Gate', icon: ScanFace },
  ] as const;

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-stone-900 flex">
      {/* ========================================================= */}
      {/* LEFT SIDEBAR NAVIGATION (Obsidian Studio Theme) */}
      {/* ========================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-stone-950 text-stone-200 flex flex-col justify-between border-r border-stone-800 transition-transform md:translate-x-0 md:static md:shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-5 space-y-6">
          {/* Brand Title */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-4">
            <div>
              <span className="text-lg font-bold tracking-tight text-white block">
                VidyaKosh
              </span>
              <span className="text-[11px] text-amber-400 font-mono tabular-nums">
                Single-Floor Biometric Hall
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1 text-stone-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                      : 'text-stone-400 hover:text-white hover:bg-stone-900'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Live Gate & Auto Seat Status Box in Sidebar */}
          <div className="p-3.5 bg-stone-900/90 border border-stone-800 rounded-xl space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-stone-400">
              <span>Next Auto Seat</span>
              <span className="font-mono tabular-nums font-bold text-amber-400">
                {nextAutoSeat ? nextAutoSeat.code : 'Full'}
              </span>
            </div>
            <div className="flex items-center justify-between text-stone-400">
              <span>Inside Hall Now</span>
              <span className="font-mono tabular-nums font-bold text-emerald-400">
                {currentlyInsideList.length} Active
              </span>
            </div>
            <button
              onClick={() => {
                setFaceScanMember(members[2]); // Quick test for Rohan or any member
              }}
              className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Quick Gate Face Scan</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-stone-800 space-y-2">
          <button
            onClick={handleExportMembersCsv}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-stone-200 bg-stone-900 hover:bg-stone-800 border border-stone-700 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Members CSV</span>
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              window.location.reload();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-stone-500 hover:text-stone-300 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* RIGHT WORKSPACE CANVAS (Top Contextual Header + Main Viewport) */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Contextual Top Bar (No navigation links here — moved to Left Sidebar) */}
        <header className="sticky top-0 z-30 bg-[#F7F5F0]/95 backdrop-blur-xs border-b border-stone-200 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-stone-700 bg-white border border-stone-300 rounded-lg"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-xs text-stone-500 font-medium">
              <span>VidyaKosh Single-Floor Hall</span>
              <span className="mx-2" aria-hidden="true">
                /
              </span>
              <span className="text-stone-900 font-semibold capitalize">
                {activeTab === 'attendance'
                  ? 'Common Gate QR & Face ID'
                  : activeTab}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportMembersCsv}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-800 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-indigo-700" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                setAdmissionPreselectedSeat(null);
                setIsAdmissionOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors whitespace-nowrap"
            >
              + New Admission
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 bg-stone-950 text-white text-xs font-medium rounded-lg shadow-xl border border-stone-800">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-6 space-y-6">
          {/* VIEW 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                    Single-Floor Library & Biometric Wallet Dashboard
                  </h1>
                  <p className="text-xs text-stone-600 mt-1">
                    Apni library ka pura status ek dashboard pe · Auto 1-by-1 Seat Queue:{' '}
                    <strong className="font-mono text-indigo-700">
                      {nextAutoSeat?.code || 'Full'}
                    </strong>{' '}
                    · Per-Hour Wallet Fee Deduction Active
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <ScanFace className="w-4 h-4" />
                    <span>Open Gate QR + Face ID Scanner</span>
                  </button>
                </div>
              </div>

              {/* 4 Real-Time Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setActiveTab('members')}
                  className="bg-white border border-stone-200 rounded-xl p-5 cursor-pointer hover:border-indigo-400 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs font-medium text-stone-500">
                      Total Enrolled Members
                    </p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1.5">
                      {members.length}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-emerald-700 font-medium">
                      {activeMembersCount} Active
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-rose-600 font-medium">
                      {lowBalanceMembers.length} Low Bal
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-indigo-700 underline font-sans">
                      CSV / View
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('seats')}
                  className="bg-white border border-stone-200 rounded-xl p-5 cursor-pointer hover:border-indigo-400 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs font-medium text-stone-500">
                      Single-Floor Seats (Auto 1-by-1)
                    </p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1.5">
                      {occupiedSeatsCount}{' '}
                      <span className="text-sm font-normal text-stone-400">
                        / {seats.length}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-emerald-700 font-medium">
                      {vacantSeatsCount} Free
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-indigo-700 font-semibold">
                      Next: {nextAutoSeat?.code || 'None'}
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setIsLockerDialogOpen(true)}
                  className="bg-white border border-stone-200 rounded-xl p-5 cursor-pointer hover:border-indigo-400 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs font-medium text-stone-500">
                      Personal Lockers
                    </p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-stone-900 mt-1.5">
                      {occupiedLockersCount}{' '}
                      <span className="text-sm font-normal text-stone-400">
                        / {lockers.length}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-emerald-700 font-medium">
                      {vacantLockersCount} Available
                    </span>
                    <span className="text-indigo-700 font-sans font-semibold underline">
                      Assign Locker →
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setActiveTab('finance')}
                  className="bg-white border border-stone-200 rounded-xl p-5 cursor-pointer hover:border-indigo-400 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs font-medium text-stone-500">
                      Net Library Profit (₹)
                    </p>
                    <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1.5">
                      ₹{netProfitAllTime.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-mono tabular-nums text-stone-500">
                    <span>In: ₹{(totalAllTimeIncome / 1000).toFixed(1)}k</span>
                    <span aria-hidden="true">·</span>
                    <span>Out: ₹{(totalAllTimeExpenses / 1000).toFixed(1)}k</span>
                  </div>
                </div>
              </div>

              {/* Visual Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between">
                  <div className="mb-3">
                    <h2 className="text-sm font-semibold text-stone-900">
                      Monthly Wallet Recharges vs. Hall Expenses (6-Month Trend)
                    </h2>
                    <p className="text-xs text-stone-500">
                      Hover over any month bar to inspect financial performance
                    </p>
                  </div>
                  <MonthlyIncomeExpenseChart
                    payments={payments}
                    expenses={expenses}
                  />
                </div>

                <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h2 className="text-sm font-semibold text-stone-900">
                        Single-Floor Seat Occupancy Breakdown
                      </h2>
                      <p className="text-xs text-stone-500">
                        Live distribution across Row A, Row B, Row C & Cabin Row D
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('seats')}
                      className="text-xs font-medium text-indigo-700 underline"
                    >
                      Seat Map
                    </button>
                  </div>
                  <LiveSeatOccupancyDonut seats={seats} />
                </div>
              </div>

              {/* Bottom Insights: Low Wallet Balance Top-Up + Recent Receipts + Notice Board */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Low Wallet Balance / Due Recharge */}
                <div className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-stone-900">
                          Low Wallet Balance Alert (&lt; ₹120)
                        </h3>
                        <p className="text-xs text-stone-500">
                          Hourly fees deduct on exit · 1-tap recharge with digital receipt
                        </p>
                      </div>
                      <span className="text-xs font-mono tabular-nums font-semibold text-rose-600">
                        {lowBalanceMembers.length} Low
                      </span>
                    </div>

                    <div className="divide-y divide-stone-100 max-h-[260px] overflow-y-auto pr-1">
                      {lowBalanceMembers.map((m) => (
                        <div
                          key={m.id}
                          className="py-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <button
                              onClick={() => setProfileMemberId(m.id)}
                              className="text-xs font-semibold text-stone-900 hover:underline truncate block text-left"
                            >
                              {m.name}
                            </button>
                            <p className="text-[11px] text-stone-500 font-mono tabular-nums">
                              {m.id} · Rate ₹{m.hourlyRate}/hr ·{' '}
                              <span className="text-rose-600 font-semibold">
                                Bal: ₹{m.walletBalance}
                              </span>
                            </p>
                          </div>

                          <button
                            onClick={() => handleOneTapWalletRecharge(m)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800 transition-colors whitespace-nowrap shrink-0 font-mono tabular-nums"
                          >
                            +Top-Up ₹{m.monthlyFee}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Fee Payments */}
                <div className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-stone-900">
                          Recent Wallet Recharges & Receipts
                        </h3>
                        <p className="text-xs text-stone-500">
                          Tap any payment to open its shareable Digital Receipt
                        </p>
                      </div>
                      <Receipt className="w-4 h-4 text-stone-400" />
                    </div>

                    <div className="divide-y divide-stone-100 max-h-[260px] overflow-y-auto pr-1">
                      {payments.slice(0, 6).map((pay) => (
                        <button
                          key={pay.id}
                          onClick={() => setSelectedReceipt(pay)}
                          className="w-full py-2.5 flex items-center justify-between gap-2 text-left hover:bg-stone-50 px-1.5 rounded-md transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-stone-900 truncate">
                              {pay.memberName}
                            </p>
                            <p className="text-[11px] text-stone-500 font-mono tabular-nums">
                              {pay.id} · {pay.date} · {pay.mode}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-bold font-mono tabular-nums text-emerald-700">
                              +₹{pay.totalPaid.toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-indigo-700 underline">
                              Receipt
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notice Board */}
                <div className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-stone-900">
                          Library Notice Board
                        </h3>
                        <p className="text-xs text-stone-500">
                          Announcements for single-floor hall
                        </p>
                      </div>
                      <button
                        onClick={() => setIsAddingNotice(!isAddingNotice)}
                        className="px-2.5 py-1 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md"
                      >
                        {isAddingNotice ? 'Cancel' : '+ Post Notice'}
                      </button>
                    </div>

                    {isAddingNotice && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (!noticeTitle.trim() || !noticeContent.trim())
                            return;
                          setNotices((prev) => [
                            {
                              id: `NTC-${Date.now()}`,
                              title: noticeTitle.trim(),
                              content: noticeContent.trim(),
                              category: noticeCategory,
                              pinned: true,
                              createdAt: TODAY_STR,
                              author: 'Admin',
                            },
                            ...prev,
                          ]);
                          setNoticeTitle('');
                          setNoticeContent('');
                          setIsAddingNotice(false);
                        }}
                        className="p-3 bg-stone-50 border border-stone-200 rounded-lg space-y-2"
                      >
                        <input
                          type="text"
                          required
                          placeholder="Notice title..."
                          value={noticeTitle}
                          onChange={(e) => setNoticeTitle(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md"
                        />
                        <textarea
                          rows={2}
                          required
                          placeholder="Details..."
                          value={noticeContent}
                          onChange={(e) => setNoticeContent(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-md"
                        />
                        <button
                          type="submit"
                          className="w-full py-1.5 text-xs font-semibold text-white bg-indigo-700 rounded-md"
                        >
                          Publish Notice
                        </button>
                      </form>
                    )}

                    <div className="divide-y divide-stone-100 max-h-[250px] overflow-y-auto pr-1">
                      {notices.map((n) => (
                        <div key={n.id} className="py-2.5 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-stone-900">
                              {n.pinned && (
                                <span className="text-amber-700 mr-1">
                                  [Pinned]
                                </span>
                              )}
                              {n.title}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() =>
                                  setNotices((prev) =>
                                    prev.map((x) =>
                                      x.id === n.id
                                        ? { ...x, pinned: !x.pinned }
                                        : x
                                    )
                                  )
                                }
                                className="p-1 text-stone-400 hover:text-amber-600"
                              >
                                <Pin className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  setNotices((prev) =>
                                    prev.filter((x) => x.id !== n.id)
                                  )
                                }
                                className="p-1 text-stone-400 hover:text-rose-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-stone-600">{n.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: MEMBERS & CSV EXPORT */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                    Member Directory, Hourly Wallets & CSV Backup
                  </h1>
                  <p className="text-xs text-stone-600 mt-1">
                    Sabhi members ka complete record · Hourly fee balance, Face ID status, auto/manual seat & 1-click CSV export
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleExportMembersCsv}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Full Member List (.CSV)</span>
                  </button>
                  <button
                    onClick={() => {
                      setAdmissionPreselectedSeat(null);
                      setIsAdmissionOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Admission ({nextMemberId})</span>
                  </button>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Instant search by Name, Member ID (LIB-1001), Mobile Number, Seat Code (S-01)..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-700"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg overflow-x-auto">
                  {(
                    [
                      'All',
                      'Active',
                      'Low Balance',
                      'Suspended',
                      'Left',
                    ] as const
                  ).map((st) => {
                    const count =
                      st === 'All'
                        ? members.length
                        : members.filter((m) => m.status === st).length;
                    return (
                      <button
                        key={st}
                        onClick={() => setMemberStatusFilter(st)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                          memberStatusFilter === st
                            ? 'bg-white text-stone-900 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {st} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100 border-b border-stone-200 text-stone-600">
                        <th className="py-3 px-4 font-medium">Member & Face ID</th>
                        <th className="py-3 px-4 font-medium">Exam & Shift</th>
                        <th className="py-3 px-4 font-medium">Single-Floor Seat</th>
                        <th className="py-3 px-4 font-medium">Hourly Rate</th>
                        <th className="py-3 px-4 font-medium">Wallet Balance</th>
                        <th className="py-3 px-4 font-medium">Hours Used</th>
                        <th className="py-3 px-4 font-medium text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredMembers.map((m) => {
                        const isInside = attendance.some(
                          (a) => a.memberId === m.id && a.status === 'Inside'
                        );
                        return (
                          <tr
                            key={m.id}
                            onClick={() => setProfileMemberId(m.id)}
                            className="hover:bg-stone-50 cursor-pointer transition-colors"
                          >
                            <td className="py-3 px-4">
                              <p className="font-semibold text-stone-900">
                                {m.name}
                              </p>
                              <p className="text-[11px] text-stone-500 font-mono tabular-nums mt-0.5">
                                {m.id} · +91 {m.phone} · {m.faceTemplateId}
                              </p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-medium text-stone-800">
                                {m.examPrep}
                              </p>
                              <p className="text-[11px] text-stone-500">
                                {m.shift}
                              </p>
                            </td>
                            <td className="py-3 px-4 font-mono tabular-nums">
                              <span className="font-semibold text-indigo-800">
                                {m.seatId
                                  ? `Seat ${m.seatId} (${m.seatAssignmentMode})`
                                  : 'Auto 1-by-1 on Entry'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono tabular-nums text-stone-800">
                              ₹{m.hourlyRate}/hr
                            </td>
                            <td className="py-3 px-4 font-mono tabular-nums">
                              <span
                                className={`font-bold ${
                                  m.walletBalance < 100
                                    ? 'text-rose-600'
                                    : 'text-emerald-700'
                                }`}
                              >
                                ₹{m.walletBalance.toLocaleString('en-IN')}
                              </span>
                              <p className="text-[10px] text-stone-400">
                                ~{Math.floor(m.walletBalance / m.hourlyRate)}h left
                              </p>
                            </td>
                            <td className="py-3 px-4 font-mono tabular-nums text-stone-700">
                              {m.totalHoursUsed.toFixed(1)} hrs (₹{m.totalDeducted})
                            </td>
                            <td
                              className="py-3 px-4 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => setFaceScanMember(m)}
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                                    isInside
                                      ? 'bg-amber-400 text-stone-950 hover:bg-amber-300'
                                      : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100'
                                  }`}
                                >
                                  {isInside ? 'Exit Face Scan' : 'Entry Face Scan'}
                                </button>
                                <button
                                  onClick={() => handleJumpToFeeCollection(m)}
                                  className="px-2.5 py-1 text-xs font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-md whitespace-nowrap"
                                >
                                  +Recharge
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: SINGLE-FLOOR SEAT BOARD */}
          {activeTab === 'seats' && (
            <SeatBoardSection
              seats={seats}
              members={members}
              nextAutoSeat={nextAutoSeat}
              onSelectSeatForAction={(seatId) => {
                setActiveSeatModalId(seatId);
                setSeatAssignMemberId('');
              }}
              onOpenAddSeatModal={() => setIsAddSeatOpen(true)}
              onOpenFaceScanForMember={(m) => setFaceScanMember(m)}
            />
          )}

          {/* VIEW 4: WALLET RECHARGE & FINANCIAL REPORTS */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                    Hourly Wallet Recharge & Financial Reports
                  </h1>
                  <p className="text-xs text-stone-600 mt-1">
                    Recharge student prepaid wallets (balance cuts automatically per hour on exit) & inspect library P&L
                  </p>
                </div>

                <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-lg">
                  {(
                    ['Weekly', 'Monthly', 'Quarterly', '6M / Yearly'] as const
                  ).map((rng) => (
                    <button
                      key={rng}
                      onClick={() => setReportRange(rng)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                        reportRange === rng
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {rng}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <p className="text-xs text-stone-500">
                    Total Wallet Recharges ({reportRange})
                  </p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-indigo-700 mt-1">
                    ₹{filteredReportData.totalIncome.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <p className="text-xs text-stone-500">
                    Total Hall Expenses ({reportRange})
                  </p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1">
                    ₹{filteredReportData.totalExpense.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-white border border-stone-200 rounded-xl p-5">
                  <p className="text-xs text-stone-500">
                    Net Library Surplus ({reportRange})
                  </p>
                  <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
                    ₹{filteredReportData.netProfit.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
                    Recharge Student Hourly Wallet
                  </h2>

                  <form onSubmit={handleCollectFeeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">
                        Select Member
                      </label>
                      <select
                        value={feeMemberId}
                        onChange={(e) => setFeeMemberId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
                      >
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.id}) · Bal: ₹{m.walletBalance} (₹
                            {m.hourlyRate}/hr)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Recharge Plan
                        </label>
                        <select
                          value={feePlan}
                          onChange={(e) =>
                            setFeePlan(e.target.value as PlanType)
                          }
                          className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
                        >
                          <option value="Monthly">Monthly Credit</option>
                          <option value="Quarterly">Quarterly Credit (3x)</option>
                          <option value="Half-Yearly">Half-Yearly (6x)</option>
                          <option value="Custom">Custom Months</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-700 mb-1">
                          Concession / Discount (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          placeholder={String(feeAutoDiscount)}
                          value={feeDiscount || ''}
                          onChange={(e) =>
                            setFeeDiscount(Number(e.target.value))
                          }
                          className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-stone-300 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-1 text-xs font-mono tabular-nums">
                      <div className="flex justify-between">
                        <span>Current Wallet Balance:</span>
                        <span>₹{selectedFeeMember?.walletBalance}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>Balance After Recharge:</span>
                        <span>
                          ₹
                          {(
                            (selectedFeeMember?.walletBalance || 0) +
                            feeBaseAmount -
                            effectiveFeeDiscount
                          ).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-700 rounded-lg hover:bg-indigo-800"
                    >
                      Collect ₹{feeNetTotal.toLocaleString('en-IN')} & Open Receipt
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 space-y-4">
                  <h2 className="text-base font-bold text-stone-900 border-b border-stone-100 pb-3">
                    Expense Breakdown & Log New Expense
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredReportData.categoryBreakdown.map((item) => (
                      <div
                        key={item.category}
                        className="p-3 border border-stone-200 rounded-lg space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-stone-800">
                            {item.category}
                          </span>
                          <span className="font-mono tabular-nums font-semibold text-stone-900">
                            ₹{item.amount.toLocaleString('en-IN')} ({item.pct}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-700 rounded-full"
                            style={{ width: `${Math.max(4, item.pct)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleAddExpense}
                    className="pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5"
                  >
                    <input
                      type="text"
                      required
                      placeholder="Expense title..."
                      value={expTitle}
                      onChange={(e) => setExpTitle(e.target.value)}
                      className="sm:col-span-5 px-3 py-2 text-xs bg-white border border-stone-300 rounded-lg"
                    />
                    <select
                      value={expCategory}
                      onChange={(e) =>
                        setExpCategory(e.target.value as ExpenseCategory)
                      }
                      className="sm:col-span-4 px-2.5 py-2 text-xs bg-white border border-stone-300 rounded-lg"
                    >
                      <option value="Electricity & AC">Electricity & AC</option>
                      <option value="Rent & Maintenance">Rent & Maintenance</option>
                      <option value="Wi-Fi & Newspapers">Wi-Fi & Newspapers</option>
                      <option value="Staff Salary">Staff Salary</option>
                      <option value="Drinking Water & Cleaning">
                        Drinking Water & Cleaning
                      </option>
                      <option value="Furniture & Electrical">
                        Furniture & Electrical
                      </option>
                    </select>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="₹ Amt"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      className="sm:col-span-3 px-3 py-2 text-xs font-mono tabular-nums bg-white border border-stone-300 rounded-lg"
                    />
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: COMMON GATE QR + FACE ID ENTRY & EXIT */}
          {activeTab === 'attendance' && (
            <QrFaceAttendanceSection
              members={members}
              seats={seats}
              attendance={attendance}
              nextAutoSeat={nextAutoSeat}
              onOpenFaceScanner={(m) => setFaceScanMember(m)}
              onOpenMemberProfile={(mId) => setProfileMemberId(mId)}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      <DigitalReceiptModal
        payment={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      <LockerDialog
        isOpen={isLockerDialogOpen}
        onClose={() => setIsLockerDialogOpen(false)}
        lockers={lockers}
        members={members}
        onAssignLocker={handleAssignLocker}
        onReleaseLocker={handleReleaseLocker}
        onToggleMaintenance={handleToggleLockerMaintenance}
        onAddLocker={handleAddLocker}
      />

      <MemberProfileModal
        member={activeProfileMember}
        onClose={() => setProfileMemberId(null)}
        payments={payments}
        attendance={attendance}
        onOpenReceipt={(pay) => setSelectedReceipt(pay)}
        onInitiateRenewal={handleJumpToFeeCollection}
        onUpdateStatus={(mId, st) =>
          setMembers((prev) =>
            prev.map((m) => (m.id === mId ? { ...m, status: st } : m))
          )
        }
        onOpenFaceScanForMember={(m) => {
          setProfileMemberId(null);
          setFaceScanMember(m);
        }}
      />

      <NewAdmissionModal
        isOpen={isAdmissionOpen}
        onClose={() => setIsAdmissionOpen(false)}
        nextMemberId={nextMemberId}
        seats={seats}
        lockers={lockers}
        preselectedSeatId={admissionPreselectedSeat}
        onCreateAdmission={handleCreateAdmission}
      />

      <FaceScannerModal
        isOpen={Boolean(faceScanMember)}
        onClose={() => setFaceScanMember(null)}
        member={faceScanMember}
        activeSession={
          faceScanMember
            ? attendance.find(
                (a) =>
                  a.memberId === faceScanMember.id && a.status === 'Inside'
              ) || null
            : null
        }
        nextAutoSeat={nextAutoSeat}
        vacantSeats={vacantSeatsList}
        onConfirmEntryAfterFaceScan={handleConfirmEntryAfterFaceScan}
        onConfirmExitAfterFaceScan={handleConfirmExitAfterFaceScan}
      />

      {/* Manual Seat Action Modal */}
      {activeSeatModalObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4">
          <div className="bg-white border border-stone-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-900 text-white">
              <div>
                <h3 className="text-sm font-bold font-mono tabular-nums">
                  Single-Floor Seat {activeSeatModalObj.code} ·{' '}
                  {activeSeatModalObj.rowZone}
                </h3>
                <p className="text-xs text-stone-400">
                  Sequence #{activeSeatModalObj.sequenceOrder} · Status:{' '}
                  <strong>{activeSeatModalObj.status}</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveSeatModalId(null)}
                className="text-xs text-stone-300 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {activeSeatModalObj.status === 'Occupied' ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => {
                        const mId = activeSeatModalObj.memberId;
                        setActiveSeatModalId(null);
                        if (mId) setProfileMemberId(mId);
                      }}
                      className="py-2 px-3 font-medium text-stone-800 bg-stone-100 rounded-lg hover:bg-stone-200"
                    >
                      Inspect Member
                    </button>
                    <button
                      onClick={() => handleVacateSeat(activeSeatModalObj.id)}
                      className="py-2 px-3 font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100"
                    >
                      Mark Seat Vacant
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block font-semibold text-stone-900">
                      Manual Override: Assign Member to {activeSeatModalObj.code}
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={seatAssignMemberId}
                        onChange={(e) => setSeatAssignMemberId(e.target.value)}
                        className="flex-1 px-2.5 py-2 bg-white border border-stone-300 rounded-lg"
                      >
                        <option value="">-- Select Member --</option>
                        {members
                          .filter((m) => m.status !== 'Left')
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.id}) · Bal ₹{m.walletBalance}
                            </option>
                          ))}
                      </select>
                      <button
                        disabled={!seatAssignMemberId}
                        onClick={() =>
                          handleManualAssignSeat(
                            activeSeatModalObj.id,
                            seatAssignMemberId
                          )
                        }
                        className="px-3.5 py-2 font-semibold text-white bg-indigo-700 rounded-lg disabled:opacity-40"
                      >
                        Manual Assign
                      </button>
                    </div>
                  </div>

                  <form
                    onSubmit={handleReserveSeat}
                    className="pt-3 border-t border-stone-200 space-y-2"
                  >
                    <p className="font-semibold text-stone-900">
                      Or Reserve / Hold Seat for Walk-in Inquiry
                    </p>
                    <input
                      type="text"
                      required
                      placeholder="Inquirer Name *"
                      value={reserveName}
                      onChange={(e) => setReserveName(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 px-3 font-medium text-amber-950 bg-amber-300 hover:bg-amber-400 rounded-lg"
                    >
                      Hold Seat
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Seat Modal */}
      {isAddSeatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateNewSeat}
            className="bg-white border border-stone-200 rounded-xl w-full max-w-md shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-900 text-white">
              <h3 className="text-sm font-bold">
                Add Sequential Seat on Single Floor
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSeatOpen(false)}
                className="text-xs text-stone-300"
              >
                Close
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Single-Floor Row Zone
                </label>
                <select
                  value={newSeatRow}
                  onChange={(e) =>
                    setNewSeatRow(e.target.value as SingleFloorRow)
                  }
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg"
                >
                  <option value="Row A (AC Prime)">Row A (AC Prime)</option>
                  <option value="Row B (AC Standard)">Row B (AC Standard)</option>
                  <option value="Row C (Silent Zone)">Row C (Silent Zone)</option>
                  <option value="Row D (Cabin Desk)">Row D (Cabin Desk)</option>
                </select>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSeatHasAC}
                    onChange={(e) => setNewSeatHasAC(e.target.checked)}
                  />
                  <span>AC Zone</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newSeatHasSocket}
                    onChange={(e) => setNewSeatHasSocket(e.target.checked)}
                  />
                  <span>Power Socket</span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2 font-semibold text-white bg-indigo-700 rounded-lg"
              >
                Create Seat S-{String(seats.length + 1).padStart(2, '0')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
