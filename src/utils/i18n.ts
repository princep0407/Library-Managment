export type AppLang = 'en' | 'gu';

export const TRANSLATIONS = {
  en: {
    appName: 'VidyaKosh',
    adminConsole: 'Admin Console',
    studyHall: 'VidyaKosh Study Hall',
    navDashboard: 'Dashboard',
    navMembers: 'Members Directory',
    navSeats: 'Single-Floor Seats',
    navFinance: 'Wallet & Finance',
    navAttendance: 'QR + Face ID Gate',
    nextAutoSeat: 'Next Auto Seat',
    insideHallNow: 'Inside Hall Now',
    active: 'Active',
    quickGateFaceScan: 'Quick Gate Face Scan',
    lightTheme: 'Light Theme',
    darkTheme: 'Dark Theme',
    profile: 'Profile',
    newAdmission: '+ New Admission',
    logout: 'Logout',
    adminLogout: 'Admin Logout',

    // Overcrowding >90% Alert
    overcrowdingTitle:
      'High Occupancy Alert — Seat Capacity Exceeded 90% Threshold!',
    overcrowdingSubtitle: (pct: number, occ: number, total: number, vac: number) =>
      `Total seat occupancy is currently at ${pct}% (${occ} of ${total} seats occupied, only ${vac} vacant). Consider adding extra seats or managing entry queue to prevent overcrowding.`,
    overcrowdingToast: (pct: number, occ: number, total: number) =>
      `Overcrowding Alert: Seat occupancy reached ${pct}% (${occ}/${total} seats) — exceeds 90% threshold!`,
    inspectSeatsBtn: 'Manage Seat Board',
    addExtraSeatBtn: '+ Add Floor Seat',
    dismissAlert: 'Dismiss',

    // Dashboard
    dashboardTitle: 'Single-Floor Library & Biometric Wallet Dashboard',
    dashboardSubtitle:
      'Complete real-time overview · Auto 1-by-1 Seat Queue & Hourly Wallet Deduction Active',
    openGateScanner: 'Open Gate QR + Face ID Scanner',
    totalEnrolledMembers: 'Total Enrolled Members',
    seatOccupancyCard: 'Single-Floor Seat Occupancy',
    lockersAssignedCard: 'Lockers Assigned',
    netFinancialProfitCard: 'All-Time Net Balance',
    occupied: 'Occupied',
    vacant: 'Vacant',
    lowBal: 'Low Bal',

    // Member Login & Portal
    libraryTitle: 'VidyaKosh Study Library',
    libraryTagline: 'Single-Floor AC Reading Room & Biometric Gate',
    portalHeroTitle: 'Member Study Portal & Biometric Attendance',
    portalHeroDesc:
      'Sign in with your Member ID or registered Mobile Number to view your assigned seat, live check-in/out timer, study hours completed, and prepaid wallet balance.',
    featureSeatTitle: 'Instant Seat & Shift Status',
    featureSeatDesc:
      'Know your exact assigned seat (Auto 1-by-1 or Fixed) on entry.',
    featureFaceTitle: '1-to-1 Biometric Face ID & Gate QR',
    featureFaceDesc:
      'Strict facial geometry verification with live study timer & wallet ledger.',
    featureWalletTitle: 'Transparent Hourly Wallet Balance',
    featureWalletDesc:
      'Track your daily check-in time, check-out time, hours studied, and fee receipts.',
    memberLoginHeading: 'Member Login',
    memberLoginSub:
      'Enter your Member ID or Mobile Number and Password to access your dashboard',
    loginIdLabel: 'Member ID / User ID / Mobile Number',
    loginIdPlaceholder: 'Enter Member ID or Mobile No.',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    signInBtn: 'Sign In to Portal',
    contactDeskNote:
      'For new admission or password assistance, please contact the Library Desk.',
    currentlyInsideSeat: (seat: string) => `Currently Inside — Seat ${seat}`,
    currentlyOutside: 'Currently Outside Library',
    sitAtSeat: (seat: string) => `Sit at Seat ${seat}`,
    assignedSeatOnEntry: (seat: string) => `Assigned Seat on Entry: ${seat}`,
    checkedInAt: 'Checked In At (In Time)',
    lastStatus: 'Last Status',
    liveRunningDuration: 'Live Running Duration',
    totalHoursStudied: 'Total Hours Studied',
    liveWalletBalance: 'Live Wallet Balance',
    studyHoursLeft: 'Study Hours Left',
    scanToCheckIn: (seat: string) =>
      `Scan Gate QR & Face ID to Check In (Seat ${seat})`,
    markExitBtn: 'Mark Exit · Scan Gate QR & Face ID',
    attendanceHistoryHeading:
      'My Complete Entry / Exit History (Check-In · Check-Out · Seat · Duration · Wallet Balance)',
    walletReceiptsHeading: 'My Wallet Recharges & Digital Receipts',
  },
  gu: {
    appName: 'વિદ્યાકોશ (VidyaKosh)',
    adminConsole: 'એડમિન કંટ્રોલ પેનલ',
    studyHall: 'વિદ્યાકોશ સ્ટડી હોલ',
    navDashboard: 'ડેશબોર્ડ (Dashboard)',
    navMembers: 'સભ્યોની યાદી (Members)',
    navSeats: 'સિંગલ-ફ્લોર સીટ બોર્ડ',
    navFinance: 'વોલેટ અને હિસાબ (Finance)',
    navAttendance: 'QR + ફેસ ID હાજરી',
    nextAutoSeat: 'આગળની ઓટો સીટ',
    insideHallNow: 'હાલમાં લાઇબ્રેરીમાં',
    active: 'સક્રિય',
    quickGateFaceScan: 'ગેટ ફેસ સ્કેન કરો',
    lightTheme: 'લાઇટ થીમ',
    darkTheme: 'ડાર્ક થીમ',
    profile: 'પ્રોફાઇલ',
    newAdmission: '+ નવો પ્રવેશ (Admission)',
    logout: 'લોગઆઉટ',
    adminLogout: 'એડમિન લોગઆઉટ',

    // Overcrowding >90% Alert
    overcrowdingTitle:
      'ઓવરક્રાઉડિંગ એલર્ટ — સીટ ઓક્યુપન્સી 90% કરતા વધી ગઈ છે!',
    overcrowdingSubtitle: (pct: number, occ: number, total: number, vac: number) =>
      `હાલમાં કુલ સીટ ઓક્યુપન્સી ${pct}% છે (${total} માંથી ${occ} સીટ ભરાયેલ છે, માત્ર ${vac} સીટ ખાલી છે). ભીડ નિયંત્રિત કરવા માટે નવી સીટ ઉમેરો અથવા સીટ બોર્ડ તપાસો.`,
    overcrowdingToast: (pct: number, occ: number, total: number) =>
      `ઓવરક્રાઉડિંગ એલર્ટ: સીટ ઓક્યુપન્સી ${pct}% (${occ}/${total} સીટ) થઈ ગઈ છે — 90% લિમિટ પાર!`,
    inspectSeatsBtn: 'સીટ બોર્ડ તપાસો',
    addExtraSeatBtn: '+ નવી સીટ ઉમેરો',
    dismissAlert: 'બંધ કરો',

    // Dashboard
    dashboardTitle: 'સિંગલ-ફ્લોર લાઇબ્રેરી અને બાયોમેટ્રિક વોલેટ ડેશબોર્ડ',
    dashboardSubtitle:
      'તમારી લાઇબ્રેરીનું સંપૂર્ણ સ્ટેટસ · 1-by-1 ઓટો સીટ અને કલાક મુજબ વોલેટ ફી કપાત સક્રિય',
    openGateScanner: 'ગેટ QR + ફેસ ID સ્કેનર ખોલો',
    totalEnrolledMembers: 'કુલ નોંધાયેલા સભ્યો',
    seatOccupancyCard: 'સિંગલ-ફ્લોર સીટ ઓક્યુપન્સી',
    lockersAssignedCard: 'ફાળવેલ લોકર્સ',
    netFinancialProfitCard: 'કુલ ચોખ્ખી આવક (Net Balance)',
    occupied: 'ભરાયેલ',
    vacant: 'ખાલી',
    lowBal: 'ઓછું બેલેન્સ',

    // Member Login & Portal
    libraryTitle: 'વિદ્યાકોશ સ્ટડી લાઇબ્રેરી',
    libraryTagline: 'સિંગલ-ફ્લોર AC રીડિંગ રૂમ અને બાયોમેટ્રિક ગેટ',
    portalHeroTitle: 'સભ્ય સ્ટડી પોર્ટલ અને બાયોમેટ્રિક હાજરી',
    portalHeroDesc:
      'તમારી સીટ, ચેક-ઇન/આઉટ સમય, કુલ અભ્યાસ કલાકો અને પ્રીપેડ વોલેટ બેલેન્સ જોવા માટે તમારા સભ્ય ID અથવા મોબાઇલ નંબરથી લોગિન કરો.',
    featureSeatTitle: 'લાઇવ સીટ અને શિફ્ટ સ્ટેટસ',
    featureSeatDesc:
      'એન્ટ્રી સમયે તમારી ઓટો (1-by-1) અથવા ફિક્સ સીટની તુરંત માહિતી.',
    featureFaceTitle: '1-to-1 બાયોમેટ્રિક ફેસ ID અને ગેટ QR',
    featureFaceDesc:
      'ચોક્કસ ફેસ વેરિફિકેશન સાથે લાઇવ સ્ટડી ટાઇમર અને વોલેટ હિસાબ.',
    featureWalletTitle: 'પારદર્શક કલાક-દીઠ વોલેટ બેલેન્સ',
    featureWalletDesc:
      'તમારો દૈનિક ચેક-ઇન સમય, ચેક-આઉટ સમય, કલાકો અને ફી રસીદ જુઓ.',
    memberLoginHeading: 'સભ્ય લોગિન (Member Login)',
    memberLoginSub:
      'તમારા ડેશબોર્ડમાં પ્રવેશવા માટે સભ્ય ID અથવા મોબાઇલ નંબર અને પાસવર્ડ દાખલ કરો',
    loginIdLabel: 'સભ્ય ID / યુઝર ID / મોબાઇલ નંબર',
    loginIdPlaceholder: 'સભ્ય ID અથવા મોબાઇલ નંબર નાખો',
    passwordLabel: 'પાસવર્ડ (Password)',
    passwordPlaceholder: 'તમારો પાસવર્ડ નાખો',
    signInBtn: 'પોર્ટલમાં લોગિન કરો',
    contactDeskNote:
      'નવા પ્રવેશ અથવા પાસવર્ડ સહાય માટે લાઇબ્રેરી ઓફિસનો સંપર્ક કરો.',
    currentlyInsideSeat: (seat: string) => `હાલમાં લાઇબ્રેરીમાં — સીટ ${seat}`,
    currentlyOutside: 'હાલમાં લાઇબ્રેરીની બહાર',
    sitAtSeat: (seat: string) => `તમારી સીટ: ${seat}`,
    assignedSeatOnEntry: (seat: string) => `એન્ટ્રી પર ફાળવેલ સીટ: ${seat}`,
    checkedInAt: 'ચેક-ઇન સમય (In Time)',
    lastStatus: 'છેલ્લું સ્ટેટસ',
    liveRunningDuration: 'ચાલુ અભ્યાસ સમય',
    totalHoursStudied: 'કુલ અભ્યાસ કલાકો',
    liveWalletBalance: 'લાઇવ વોલેટ બેલેન્સ',
    studyHoursLeft: 'બાકી અભ્યાસ કલાકો',
    scanToCheckIn: (seat: string) =>
      `ચેક-ઇન કરવા ગેટ QR અને ફેસ ID સ્કેન કરો (સીટ ${seat})`,
    markExitBtn: 'એક્ઝિટ માર્ક કરો · ગેટ QR અને ફેસ ID સ્કેન',
    attendanceHistoryHeading:
      'મારી સંપૂર્ણ એન્ટ્રી / એક્ઝિટ હિસ્ટ્રી (ચેક-ઇન · ચેક-આઉટ · સીટ · સમય · વોલેટ બેલેન્સ)',
    walletReceiptsHeading: 'મારા વોલેટ રિચાર્જ અને ડિજિટલ રસીદો',
  },
};
