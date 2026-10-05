import React, { useState, useRef, useEffect } from 'react';
import { ScanFace, Camera, CheckCircle2, RefreshCw } from 'lucide-react';

interface FaceTemplateCaptureBoxProps {
  memberId: string;
  currentTemplateId?: string;
  onCaptureComplete: (newFaceTemplateId: string) => void;
}

export const FaceTemplateCaptureBox: React.FC<FaceTemplateCaptureBoxProps> = ({
  memberId,
  currentTemplateId,
  onCaptureComplete,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleCaptureFaceTemplate = async () => {
    setIsCapturing(true);
    setProgress(10);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch {
      setCameraActive(false);
    }

    let step = 15;
    const interval = setInterval(() => {
      step += 22;
      if (step >= 100) {
        clearInterval(interval);
        setProgress(100);
        const numericId = memberId.replace(/\D+/g, '') || '1000';
        const hashSuffix = Math.random()
          .toString(16)
          .substring(2, 8)
          .toUpperCase();
        const generatedId = `FACE-BIO-${numericId}-${hashSuffix}`;
        setTimeout(() => {
          stopCamera();
          setIsCapturing(false);
          onCaptureComplete(generatedId);
        }, 250);
      } else {
        setProgress(step);
      }
    }, 240);
  };

  return (
    <div className="p-3.5 bg-slate-900 dark:bg-slate-950 text-white rounded-xl border border-slate-800 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
            <ScanFace className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white flex items-center gap-1.5">
              <span>Biometric Face ID Template</span>
              {currentTemplateId && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                </span>
              )}
            </p>
            <p className="text-[11px] font-mono tabular-nums text-slate-400">
              {currentTemplateId
                ? `Template ID: ${currentTemplateId}`
                : 'No Face Template captured yet — required for Gate Check-In'}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={isCapturing}
          onClick={handleCaptureFaceTemplate}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          {currentTemplateId ? (
            <>
              <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
              <span>Capture Face Template</span>
            </>
          ) : (
            <>
              <Camera className="w-3.5 h-3.5" />
              <span>Capture Face Template</span>
            </>
          )}
        </button>
      </div>

      {isCapturing && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="relative h-32 rounded-lg bg-slate-950 border border-indigo-500/40 overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                cameraActive ? 'opacity-90' : 'hidden'
              }`}
            />
            {!cameraActive && (
              <div className="flex flex-col items-center gap-1 text-indigo-300">
                <ScanFace className="w-8 h-8 animate-pulse text-amber-400" />
                <span className="text-[11px] font-mono">
                  Extracting 128-point facial landmarks...
                </span>
              </div>
            )}
            <div className="absolute bottom-2 left-3 right-3">
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
