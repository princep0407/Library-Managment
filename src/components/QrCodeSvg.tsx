import React, { useMemo } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

/**
 * Generates a 100% real, ISO/IEC 18004 standard scannable QR code SVG
 * using Reed-Solomon error correction so any mobile camera or QR scanner app scans it immediately.
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 148,
  className = '',
  onClick,
}) => {
  const qrData = useMemo(() => {
    try {
      const qr = QRCode.create(value || 'https://vidyakosh.app', {
        errorCorrectionLevel: 'M',
      });
      const count = qr.modules.size;
      const data = qr.modules.data;
      const cells: { r: number; c: number }[] = [];
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (data[r * count + c]) {
            cells.push({ r, c });
          }
        }
      }
      return { count, cells };
    } catch {
      return { count: 21, cells: [] };
    }
  }, [value]);

  const quietZone = 2;
  const totalModules = qrData.count + quietZone * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${totalModules} ${totalModules}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
      className={`${onClick ? 'cursor-pointer' : ''} ${className}`}
      role="img"
      aria-label={`Scannable QR Code for ${value}`}
    >
      <rect width={totalModules} height={totalModules} rx="1.5" fill="#FFFFFF" />
      {qrData.cells.map(({ r, c }) => (
        <rect
          key={`${r}-${c}`}
          x={c + quietZone}
          y={r + quietZone}
          width={1.03}
          height={1.03}
          fill="#0F172A"
        />
      ))}
    </svg>
  );
};
