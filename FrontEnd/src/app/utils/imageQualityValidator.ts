/**
 * Image Quality Validation Utility
 * Validates image quality before crop disease analysis
 */

export interface ImageQualityResult {
  isValid: boolean;
  issues: string[];
  score: number; // 0-100
  warnings: string[];
}

/**
 * Validates image quality for crop disease analysis
 * @param file The image file to validate
 * @returns Promise with validation results
 */
export async function validateImageQuality(file: File): Promise<ImageQualityResult> {
  const result: ImageQualityResult = {
    isValid: true,
    issues: [],
    score: 100,
    warnings: [],
  };

  try {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB < 0.1) {
      result.issues.push("Image file is too small (< 100KB). This may indicate poor quality.");
      result.score -= 30;
      result.isValid = false;
    } else if (fileSizeMB < 0.5) {
      result.warnings.push("Image file is small. Consider using a higher quality image for better results.");
      result.score -= 10;
    }

    // Load image to check dimensions and analyze quality
    const imageData = await loadImage(file);
    const { width, height, canvas, ctx } = imageData;

    // Check image dimensions
    if (width < 300 || height < 300) {
      result.issues.push(`Image resolution is too low (${width}x${height}). Minimum 300x300 pixels required.`);
      result.score -= 40;
      result.isValid = false;
    } else if (width < 640 || height < 640) {
      result.warnings.push(`Image resolution is low (${width}x${height}). 640x640 or higher recommended for best results.`);
      result.score -= 15;
    }

    // Check aspect ratio (should be reasonable for plant photos)
    const aspectRatio = width / height;
    if (aspectRatio < 0.5 || aspectRatio > 2.0) {
      result.warnings.push("Unusual aspect ratio detected. Try to capture plants in a more standard frame.");
      result.score -= 5;
    }

    // Analyze image brightness and contrast
    const imageStats = analyzeImageStats(ctx, width, height);

    // Check if image is too dark
    if (imageStats.avgBrightness < 40) {
      result.issues.push("Image is too dark. Please take photo in better lighting conditions.");
      result.score -= 35;
      result.isValid = false;
    } else if (imageStats.avgBrightness < 70) {
      result.warnings.push("Image is somewhat dark. Better lighting will improve analysis accuracy.");
      result.score -= 10;
    }

    // Check if image is overexposed
    if (imageStats.avgBrightness > 230) {
      result.issues.push("Image is overexposed. Reduce lighting or avoid direct sunlight.");
      result.score -= 30;
      result.isValid = false;
    } else if (imageStats.avgBrightness > 200) {
      result.warnings.push("Image is quite bright. Slightly reduce exposure for better results.");
      result.score -= 8;
    }

    // Check contrast
    if (imageStats.contrast < 20) {
      result.warnings.push("Low image contrast detected. This may affect analysis accuracy.");
      result.score -= 10;
    }

    // Estimate blur using Laplacian variance
    const blurScore = estimateBlur(ctx, width, height);
    if (blurScore < 50) {
      result.issues.push("Image appears to be blurry. Please hold camera steady and ensure focus.");
      result.score -= 40;
      result.isValid = false;
    } else if (blurScore < 100) {
      result.warnings.push("Image may be slightly out of focus. Ensure camera is focused on the plant.");
      result.score -= 15;
    }

    // Check if image is predominantly green (expected for plant images)
    if (imageStats.greenRatio < 0.15) {
      result.warnings.push("Image doesn't appear to contain much vegetation. Ensure plant leaves are clearly visible.");
      result.score -= 10;
    }

    // Ensure score doesn't go below 0
    result.score = Math.max(0, result.score);

  } catch (error) {
    console.error("Error validating image quality:", error);
    result.issues.push("Unable to validate image quality. Please try another image.");
    result.isValid = false;
    result.score = 0;
  }

  return result;
}

/**
 * Load image file and return canvas context for analysis
 */
function loadImage(file: File): Promise<{ width: number; height: number; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height, canvas, ctx });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Analyze image statistics (brightness, contrast, color distribution)
 */
function analyzeImageStats(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Sample pixels for performance (every 10th pixel)
  const sampleStep = 10;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  let totalBrightness = 0;
  let totalRed = 0;
  let totalGreen = 0;
  let totalBlue = 0;
  let sampleCount = 0;
  let minBrightness = 255;
  let maxBrightness = 0;

  for (let i = 0; i < pixels.length; i += sampleStep * 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;
    totalRed += r;
    totalGreen += g;
    totalBlue += b;

    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
    sampleCount++;
  }

  const avgBrightness = totalBrightness / sampleCount;
  const avgRed = totalRed / sampleCount;
  const avgGreen = totalGreen / sampleCount;
  const avgBlue = totalBlue / sampleCount;
  const contrast = maxBrightness - minBrightness;
  const greenRatio = avgGreen / (avgRed + avgGreen + avgBlue);

  return {
    avgBrightness,
    contrast,
    greenRatio,
    avgRed,
    avgGreen,
    avgBlue,
  };
}

/**
 * Estimate image blur using Laplacian variance approximation
 * Higher values indicate sharper images
 */
function estimateBlur(ctx: CanvasRenderingContext2D, width: number, height: number): number {
  // Use smaller sample for performance
  const sampleWidth = Math.min(width, 640);
  const sampleHeight = Math.min(height, 640);
  const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  const pixels = imageData.data;

  let laplacianSum = 0;
  let count = 0;

  // Simple Laplacian edge detection
  for (let y = 1; y < sampleHeight - 1; y += 4) {
    for (let x = 1; x < sampleWidth - 1; x += 4) {
      const idx = (y * sampleWidth + x) * 4;

      // Convert to grayscale
      const center = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
      const top = (pixels[idx - sampleWidth * 4] + pixels[idx - sampleWidth * 4 + 1] + pixels[idx - sampleWidth * 4 + 2]) / 3;
      const bottom = (pixels[idx + sampleWidth * 4] + pixels[idx + sampleWidth * 4 + 1] + pixels[idx + sampleWidth * 4 + 2]) / 3;
      const left = (pixels[idx - 4] + pixels[idx - 3] + pixels[idx - 2]) / 3;
      const right = (pixels[idx + 4] + pixels[idx + 5] + pixels[idx + 6]) / 3;

      // Laplacian = -4*center + top + bottom + left + right
      const laplacian = Math.abs(-4 * center + top + bottom + left + right);
      laplacianSum += laplacian;
      count++;
    }
  }

  // Return variance (higher = sharper)
  return count > 0 ? laplacianSum / count : 0;
}
