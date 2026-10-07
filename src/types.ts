export type MemberStatus = 'Active' | 'Low Balance' | 'Suspended' | 'Left';

export type PlanType = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Custom';

export type ShiftType =
  | 'Full Day (24x7)'
  | 'Morning (6 AM - 2 PM)'
  | 'Evening (2 PM - 10 PM)'
  | 'Night (10 PM - 6 AM)';

// Single Floor Library Zones (all on one floor)
export type SingleFloorRow =
  | 'Row A (AC Prime)'
  | 'Row B (AC Standard)'
  | 'Row C (Silent Zone)'
  | 'Row D (Cabin Desk)';

export type SeatStatus = 'Vacant' | 'Occupied' | 'Reserved';

export type LockerStatus = 'Vacant' | 'Occupied' | 'Maintenance';

export type PaymentMode = 'UPI' | 'Cash' | 'Online';

export type ExpenseCategory =
  | 'Electricity & AC'
  | 'Rent & Maintenance'
  | 'Wi-Fi & Newspapers'
  | 'Staff Salary'
  | 'Drinking Water & Cleaning'
  | 'Furniture & Electrical';

export interface Member {
  id: string; // e.g., LIB-1001
  name: string;
  phone: string;
  email: string;
  examPrep: string;
  plan: PlanType;
  shift: ShiftType;
  hourlyRate: number; // ₹ per hour (e.g., ₹15/hr or ₹20/hr)
  walletBalance: number; // Current prepaid balance in ₹ (deducted per hour of library usage)
  totalHoursUsed: number; // Cumulative hours studied
  totalDeducted: number; // Cumulative ₹ deducted from usage
  monthlyFee: number;
  joinDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  status: MemberStatus;
  seatId: string | null; // e.g., S-01
  seatAssignmentMode: 'Auto' | 'Manual'; // Auto sequential on entry or Manual fixed
  lockerId: string | null; // e.g., L-01
  faceRegistered: boolean;
  faceTemplateId: string; // e.g., FACE-BIO-1001-9A4F
  facePhotoUrl?: string; // Captured webcam snapshot data URL for visual + biometric verification
  password?: string; // Member portal login password
  idProof: string;
  address: string;
  notes?: string;
}

export interface AdminProfile {
  libraryName: string;
  adminName: string;
  adminRole: string;
  phone: string;
  email: string;
  address: string;
  gateId: string;
  defaultHourlyRate: number;
}

export interface SeatReservation {
  name: string;
  phone: string;
  note: string;
  until: string; // YYYY-MM-DD
}

export interface Seat {
  id: string; // e.g., S-01
  code: string; // e.g., S-01
  sequenceOrder: number; // 1, 2, 3... for sequential 1-by-1 auto assignment
  rowZone: SingleFloorRow; // All on Single Ground Floor
  status: SeatStatus;
  memberId: string | null;
  assignmentType?: 'Auto-Entry' | 'Manual';
  reservedFor?: SeatReservation;
  hasAC: boolean;
  hasSocket: boolean;
  hourlyRateAddon: number;
}

export interface Locker {
  id: string; // e.g., L-01
  code: string; // e.g., L-01
  status: LockerStatus;
  memberId: string | null;
  monthlyRent: number;
  notes?: string;
}

export interface FeePayment {
  id: string; // e.g., RCP-2026-101
  memberId: string;
  memberName: string;
  memberPhone: string;
  seatCode: string | null;
  lockerCode: string | null;
  plan: PlanType;
  months: number;
  baseAmount: number; // Wallet recharge credit amount
  lockerFee: number;
  discount: number;
  totalPaid: number;
  walletBalanceAfter: number; // Member balance after this recharge
  mode: PaymentMode;
  transactionRef?: string;
  date: string; // YYYY-MM-DD
  validFrom: string;
  validUntil: string;
  remarks?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  mode: PaymentMode;
  vendor?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  memberName: string;
  examPrep: string;
  seatCode: string | null;
  seatAssignMode: 'Auto (1-by-1)' | 'Manual';
  shift: ShiftType;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm (24h)
  checkInDisplay: string; // e.g., 06:45 AM
  checkInTimestamp: number; // ms epoch for live timer calculation
  checkOutTime: string | null;
  checkOutDisplay: string | null;
  durationMinutes: number | null;
  hourlyRateApplied: number; // ₹/hr
  feeDeducted: number | null; // ₹ deducted from member wallet on exit
  balanceAfterExit: number | null; // ₹ remaining in wallet
  entryFaceVerified: boolean;
  exitFaceVerified: boolean;
  faceMatchScore: number; // e.g. 99.4
  deviceSource: 'Student Mobile QR + Face ID' | 'Gate Biometric Kiosk' | 'Admin Override';
  status: 'Inside' | 'Completed';
}

export interface LibraryNotice {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'Timing' | 'Exam Alert' | 'Maintenance';
  pinned: boolean;
  createdAt: string; // YYYY-MM-DD
  author: string;
}
