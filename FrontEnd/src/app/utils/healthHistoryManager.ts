// Health History Manager - Track crop health over time

export interface CropScan {
  id: string;
  timestamp: Date;
  cropType: string;
  fieldSection?: string;
  isHealthy: boolean;
  detectedDisease: string | null;
  severity: string;
  confidence: number;
  imageUrl?: string;
  treatment?: {
    immediate: string;
    prevention: string;
    followUp: string;
  };
  observations?: string;
  weatherConditions?: {
    temperature: number;
    humidity: number;
    description: string;
  };
}

export interface CropHealthHistory {
  cropId: string;
  cropType: string;
  fieldSection: string;
  scans: CropScan[];
  healthTrend: number; // -1 declining, 0 stable, 1 improving
  riskLevel: "low" | "medium" | "high";
  lastScanned: Date;
  totalScans: number;
  healthyScans: number;
  diseasedScans: number;
  commonDiseases: { name: string; count: number }[];
}

class HealthHistoryManager {
  private storageKey = "cropHealthHistory";

  // Get all health history
  getAllHistory(userId: string): CropHealthHistory[] {
    const data = localStorage.getItem(`${this.storageKey}_${userId}`);
    if (!data) return [];

    const history = JSON.parse(data);
    // Convert string dates back to Date objects
    return history.map((h: any) => ({
      ...h,
      lastScanned: new Date(h.lastScanned),
      scans: h.scans.map((s: any) => ({
        ...s,
        timestamp: new Date(s.timestamp),
      })),
    }));
  }

  // Add a new scan to history
  addScan(userId: string, scan: CropScan): void {
    const history = this.getAllHistory(userId);
    const cropId = this.generateCropId(scan.cropType, scan.fieldSection || "default");

    // Find or create crop history
    let cropHistory = history.find((h) => h.cropId === cropId);

    if (!cropHistory) {
      cropHistory = {
        cropId,
        cropType: scan.cropType,
        fieldSection: scan.fieldSection || "default",
        scans: [],
        healthTrend: 0,
        riskLevel: "low",
        lastScanned: scan.timestamp,
        totalScans: 0,
        healthyScans: 0,
        diseasedScans: 0,
        commonDiseases: [],
      };
      history.push(cropHistory);
    }

    // Add scan
    cropHistory.scans.push(scan);
    cropHistory.lastScanned = scan.timestamp;
    cropHistory.totalScans++;

    if (scan.isHealthy) {
      cropHistory.healthyScans++;
    } else {
      cropHistory.diseasedScans++;
    }

    // Update common diseases
    if (scan.detectedDisease && scan.detectedDisease !== "Healthy leaf") {
      const existingDisease = cropHistory.commonDiseases.find(
        (d) => d.name === scan.detectedDisease
      );
      if (existingDisease) {
        existingDisease.count++;
      } else {
        cropHistory.commonDiseases.push({
          name: scan.detectedDisease,
          count: 1,
        });
      }
    }

    // Sort by count
    cropHistory.commonDiseases.sort((a, b) => b.count - a.count);

    // Calculate health trend
    cropHistory.healthTrend = this.calculateHealthTrend(cropHistory.scans);

    // Calculate risk level
    cropHistory.riskLevel = this.calculateRiskLevel(cropHistory);

    // Save
    this.saveHistory(userId, history);
  }

  // Calculate health trend from recent scans
  private calculateHealthTrend(scans: CropScan[]): number {
    if (scans.length < 2) return 0;

    // Look at last 5 scans
    const recentScans = scans.slice(-5);
    const healthyCount = recentScans.filter((s) => s.isHealthy).length;
    const diseasedCount = recentScans.length - healthyCount;

    // Get older scans for comparison
    const olderScans = scans.slice(-10, -5);
    if (olderScans.length === 0) return 0;

    const olderHealthyCount = olderScans.filter((s) => s.isHealthy).length;
    const recentHealthRate = healthyCount / recentScans.length;
    const olderHealthRate = olderHealthyCount / olderScans.length;

    if (recentHealthRate > olderHealthRate + 0.1) return 1; // Improving
    if (recentHealthRate < olderHealthRate - 0.1) return -1; // Declining
    return 0; // Stable
  }

  // Calculate risk level
  private calculateRiskLevel(history: CropHealthHistory): "low" | "medium" | "high" {
    const healthRate = history.healthyScans / history.totalScans;
    const recentScans = history.scans.slice(-3);
    const recentDiseased = recentScans.filter((s) => !s.isHealthy).length;

    if (recentDiseased >= 2 || healthRate < 0.5) return "high";
    if (recentDiseased === 1 || healthRate < 0.75) return "medium";
    return "low";
  }

  // Generate unique crop ID
  private generateCropId(cropType: string, fieldSection: string): string {
    return `${cropType.toLowerCase()}_${fieldSection.toLowerCase()}`;
  }

  // Save history
  private saveHistory(userId: string, history: CropHealthHistory[]): void {
    localStorage.setItem(`${this.storageKey}_${userId}`, JSON.stringify(history));
  }

  // Get history for specific crop
  getCropHistory(userId: string, cropType: string, fieldSection?: string): CropHealthHistory | null {
    const history = this.getAllHistory(userId);
    const cropId = this.generateCropId(cropType, fieldSection || "default");
    return history.find((h) => h.cropId === cropId) || null;
  }

  // Get statistics
  getStatistics(userId: string) {
    const history = this.getAllHistory(userId);
    const totalScans = history.reduce((sum, h) => sum + h.totalScans, 0);
    const totalHealthy = history.reduce((sum, h) => sum + h.healthyScans, 0);
    const totalDiseased = history.reduce((sum, h) => sum + h.diseasedScans, 0);

    return {
      totalCrops: history.length,
      totalScans,
      totalHealthy,
      totalDiseased,
      healthRate: totalScans > 0 ? (totalHealthy / totalScans) * 100 : 0,
      highRiskCrops: history.filter((h) => h.riskLevel === "high").length,
      mediumRiskCrops: history.filter((h) => h.riskLevel === "medium").length,
    };
  }

  // Delete old scans (keep last 50 per crop)
  cleanOldScans(userId: string): void {
    const history = this.getAllHistory(userId);
    history.forEach((h) => {
      if (h.scans.length > 50) {
        h.scans = h.scans.slice(-50);
      }
    });
    this.saveHistory(userId, history);
  }
}

export const healthHistoryManager = new HealthHistoryManager();
