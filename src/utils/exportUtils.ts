import { Member, FeePayment, Expense, AttendanceRecord } from '../types';
import { TODAY_STR } from '../data/initialData';

function escapeCsvCell(val: string | number | null | undefined): string {
  const s = val === null || val === undefined ? '' : String(val);
  return `"${s.replace(/"/g, '""')}"`;
}

function downloadCsvFile(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const csvLines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  const csvContent = '\uFEFF' + csvLines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportMembersToCsv(members: Member[]) {
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
    'Seat Mode',
    'Locker Code',
    'Face ID Template',
    'Status',
    'Join Date',
    'Expiry Date',
    'Address',
  ];

  const rows = members.map((m) => [
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
    m.seatId || 'Auto on Entry',
    m.seatAssignmentMode,
    m.lockerId || 'None',
    m.faceTemplateId,
    m.status,
    m.joinDate,
    m.expiryDate,
    m.address,
  ]);

  downloadCsvFile(`vidyakosh_members_${TODAY_STR}.csv`, headers, rows);
}

export function exportFinanceToCsv(payments: FeePayment[], expenses: Expense[]) {
  const headers = [
    'Entry Type',
    'Reference ID',
    'Date',
    'Party / Member Name',
    'Category / Plan',
    'Payment Mode',
    'Amount (INR)',
    'Wallet Balance After (INR)',
    'Remarks',
  ];

  const paymentRows = payments.map((p) => [
    'INCOME (Wallet Recharge)',
    p.id,
    p.date,
    `${p.memberName} (${p.memberId})`,
    `${p.plan} (${p.months}m)`,
    p.mode,
    p.totalPaid,
    p.walletBalanceAfter,
    p.remarks || '',
  ]);

  const expenseRows = expenses.map((e) => [
    'EXPENSE (Hall Cost)',
    e.id,
    e.date,
    e.vendor || 'Library Vendor',
    e.category,
    e.mode,
    -e.amount,
    '',
    e.title,
  ]);

  downloadCsvFile(
    `vidyakosh_financial_ledger_${TODAY_STR}.csv`,
    headers,
    [...paymentRows, ...expenseRows]
  );
}

export function exportAttendanceToCsv(attendance: AttendanceRecord[]) {
  const headers = [
    'Record ID',
    'Date',
    'Member ID',
    'Member Name',
    'Exam',
    'Seat Code',
    'Seat Assignment Mode',
    'Entry Time',
    'Exit Time',
    'Duration (Minutes)',
    'Duration (Hours)',
    'Hourly Rate (INR/hr)',
    'Fee Deducted (INR)',
    'Remaining Wallet Balance (INR)',
    'Face Match %',
    'Status',
  ];

  const rows = attendance.map((a) => [
    a.id,
    a.date,
    a.memberId,
    a.memberName,
    a.examPrep,
    a.seatCode || 'Auto',
    a.seatAssignMode,
    a.checkInDisplay,
    a.checkOutDisplay || 'Currently Inside',
    a.durationMinutes ?? '',
    a.durationMinutes ? (a.durationMinutes / 60).toFixed(2) : '',
    a.hourlyRateApplied,
    a.feeDeducted ?? 0,
    a.balanceAfterExit ?? '',
    a.faceMatchScore,
    a.status,
  ]);

  downloadCsvFile(`vidyakosh_attendance_logs_${TODAY_STR}.csv`, headers, rows);
}

/**
 * Populates a temporary printable #printable-area container and invokes window.print()
 * so users can Save as PDF cleanly in the sandboxed environment without window.open.
 */
export function triggerPrintPdfReport(title: string, subtitle: string, tableHeaders: string[], tableRows: string[][]) {
  const existing = document.getElementById('printable-area');
  if (existing) {
    existing.removeAttribute('id');
  }

  const container = document.createElement('div');
  container.id = 'printable-area';
  container.className = 'hidden print:block bg-white text-slate-900 p-6';

  const headerHtml = `
    <div style="border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <h1 style="font-size: 18px; font-weight: 700; margin: 0;">VidyaKosh — Single-Floor Study Hall</h1>
        <p style="font-size: 13px; font-weight: 600; margin: 4px 0 0 0; color: #334155;">${title}</p>
        <p style="font-size: 11px; margin: 2px 0 0 0; color: #64748b;">${subtitle}</p>
      </div>
      <div style="font-size: 11px; font-family: monospace; color: #475569;">
        Generated: ${TODAY_STR}
      </div>
    </div>
  `;

  const thCells = tableHeaders
    .map(
      (h) =>
        `<th style="border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; font-size: 10px; background: #f1f5f9; font-weight: 600;">${h}</th>`
    )
    .join('');

  const trRows = tableRows
    .map(
      (r) =>
        `<tr>${r
          .map(
            (c) =>
              `<td style="border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 10px; font-family: monospace;">${c}</td>`
          )
          .join('')}</tr>`
    )
    .join('');

  container.innerHTML = `
    ${headerHtml}
    <table style="width: 100%; border-collapse: collapse;">
      <thead><tr>${thCells}</tr></thead>
      <tbody>${trRows}</tbody>
    </table>
  `;

  document.body.appendChild(container);
  window.print();
  setTimeout(() => {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }, 800);
}
