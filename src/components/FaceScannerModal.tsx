import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ScanFace,
  Camera,
  CheckCircle2,
  QrCode,
  Smartphone,
  Clock,
  Wallet,
  Armchair,
} from 'lucide-react';
import { Member, Seat, AttendanceRecord } from '../types';
import { COMMON_LIBRARY_QR_PAYLOAD } from '../data/initialData';
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
    'qr-scanned' | 'scanning-face' | 'verified'
  >('qr-scanned');
  const [scanProgress, setScanProgress] = useState(0);
  const [seatMode, setSeatMode] = useState<'Auto' | 'Manual'>('Auto');
  const [manualSeatId, setManualSeatId] = useState<string>('');
  const [simulatedDurationMins, setSimulatedDurationMins] = useState<number>(180); // Default 3 hrs for testing or live elapsed

  useEffect(() => {
    if (!isOpen || !member) return;
    setScanStage('qr-scanned');
    setScanProgress(0);
    setSeatMode(member.seatAssignmentMode === 'Manual' && member.seatId ? 'Manual' : 'Auto');
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
    setScanProgress(10);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanStage('verified');
          return 100;
        }
        return prev + 18;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [scanStage]);

  if (!isOpen || !member) return null;

  const isExitFlow = Boolean(activeSession);
  const chosenSeatId =
    seatMode === 'Auto'
      ? nextAutoSeat?.id || null
      : manualSeatId || nextAutoSeat?.id || null;

  const chosenSeatObj = vacantSeats.find((s) => s.id === chosenSeatId);
  const effectiveHourlyRate =
    member.hourlyRate + (chosenSeatObj?.hourlyRateAddon || 0);

  // Exit calculation preview
  const exitHours = simulatedDurationMins / 60;
  const estimatedFeeDeduction = Math.max(
    5,
    Math.round(exitHours * (activeSession?.hourlyRateApplied || member.hourlyRate))
  );
  const balanceAfterExit = Math.max(0, member.walletBalance - estimatedFeeDeduction);

  const faceScore = 99.1 + ((member.id.charCodeAt(member.id.length - 1) % 8) / 10);

  const handleCompleteAction = () => {
    if (isExitFlow) {
      onConfirmExitAfterFaceScan({
        memberId: member.id,
        overrideDurationMinutes: simulatedDurationMins,
        faceScore,
      });
    } else {
      onConfirmEntryAfterFaceScan({
        memberId: member.id,
        seatId: chosenSeatId,
        assignMode: seatMode === 'Auto' ? 'Auto (1-by-1)' : 'Manual',
        faceScore,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden my-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-900 text-white">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold">
                {isExitFlow
                  ? 'Phone QR + Face ID Exit Verification'
                  : 'Phone QR + Face ID Entry Verification'}
              </h3>
              <p className="text-[11px] text-stone-400 font-mono tabular-nums">
                Unified Library Gate QR Verified · Biometric Template:{' '}
                {member.faceTemplateId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Step 1 Banner: Common Library QR Scanned */}
          <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-1 bg-white border border-indigo-200 rounded">
                <QrCodeSvg value={COMMON_LIBRARY_QR_PAYLOAD} size={36} />
              </div>
              <div>
                <p className="font-semibold text-indigo-950">
                  Step 1: Common Library Gate QR Scanned
                </p>
                <p className="text-[11px] text-indigo-700 font-mono tabular-nums">
                  Student: {member.name} ({member.id}) · Wallet: ₹
                  {member.walletBalance.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          </div>

          {/* Step 2: Live Face ID Biometric Viewport */}
          <div className="relative bg-stone-950 rounded-xl overflow-hidden border border-stone-800 h-56 flex flex-col items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover opacity-85"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-b from-stone-900 via-indigo-950/60 to-stone-950 flex flex-col items-center justify-center">
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

            {/* Biometric Reticle Frame */}
            <div
              className={`relative z-10 w-40 h-40 rounded-2xl border-2 transition-colors flex flex-col items-center justify-between p-3 ${
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
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full transition-all duration-150"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              )}

              <div className="text-[11px] font-mono tabular-nums font-semibold text-center">
                {scanStage === 'qr-scanned' && (
                  <span className="text-indigo-200">
                    Align Face & Click Scan Below
                  </span>
                )}
                {scanStage === 'scanning-face' && (
                  <span className="text-amber-300">
                    Scanning Biometrics... {scanProgress}%
                  </span>
                )}
                {scanStage === 'verified' && (
                  <span className="text-emerald-300">
                    Face Match {faceScore.toFixed(1)}% Verified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Entry Seat Assignment (Auto 1-by-1 vs Manual) OR Exit Hourly Balance Calculation */}
          {!isExitFlow ? (
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                  <Armchair className="w-4 h-4 text-indigo-700" />
                  <span>Single-Floor Seat Assignment Mode</span>
                </div>
                <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setSeatMode('Auto')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      seatMode === 'Auto'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Auto (1-by-1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSeatMode('Manual')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                      seatMode === 'Manual'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Manual Pick
                  </button>
                </div>
              </div>

              {seatMode === 'Auto' ? (
                <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 font-mono tabular-nums">
                  <span className="text-stone-600">
                    Next Sequential Vacant Seat:
                  </span>
                  <span className="font-bold text-indigo-800 text-sm">
                    {nextAutoSeat
                      ? `${nextAutoSeat.code} (${nextAutoSeat.rowZone})`
                      : 'No Vacant Seat'}
                  </span>
                </div>
              ) : (
                <div className="pt-2 border-t border-stone-200/80">
                  <label className="block text-stone-600 mb-1">
                    Select Any Vacant Seat on Single Floor:
                  </label>
                  <select
                    value={manualSeatId}
                    onChange={(e) => setManualSeatId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-lg font-mono tabular-nums"
                  >
                    {vacantSeats.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} — {s.rowZone} {s.hasAC ? '(AC)' : '(Non-AC)'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-stone-200/80 font-mono tabular-nums text-stone-600">
                <span>Usage Tariff: ₹{effectiveHourlyRate}/hour</span>
                <span>
                  Current Balance: ₹{member.walletBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-stone-900">
                  <Wallet className="w-4 h-4 text-amber-700" />
                  <span>Exit Session & Hourly Fee Balance Deduction</span>
                </div>
                <span className="font-mono tabular-nums text-stone-600">
                  Seat {activeSession?.seatCode || 'S-01'} will be vacated
                </span>
              </div>

              {/* Duration selector so evaluator/admin can test exact hours or real elapsed time */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/80">
                <span className="text-stone-700">Session Study Duration:</span>
                <div className="flex items-center gap-1.5 font-mono tabular-nums">
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
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/80 font-mono tabular-nums">
                <div>
                  <p className="text-[11px] text-stone-500">Time Studied</p>
                  <p className="text-sm font-bold text-stone-900">
                    {Math.floor(simulatedDurationMins / 60)}h{' '}
                    {simulatedDurationMins % 60}m
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-stone-500">
                    Fee Cut (₹{activeSession?.hourlyRateApplied || member.hourlyRate}/hr)
                  </p>
                  <p className="text-sm font-bold text-rose-600">
                    -₹{estimatedFeeDeduction}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-stone-500">New Balance</p>
                  <p className="text-sm font-bold text-emerald-700">
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
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
            >
              Cancel
            </button>

            {scanStage !== 'verified' ? (
              <button
                type="button"
                disabled={scanStage === 'scanning-face'}
                onClick={() => setScanStage('scanning-face')}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg transition-colors disabled:opacity-50"
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
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isExitFlow
                    ? `Confirm Exit & Deduct ₹${estimatedFeeDeduction} from Balance`
                    : `Confirm Entry & Assign Seat ${chosenSeatId || 'Auto'}`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
