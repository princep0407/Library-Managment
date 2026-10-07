import {
  Member,
  Seat,
  Locker,
  FeePayment,
  Expense,
  AttendanceRecord,
  LibraryNotice,
} from '../types';

export const TODAY_STR = new Date().toISOString().slice(0, 10);

export const PUBLIC_APP_URL = 'https://library-ms.ai.studio';

// Common Unified Library Gate QR Code for ALL users (Entry & Exit)
export const COMMON_LIBRARY_QR_PAYLOAD =
  'VIDYAKOSH-GATE-SINGLE-FLOOR-MASTER-QR';

export const INITIAL_MEMBERS: Member[] = [];

export const INITIAL_SEATS: Seat[] = [];

export const INITIAL_LOCKERS: Locker[] = [];

export const INITIAL_PAYMENTS: FeePayment[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

export const INITIAL_NOTICES: LibraryNotice[] = [];
