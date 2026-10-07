import React, { useState, useMemo } from 'react';
import {
  Plus,
  Wind,
  Plug,
  ScanFace,
  Armchair,
  AlertTriangle,
} from 'lucide-react';
import { Member, Seat, SingleFloorRow, SeatStatus } from '../types';
import { AppLang, TRANSLATIONS } from '../utils/i18n';

interface SeatBoardSectionProps {
  lang?: AppLang;
  seats: Seat[];
  members: Member[];
  nextAutoSeat: Seat | null;
  onSelectSeatForAction: (seatId: string) => void;
  onOpenAddSeatModal: () => void;
  onOpenFaceScanForMember: (member: Member) => void;
  onSimulateOvercrowding?: () => void;
}

export const SeatBoardSection: React.FC<SeatBoardSectionProps> = ({
  lang = 'en',
  seats,
  members,
  nextAutoSeat,
  onSelectSeatForAction,
  onOpenAddSeatModal,
  onOpenFaceScanForMember,
  onSimulateOvercrowding,
}) => {
  const t = TRANSLATIONS[lang];
  const [rowFilter, setRowFilter] = useState<'All' | SingleFloorRow>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | SeatStatus>('All');
  const [quickEntryMemberId, setQuickEntryMemberId] = useState<string>('');

  const filteredSeats = useMemo(() => {
    return seats
      .filter((s) => {
        const matchRow = rowFilter === 'All' ? true : s.rowZone === rowFilter;
        const matchSt =
          statusFilter === 'All' ? true : s.status === statusFilter;
        return matchRow && matchSt;
      })
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }, [seats, rowFilter, statusFilter]);

  const outsideMembers = members.filter(
    (m) => m.status !== 'Left' && !seats.some((s) => s.memberId === m.id)
  );

  const occupiedCount = seats.filter((s) => s.status === 'Occupied').length;
  const vacantCount = seats.filter((s) => s.status === 'Vacant').length;
  const occupancyPct =
    seats.length > 0 ? Math.round((occupiedCount / seats.length) * 100) : 0;
  const isOver90Threshold =
    seats.length > 0 && (occupiedCount / seats.length) * 100 > 90;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Overcrowding >90% Threshold Banner inside Seat Board */}
      {isOver90Threshold && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 via-amber-50/90 to-rose-50 dark:from-rose-950/60 dark:via-amber-950/40 dark:to-rose-950/60 border-2 border-rose-400 dark:border-rose-700 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-scale-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                  {t.overcrowdingTitle}
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-rose-600 text-white rounded-md">
                  {occupancyPct}% (&gt;90%)
                </span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                {t.overcrowdingSubtitle(
                  occupancyPct,
                  occupiedCount,
                  seats.length,
                  vacantCount
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAddSeatModal}
            className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            {t.addExtraSeatBtn}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {lang === 'gu'
              ? 'સિંગલ-ફ્લોર સ્ટડી હોલ — ઓટો (1-by-1) અને મેન્યુઅલ સીટ બોર્ડ'
              : 'Single-Floor Study Hall — Auto (1-by-1) & Manual Seat Board'}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {lang === 'gu'
              ? `કુલ સીટ: ${seats.length} · ભરાયેલ: ${occupiedCount} (${occupancyPct}%) · ખાલી: ${vacantCount} · 90% ઓવરક્રાઉડિંગ એલર્ટ સક્રિય`
              : `Total Seats: ${seats.length} · Occupied: ${occupiedCount} (${occupancyPct}%) · Vacant: ${vacantCount} · 90% Overcrowding Threshold Active`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-mono tabular-nums text-indigo-950 dark:text-indigo-200">
            {t.nextAutoSeat}:{' '}
            <strong className="text-indigo-600 dark:text-indigo-400">
              {nextAutoSeat
                ? `${nextAutoSeat.code} (${nextAutoSeat.rowZone})`
                : lang === 'gu'
                ? 'હોલ હાઉસફુલ'
                : 'Hall Full'}
            </strong>
          </div>
          {onSimulateOvercrowding && !isOver90Threshold && (
            <button
              onClick={onSimulateOvercrowding}
              className="px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
            >
              {lang === 'gu'
                ? '⚡ >90% એલર્ટ ટેસ્ટ કરો'
                : '⚡ Test >90% Occupancy Alert'}
            </button>
          )}
          <button
            onClick={onOpenAddSeatModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t.addExtraSeatBtn}</span>
          </button>
        </div>
      </div>

      {/* Live Occupancy Meter with 90% Threshold Marker */}
      {seats.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {lang === 'gu'
                ? 'લાઇવ સીટ ઓક્યુપન્સી મીટર (90% ઓવરક્રાઉડિંગ થ્રેશોલ્ડ)'
                : 'Live Seat Occupancy Meter (90% Overcrowding Threshold)'}
            </span>
            <span
              className={`font-mono font-bold ${
                isOver90Threshold
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}
            >
              {occupancyPct}% ({occupiedCount}/{seats.length}{' '}
              {lang === 'gu' ? 'સીટ ભરાયેલ' : 'Seats Occupied'})
            </span>
          </div>
          <div className="relative h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isOver90Threshold
                  ? 'bg-rose-600'
                  : occupancyPct >= 75
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, occupancyPct)}%` }}
            />
            <div
              title="90% Overcrowding Threshold"
              className="absolute top-0 bottom-0 w-0.5 bg-rose-600 dark:bg-rose-400"
              style={{ left: '90%' }}
            />
          </div>
        </div>
      )}

      {/* Quick Auto 1-by-1 Entry Bar + Single-Floor Row Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs">
            <Armchair className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {lang === 'gu'
                ? 'ઝડપી ગેટ ચેક-ઇન (1-by-1 ઓટો સીટ ફાળવણી):'
                : 'Quick Gate Check-In (1-by-1 Auto Seat Assignment):'}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              {lang === 'gu'
                ? 'સભ્ય પસંદ કરો અને ફેસ સ્કેનથી ઓટો સીટ ફાળવો'
                : 'Select arriving member to scan Face ID & auto-assign'}{' '}
              <strong className="font-mono text-indigo-600 dark:text-indigo-400">
                {nextAutoSeat?.code || 'next seat'}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={quickEntryMemberId}
              onChange={(e) => setQuickEntryMemberId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="">
                {lang === 'gu'
                  ? '-- આવનાર સભ્ય પસંદ કરો --'
                  : '-- Select Arriving Member --'}
              </option>
              {outsideMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id}) · {m.totalHoursUsed.toFixed(1)}h · Bal: ₹
                  {m.walletBalance}
                </option>
              ))}
            </select>
            <button
              disabled={!quickEntryMemberId}
              onClick={() => {
                const m = members.find((x) => x.id === quickEntryMemberId);
                if (m) {
                  onOpenFaceScanForMember(m);
                  setQuickEntryMemberId('');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-40 transition-colors whitespace-nowrap cursor-pointer"
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>
                {lang === 'gu'
                  ? `ફેસ ID એન્ટ્રી → ${nextAutoSeat?.code || ''}`
                  : `Face ID Entry → Auto Assign ${nextAutoSeat?.code || ''}`}
              </span>
            </button>
          </div>
        </div>

        {/* Single-Floor Row Filter & Status Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto max-w-full">
            {(
              [
                'All',
                'Row A (AC Prime)',
                'Row B (AC Standard)',
                'Row C (Silent Zone)',
                'Row D (Cabin Desk)',
              ] as const
            ).map((r) => (
              <button
                key={r}
                onClick={() => setRowFilter(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  rowFilter === r
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {r === 'All'
                  ? lang === 'gu'
                    ? `સંપૂર્ણ ફ્લોર (${seats.length})`
                    : `Entire Single Floor (${seats.length})`
                  : r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {(['All', 'Vacant', 'Occupied', 'Reserved'] as const).map((st) => {
              const cnt =
                st === 'All'
                  ? seats.length
                  : seats.filter((s) => s.status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st} ({cnt})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seat Grid */}
      {filteredSeats.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-3">
          <Armchair className="w-8 h-8 text-indigo-500 mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {lang === 'gu'
              ? 'હજુ સુધી કોઈ સીટ ઉમેરવામાં આવી નથી'
              : 'No Seats Configured Yet'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {lang === 'gu'
              ? 'ઓટોમેટિક અથવા મેન્યુઅલ સીટ ફાળવણી માટે "+ નવી સીટ ઉમેરો" પર ક્લિક કરો.'
              : 'Click "+ Add Floor Seat" to create single-floor study seats (S-01, S-02...) for automatic or manual assignment.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={onOpenAddSeatModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addExtraSeatBtn}</span>
            </button>
            {onSimulateOvercrowding && (
              <button
                onClick={onSimulateOvercrowding}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                <span>
                  {lang === 'gu'
                    ? '⚡ 10 સીટ બનાવી >90% ઓવરક્રાઉડિંગ એલર્ટ ટેસ્ટ કરો'
                    : '⚡ Create 10 Seats & Test >90% Overcrowding Alert'}
                </span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {filteredSeats.map((seat) => {
            const occupant = seat.memberId
              ? members.find((m) => m.id === seat.memberId)
              : null;
            const isNextAuto = nextAutoSeat?.id === seat.id;

            let cardStyle =
              'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-800 hover:border-emerald-500';
            let stateText = isNextAuto
              ? 'Vacant · Next Auto #1'
              : 'Vacant · Available';
            let stateColor = isNextAuto
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-emerald-600 dark:text-emerald-400';

            if (seat.status === 'Occupied') {
              cardStyle =
                'bg-indigo-600 dark:bg-indigo-950/90 text-white border-indigo-600 dark:border-indigo-700 hover:bg-indigo-700 shadow-xs';
              stateText = occupant ? occupant.name : 'Occupied';
              stateColor = 'text-amber-200';
            } else if (seat.status === 'Reserved') {
              cardStyle =
                'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 hover:border-amber-500';
              stateText = seat.reservedFor
                ? `Hold: ${seat.reservedFor.name}`
                : 'Reserved';
              stateColor = 'text-amber-800 dark:text-amber-300';
            } else if (isNextAuto) {
              cardStyle =
                'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-400 ring-2 ring-indigo-500/30';
            }

            return (
              <button
                key={seat.id}
                onClick={() => onSelectSeatForAction(seat.id)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[120px] cursor-pointer hover:-translate-y-0.5 ${cardStyle}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono tabular-nums text-sm font-bold">
                    {seat.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {seat.hasAC && (
                      <span
                        title="Air Conditioned"
                        className={
                          seat.status === 'Occupied'
                            ? 'text-sky-200'
                            : 'text-sky-600 dark:text-sky-400'
                        }
                      >
                        <Wind className="w-3.5 h-3.5" />
                      </span>
                    )}
                    {seat.hasSocket && (
                      <span
                        title="Power Socket"
                        className={
                          seat.status === 'Occupied'
                            ? 'text-amber-200'
                            : 'text-slate-500 dark:text-slate-400'
                        }
                      >
                        <Plug className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="my-2">
                  <p className={`text-xs font-semibold truncate ${stateColor}`}>
                    {stateText}
                  </p>
                  <p
                    className={`text-[11px] font-mono tabular-nums mt-0.5 ${
                      seat.status === 'Occupied'
                        ? 'text-indigo-100'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {occupant
                      ? `${occupant.id} · Bal ₹${occupant.walletBalance}`
                      : seat.status === 'Reserved' && seat.reservedFor
                      ? `Till ${seat.reservedFor.until}`
                      : seat.rowZone}
                  </p>
                </div>

                <div
                  className={`pt-2 border-t flex items-center justify-between text-[10px] font-mono tabular-nums ${
                    seat.status === 'Occupied'
                      ? 'border-indigo-500/60 text-indigo-100'
                      : 'border-slate-200/70 dark:border-slate-800 text-slate-500'
                  }`}
                >
                  <span>
                    {seat.status === 'Occupied'
                      ? seat.assignmentType || 'Auto-Entry'
                      : `Seq #${seat.sequenceOrder}`}
                  </span>
                  <span>{lang === 'gu' ? 'મેનેજ' : 'Manage'}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
