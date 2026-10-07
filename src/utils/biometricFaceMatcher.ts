export interface FaceDescriptor {
  faceDetected: boolean;
  reason?: string;
  gridLuminance: number[]; // 64 normalized zero-mean unit-variance values (8x8 grid)
  gridChrominance: number[]; // 32 values (4x4 Cb & Cr)
  verticalProfile: number[]; // 16 vertical row contrast profile values
  edgeProfile: number[]; // 16 regional gradient values
  skinRatio: number;
  symmetryScore: number;
  hashHex: string;
}

export interface FaceVerificationResult {
  verified: boolean;
  score: number; // 0 to 100
  threshold: number; // 80.0
  reason: string;
  geometryMatch: number;
  colorMatch: number;
  structureMatch: number;
}

/**
 * Extracts a 128-feature biometric descriptor from the central facial oval of a canvas
 * and validates that an actual human face is present in the frame.
 */
export function extractBiometricDescriptor(
  sourceCanvas: HTMLCanvasElement
): FaceDescriptor {
  const workCanvas = document.createElement('canvas');
  const SIZE = 128;
  workCanvas.width = SIZE;
  workCanvas.height = SIZE;
  const ctx = workCanvas.getContext('2d');

  if (!ctx || sourceCanvas.width === 0 || sourceCanvas.height === 0) {
    return {
      faceDetected: false,
      reason: 'Camera frame unavailable. Please allow camera access.',
      gridLuminance: [],
      gridChrominance: [],
      verticalProfile: [],
      edgeProfile: [],
      skinRatio: 0,
      symmetryScore: 0,
      hashHex: '000000',
    };
  }

  // Crop central face oval region (center 55% width, 75% height)
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  const cropW = sw * 0.55;
  const cropH = sh * 0.75;
  const cropX = (sw - cropW) / 2;
  const cropY = (sh - cropH) / 2;

  ctx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, SIZE, SIZE);
  const imgData = ctx.getImageData(0, 0, SIZE, SIZE).data;

  const lum = new Float32Array(SIZE * SIZE);
  const cbArr = new Float32Array(SIZE * SIZE);
  const crArr = new Float32Array(SIZE * SIZE);

  let sumY = 0;
  let skinPixels = 0;
  let ovalPixels = 0;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const idx = y * SIZE + x;
      const p = idx * 4;
      const r = imgData[p];
      const g = imgData[p + 1];
      const b = imgData[p + 2];

      const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

      lum[idx] = yVal;
      cbArr[idx] = cb;
      crArr[idx] = cr;
      sumY += yVal;

      // Check inside elliptical face mask
      const nx = (x - SIZE / 2) / (SIZE * 0.44);
      const ny = (y - SIZE / 2) / (SIZE * 0.48);
      if (nx * nx + ny * ny <= 1.0) {
        ovalPixels++;
        if (cb >= 72 && cb <= 135 && cr >= 126 && cr <= 185 && yVal > 25) {
          skinPixels++;
        }
      }
    }
  }

  const meanY = sumY / (SIZE * SIZE);
  let varSum = 0;
  for (let i = 0; i < lum.length; i++) {
    const d = lum[i] - meanY;
    varSum += d * d;
  }
  const stdY = Math.sqrt(varSum / lum.length);
  const skinRatio = ovalPixels > 0 ? skinPixels / ovalPixels : 0;

  // Compute bilateral left-right facial symmetry inside the central region
  let symDiffSum = 0;
  let symCount = 0;
  for (let y = 16; y < SIZE - 16; y++) {
    for (let x = 16; x < SIZE / 2; x++) {
      const mirrorX = SIZE - 1 - x;
      const leftVal = lum[y * SIZE + x];
      const rightVal = lum[y * SIZE + mirrorX];
      symDiffSum += Math.abs(leftVal - rightVal);
      symCount++;
    }
  }
  const avgSymDiff = symCount > 0 ? symDiffSum / symCount : 255;
  const symmetryScore = Math.max(0, Math.min(1, 1 - avgSymDiff / 95));

  // Validate face presence (reject covered camera, blank wall, or non-face objects)
  if (meanY < 18) {
    return {
      faceDetected: false,
      reason:
        'Camera frame is too dark or covered. Please uncover camera and ensure good lighting.',
      gridLuminance: [],
      gridChrominance: [],
      verticalProfile: [],
      edgeProfile: [],
      skinRatio,
      symmetryScore,
      hashHex: '000000',
    };
  }

  if (stdY < 11) {
    return {
      faceDetected: false,
      reason:
        'No face structure detected (flat background). Position your face clearly inside the oval.',
      gridLuminance: [],
      gridChrominance: [],
      verticalProfile: [],
      edgeProfile: [],
      skinRatio,
      symmetryScore,
      hashHex: '000000',
    };
  }

  if (skinRatio < 0.14 || symmetryScore < 0.35) {
    return {
      faceDetected: false,
      reason:
        'No human face detected inside the scanner oval. Please center your face directly in front of the camera.',
      gridLuminance: [],
      gridChrominance: [],
      verticalProfile: [],
      edgeProfile: [],
      skinRatio,
      symmetryScore,
      hashHex: '000000',
    };
  }

  // 1. 8x8 Grid Luminance (64 blocks), normalized to Zero-Mean & Unit-Variance
  const rawGridLum: number[] = [];
  const blockSize = SIZE / 8; // 16x16
  for (let gy = 0; gy < 8; gy++) {
    for (let gx = 0; gx < 8; gx++) {
      let bSum = 0;
      for (let y = gy * blockSize; y < (gy + 1) * blockSize; y++) {
        for (let x = gx * blockSize; x < (gx + 1) * blockSize; x++) {
          bSum += lum[y * SIZE + x];
        }
      }
      rawGridLum.push(bSum / (blockSize * blockSize));
    }
  }

  const gMean = rawGridLum.reduce((a, b) => a + b, 0) / rawGridLum.length;
  const gStd =
    Math.sqrt(
      rawGridLum.reduce((acc, v) => acc + (v - gMean) * (v - gMean), 0) /
        rawGridLum.length
    ) || 1;
  const gridLuminance = rawGridLum.map((v) => (v - gMean) / gStd);

  // 2. 4x4 Chrominance Grid (16 Cb + 16 Cr = 32 values)
  const gridChrominance: number[] = [];
  const cBlock = SIZE / 4; // 32x32
  for (let cy = 0; cy < 4; cy++) {
    for (let cx = 0; cx < 4; cx++) {
      let sumCb = 0;
      let sumCr = 0;
      for (let y = cy * cBlock; y < (cy + 1) * cBlock; y++) {
        for (let x = cx * cBlock; x < (cx + 1) * cBlock; x++) {
          const idx = y * SIZE + x;
          sumCb += cbArr[idx];
          sumCr += crArr[idx];
        }
      }
      gridChrominance.push(sumCb / (cBlock * cBlock));
      gridChrominance.push(sumCr / (cBlock * cBlock));
    }
  }

  // 3. 16-band Horizontal Row Contrast Profile (captures hairline, forehead, eyes, nose, mouth, chin)
  const rawVert: number[] = [];
  const rowBand = SIZE / 16; // 8px high bands
  for (let ry = 0; ry < 16; ry++) {
    let rSum = 0;
    let count = 0;
    for (let y = ry * rowBand; y < (ry + 1) * rowBand; y++) {
      for (let x = 24; x < SIZE - 24; x++) {
        rSum += lum[y * SIZE + x];
        count++;
      }
    }
    rawVert.push(rSum / Math.max(1, count));
  }
  const vMean = rawVert.reduce((a, b) => a + b, 0) / rawVert.length;
  const vStd =
    Math.sqrt(
      rawVert.reduce((acc, v) => acc + (v - vMean) * (v - vMean), 0) /
        rawVert.length
    ) || 1;
  const verticalProfile = rawVert.map((v) => (v - vMean) / vStd);

  // 4. 4x4 Regional Gradient Magnitude (16 values)
  const rawEdge: number[] = [];
  for (let cy = 0; cy < 4; cy++) {
    for (let cx = 0; cx < 4; cx++) {
      let edgeSum = 0;
      let count = 0;
      for (
        let y = Math.max(1, cy * cBlock);
        y < Math.min(SIZE - 1, (cy + 1) * cBlock);
        y++
      ) {
        for (
          let x = Math.max(1, cx * cBlock);
          x < Math.min(SIZE - 1, (cx + 1) * cBlock);
          x++
        ) {
          const gx = lum[y * SIZE + (x + 1)] - lum[y * SIZE + (x - 1)];
          const gy = lum[(y + 1) * SIZE + x] - lum[(y - 1) * SIZE + x];
          edgeSum += Math.hypot(gx, gy);
          count++;
        }
      }
      rawEdge.push(edgeSum / Math.max(1, count));
    }
  }
  const eMax = Math.max(...rawEdge, 1);
  const edgeProfile = rawEdge.map((v) => v / eMax);

  // Deterministic 6-char hex signature from descriptor
  let hash = 2166136261;
  for (let i = 0; i < gridLuminance.length; i++) {
    const quantized = Math.round((gridLuminance[i] + 3) * 40);
    hash ^= quantized;
    hash = Math.imul(hash, 16777619);
  }
  const hashHex = (hash >>> 0).toString(16).toUpperCase().padStart(6, '0').slice(0, 6);

  return {
    faceDetected: true,
    gridLuminance,
    gridChrominance,
    verticalProfile,
    edgeProfile,
    skinRatio,
    symmetryScore,
    hashHex,
  };
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Strictly compares a member's stored `facePhotoUrl` against a live camera frame canvas.
 * Rejects different people (`koi alag banda`), missing enrollments, or empty frames.
 */
export async function verifyLiveFaceAgainstEnrolled(
  enrolledPhotoUrl: string | undefined,
  liveCanvas: HTMLCanvasElement
): Promise<FaceVerificationResult> {
  const THRESHOLD = 80.0;

  if (!enrolledPhotoUrl) {
    return {
      verified: false,
      score: 0,
      threshold: THRESHOLD,
      reason:
        'Member has no enrolled Face Photo! Please capture Face Template in Member Profile or New Admission first.',
      geometryMatch: 0,
      colorMatch: 0,
      structureMatch: 0,
    };
  }

  const liveDesc = extractBiometricDescriptor(liveCanvas);
  if (!liveDesc.faceDetected) {
    return {
      verified: false,
      score: 0,
      threshold: THRESHOLD,
      reason:
        liveDesc.reason ||
        'No face detected in live camera view. Please align your face inside the oval.',
      geometryMatch: 0,
      colorMatch: 0,
      structureMatch: 0,
    };
  }

  try {
    const enrolledImg = await loadImageElement(enrolledPhotoUrl);
    const enrolledCanvas = document.createElement('canvas');
    enrolledCanvas.width = 320;
    enrolledCanvas.height = 240;
    const eCtx = enrolledCanvas.getContext('2d');
    if (!eCtx) {
      throw new Error('Canvas context unavailable');
    }
    eCtx.drawImage(enrolledImg, 0, 0, 320, 240);

    const enrolledDesc = extractBiometricDescriptor(enrolledCanvas);
    if (!enrolledDesc.faceDetected) {
      return {
        verified: false,
        score: 0,
        threshold: THRESHOLD,
        reason:
          'Stored Face Template image is invalid or synthetic. Please retake a real Face Template photo in Member Profile.',
        geometryMatch: 0,
        colorMatch: 0,
        structureMatch: 0,
      };
    }

    // 1. 8x8 Spatial Facial Geometry Correlation (-1 to 1)
    const gridCorr = cosineSimilarity(
      enrolledDesc.gridLuminance,
      liveDesc.gridLuminance
    );
    // Map correlation: 0.70+ -> 85%+, < 0.45 -> < 65%
    const geometryMatch = Math.max(
      0,
      Math.min(100, ((gridCorr + 0.2) / 1.1) * 100)
    );

    // 2. Vertical Facial Profile Correlation (Hairline -> Forehead -> Eyes -> Nose -> Mouth -> Chin)
    const vertCorr = cosineSimilarity(
      enrolledDesc.verticalProfile,
      liveDesc.verticalProfile
    );
    const edgeCorr = cosineSimilarity(
      enrolledDesc.edgeProfile,
      liveDesc.edgeProfile
    );
    const structureMatch = Math.max(
      0,
      Math.min(100, ((vertCorr * 0.65 + edgeCorr * 0.35 + 0.15) / 1.05) * 100)
    );

    // 3. Chrominance (Skin/Hair/Facial Tone) Similarity
    let chromaDiffSum = 0;
    for (let i = 0; i < enrolledDesc.gridChrominance.length; i++) {
      chromaDiffSum += Math.abs(
        enrolledDesc.gridChrominance[i] - liveDesc.gridChrominance[i]
      );
    }
    const avgChromaDiff =
      chromaDiffSum / Math.max(1, enrolledDesc.gridChrominance.length);
    const skinRatioDiff = Math.abs(
      enrolledDesc.skinRatio - liveDesc.skinRatio
    );
    const colorMatch = Math.max(
      0,
      Math.min(100, 100 - avgChromaDiff * 2.4 - skinRatioDiff * 65)
    );

    // Combined Weighted Biometric Score
    const rawScore =
      geometryMatch * 0.48 + structureMatch * 0.32 + colorMatch * 0.2;
    const finalScore = Number(Math.max(0, Math.min(99.8, rawScore)).toFixed(1));

    const verified =
      finalScore >= THRESHOLD &&
      gridCorr >= 0.48 &&
      vertCorr >= 0.42 &&
      colorMatch >= 62;

    if (!verified) {
      return {
        verified: false,
        score: finalScore,
        threshold: THRESHOLD,
        reason: `FACE MISMATCH (${finalScore}% < ${THRESHOLD}% required)! The person in front of the camera does not match the enrolled face for this member.`,
        geometryMatch: Math.round(geometryMatch),
        colorMatch: Math.round(colorMatch),
        structureMatch: Math.round(structureMatch),
      };
    }

    return {
      verified: true,
      score: finalScore,
      threshold: THRESHOLD,
      reason: `Biometric Face Match Confirmed (${finalScore}% similarity)`,
      geometryMatch: Math.round(geometryMatch),
      colorMatch: Math.round(colorMatch),
      structureMatch: Math.round(structureMatch),
    };
  } catch {
    return {
      verified: false,
      score: 0,
      threshold: THRESHOLD,
      reason:
        'Could not compare stored face template. Please retake the member face photo.',
      geometryMatch: 0,
      colorMatch: 0,
      structureMatch: 0,
    };
  }
}
