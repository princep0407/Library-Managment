import React, { useState } from 'react';
import { X, Lock, Unlock, Wrench, Plus } from 'lucide-react';
import { Locker, LockerStatus, Member } from '../types';

interface LockerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lockers: Locker[];
  members: Member[];
  onAssignLocker: (lockerId: string, memberId: string) => void;
  onReleaseLocker: (lockerId: string) => void;
  onToggleMaintenance: (lockerId: string, note?: string) => void;
  onAddLocker: (monthlyRent: number) => void;
}

export const LockerDialog: React.FC<LockerDialogProps> = ({
  isOpen,
  onClose,
  lockers,
  members,
  onAssignLocker,
  onReleaseLocker,
  onToggleMaintenance,
  onAddLocker,
}) => {
  const [filter, setFilter] = useState<'All' | LockerStatus>('All');
  const [selectedLockerId, setSelectedLockerId] = useState<string | null>(
    lockers[0]?.id || null
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [maintenanceNote, setMaintenanceNote] = useState<string>('');

  if (!isOpen) return null;

  const filteredLockers = lockers.filter((l) =>
    filter === 'All' ? true : l.status === filter
  );

  const activeLocker =
    lockers.find((l) => l.id === selectedLockerId) || filteredLockers[0] || null;

  const assignedMember = activeLocker?.memberId
    ? members.find((m) => m.id === activeLocker.memberId) || null
    : null;

  // Eligible members without a locker (or active/expired members)
  const eligibleMembers = members.filter(
    (m) =>
      (m.status === 'Active' || m.status === 'Expired') &&
      (!m.lockerId || m.lockerId === activeLocker?.id)
  );

  const occupiedCount = lockers.filter((l) => l.status === 'Occupied').length;
  const vacantCount = lockers.filter((l) => l.status === 'Vacant').length;
  const maintCount = lockers.filter((l) => l.status === 'Maintenance').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl shadow-xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Library Locker Bank & Assignment Console
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
              {occupiedCount} Occupied · {vacantCount} Vacant · {maintCount} Maintenance · ₹200/month standard rent
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddLocker(200)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Locker</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              aria-label="Close locker dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left: Locker Grid (7 cols) */}
          <div className="md:col-span-7 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['All', 'Vacant', 'Occupied', 'Maintenance'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilter(st)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      filter === st
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {filteredLockers.map((lck) => {
                const holder = lck.memberId
                  ? members.find((m) => m.id === lck.memberId)
                  : null;
                const isSelected = activeLocker?.id === lck.id;

                let statusColor = 'border-emerald-200 bg-emerald-50/50 text-emerald-900';
                if (lck.status === 'Occupied') {
                  statusColor = 'border-slate-300 bg-slate-100 text-slate-900';
                } else if (lck.status === 'Maintenance') {
                  statusColor = 'border-amber-300 bg-amber-50/60 text-amber-900';
                }

                return (
                  <button
                    key={lck.id}
                    onClick={() => {
                      setSelectedLockerId(lck.id);
                      setSelectedMemberId('');
                      setMaintenanceNote(lck.notes || '');
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between min-h-[76px] ${statusColor} ${
                      isSelected ? 'ring-2 ring-slate-900 ring-offset-1' : 'hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono tabular-nums text-xs font-bold">
                        {lck.code}
                      </span>
                      {lck.status === 'Occupied' ? (
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                      ) : lck.status === 'Maintenance' ? (
                        <Wrench className="w-3.5 h-3.5 text-amber-700" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </div>

                    <div className="mt-2">
                      {holder ? (
                        <p className="text-[11px] font-medium text-slate-800 truncate">
                          {holder.name.split(' ')[0]}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500">{lck.status}</p>
                      )}
                      <p className="text-[10px] font-mono tabular-nums text-slate-400">
                        {holder ? holder.id : `₹${lck.monthlyRent}/m`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Assignment Inspector (5 cols) */}
          <div className="md:col-span-5 p-5 bg-slate-50/60 flex flex-col justify-between space-y-4">
            {activeLocker ? (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-bold font-mono tabular-nums text-slate-900">
                      Locker {activeLocker.code}
                    </h4>
                    <span className="text-xs font-mono tabular-nums text-slate-600">
                      ₹{activeLocker.monthlyRent}/month
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Current State: <strong className="text-slate-800">{activeLocker.status}</strong>
                  </p>
                </div>

                {activeLocker.status === 'Occupied' && assignedMember ? (
                  <div className="space-y-3">
                    <div className="p-3.5 bg-white border border-slate-200 rounded-lg space-y-1.5">
                      <p className="text-xs text-slate-500">Assigned Member</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {assignedMember.name}
                      </p>
                      <p className="text-xs text-slate-600 font-mono tabular-nums">
                        {assignedMember.id} · Seat {assignedMember.seatId || 'None'} · +91{' '}
                        {assignedMember.phone}
                      </p>
                      <p className="text-xs text-slate-500 font-mono tabular-nums">
                        Membership Valid Until: {assignedMember.expiryDate}
                      </p>
                    </div>

                    <button
                      onClick={() => onReleaseLocker(activeLocker.id)}
                      className="w-full py-2 px-4 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      Vacate & Release Locker {activeLocker.code}
                    </button>
                  </div>
                ) : activeLocker.status === 'Vacant' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        Assign Locker {activeLocker.code} to Member
                      </label>
                      <select
                        value={selectedMemberId}
                        onChange={(e) => setSelectedMemberId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                      >
                        <option value="">-- Select Member without Locker --</option>
                        {eligibleMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.id}) — Seat {m.seatId || 'Unassigned'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      disabled={!selectedMemberId}
                      onClick={() => {
                        if (selectedMemberId) {
                          onAssignLocker(activeLocker.id, selectedMemberId);
                          setSelectedMemberId('');
                        }
                      }}
                      className="w-full py-2 px-4 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors"
                    >
                      Confirm Locker Assignment
                    </button>

                    <div className="pt-3 border-t border-slate-200 space-y-2">
                      <label className="block text-xs text-slate-600">
                        Or mark under lock/key maintenance:
                      </label>
                      <input
                        type="text"
                        placeholder="Reason (e.g. Duplicate key issue)"
                        value={maintenanceNote}
                        onChange={(e) => setMaintenanceNote(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                      <button
                        onClick={() =>
                          onToggleMaintenance(
                            activeLocker.id,
                            maintenanceNote || 'Key lock maintenance'
                          )
                        }
                        className="w-full py-1.5 px-3 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        Mark as Maintenance
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                      <p className="font-semibold">Under Maintenance</p>
                      <p className="mt-1 text-amber-800">
                        {activeLocker.notes || 'Key cylinder / hinge service pending'}
                      </p>
                    </div>
                    <button
                      onClick={() => onToggleMaintenance(activeLocker.id)}
                      className="w-full py-2 px-4 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Mark Repaired & Available (Vacant)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Select any locker from the grid to inspect.</p>
            )}

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
