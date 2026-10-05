import React, { useEffect, useRef, useState } from 'react';
import { FeePayment, Expense, Seat } from '../types';

interface MonthlyChartProps {
  payments: FeePayment[];
  expenses: Expense[];
}

interface MonthBucket {
  key: string;
  label: string;
  income: number;
  expense: number;
  profit: number;
}

const SIX_MONTHS = [
  { key: '2026-05', label: 'May' },
  { key: '2026-06', label: 'Jun' },
  { key: '2026-07', label: 'Jul' },
  { key: '2026-08', label: 'Aug' },
  { key: '2026-09', label: 'Sep' },
  { key: '2026-10', label: 'Oct' },
];

export const MonthlyIncomeExpenseChart: React.FC<MonthlyChartProps> = ({
  payments,
  expenses,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(5);

  const buckets: MonthBucket[] = SIX_MONTHS.map((m) => {
    const income = payments
      .filter((p) => p.date.startsWith(m.key))
      .reduce((acc, p) => acc + p.totalPaid, 0);
    const expense = expenses
      .filter((e) => e.date.startsWith(m.key))
      .reduce((acc, e) => acc + e.amount, 0);
    return {
      key: m.key,
      label: m.label,
      income,
      expense,
      profit: income - expense,
    };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth || 540;
    const height = 220;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const padLeft = 52;
    const padRight = 16;
    const padTop = 18;
    const padBottom = 34;

    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const maxVal = Math.max(
      12000,
      ...buckets.map((b) => Math.max(b.income, b.expense))
    );
    const niceMax = Math.ceil(maxVal / 4000) * 4000;

    const steps = 4;
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= steps; i++) {
      const val = (niceMax / steps) * i;
      const y = padTop + chartH - (val / niceMax) * chartH;

      ctx.strokeStyle = i === 0 ? '#d6d3d1' : '#f5f5f4';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(width - padRight, y);
      ctx.stroke();

      ctx.fillStyle = '#57534e';
      const label = val === 0 ? '₹0' : `₹${(val / 1000).toFixed(0)}k`;
      ctx.fillText(label, padLeft - 8, y);
    }

    const groupW = chartW / buckets.length;
    const barW = Math.min(20, Math.max(12, groupW * 0.26));
    const gap = 5;

    buckets.forEach((b, idx) => {
      const centerX = padLeft + idx * groupW + groupW / 2;

      if (hoveredIdx === idx) {
        ctx.fillStyle = 'rgba(238, 242, 255, 0.7)';
        ctx.fillRect(
          padLeft + idx * groupW + 4,
          padTop,
          groupW - 8,
          chartH
        );
      }

      // Income bar (Indigo #4338ca)
      const incH = Math.max(3, (b.income / niceMax) * chartH);
      const incX = centerX - barW - gap / 2;
      const incY = padTop + chartH - incH;

      ctx.fillStyle = hoveredIdx === idx ? '#3730a3' : '#4f46e5';
      ctx.beginPath();
      ctx.roundRect(incX, incY, barW, incH, [4, 4, 0, 0]);
      ctx.fill();

      // Expense bar (Amber/Orange #d97706)
      const expH = Math.max(3, (b.expense / niceMax) * chartH);
      const expX = centerX + gap / 2;
      const expY = padTop + chartH - expH;

      ctx.fillStyle = hoveredIdx === idx ? '#b45309' : '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(expX, expY, barW, expH, [4, 4, 0, 0]);
      ctx.fill();

      // Month label
      ctx.fillStyle = hoveredIdx === idx ? '#1e1b4b' : '#57534e';
      ctx.font =
        hoveredIdx === idx
          ? '600 12px "Plus Jakarta Sans", sans-serif'
          : '500 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(b.label, centerX, padTop + chartH + 10);
    });
  }, [buckets, hoveredIdx]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padLeft = 52;
    const padRight = 16;
    const chartW = rect.width - padLeft - padRight;
    if (x < padLeft || x > rect.width - padRight) {
      return;
    }
    const idx = Math.min(
      buckets.length - 1,
      Math.max(0, Math.floor(((x - padLeft) / chartW) * buckets.length))
    );
    setHoveredIdx(idx);
  };

  const activeBucket = buckets[hoveredIdx ?? buckets.length - 1];

  return (
    <div className="flex flex-col h-full justify-between">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-stone-200/80">
        <div className="flex items-center gap-4 text-xs text-stone-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
            <span>Wallet Recharges</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
            <span>Hall Expenses</span>
          </span>
        </div>

        {activeBucket && (
          <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-stone-700">
            <span className="font-semibold text-stone-900">{activeBucket.label} 2026:</span>
            <span className="text-indigo-700 font-medium">+₹{activeBucket.income.toLocaleString('en-IN')}</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-700 font-medium">-₹{activeBucket.expense.toLocaleString('en-IN')}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-emerald-700">
              Net ₹{activeBucket.profit.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          className="w-full h-[220px] block cursor-crosshair"
        />
      </div>
    </div>
  );
};

interface DonutChartProps {
  seats: Seat[];
}

export const LiveSeatOccupancyDonut: React.FC<DonutChartProps> = ({ seats }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const occupied = seats.filter((s) => s.status === 'Occupied').length;
  const reserved = seats.filter((s) => s.status === 'Reserved').length;
  const vacant = seats.filter((s) => s.status === 'Vacant').length;
  const total = Math.max(1, seats.length);
  const occupancyPct = Math.round((occupied / total) * 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 168;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const radius = 64;
    const thickness = 18;

    const segments = [
      { count: occupied, color: '#3730a3' }, // Occupied: Deep Indigo
      { count: reserved, color: '#d97706' }, // Reserved: Amber
      { count: vacant, color: '#16a34a' }, // Vacant: Emerald
    ];

    let startAngle = -Math.PI / 2;
    segments.forEach((seg) => {
      if (seg.count <= 0) return;
      const sliceAngle = (seg.count / total) * (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.strokeStyle = seg.color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'butt';
      ctx.stroke();
      startAngle += sliceAngle;
    });

    startAngle = -Math.PI / 2;
    segments.forEach((seg) => {
      if (seg.count <= 0) return;
      const sliceAngle = (seg.count / total) * (Math.PI * 2);
      const x1 = cx + (radius - thickness / 2 - 1) * Math.cos(startAngle);
      const y1 = cy + (radius - thickness / 2 - 1) * Math.sin(startAngle);
      const x2 = cx + (radius + thickness / 2 + 1) * Math.cos(startAngle);
      const y2 = cy + (radius + thickness / 2 + 1) * Math.sin(startAngle);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      startAngle += sliceAngle;
    });
  }, [occupied, reserved, vacant, total]);

  const rows = [
    'Row A (AC Prime)',
    'Row B (AC Standard)',
    'Row C (Silent Zone)',
    'Row D (Cabin Desk)',
  ] as const;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 h-full">
      <div className="relative w-[168px] h-[168px] shrink-0 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-[168px] h-[168px] block" />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold font-mono tabular-nums text-stone-900">
            {occupancyPct}%
          </span>
          <span className="text-[11px] text-stone-500">Single Floor</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-3">
        <div className="grid grid-cols-3 gap-2 pb-3 border-b border-stone-200/80 text-xs">
          <div>
            <div className="flex items-center gap-1.5 text-stone-500">
              <span className="w-2 h-2 rounded-xs bg-indigo-800" />
              <span>Occupied</span>
            </div>
            <p className="font-mono tabular-nums font-semibold text-sm text-stone-900 mt-0.5">
              {occupied} <span className="text-xs font-normal text-stone-400">/ {total}</span>
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-stone-500">
              <span className="w-2 h-2 rounded-xs bg-emerald-600" />
              <span>Vacant</span>
            </div>
            <p className="font-mono tabular-nums font-semibold text-sm text-emerald-700 mt-0.5">
              {vacant}
            </p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-stone-500">
              <span className="w-2 h-2 rounded-xs bg-amber-600" />
              <span>Reserved</span>
            </div>
            <p className="font-mono tabular-nums font-semibold text-sm text-amber-700 mt-0.5">
              {reserved}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          {rows.map((r) => {
            const rowSeats = seats.filter((s) => s.rowZone === r);
            const rowOcc = rowSeats.filter((s) => s.status === 'Occupied').length;
            const rowTotal = rowSeats.length;
            const pct = rowTotal > 0 ? Math.round((rowOcc / rowTotal) * 100) : 0;
            return (
              <div key={r} className="flex items-center justify-between text-xs">
                <span className="text-stone-600">{r}</span>
                <div className="flex items-center gap-2 font-mono tabular-nums">
                  <span className="text-stone-900 font-medium">
                    {rowOcc}/{rowTotal}
                  </span>
                  <span className="text-stone-400 w-9 text-right">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
