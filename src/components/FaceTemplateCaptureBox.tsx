import React, { useState, useRef, useEffect } from 'react';
import {
  ScanFace,
  Camera,
  CheckCircle2,
  RefreshCw,
  X,
  Upload,
  AlertTriangle,
} from 'lucide-react';
import { extractBiometricDescriptor } from '../utils/biometricFaceMatcher';

interface FaceTemplateCaptureBoxProps {
  memberId: string;
  currentTemplateId?: string;
  currentPhotoUrl?: string;
  onCaptureComplete: (newFaceTemplateId: string, facePhotoUrl?: string) => void;
}

export const FaceTemplateCaptureBox: React.FC<FaceTemplateCaptureBoxProps> = ({
  memberId,
  currentTemplateId,
  currentPhotoUrl,
  onCaptureComplete,
}) => {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>(
    currentPhotoUrl
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCapturedPhoto(currentPhotoUrl);
  }, [currentPhotoUrl]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
    setCameraOpen(false);
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (cameraOpen && streamRef.current && videoRef.current) {
      const video = videoRef.current;
      if (video.srcObject !== streamRef.current) {
        video.srcObject = streamRef.current;
      }
      video
        .play()
        .then(() => setCameraReady(true))
        .catch(() => setCameraReady(true));
    }
  }, [cameraOpen]);

  const handleOpenCamera = async () => {
    setErrorMessage('');
    setStatusMessage('Starting camera for biometric face enrollment...');
    setCameraOpen(true);
    setCameraReady(false);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage(
          'Webcam API not available on this device. Please use "Upload Selfie Photo" to enroll face.'
        );
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraReady(true);
      setStatusMessage(
        'Look directly into the camera inside the oval and click Capture'
      );
    } catch {
      setErrorMessage(
        'Camera permission blocked or no webcam connected. Click "Upload Selfie Photo" to enroll face.'
      );
    }
  };

  const handleSnapAndEnroll = () => {
    if (isScanning) return;
    setErrorMessage('');

    const video = videoRef.current;
    if (!video || !cameraReady || video.videoWidth === 0) {
      setErrorMessage(
        'Live camera feed is not active! Please allow webcam access or use "Upload Selfie Photo".'
      );
      return;
    }

    setIsScanning(true);

    setTimeout(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsScanning(false);
        return;
      }

      // Mirror horizontally for front camera
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const descriptor = extractBiometricDescriptor(canvas);
      if (!descriptor.faceDetected) {
        setIsScanning(false);
        setErrorMessage(
          descriptor.reason ||
            'No clear face detected! Center your face inside the oval in good lighting.'
        );
        return;
      }

      const numericId = memberId.replace(/\D+/g, '') || '1001';
      const generatedId = `FACE-BIO-${numericId}-${descriptor.hashHex}`;
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      setCapturedPhoto(photoDataUrl);
      setIsScanning(false);
      stopCamera();
      onCaptureComplete(generatedId, photoDataUrl);
    }, 350);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage('');

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const descriptor = extractBiometricDescriptor(canvas);
        if (!descriptor.faceDetected) {
          setErrorMessage(
            descriptor.reason ||
              'Uploaded photo does not contain a clear centered face. Please try a clear front-facing portrait.'
          );
          return;
        }

        const numericId = memberId.replace(/\D+/g, '') || '1001';
        const generatedId = `FACE-BIO-${numericId}-${descriptor.hashHex}`;
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPhoto(photoDataUrl);
        stopCamera();
        onCaptureComplete(generatedId, photoDataUrl);
      };
      if (typeof reader.result === 'string') {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 bg-indigo-50/60 dark:bg-slate-900 border border-indigo-200/80 dark:border-slate-800 rounded-xl space-y-3 transition-all duration-200">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {capturedPhoto ? (
            <img
              src={capturedPhoto}
              alt="Enrolled Face"
              className="w-13 h-13 rounded-xl object-cover border-2 border-emerald-500 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs shrink-0">
              <ScanFace className="w-6 h-6" />
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Biometric Face ID Template</span>
              {capturedPhoto && currentTemplateId ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Face Enrolled
                </span>
              ) : (
                <span className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                  · Not Enrolled Yet
                </span>
              )}
            </p>
            <p className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-slate-400 mt-0.5">
              {capturedPhoto && currentTemplateId
                ? `Template ID: ${currentTemplateId} (Strict 1-to-1 Face Match Active)`
                : 'Enroll real face photo so only this member can verify at Gate'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!cameraOpen ? (
            <>
              <button
                type="button"
                onClick={handleOpenCamera}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                {capturedPhoto ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake Face Template</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Capture Face Template</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Upload Selfie Photo</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close Camera</span>
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Camera Viewport for Face Capture */}
      {cameraOpen && (
        <div className="pt-3 border-t border-indigo-200/70 dark:border-slate-800 space-y-3 animate-scale-in">
          <div className="relative h-60 rounded-xl bg-slate-900 border border-indigo-300 dark:border-indigo-500/50 overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={() => setCameraReady(true)}
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-200 ${
                cameraReady ? 'opacity-95' : 'opacity-20'
              }`}
            />

            {!cameraReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90">
                <ScanFace className="w-12 h-12 text-indigo-400 animate-pulse" />
              </div>
            )}

            {/* Face Alignment Oval & Scanning Laser */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              <div
                className={`relative w-36 h-44 rounded-full border-2 border-dashed overflow-hidden transition-all flex items-center justify-center ${
                  isScanning
                    ? 'border-emerald-400 bg-emerald-500/15 scale-105'
                    : cameraReady
                    ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.25)]'
                    : 'border-indigo-400/60'
                }`}
              >
                {cameraReady && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-scan-laser" />
                )}
              </div>

              <span className="mt-2 px-3 py-1 rounded-md bg-slate-900/85 text-[11px] font-mono text-white">
                {isScanning
                  ? 'Analyzing 128-Pt Facial Geometry...'
                  : statusMessage ||
                    'Center your face inside oval & click Capture'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Or Upload Selfie Photo</span>
            </button>

            <button
              type="button"
              disabled={isScanning}
              onClick={handleSnapAndEnroll}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>
                {isScanning
                  ? 'Verifying & Saving Face...'
                  : 'Capture & Save Face Template Now'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
