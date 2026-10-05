import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ScanFace,
  CheckCircle2,
  Smartphone,
  Wallet,
  Armchair,
  Clock,
  LogOut,
} from 'lucide-react';
import { Member, Seat, AttendanceRecord } from '../types';
import { QrCodeSvg } from './QrCodeSvg';

interface FaceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  activeSession: AttendanceRecord | null;
  nextAutoSeat: Seat | null;
  vacantSeats: Seat[];
  onConfirmEntryAfterFaceScan: (payload: {
    memberId: string;
    seatId: string | null;
    assignMode: 'Auto (1-by-1)' | 'Manual';
    faceScore: number;
  }) => void;
  onConfirmExitAfterFaceScan: (payload: {
    memberId: string;
    overrideDurationMinutes?: number;
    faceScore: number;
  }) => void;
}

export const FaceScannerModal: React.FC<FaceScannerModalProps> = ({
  isOpen,
  onClose,
  member,
  activeSession,
  nextAutoSeat,
  vacantSeats,
  onConfirmEntryAfterFaceScan,
  onConfirmExitAfterFaceScan,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanStage, setScanStage] = useState<
    'qr-scanned' | 'scanning-face' | 'verified' | 'entry-live-summary'
  >('qr-scanned');
  const [scanProgress, setScanProgress] = useState(0);
  const [seatMode, setSeatMode] = useState<'Auto' | 'Manual'>('Auto');
  const [manualSeatId, setManualSeatId] = useState<string>('');
  const [simulatedDurationMins, setSimulatedDurationMins] =
    useState<number>(180);
  const [liveSeconds, setLiveSeconds] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !member) return;
    setScanStage('qr-scanned');
    setScanProgress(0);
    setLiveSeconds(0);
    setSeatMode(
      member.seatAssignmentMode === 'Manual' && member.seatId
        ? 'Manual'
        : 'Auto'
    );
    setManualSeatId(member.seatId || nextAutoSeat?.id || '');

    if (activeSession) {
      const elapsed = Math.max(
        60,
        Math.round((Date.now() - activeSession.checkInTimestamp) / 60000)
      );
      setSimulatedDurationMins(elapsed);
    }

    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((s) => {
          stream = s;
          setCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(() => {
          setCameraActive(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      setCameraActive(false);
    };
  }, [isOpen, member, activeSession, nextAutoSeat]);

  useEffect(() => {
    if (scanStage !== 'scanning-face') return;
    setScanProgress(15);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanStage('verified');
          return 100;
        }
        return prev + 22;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [scanStage]);

  // Live ticking timer when showing student live dashboard
  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => {
      setLiveSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const isExitFlow = Boolean(activeSession);
  const chosenSeatId =
    seatMode === 'Auto'
      ? nextAutoSeat?.id || null
      : manualSeatId || nextAutoSeat?.id || null;

  const chosenSeatObj = vacantSeats.find((s) => s.id === chosenSeatId);
  const effectiveHourlyRate =
    member.hourlyRate + (chosenSeatObj?.hourlyRateAddon || 0);

  const exitHours = simulatedDurationMins / 60;
  const estimatedFeeDeduction = Math.max(
    5,
    Math.round(
      exitHours * (activeSession?.hourlyRateApplied || member.hourlyRate)
    )
  );
  const balanceAfterExit = Math.max(
    0,
    member.walletBalance - estimatedFeeDeduction
  );

  const faceScore =
    99.1 + ((member.id.charCodeAt(member.id.length - 1) % 8) / 10);

  const gateQrUrl = `${window.location.origin}/?gate=scan&memberId=${encodeURIComponent(
    member.id
  )}`;

  const handleCompleteAction = () => {
    if (isExitFlow) {
      onConfirmExitAfterFaceScan({
        memberId: member.id,
        overrideDurationMinutes: simulatedDurationMins,
        faceScore,
      });
      onClose();
    } else {
      onConfirmEntryAfterFaceScan({
        memberId: member.id,
        seatId: chosenSeatId,
        assignMode: seatMode === 'Auto' ? 'Auto (1-by-1)' : 'Manual',
        faceScore,
      });
      // Show the student's live entry dashboard with hours & balance!
      setScanStage('entry-live-summary');
    }
  };

  const remainingHoursAvailable = (
    member.walletBalance / effectiveHourlyRate
  ).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-slate-100">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 dark:bg-slate-950 text-white">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold">
                {scanStage === 'entry-live-summary'
                  ? 'Student Entry Confirmed — Live Hours & Balance View'
                  : isExitFlow
                  ? 'Phone QR + Face ID Exit & Balance Deduction'
                  : 'Phone QR + Face ID Entry & Live Balance Check'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                {member.name} ({member.id}) · Face ID: {member.faceTemplateId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post-Entry Student Screen: Shows exact Hours & Wallet Balance */}
        {scanStage === 'entry-live-summary' ? (
          <div className="p-6 space-y-5">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    Welcome, {member.name}! Your Study Timer Has Started
                  </p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-mono tabular-nums">
                    Assigned Single-Floor Seat:{' '}
                    <strong>{chosenSeatId || 'S-01'}</strong> ({seatMode})
                  </p>
                </div>
              </div>
              <span className="text-sm font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-300">
                00:00:{String(liveSeconds % 60).padStart(2, '0')}
              </span>
            </div>

            {/* Member Hours & Balance Dashboard (What the member sees on entry!) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Total Hours Completed</span>
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums text-white">
                  {member.totalHoursUsed.toFixed(1)} hrs
                </p>
                <p className="text-[11px] font-mono tabular-nums text-emerald-400">
                  + Live Session Running
                </p>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Available Fee Balance</span>
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums text-emerald-400">
                  ₹{member.walletBalance.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-slate-400">
                  Rate: ₹{effectiveHourlyRate}/hr
                </p>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Armchair className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Study Hours Left in Balance</span>
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums text-amber-400">
                  {remainingHoursAvailable} hrs
                </p>
                <p className="text-[11px] font-mono tabular-nums text-slate-400">
                  Seat {chosenSeatId || 'S-01'} Active
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>
                Jab aap library se bahar jayenge, phone se firse QR + Face ID scan karke Exit mark karein.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 ml-3"
              >
                Done · Go to Desk
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-4">
            {/* ALWAYS VISIBLE: Member's Current Hours Completed & Wallet Balance Banner */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-900 dark:bg-slate-950 text-white rounded-xl border border-slate-800 font-mono tabular-nums">
              <div>
                <p className="text-[10px] font-sans text-slate-400">
                  Your Completed Hours
                </p>
                <p className="text-base font-bold text-white mt-0.5">
                  {member.totalHoursUsed.toFixed(1)} hrs
                </p>
              </div>
              <div className="border-x border-slate-800 px-2.5">
                <p className="text-[10px] font-sans text-slate-400">
                  Your Wallet Balance
                </p>
                <p className="text-base font-bold text-emerald-400 mt-0.5">
                  ₹{member.walletBalance.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="pl-1">
                <p className="text-[10px] font-sans text-slate-400">
                  Hours Remaining (₹{effectiveHourlyRate}/hr)
                </p>
                <p className="text-base font-bold text-amber-400 mt-0.5">
                  {remainingHoursAvailable} hrs left
                </p>
              </div>
            </div>

            {/* Step 1: Common Gate QR Scanned */}
            <div className="flex items-center justify-between p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1 bg-white border border-indigo-200 rounded">
                  <QrCodeSvg value={gateQrUrl} size={36} />
                </div>
                <div>
                  <p className="font-semibold text-indigo-950 dark:text-indigo-200">
                    Step 1: Common Library Gate QR Scanned
                  </p>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-mono tabular-nums">
                    {isExitFlow
                      ? `Active on Seat ${activeSession?.seatCode} since ${activeSession?.checkInDisplay}`
                      : `Ready for Face ID Entry Scan`}
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            </div>

            {/* Step 2: Live Face ID Biometric Viewport */}
            <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 h-52 flex flex-col items-center justify-center">
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover opacity-85"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950/60 to-slate-950 flex flex-col items-center justify-center">
                  <ScanFace
                    className={`w-16 h-16 ${
                      scanStage === 'verified'
                        ? 'text-emerald-400'
                        : scanStage === 'scanning-face'
                        ? 'text-amber-400 animate-pulse'
                        : 'text-indigo-400'
                    }`}
                  />
                </div>
              )}

              <div
                className={`relative z-10 w-40 h-36 rounded-2xl border-2 transition-colors flex flex-col items-center justify-between p-3 ${
                  scanStage === 'verified'
                    ? 'border-emerald-400 bg-emerald-950/20'
                    : scanStage === 'scanning-face'
                    ? 'border-amber-400 bg-amber-950/10'
                    : 'border-indigo-400/70'
                }`}
              >
                <div className="w-full flex justify-between text-[10px] font-mono tabular-nums text-white/90">
                  <span>FACE-ID</span>
                  <span>{member.id}</span>
                </div>

                {scanStage === 'scanning-face' && (
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full transition-all duration-150"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                )}

                <div className="text-[11px] font-mono tabular-nums font-semibold text-center">
                  {scanStage === 'qr-scanned' && (
                    <span className="text-indigo-200">
                      Click "Start Face ID Scan"
                    </span>
                  )}
                  {scanStage === 'scanning-face' && (
                    <span className="text-amber-300">
                      Scanning Face... {scanProgress}%
                    </span>
                  )}
                  {scanStage === 'verified' && (
                    <span className="text-emerald-300">
                      Match {faceScore.toFixed(1)}% Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Entry Seat Assignment OR Exit Hourly Balance Calculation */}
            {!isExitFlow ? (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Armchair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Single-Floor Seat Assignment</span>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-slate-200 dark:bg-slate-700 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setSeatMode('Auto')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        seatMode === 'Auto'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Auto (1-by-1)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeatMode('Manual')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                        seatMode === 'Manual'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Manual Pick
                    </button>
                  </div>
                </div>

                {seatMode === 'Auto' ? (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-mono tabular-nums">
                    <span className="text-slate-600 dark:text-slate-400">
                      Next Sequential Vacant Seat:
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {nextAutoSeat
                        ? `${nextAutoSeat.code} (${nextAutoSeat.rowZone})`
                        : 'No Vacant Seat'}
                    </span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <select
                      value={manualSeatId}
                      onChange={(e) => setManualSeatId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums"
                    >
                      {vacantSeats.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} — {s.rowZone} {s.hasAC ? '(AC)' : '(Non-AC)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    Session Duration (for Hourly Fee Cut):
                  </span>
                  <div className="flex items-center gap-1 font-mono tabular-nums">
                    {[
                      { label: '1h', mins: 60 },
                      { label: '2h', mins: 120 },
                      { label: '3h', mins: 180 },
                      { label: '5h', mins: 300 },
                      { label: '8h', mins: 480 },
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset.mins}
                        onClick={() => setSimulatedDurationMins(preset.mins)}
                        className={`px-2 py-1 rounded border text-[11px] ${
                          simulatedDurationMins === preset.mins
                            ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-900'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200 dark:border-amber-800 font-mono tabular-nums">
                  <div>
                    <p className="text-[11px] text-slate-500">Session Hours</p>
                    <p className="text-sm font-bold">
                      {Math.floor(simulatedDurationMins / 60)}h{' '}
                      {simulatedDurationMins % 60}m
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500">
                      Fee Cut (₹
                      {activeSession?.hourlyRateApplied || member.hourlyRate}/hr)
                    </p>
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                      -₹{estimatedFeeDeduction}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">New Balance</p>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      ₹{balanceAfterExit.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Footer */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Cancel
              </button>

              {scanStage !== 'verified' ? (
                <button
                  type="button"
                  disabled={scanStage === 'scanning-face'}
                  onClick={() => setScanStage('scanning-face')}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <ScanFace className="w-4 h-4" />
                  <span>
                    {scanStage === 'scanning-face'
                      ? 'Verifying Face ID...'
                      : 'Start Face ID Biometric Scan'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteAction}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  {isExitFlow ? (
                    <>
                      <LogOut className="w-4 h-4" />
                      <span>
                        Confirm Exit & Cut ₹{estimatedFeeDeduction} from Balance
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Confirm Entry & View My Hours / Balance
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
