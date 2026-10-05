import React, { useState, useMemo } from 'react';
import { Plus, Wind, Plug, ScanFace, Armchair } from 'lucide-react';
import { Member, Seat, SingleFloorRow, SeatStatus } from '../types';

interface SeatBoardSectionProps {
  seats: Seat[];
  members: Member[];
  nextAutoSeat: Seat | null;
  onSelectSeatForAction: (seatId: string) => void;
  onOpenAddSeatModal: () => void;
  onOpenFaceScanForMember: (member: Member) => void;
}

export const SeatBoardSection: React.FC<SeatBoardSectionProps> = ({
  seats,
  members,
  nextAutoSeat,
  onSelectSeatForAction,
  onOpenAddSeatModal,
  onOpenFaceScanForMember,
}) => {
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Single-Floor Study Hall — Auto (1-by-1) & Manual Seat Board
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Apni library ek hi floor pe hai (S-01 to S-{seats.length}) · Entry par sequential vacant seat automatic assign hoti hai, ya kisi bhi seat card pe tap karke manual assign karein
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-mono tabular-nums text-indigo-950">
            Next Auto-Assign Queue:{' '}
            <strong className="text-indigo-700">
              {nextAutoSeat
                ? `${nextAutoSeat.code} (${nextAutoSeat.rowZone})`
                : 'Hall Full'}
            </strong>
          </div>
          <button
            onClick={onOpenAddSeatModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Seat on Floor</span>
          </button>
        </div>
      </div>

      {/* Quick Auto 1-by-1 Entry Bar + Single-Floor Row Filters */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 space-y-4">
        {/* Auto 1-by-1 Quick Entry Trigger */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-stone-200/80">
          <div className="flex items-center gap-2 text-xs">
            <Armchair className="w-4 h-4 text-indigo-700" />
            <span className="font-semibold text-stone-900">
              Test 1-by-1 Auto Seat Assignment on Entry:
            </span>
            <span className="text-stone-500">
              Select a member arriving at the gate to scan Face ID & auto-assign{' '}
              <strong className="font-mono text-indigo-700">
                {nextAutoSeat?.code || 'next seat'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={quickEntryMemberId}
              onChange={(e) => setQuickEntryMemberId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg"
            >
              <option value="">-- Select Arriving Member --</option>
              {outsideMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.id}) · Bal: ₹{m.walletBalance}
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              <ScanFace className="w-3.5 h-3.5" />
              <span>Face ID Entry → Auto Assign {nextAutoSeat?.code}</span>
            </button>
          </div>
        </div>

        {/* Single-Floor Row Filter & Status Filter */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg overflow-x-auto">
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
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  rowFilter === r
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {r === 'All' ? `Entire Single Floor (${seats.length})` : r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
            {(['All', 'Vacant', 'Occupied', 'Reserved'] as const).map((st) => {
              const cnt =
                st === 'All'
                  ? seats.length
                  : seats.filter((s) => s.status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        {filteredSeats.map((seat) => {
          const occupant = seat.memberId
            ? members.find((m) => m.id === seat.memberId)
            : null;
          const isNextAuto = nextAutoSeat?.id === seat.id;

          let cardStyle =
            'bg-white border-emerald-300 hover:border-emerald-500';
          let stateText = isNextAuto
            ? 'Vacant · Next Auto #1'
            : 'Vacant · Available';
          let stateColor = isNextAuto ? 'text-indigo-700' : 'text-emerald-700';

          if (seat.status === 'Occupied') {
            cardStyle =
              'bg-stone-900 text-white border-stone-900 hover:bg-stone-800';
            stateText = occupant ? occupant.name : 'Occupied';
            stateColor = 'text-amber-300';
          } else if (seat.status === 'Reserved') {
            cardStyle =
              'bg-amber-50/80 border-amber-300 hover:border-amber-500';
            stateText = seat.reservedFor
              ? `Hold: ${seat.reservedFor.name}`
              : 'Reserved';
            stateColor = 'text-amber-900';
          } else if (isNextAuto) {
            cardStyle =
              'bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-600/30 hover:border-indigo-600';
          }

          return (
            <button
              key={seat.id}
              onClick={() => onSelectSeatForAction(seat.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[120px] ${cardStyle}`}
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
                          ? 'text-sky-300'
                          : 'text-sky-600'
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
                          ? 'text-amber-300'
                          : 'text-stone-500'
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
                      ? 'text-stone-300'
                      : 'text-stone-500'
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
                    ? 'border-stone-800 text-stone-400'
                    : 'border-stone-200/70 text-stone-500'
                }`}
              >
                <span>
                  {seat.status === 'Occupied'
                    ? seat.assignmentType || 'Auto-Entry'
                    : `Seq #${seat.sequenceOrder}`}
                </span>
                <span>Tap to Manage</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
