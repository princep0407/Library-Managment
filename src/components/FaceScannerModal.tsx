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
  ShieldCheck,
  Camera,
  Upload,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Member, Seat, AttendanceRecord } from '../types';
import { PUBLIC_APP_URL } from '../data/initialData';
import { QrCodeSvg } from './QrCodeSvg';
import {
  verifyLiveFaceAgainstEnrolled,
  extractBiometricDescriptor,
  FaceVerificationResult,
} from '../utils/biometricFaceMatcher';

interface FaceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  allMembers?: Member[];
  onSelectMember?: (member: Member) => void;
  onEnrollMemberFace?: (
    memberId: string,
    newTemplateId: string,
    photoUrl: string
  ) => void;
  activeSession: AttendanceRecord | null;
  nextAutoSeat: Seat | null;
  vacantSeats: Seat[];
  onConfirmEntryAfterFaceScan: (payload: {
    memberId: string;
    seatId: string | null;
    assignMode: 'Auto (1-by-1)' | 'Manual';
    faceScore: number;
    capturedPhotoUrl?: string;
  }) => void;
  onConfirmExitAfterFaceScan: (payload: {
    memberId: string;
    overrideDurationMinutes?: number;
    faceScore: number;
    capturedPhotoUrl?: string;
  }) => void;
}

export const FaceScannerModal: React.FC<FaceScannerModalProps> = ({
  isOpen,
  onClose,
  member,
  allMembers = [],
  onSelectMember,
  onEnrollMemberFace,
  activeSession,
  nextAutoSeat,
  vacantSeats,
  onConfirmEntryAfterFaceScan,
  onConfirmExitAfterFaceScan,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const initializedMemberIdRef = useRef<string | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<string>(
    'Initializing biometric camera...'
  );
  const [scanStage, setScanStage] = useState<
    | 'qr-scanned'
    | 'scanning-face'
    | 'verified'
    | 'mismatch'
    | 'entry-live-summary'
  >('qr-scanned');
  const [scanProgress, setScanProgress] = useState(0);
  const [verificationResult, setVerificationResult] =
    useState<FaceVerificationResult | null>(null);
  const [liveCapturedPhoto, setLiveCapturedPhoto] = useState<
    string | undefined
  >(undefined);
  const [confirmedSeatCode, setConfirmedSeatCode] = useState<string>('S-01');
  const [seatMode, setSeatMode] = useState<'Auto' | 'Manual'>('Auto');
  const [manualSeatId, setManualSeatId] = useState<string>('');
  const [sessionDurationMins, setSessionDurationMins] = useState<number>(180);
  const [liveSeconds, setLiveSeconds] = useState<number>(0);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCameraStream = async () => {
    setCameraStatus('Starting front camera for 1-to-1 Face ID verification...');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraActive(false);
        setCameraStatus(
          'Webcam unavailable — use "Selfie Photo Verify" button in top-right.'
        );
        return;
      }
      const s = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = s;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => {});
      }
      setCameraStatus('Live camera active — Align face & click Scan & Verify');
    } catch {
      setCameraActive(false);
      setCameraStatus(
        'Camera permission blocked — allow camera or use "Selfie Photo Verify".'
      );
    }
  };

  // Initialize only when modal opens or selected member ID changes
  useEffect(() => {
    if (!isOpen) {
      initializedMemberIdRef.current = null;
      stopCameraStream();
      return;
    }

    if (!member) return;

    if (initializedMemberIdRef.current !== member.id) {
      initializedMemberIdRef.current = member.id;
      setScanStage('qr-scanned');
      setScanProgress(0);
      setVerificationResult(null);
      setLiveSeconds(0);
      setLiveCapturedPhoto(undefined);
      setSeatMode(
        member.seatAssignmentMode === 'Manual' && member.seatId
          ? 'Manual'
          : 'Auto'
      );
      setManualSeatId(member.seatId || nextAutoSeat?.id || 'S-01');

      if (activeSession) {
        const elapsed = Math.max(
          60,
          Math.round((Date.now() - activeSession.checkInTimestamp) / 60000)
        );
        setSessionDurationMins(elapsed);
      }

      startCameraStream();
    }
  }, [isOpen, member?.id]);

  useEffect(() => {
    if (isOpen && cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  }, [isOpen, cameraActive]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const t = setInterval(() => {
      setLiveSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  // Execute strict biometric comparison against member.facePhotoUrl
  const executeFaceVerificationFromCanvas = async (
    liveCanvas: HTMLCanvasElement
  ) => {
    if (!member) return;
    setScanStage('scanning-face');
    setScanProgress(25);
    setVerificationResult(null);

    const snapshotUrl = liveCanvas.toDataURL('image/jpeg', 0.88);
    setLiveCapturedPhoto(snapshotUrl);

    const pTimer = setInterval(() => {
      setScanProgress((prev) => (prev < 90 ? prev + 22 : prev));
    }, 110);

    const res = await verifyLiveFaceAgainstEnrolled(
      member.facePhotoUrl,
      liveCanvas
    );

    setTimeout(() => {
      clearInterval(pTimer);
      setScanProgress(100);
      setVerificationResult(res);
      if (res.verified) {
        setScanStage('verified');
      } else {
        setScanStage('mismatch');
      }
    }, 450);
  };

  const handleTriggerLiveCameraVerify = () => {
    if (!member) return;

    const video = videoRef.current;
    if (!video || !cameraActive || video.videoWidth === 0) {
      setVerificationResult({
        verified: false,
        score: 0,
        threshold: 80,
        reason:
          'Live webcam feed is not active! Please allow camera access or click "Selfie" in top-right to verify with a live photo.',
        geometryMatch: 0,
        colorMatch: 0,
        structureMatch: 0,
      });
      setScanStage('mismatch');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Mirror horizontally for natural front camera alignment
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    executeFaceVerificationFromCanvas(canvas);
  };

  // If member has NO facePhotoUrl enrolled yet, allow enrolling right now from live camera
  const handleQuickEnrollCurrentFace = () => {
    if (!member || !onEnrollMemberFace) return;
    const video = videoRef.current;
    if (!video || !cameraActive || video.videoWidth === 0) {
      fileInputRef.current?.click();
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const desc = extractBiometricDescriptor(canvas);
    if (!desc.faceDetected) {
      setVerificationResult({
        verified: false,
        score: 0,
        threshold: 80,
        reason:
          desc.reason ||
          'No clear face detected in camera frame to enroll. Please center your face inside the oval.',
        geometryMatch: 0,
        colorMatch: 0,
        structureMatch: 0,
      });
      setScanStage('mismatch');
      return;
    }

    const numericId = member.id.replace(/\D+/g, '') || '1001';
    const newTemplateId = `FACE-BIO-${numericId}-${desc.hashHex}`;
    const photoUrl = canvas.toDataURL('image/jpeg', 0.9);
    onEnrollMemberFace(member.id, newTemplateId, photoUrl);
    setLiveCapturedPhoto(photoUrl);
    setVerificationResult({
      verified: true,
      score: 99.2,
      threshold: 80,
      reason: 'Face Template enrolled & verified from live camera!',
      geometryMatch: 99,
      colorMatch: 99,
      structureMatch: 99,
    });
    setScanStage('verified');
  };

  const handlePhotoUploadVerify = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !member) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 320, 240);

        // If member had no enrolled photo yet, enroll it if valid face
        if (!member.facePhotoUrl && onEnrollMemberFace) {
          const desc = extractBiometricDescriptor(canvas);
          if (!desc.faceDetected) {
            setVerificationResult({
              verified: false,
              score: 0,
              threshold: 80,
              reason:
                desc.reason || 'Uploaded photo does not contain a clear face.',
              geometryMatch: 0,
              colorMatch: 0,
              structureMatch: 0,
            });
            setScanStage('mismatch');
            return;
          }
          const numericId = member.id.replace(/\D+/g, '') || '1001';
          const newTemplateId = `FACE-BIO-${numericId}-${desc.hashHex}`;
          const photoUrl = canvas.toDataURL('image/jpeg', 0.9);
          onEnrollMemberFace(member.id, newTemplateId, photoUrl);
          setLiveCapturedPhoto(photoUrl);
          setVerificationResult({
            verified: true,
            score: 99.1,
            threshold: 80,
            reason: 'Face Template enrolled & verified!',
            geometryMatch: 99,
            colorMatch: 99,
            structureMatch: 99,
          });
          setScanStage('verified');
          return;
        }

        executeFaceVerificationFromCanvas(canvas);
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen || !member) return null;

  const isExitFlow =
    Boolean(activeSession) && scanStage !== 'entry-live-summary';
  const chosenSeatId =
    seatMode === 'Auto'
      ? nextAutoSeat?.id || member.seatId || 'S-01'
      : manualSeatId || nextAutoSeat?.id || 'S-01';

  const chosenSeatObj = vacantSeats.find((s) => s.id === chosenSeatId);
  const effectiveHourlyRate =
    member.hourlyRate + (chosenSeatObj?.hourlyRateAddon || 0);

  const exitHours = sessionDurationMins / 60;
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

  const faceScore = verificationResult?.score || 98.4;
  const gateQrUrl = `${PUBLIC_APP_URL}/?portal=member&gate=scan`;

  const handleCompleteAction = () => {
    if (scanStage !== 'verified') return;

    if (isExitFlow) {
      stopCameraStream();
      onConfirmExitAfterFaceScan({
        memberId: member.id,
        overrideDurationMinutes: sessionDurationMins,
        faceScore,
        capturedPhotoUrl: liveCapturedPhoto,
      });
      onClose();
    } else {
      const targetSeat = chosenSeatId || 'S-01';
      setConfirmedSeatCode(targetSeat);
      stopCameraStream();
      onConfirmEntryAfterFaceScan({
        memberId: member.id,
        seatId: targetSeat,
        assignMode: seatMode === 'Auto' ? 'Auto (1-by-1)' : 'Manual',
        faceScore,
        capturedPhotoUrl: liveCapturedPhoto,
      });
      setScanStage('entry-live-summary');
    }
  };

  const remainingHoursAvailable = (
    member.walletBalance / Math.max(1, effectiveHourlyRate)
  ).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handlePhotoUploadVerify}
        className="hidden"
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-auto text-slate-900 dark:text-slate-100 animate-scale-in">
        {/* Top Light Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-50 via-white to-emerald-50/60 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {scanStage === 'entry-live-summary'
                  ? 'Entry Confirmed — Seat, Hours & Wallet Status'
                  : isExitFlow
                  ? 'Gate QR + 1-to-1 Face ID Exit Verification'
                  : 'Gate QR + 1-to-1 Face ID Entry Verification'}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                {member.name} ({member.id}) · Template: {member.faceTemplateId}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post-Entry Student Screen: Shows Seat to Sit In, Exact Hours & Wallet Balance */}
        {scanStage === 'entry-live-summary' ? (
          <div className="p-6 space-y-5 animate-fade-in">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                    Welcome, {member.name}! 1-to-1 Face Verified (
                    {faceScore.toFixed(1)}%)
                  </p>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-mono tabular-nums mt-0.5">
                    Please sit at Seat:{' '}
                    <strong className="text-sm underline">
                      {confirmedSeatCode}
                    </strong>{' '}
                    ({chosenSeatObj?.rowZone || 'Single-Floor AC Hall'})
                  </p>
                </div>
              </div>
              <span className="text-sm font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-300">
                00:00:{String(liveSeconds % 60).padStart(2, '0')}
              </span>
            </div>

            {/* Member Hours & Balance Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-indigo-50/70 dark:bg-slate-800 border border-indigo-200/80 dark:border-slate-700 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <Armchair className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Your Assigned Seat</span>
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums text-indigo-700 dark:text-amber-400">
                  {confirmedSeatCode}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-slate-500">
                  {chosenSeatObj?.rowZone || 'Ground Floor'}
                </p>
              </div>

              <div className="p-4 bg-emerald-50/70 dark:bg-slate-800 border border-emerald-200/80 dark:border-slate-700 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Available Fee Balance</span>
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                  ₹{member.walletBalance.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-slate-500">
                  Rate: ₹{effectiveHourlyRate}/hr ({remainingHoursAvailable}h
                  left)
                </p>
              </div>

              <div className="p-4 bg-amber-50/70 dark:bg-slate-800 border border-amber-200/80 dark:border-slate-700 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Total Hours Completed</span>
                </div>
                <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {member.totalHoursUsed.toFixed(1)} hrs
                </p>
                <p className="text-[11px] font-mono tabular-nums text-emerald-600 font-semibold">
                  + Live Session Running
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
              <span>
                Jab aap library exit karenge, firse Common Gate QR + Face ID
                scan karke Exit mark karein.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 ml-3 cursor-pointer"
              >
                Done · Go to Seat {confirmedSeatCode}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-4">
            {/* Optional Quick Member Switcher if multiple members exist */}
            {allMembers.length > 1 && onSelectMember && (
              <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Member at Gate:
                </span>
                <select
                  value={member.id}
                  onChange={(e) => {
                    const found = allMembers.find(
                      (m) => m.id === e.target.value
                    );
                    if (found) onSelectMember(found);
                  }}
                  className="px-2.5 py-1 font-mono text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white"
                >
                  {allMembers
                    .filter((m) => m.status !== 'Left')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} — {m.name} ({m.faceTemplateId})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Member's Current Hours Completed & Wallet Balance Banner (Light Surface) */}
            <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 font-mono tabular-nums">
              <div>
                <p className="text-[10px] font-sans text-slate-500">
                  Completed Hours
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                  {member.totalHoursUsed.toFixed(1)} hrs
                </p>
              </div>
              <div className="border-x border-slate-200 dark:border-slate-700 px-2.5">
                <p className="text-[10px] font-sans text-slate-500">
                  Wallet Balance
                </p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ₹{member.walletBalance.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="pl-1">
                <p className="text-[10px] font-sans text-slate-500">
                  Hours Left (₹{effectiveHourlyRate}/hr)
                </p>
                <p className="text-base font-bold text-indigo-600 dark:text-amber-400 mt-0.5">
                  {remainingHoursAvailable} hrs left
                </p>
              </div>
            </div>

            {/* Step 1: Common Gate QR Scanned & Stored Face Template Status */}
            <div className="flex items-center justify-between p-3 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1 bg-white border border-indigo-200 rounded shrink-0">
                  <QrCodeSvg value={gateQrUrl} size={36} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-indigo-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>
                      Strict 1-to-1 Match against:{' '}
                      <code className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                        {member.faceTemplateId}
                      </code>
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-indigo-300 font-mono tabular-nums">
                    {member.facePhotoUrl
                      ? 'Enrolled reference face loaded · Different faces will be rejected (<80%)'
                      : 'No face photo enrolled yet! Enroll member face below before check-in.'}
                  </p>
                </div>
              </div>
              {member.facePhotoUrl ? (
                <img
                  src={member.facePhotoUrl}
                  alt="Enrolled Reference"
                  className="w-10 h-10 rounded-lg object-cover border-2 border-emerald-500 shrink-0"
                  title="Enrolled Reference Face"
                />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              )}
            </div>

            {/* Step 2: Live Face ID Biometric Viewport */}
            <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 h-56 flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => setCameraActive(true)}
                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-200 ${
                  cameraActive ? 'opacity-90' : 'opacity-0 pointer-events-none'
                }`}
              />

              {!cameraActive && !liveCapturedPhoto && (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950/60 to-slate-950 flex flex-col items-center justify-center">
                  <ScanFace
                    className={`w-16 h-16 ${
                      scanStage === 'verified'
                        ? 'text-emerald-400'
                        : scanStage === 'mismatch'
                        ? 'text-rose-400'
                        : scanStage === 'scanning-face'
                        ? 'text-amber-400 animate-pulse'
                        : 'text-indigo-400'
                    }`}
                  />
                </div>
              )}

              {liveCapturedPhoto && !cameraActive && (
                <img
                  src={liveCapturedPhoto}
                  alt="Live Face Scan"
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
              )}

              {/* Enrolled Reference Thumbnail Badge (Top Left) */}
              {member.facePhotoUrl && (
                <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-2 p-1.5 bg-slate-950/85 border border-slate-700 rounded-lg">
                  <img
                    src={member.facePhotoUrl}
                    alt="Enrolled Template"
                    className="w-9 h-9 rounded object-cover border border-emerald-400"
                  />
                  <div className="text-[10px] font-mono leading-tight text-left">
                    <p className="text-emerald-400 font-bold">Enrolled Face</p>
                    <p className="text-slate-300">{member.id}</p>
                  </div>
                </div>
              )}

              {/* Camera Controls (Top Right) */}
              <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={startCameraStream}
                  title="Restart Camera"
                  className="p-1.5 bg-slate-950/80 hover:bg-slate-900 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Verify with Selfie Photo"
                  className="p-1.5 bg-slate-950/80 hover:bg-slate-900 text-amber-300 border border-slate-700 rounded-lg text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Selfie</span>
                </button>
              </div>

              {/* Biometric Face Reticle */}
              <div
                className={`relative z-10 w-48 h-40 rounded-2xl border-2 overflow-hidden transition-all flex flex-col items-center justify-between p-3 ${
                  scanStage === 'verified'
                    ? 'border-emerald-400 bg-emerald-950/30 shadow-[0_0_25px_rgba(52,211,153,0.3)]'
                    : scanStage === 'mismatch'
                    ? 'border-rose-500 bg-rose-950/40 shadow-[0_0_25px_rgba(244,63,94,0.35)]'
                    : scanStage === 'scanning-face'
                    ? 'border-amber-400 bg-amber-950/20'
                    : 'border-indigo-400/80 bg-slate-950/25'
                }`}
              >
                {scanStage === 'scanning-face' && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-scan-laser" />
                )}

                <div className="w-full flex justify-between text-[10px] font-mono tabular-nums text-white/90">
                  <span>{member.faceTemplateId}</span>
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

                <div className="text-[11px] font-mono tabular-nums font-semibold text-center px-2 py-0.5 rounded bg-slate-950/85">
                  {scanStage === 'qr-scanned' && (
                    <span className="text-indigo-200">{cameraStatus}</span>
                  )}
                  {scanStage === 'scanning-face' && (
                    <span className="text-amber-300">
                      Comparing 128-Pt Face Geometry... {scanProgress}%
                    </span>
                  )}
                  {scanStage === 'verified' && (
                    <span className="text-emerald-300 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Matched ({faceScore.toFixed(1)}%)
                    </span>
                  )}
                  {scanStage === 'mismatch' && (
                    <span className="text-rose-300 flex items-center justify-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Mismatch Rejected ({verificationResult?.score || 0}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mismatch or Verification Result Breakdown */}
            {verificationResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-2 animate-fade-in ${
                  verificationResult.verified
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {verificationResult.verified ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-bold">
                      {verificationResult.verified
                        ? `Identity Verified — ${member.name} (${verificationResult.score}% Match)`
                        : 'Face Verification Failed — Access Denied'}
                    </p>
                    <p className="text-[11px] mt-0.5">
                      {verificationResult.reason}
                    </p>
                  </div>
                </div>

                {verificationResult.score > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-current/10 font-mono text-[11px]">
                    <div>
                      Geometry: <strong>{verificationResult.geometryMatch}%</strong>
                    </div>
                    <div>
                      Structure: <strong>{verificationResult.structureMatch}%</strong>
                    </div>
                    <div>
                      Tone/Color: <strong>{verificationResult.colorMatch}%</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Entry Seat Assignment OR Exit Hourly Balance Calculation */}
            {!isExitFlow ? (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Armchair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Seat to Sit In (Single-Floor Hall)</span>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-700 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setSeatMode('Auto')}
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
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
                      className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
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
                      Assigned Seat on Entry:
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {nextAutoSeat
                        ? `${nextAutoSeat.code} (${nextAutoSeat.rowZone})`
                        : `${chosenSeatId} (Row A - Auto Assigned)`}
                    </span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    {vacantSeats.length > 0 ? (
                      <select
                        value={manualSeatId}
                        onChange={(e) => setManualSeatId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums"
                      >
                        {vacantSeats.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code} — {s.rowZone}{' '}
                            {s.hasAC ? '(AC)' : '(Non-AC)'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                        Seat S-01 (Row A AC Prime) will be automatically assigned
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">
                    Completed Session Duration (Hourly Wallet Settlement):
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
                        onClick={() => setSessionDurationMins(preset.mins)}
                        className={`px-2 py-1 rounded border text-[11px] cursor-pointer ${
                          sessionDurationMins === preset.mins
                            ? 'bg-indigo-600 text-white border-indigo-600'
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
                      {Math.floor(sessionDurationMins / 60)}h{' '}
                      {sessionDurationMins % 60}m
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
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopCameraStream();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Cancel
              </button>

              {scanStage !== 'verified' ? (
                <div className="flex flex-wrap items-center gap-2">
                  {!member.facePhotoUrl && onEnrollMemberFace ? (
                    <button
                      type="button"
                      onClick={handleQuickEnrollCurrentFace}
                      className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Enroll Member Face Template First</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={scanStage === 'scanning-face'}
                      onClick={handleTriggerLiveCameraVerify}
                      className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>
                        {scanStage === 'scanning-face'
                          ? 'Comparing Face Geometry...'
                          : scanStage === 'mismatch'
                          ? 'Retry Live Face Verification'
                          : 'Scan & Verify Face Now'}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCompleteAction}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all cursor-pointer"
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
                        Confirm Entry · Assign Seat {chosenSeatId || 'S-01'}
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
