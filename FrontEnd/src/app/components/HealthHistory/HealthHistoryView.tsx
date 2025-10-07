"use client";

import { useState, useEffect } from "react";
import { healthHistoryManager, CropHealthHistory } from "../../utils/healthHistoryManager";
import styles from "./HealthHistory.module.css";

interface HealthHistoryViewProps {
  userId: string;
}

export default function HealthHistoryView({ userId }: HealthHistoryViewProps) {
  const [history, setHistory] = useState<CropHealthHistory[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<CropHealthHistory | null>(null);
  const [statistics, setStatistics] = useState<any>(null);

  useEffect(() => {
    loadHistory();
  }, [userId]);

  const loadHistory = () => {
    const allHistory = healthHistoryManager.getAllHistory(userId);
    const stats = healthHistoryManager.getStatistics(userId);
    setHistory(allHistory);
    setStatistics(stats);
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return "📈";
    if (trend < 0) return "📉";
    return "➡️";
  };

  const getTrendText = (trend: number) => {
    if (trend > 0) return "Improving";
    if (trend < 0) return "Declining";
    return "Stable";
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🌱 Crop Health History</h2>
        <p>Track your crops health over time</p>
      </div>

      {statistics && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{statistics.totalCrops}</div>
            <div className={styles.statLabel}>Tracked Crops</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{statistics.totalScans}</div>
            <div className={styles.statLabel}>Total Scans</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{statistics.healthRate.toFixed(1)}%</div>
            <div className={styles.statLabel}>Health Rate</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue} style={{ color: "#ef4444" }}>
              {statistics.highRiskCrops}
            </div>
            <div className={styles.statLabel}>High Risk Crops</div>
          </div>
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.cropList}>
          <h3>Your Crops</h3>
          {history.length === 0 ? (
            <div className={styles.emptyState}>
              <p>📊 No scan history yet</p>
              <p className={styles.emptyHint}>Start analyzing crops to see trends here</p>
            </div>
          ) : (
            history.map((crop) => (
              <div
                key={crop.cropId}
                className={`${styles.cropCard} ${
                  selectedCrop?.cropId === crop.cropId ? styles.selected : ""
                }`}
                onClick={() => setSelectedCrop(crop)}
              >
                <div className={styles.cropCardHeader}>
                  <div className={styles.cropName}>
                    <span className={styles.cropIcon}>🌿</span>
                    <div>
                      <div className={styles.cropTitle}>{crop.cropType}</div>
                      <div className={styles.cropSubtitle}>
                        {crop.fieldSection !== "default" && `Field: ${crop.fieldSection}`}
                      </div>
                    </div>
                  </div>
                  <div
                    className={styles.riskBadge}
                    style={{ backgroundColor: getRiskColor(crop.riskLevel) }}
                  >
                    {crop.riskLevel.toUpperCase()}
                  </div>
                </div>

                <div className={styles.cropStats}>
                  <div className={styles.miniStat}>
                    <span className={styles.miniLabel}>Scans</span>
                    <span className={styles.miniValue}>{crop.totalScans}</span>
                  </div>
                  <div className={styles.miniStat}>
                    <span className={styles.miniLabel}>Healthy</span>
                    <span className={styles.miniValue}>{crop.healthyScans}</span>
                  </div>
                  <div className={styles.miniStat}>
                    <span className={styles.miniLabel}>Trend</span>
                    <span className={styles.miniValue}>
                      {getTrendIcon(crop.healthTrend)}
                    </span>
                  </div>
                </div>

                <div className={styles.lastScanned}>
                  Last scanned: {new Date(crop.lastScanned).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>

        {selectedCrop && (
          <div className={styles.detailsPanel}>
            <div className={styles.detailsHeader}>
              <h3>{selectedCrop.cropType} - Details</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedCrop(null)}
              >
                ✕
              </button>
            </div>

            <div className={styles.trendSection}>
              <div className={styles.trendCard}>
                <span className={styles.trendIcon}>{getTrendIcon(selectedCrop.healthTrend)}</span>
                <div>
                  <div className={styles.trendLabel}>Health Trend</div>
                  <div className={styles.trendValue}>{getTrendText(selectedCrop.healthTrend)}</div>
                </div>
              </div>
            </div>

            {selectedCrop.commonDiseases.length > 0 && (
              <div className={styles.diseasesSection}>
                <h4>Common Issues</h4>
                <div className={styles.diseaseList}>
                  {selectedCrop.commonDiseases.map((disease, idx) => (
                    <div key={idx} className={styles.diseaseItem}>
                      <span className={styles.diseaseName}>{disease.name}</span>
                      <span className={styles.diseaseCount}>
                        {disease.count} {disease.count === 1 ? "time" : "times"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.scanHistory}>
              <h4>Scan Timeline</h4>
              <div className={styles.timeline}>
                {selectedCrop.scans.slice().reverse().map((scan, idx) => (
                  <div key={scan.id} className={styles.timelineItem}>
                    <div className={styles.timelineDot} style={{
                      backgroundColor: scan.isHealthy ? "#10b981" : "#ef4444"
                    }}></div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineStatus}>
                          {scan.isHealthy ? "✅ Healthy" : "⚠️ " + scan.detectedDisease}
                        </span>
                        <span className={styles.timelineDate}>
                          {new Date(scan.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      {!scan.isHealthy && (
                        <div className={styles.timelineDetails}>
                          <div className={styles.timelineDetail}>
                            <strong>Severity:</strong> {scan.severity}
                          </div>
                          <div className={styles.timelineDetail}>
                            <strong>Confidence:</strong> {scan.confidence}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
