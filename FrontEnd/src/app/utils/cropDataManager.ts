// Crop Analysis Data Management System
// Handles storing and retrieving real crop analysis data from localStorage

export interface CropAnalysisResult {
  id: string;
  cropType: string;
  healthScore: number;
  diseaseDetected: boolean;
  diseaseName?: string;
  confidence: number;
  area: number;
  imageUrl?: string;
  analysisDate: string;
  recommendations: string[];
  severity?: 'low' | 'medium' | 'high';
  affectedArea?: number; // percentage
  location: string;
  weatherConditions?: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };
  notes?: string;
}

export interface CropStats {
  totalScans: number;
  healthyScans: number;
  diseasedScans: number;
  averageHealthScore: number;
  mostCommonDisease?: string;
  lastScanDate?: string;
  trendsData: Array<{
    date: string;
    healthScore: number;
    scansCount: number;
  }>;
}

export class CropDataManager {
  private static readonly STORAGE_KEY = 'crop_analysis_data';
  private static readonly STATS_KEY = 'crop_analysis_stats';

  // Save a new analysis result
  static saveAnalysisResult(userId: string, result: CropAnalysisResult): void {
    const key = `${this.STORAGE_KEY}_${userId}`;
    const existingData = this.getAnalysisResults(userId);
    existingData.push(result);

    // Keep only last 100 results to prevent storage bloat
    const limitedData = existingData.slice(-100);
    localStorage.setItem(key, JSON.stringify(limitedData));

    // Update stats
    this.updateStats(userId, result);
  }

  // Get all analysis results for a user
  static getAnalysisResults(userId: string): CropAnalysisResult[] {
    const key = `${this.STORAGE_KEY}_${userId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  // Get recent analysis results (last N days)
  static getRecentAnalysisResults(userId: string, days: number = 30): CropAnalysisResult[] {
    const allResults = this.getAnalysisResults(userId);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return allResults.filter(result =>
      new Date(result.analysisDate) >= cutoffDate
    );
  }

  // Get analysis results by crop type
  static getAnalysisResultsByCrop(userId: string, cropType: string): CropAnalysisResult[] {
    return this.getAnalysisResults(userId).filter(result =>
      result.cropType.toLowerCase() === cropType.toLowerCase()
    );
  }

  // Generate crop data for dashboard (replaces dummy data)
  static generateCropDataForDashboard(userId: string): Array<{
    cropType: string;
    healthScore: number;
    lastScanned: string;
    diseaseDetected: boolean;
    area: number;
    scanCount: number;
    trend: 'up' | 'down' | 'stable';
  }> {
    const results = this.getRecentAnalysisResults(userId);

    if (results.length === 0) {
      return []; // No dummy data - return empty array
    }

    // Group by crop type
    const cropGroups = results.reduce((groups, result) => {
      const key = result.cropType;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(result);
      return groups;
    }, {} as Record<string, CropAnalysisResult[]>);

    // Generate dashboard data for each crop type
    return Object.entries(cropGroups).map(([cropType, cropResults]) => {
      const sortedResults = cropResults.sort((a, b) =>
        new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime()
      );

      const latestResult = sortedResults[0];
      const averageHealth = Math.round(
        cropResults.reduce((sum, r) => sum + r.healthScore, 0) / cropResults.length
      );

      // Calculate trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (sortedResults.length >= 2) {
        const recent = sortedResults.slice(0, 3);
        const older = sortedResults.slice(3, 6);
        if (recent.length > 0 && older.length > 0) {
          const recentAvg = recent.reduce((sum, r) => sum + r.healthScore, 0) / recent.length;
          const olderAvg = older.reduce((sum, r) => sum + r.healthScore, 0) / older.length;
          trend = recentAvg > olderAvg + 5 ? 'up' : recentAvg < olderAvg - 5 ? 'down' : 'stable';
        }
      }

      // Format last scanned time
      const lastScanDate = new Date(latestResult.analysisDate);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - lastScanDate.getTime()) / (1000 * 60 * 60));
      const lastScanned = diffHours < 1 ? 'Just now' :
                         diffHours < 24 ? `${diffHours} hours ago` :
                         diffHours < 168 ? `${Math.floor(diffHours / 24)} days ago` :
                         `${Math.floor(diffHours / 168)} weeks ago`;

      return {
        cropType,
        healthScore: averageHealth,
        lastScanned,
        diseaseDetected: latestResult.diseaseDetected,
        area: latestResult.area,
        scanCount: cropResults.length,
        trend
      };
    });
  }

  // Update statistics
  private static updateStats(userId: string, newResult: CropAnalysisResult): void {
    const statsKey = `${this.STATS_KEY}_${userId}`;
    const existingStats = this.getStats(userId);

    existingStats.totalScans += 1;
    if (newResult.diseaseDetected) {
      existingStats.diseasedScans += 1;
    } else {
      existingStats.healthyScans += 1;
    }

    // Recalculate average health score
    const allResults = this.getAnalysisResults(userId);
    existingStats.averageHealthScore = Math.round(
      allResults.reduce((sum, r) => sum + r.healthScore, 0) / allResults.length
    );

    existingStats.lastScanDate = newResult.analysisDate;

    // Update trends data
    const today = new Date().toISOString().split('T')[0];
    const todayTrend = existingStats.trendsData.find(t => t.date === today);

    if (todayTrend) {
      todayTrend.scansCount += 1;
      todayTrend.healthScore = Math.round(
        (todayTrend.healthScore * (todayTrend.scansCount - 1) + newResult.healthScore) / todayTrend.scansCount
      );
    } else {
      existingStats.trendsData.push({
        date: today,
        healthScore: newResult.healthScore,
        scansCount: 1
      });
    }

    // Keep only last 30 days of trends
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    existingStats.trendsData = existingStats.trendsData.filter(
      t => new Date(t.date) >= cutoffDate
    );

    localStorage.setItem(statsKey, JSON.stringify(existingStats));
  }

  // Get statistics for a user
  static getStats(userId: string): CropStats {
    const statsKey = `${this.STATS_KEY}_${userId}`;
    const data = localStorage.getItem(statsKey);

    if (data) {
      return JSON.parse(data);
    }

    // Return default stats structure
    return {
      totalScans: 0,
      healthyScans: 0,
      diseasedScans: 0,
      averageHealthScore: 0,
      trendsData: []
    };
  }

  // Get disease statistics
  static getDiseaseStats(userId: string): Record<string, number> {
    const results = this.getAnalysisResults(userId);
    const diseaseResults = results.filter(r => r.diseaseDetected && r.diseaseName);

    return diseaseResults.reduce((stats, result) => {
      const disease = result.diseaseName!;
      stats[disease] = (stats[disease] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
  }

  // Clear all data (for testing or reset)
  static clearUserData(userId: string): void {
    localStorage.removeItem(`${this.STORAGE_KEY}_${userId}`);
    localStorage.removeItem(`${this.STATS_KEY}_${userId}`);
  }

  // Export data for backup/download
  static exportUserData(userId: string): {
    analysisResults: CropAnalysisResult[];
    stats: CropStats;
    exportDate: string;
  } {
    return {
      analysisResults: this.getAnalysisResults(userId),
      stats: this.getStats(userId),
      exportDate: new Date().toISOString()
    };
  }
}