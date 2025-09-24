"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Home,
  ArrowLeft,
} from "lucide-react";
import {
  CropDataManager,
  CropStats,
  CropAnalysisResult,
} from "../utils/cropDataManager";
import styles from "./stats.module.css";

interface Farmer {
  id: string;
  name: string;
  farmName: string;
  location: string;
  farmSize: number;
}

export default function StatsPage() {
  const [currentUser, setCurrentUser] = useState<Farmer | null>(null);
  const [stats, setStats] = useState<CropStats | null>(null);
  const [analysisResults, setAnalysisResults] = useState<CropAnalysisResult[]>(
    []
  );
  const [diseaseStats, setDiseaseStats] = useState<Record<string, number>>({});
  const [selectedTimeframe, setSelectedTimeframe] = useState<"7" | "30" | "90">(
    "30"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      loadStatsData(user.id);
    } else {
      window.location.href = "/";
      return;
    }
    setIsLoading(false);
  }, []);

  const loadStatsData = (userId: string) => {
    const userStats = CropDataManager.getStats(userId);
    const recentResults = CropDataManager.getRecentAnalysisResults(
      userId,
      parseInt(selectedTimeframe)
    );
    const diseases = CropDataManager.getDiseaseStats(userId);

    setStats(userStats);
    setAnalysisResults(recentResults);
    setDiseaseStats(diseases);
  };

  useEffect(() => {
    if (currentUser) {
      loadStatsData(currentUser.id);
    }
  }, [selectedTimeframe]);

  const downloadPDF = async () => {
    if (!currentUser || !stats) return;

    try {
      // Create a comprehensive report object
      const reportData = {
        farmer: currentUser,
        stats,
        analysisResults: analysisResults.slice(0, 10), // Last 10 analyses
        diseaseStats,
        timeframe: selectedTimeframe,
        generatedAt: new Date().toISOString(),
      };

      // Convert to PDF using browser's print functionality
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Crop Analysis Report - ${currentUser.farmName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
            .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #10b981; margin: 0; }
            .header p { margin: 5px 0; color: #666; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
            .stat-card { background: #f9f9f9; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 2em; font-weight: bold; color: #10b981; }
            .stat-label { color: #666; margin-top: 5px; }
            .section { margin: 30px 0; }
            .section h2 { color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
            .analysis-item { background: #f9f9f9; margin: 10px 0; padding: 15px; border-radius: 5px; }
            .analysis-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
            .disease-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .trend-item { display: flex; justify-content: space-between; padding: 5px 0; }
            .healthy { color: #10b981; } .diseased { color: #ef4444; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 Crop Analysis Report</h1>
            <p><strong>Farm:</strong> ${currentUser.farmName}</p>
            <p><strong>Farmer:</strong> ${currentUser.name}</p>
            <p><strong>Location:</strong> ${currentUser.location}</p>
            <p><strong>Farm Size:</strong> ${currentUser.farmSize} acres</p>
            <p><strong>Report Period:</strong> Last ${selectedTimeframe} days</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${stats.totalScans}</div>
              <div class="stat-label">Total Scans</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.healthyScans}</div>
              <div class="stat-label">Healthy Scans</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.diseasedScans}</div>
              <div class="stat-label">Issues Detected</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${stats.averageHealthScore}%</div>
              <div class="stat-label">Avg Health Score</div>
            </div>
          </div>

          <div class="section">
            <h2>📊 Health Trends</h2>
            ${stats.trendsData
              .map(
                (trend) => `
              <div class="trend-item">
                <span>${new Date(trend.date).toLocaleDateString()}</span>
                <span>${trend.healthScore}% (${trend.scansCount} scans)</span>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="section">
            <h2>🦠 Disease Statistics</h2>
            ${
              Object.entries(diseaseStats).length > 0
                ? Object.entries(diseaseStats)
                    .map(
                      ([disease, count]) => `
                <div class="disease-item">
                  <span>${disease}</span>
                  <span>${count} occurrences</span>
                </div>
              `
                    )
                    .join("")
                : "<p>No diseases detected in this period</p>"
            }
          </div>

          <div class="section">
            <h2>🔍 Recent Analysis Results</h2>
            ${analysisResults
              .slice(0, 10)
              .map(
                (result) => `
              <div class="analysis-item">
                <div class="analysis-header">
                  <strong>${result.cropType}</strong>
                  <span class="${
                    result.diseaseDetected ? "diseased" : "healthy"
                  }">
                    ${
                      result.diseaseDetected
                        ? "⚠️ " + (result.diseaseName || "Disease Detected")
                        : "✅ Healthy"
                    }
                  </span>
                </div>
                <p><strong>Health Score:</strong> ${result.healthScore}%</p>
                <p><strong>Date:</strong> ${new Date(
                  result.analysisDate
                ).toLocaleDateString()}</p>
                <p><strong>Area:</strong> ${result.area} acres</p>
                ${
                  result.recommendations.length > 0
                    ? "<p><strong>Recommendations:</strong> " +
                      result.recommendations.join("; ") +
                      "</p>"
                    : ""
                }
              </div>
            `
              )
              .join("")}
          </div>

          <div class="section">
            <p style="text-align: center; color: #666; margin-top: 50px;">
              Generated by CropGuard AI • ${new Date().toLocaleDateString()}
            </p>
          </div>
        </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF report. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !stats) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>No Data Available</h2>
          <p>
            No crop analysis data found. Start scanning crops to see statistics.
          </p>
          <button
            onClick={() => (window.location.href = "/crop-analyzer")}
            className={styles.primaryButton}
          >
            Start Analyzing Crops
          </button>
        </div>
      </div>
    );
  }

  const healthPercentage =
    stats.totalScans > 0
      ? Math.round((stats.healthyScans / stats.totalScans) * 100)
      : 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className={styles.backButton}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className={styles.headerInfo}>
              <h1 className={styles.title}>📊 Crop Analysis Statistics</h1>
              <p className={styles.subtitle}>
                {currentUser.farmName} • {currentUser.location}
              </p>
            </div>
          </div>
          <div className={styles.headerActions}>
            <select
              title="Select timeframe"
              value={selectedTimeframe}
              onChange={(e) =>
                setSelectedTimeframe(e.target.value as "7" | "30" | "90")
              }
              className={styles.timeframeSelect}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
            <button onClick={downloadPDF} className={styles.downloadButton}>
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Overview Cards */}
        <div className={styles.overviewGrid}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <Activity className="w-6 h-6 text-blue-600" />
              <span className={styles.statTrend}>
                {stats.trendsData.length > 1 &&
                  (stats.trendsData[stats.trendsData.length - 1].scansCount >
                  stats.trendsData[stats.trendsData.length - 2].scansCount
                    ? "+"
                    : "")}
              </span>
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.totalScans}</h3>
              <p className={styles.statLabel}>Total Scans</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className={styles.statTrend}>{healthPercentage}%</span>
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.healthyScans}</h3>
              <p className={styles.statLabel}>Healthy Scans</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <span className={styles.statTrend}>
                {100 - healthPercentage}%
              </span>
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.diseasedScans}</h3>
              <p className={styles.statLabel}>Issues Detected</p>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <TrendingUp className="w-6 h-6 text-purple-600" />
              <span className={styles.statTrend}>Avg</span>
            </div>
            <div className={styles.statContent}>
              <h3 className={styles.statValue}>{stats.averageHealthScore}%</h3>
              <p className={styles.statLabel}>Health Score</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={styles.chartsGrid}>
          {/* Health Trends Chart */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>📈 Health Trends</h3>
            {stats.trendsData.length > 0 ? (
              <div className={styles.trendChart}>
                {stats.trendsData.slice(-14).map((trend, index) => (
                  <div key={trend.date} className={styles.trendBar}>
                    <div
                      className={styles.trendBarFill}
                      style={{ height: `${(trend.healthScore / 100) * 120}px` }}
                    />
                    <span className={styles.trendDate}>
                      {new Date(trend.date).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className={styles.trendValue}>
                      {trend.healthScore}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyChart}>
                <p>No trend data available</p>
              </div>
            )}
          </div>

          {/* Disease Distribution */}
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>🦠 Disease Distribution</h3>
            {Object.keys(diseaseStats).length > 0 ? (
              <div className={styles.diseaseChart}>
                {Object.entries(diseaseStats).map(([disease, count]) => (
                  <div key={disease} className={styles.diseaseItem}>
                    <div className={styles.diseaseInfo}>
                      <span className={styles.diseaseName}>{disease}</span>
                      <span className={styles.diseaseCount}>{count} cases</span>
                    </div>
                    <div className={styles.diseaseBar}>
                      <div
                        className={styles.diseaseBarFill}
                        style={{
                          width: `${
                            (count / Math.max(...Object.values(diseaseStats))) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyChart}>
                <CheckCircle className="w-12 h-12 text-green-500 mb-2" />
                <p>No diseases detected!</p>
                <p className="text-sm text-gray-500">Your crops are healthy</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Analysis Results */}
        <div className={styles.resultsSection}>
          <h3 className={styles.sectionTitle}>🔍 Recent Analysis Results</h3>
          {analysisResults.length > 0 ? (
            <div className={styles.resultsList}>
              {analysisResults.slice(0, 10).map((result) => (
                <div key={result.id} className={styles.resultItem}>
                  <div className={styles.resultHeader}>
                    <div className={styles.resultInfo}>
                      <h4 className={styles.resultCrop}>{result.cropType}</h4>
                      <span className={styles.resultDate}>
                        {new Date(result.analysisDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={styles.resultStatus}>
                      {result.diseaseDetected ? (
                        <span className={styles.statusDiseased}>
                          <AlertTriangle className="w-4 h-4" />
                          {result.diseaseName || "Disease"}
                        </span>
                      ) : (
                        <span className={styles.statusHealthy}>
                          <CheckCircle className="w-4 h-4" />
                          Healthy
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.resultDetails}>
                    <div className={styles.resultMetric}>
                      <span>Health Score:</span>
                      <span className={styles.healthScore}>
                        {result.healthScore}%
                      </span>
                    </div>
                    <div className={styles.resultMetric}>
                      <span>Area:</span>
                      <span>{result.area} acres</span>
                    </div>
                    <div className={styles.resultMetric}>
                      <span>Confidence:</span>
                      <span>{Math.round(result.confidence)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyResults}>
              <Activity className="w-12 h-12 text-gray-400 mb-2" />
              <p>No analysis results in selected timeframe</p>
              <button
                onClick={() => (window.location.href = "/crop-analyzer")}
                className={styles.primaryButton}
              >
                Start Analyzing
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
