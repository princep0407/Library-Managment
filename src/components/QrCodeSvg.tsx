import React, { useMemo } from 'react';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

/**
 * Generates a deterministic 21x21 QR matrix from any string value
 * with authentic QR finder patterns, separators, timing patterns, and hashed data modules.
 */
export const QrCodeSvg: React.FC<QrCodeSvgProps> = ({
  value,
  size = 148,
  className = '',
}) => {
  const grid = useMemo(() => {
    const N = 21;
    const matrix: boolean[][] = Array.from({ length: N }, () =>
      Array(N).fill(false)
    );
    const reserved: boolean[][] = Array.from({ length: N }, () =>
      Array(N).fill(false)
    );

    const placeFinder = (rowOffset: number, colOffset: number) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = rowOffset + r;
          const cc = colOffset + c;
          if (rr >= 0 && rr < N && cc >= 0 && cc < N) {
            reserved[rr][cc] = true;
            if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
              const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
              const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
              matrix[rr][cc] = isBorder || isCenter;
            } else {
              matrix[rr][cc] = false;
            }
          }
        }
      }
    };

    placeFinder(0, 0);
    placeFinder(0, N - 7);
    placeFinder(N - 7, 0);

    // Timing patterns
    for (let i = 8; i < N - 8; i++) {
      reserved[6][i] = true;
      matrix[6][i] = i % 2 === 0;
      reserved[i][6] = true;
      matrix[i][6] = i % 2 === 0;
    }

    // Dark module
    reserved[N - 8][8] = true;
    matrix[N - 8][8] = true;

    // Deterministic FNV-1a + xorshift seed from value
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    let state = hash >>> 0 || 123456789;
    const nextBit = () => {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      return ((state >>> 0) & 1) === 1;
    };

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!reserved[r][c]) {
          matrix[r][c] = nextBit();
        }
      }
    }

    return matrix;
  }, [value]);

  const moduleCount = 21;
  const quietZone = 2;
  const totalModules = moduleCount + quietZone * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${totalModules} ${totalModules}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={`QR Code for ${value}`}
    >
      <rect width={totalModules} height={totalModules} rx="1.5" fill="#FFFFFF" />
      {grid.map((row, rIdx) =>
        row.map((cell, cIdx) =>
          cell ? (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx + quietZone}
              y={rIdx + quietZone}
              width={1}
              height={1}
              fill="#0F172A"
            />
          ) : null
        )
      )}
    </svg>
  );
};
