"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./styles/Home.module.css";
import Head from "next/head";
import { CropDataManager, CropAnalysisResult } from "../utils/cropDataManager";

interface TreatmentInfo {
  immediate: string;
  prevention: string;
  followUp?: string;
}

interface AnalysisResults {
  isHealthy: boolean;
  detectedDisease?: string;
  plantType?: string;
  confidence?: number;
  observations?: string;
  treatment?: TreatmentInfo;
  severity?: string;
  environmentalFactors?: string;
  farmSpecificAdvice?: string;
  analyzedBy?: string;
  farmName?: string;
  farmLocation?: string;
  farmSize?: number;
  currentWeather?: WeatherData;
  timestamp?: string;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  windSpeed: number;
  pressure: number;
  location: string;
}

interface Farmer {
  id: string;
  name: string;
  email: string;
  password: string;
  farmName: string;
  location: string;
  farmSize: number;
  cropTypes: string[];
  experienceYears: number;
  phone: string;
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Farmer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showWebcam, setShowWebcam] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("currentUser");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
    } else {
      // Redirect to login if no user data
      window.location.href = "/";
      return;
    }
    setIsLoading(false);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid image file (JPG, PNG, WEBP)");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size should be less than 10MB");
        return;
      }

      setSelectedImage(file);
      setError(null);
      setResults(null);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setImagePreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Convert image to base64
      const base64Image = await convertToBase64(selectedImage);

      // Call API for real AI analysis
      const response = await fetch("/api/analyze-crop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
          mimeType: selectedImage.type,
          userId: currentUser?.id,
          farmName: currentUser?.farmName,
          userName: currentUser?.name,
          userLocation: currentUser?.location,
          farmSize: currentUser?.farmSize,
          cropTypes: currentUser?.cropTypes,
          experienceYears: currentUser?.experienceYears,
          phoneNumber: currentUser?.phone || '+27825185584',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === "Invalid image type") {
          throw new Error(errorData.message || "Please upload a valid plant or crop image.");
        }
        if (errorData.error === "Unknown plant detected") {
          throw new Error(errorData.message || "Unknown plant");
        }
        throw new Error(errorData.error || "Analysis failed");
      }

      const result = await response.json();
      // Add personalized information to results
      const personalizedResult = {
        ...result,
        analyzedBy: currentUser?.name,
        farmName: currentUser?.farmName,
        timestamp: new Date().toISOString(),
      };
      setResults(personalizedResult);

      // Save analysis to user's history
      saveAnalysisToHistory(personalizedResult);
    } catch (err) {
      console.error("Analysis error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze image. Please try again.";
      setError(errorMessage);

      // If it's an invalid image type or unknown plant error, clear the selected image
      if (errorMessage.includes("plant or crop") || errorMessage.includes("supported crops")) {
        setSelectedImage(null);
        setImagePreview(null);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setResults(null);
    setError(null);
    stopWebcam();
  };

  const startWebcam = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
      });
      setStream(mediaStream);
      setShowWebcam(true);
      setError(null);

      // Set video source when video element is ready
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowWebcam(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas to blob and then to file
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "webcam-capture.jpg", {
              type: "image/jpeg",
            });
            setSelectedImage(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result && typeof e.target.result === "string") {
                setImagePreview(e.target.result);
              }
            };
            reader.readAsDataURL(file);

            // Stop webcam after capture
            stopWebcam();
          }
        }, "image/jpeg", 0.95);
      }
    }
  };

  // Cleanup webcam on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const saveAnalysisToHistory = async (analysisResult: AnalysisResults) => {
    if (!currentUser) return;

    // Import health history manager
    const { healthHistoryManager } = await import("../utils/healthHistoryManager");
    const { reminderManager } = await import("../utils/reminderManager");

    // Save to health history
    const scan = {
      id: `scan_${Date.now()}`,
      timestamp: new Date(),
      cropType: analysisResult.plantType || "Unknown",
      fieldSection: "default", // TODO: Let user select field section
      isHealthy: analysisResult.isHealthy,
      detectedDisease: analysisResult.detectedDisease || null,
      severity: analysisResult.severity || "none",
      confidence: analysisResult.confidence || 0,
      treatment: analysisResult.treatment ? {
        immediate: analysisResult.treatment.immediate,
        prevention: analysisResult.treatment.prevention,
        followUp: analysisResult.treatment.followUp || "No follow-up needed"
      } : undefined,
      observations: analysisResult.observations,
      weatherConditions: analysisResult.currentWeather
        ? {
            temperature: analysisResult.currentWeather.temperature,
            humidity: analysisResult.currentWeather.humidity,
            description: analysisResult.currentWeather.description,
          }
        : undefined,
    };

    healthHistoryManager.addScan(currentUser.id, scan);

    // Create smart reminders if disease detected
    if (!analysisResult.isHealthy && analysisResult.treatment?.immediate) {
      // Create immediate treatment reminder
      reminderManager.createTreatmentReminder(
        currentUser.id,
        analysisResult.plantType || "Unknown",
        analysisResult.detectedDisease || "Disease",
        analysisResult.treatment.immediate,
        0 // Immediate
      );

      // Create rescan reminder (7 days after treatment)
      reminderManager.createRescanReminder(
        currentUser.id,
        analysisResult.plantType || "Unknown",
        scan.id,
        7
      );
    }

    // Generate weather-based reminders
    if (analysisResult.currentWeather && currentUser.cropTypes) {
      reminderManager.generateWeatherBasedReminders(
        currentUser.id,
        analysisResult.currentWeather,
        currentUser.cropTypes
      );
    }

    // Get weather data for the analysis
    let weatherConditions;
    try {
      const weatherResponse = await fetch(`/api/weather?location=${encodeURIComponent(currentUser.location)}`);
      if (weatherResponse.ok) {
        const weather = await weatherResponse.json();
        weatherConditions = {
          temperature: weather.temperature,
          humidity: weather.humidity,
          rainfall: weather.rainfall || 0
        };
      }
    } catch (error) {
      console.warn('Could not fetch weather data:', error);
    }

    // Convert to CropAnalysisResult format
    const cropAnalysis: CropAnalysisResult = {
      id: Date.now().toString(),
      cropType: analysisResult.plantType || 'Unknown Crop',
      healthScore: analysisResult.isHealthy ? (analysisResult.confidence || 85) : Math.max(30, (analysisResult.confidence || 50) - 20),
      diseaseDetected: !analysisResult.isHealthy,
      diseaseName: analysisResult.detectedDisease,
      confidence: analysisResult.confidence || 0,
      area: Math.round(currentUser.farmSize / (currentUser.cropTypes.length || 1) * 10) / 10,
      imageUrl: imagePreview || undefined,
      analysisDate: new Date().toISOString(),
      recommendations: [
        ...(analysisResult.treatment?.immediate ? [analysisResult.treatment.immediate] : []),
        ...(analysisResult.treatment?.prevention ? [analysisResult.treatment.prevention] : []),
        ...(analysisResult.farmSpecificAdvice ? [analysisResult.farmSpecificAdvice] : [])
      ],
      severity: analysisResult.severity?.toLowerCase() as 'low' | 'medium' | 'high' || 'medium',
      affectedArea: analysisResult.isHealthy ? 0 : Math.random() * 30 + 10, // 10-40% if diseased
      location: currentUser.location,
      weatherConditions,
      notes: analysisResult.observations || ''
    };

    // Save using CropDataManager
    CropDataManager.saveAnalysisResult(currentUser.id, cropAnalysis);

    // Also save to legacy format for backward compatibility (can be removed later)
    const analysisHistory = JSON.parse(
      localStorage.getItem(`analysisHistory_${currentUser.id}`) || "[]"
    );

    const newAnalysis = {
      id: cropAnalysis.id,
      ...analysisResult,
      image: imagePreview,
    };

    analysisHistory.unshift(newAnalysis);
    if (analysisHistory.length > 50) {
      analysisHistory.splice(50);
    }

    localStorage.setItem(
      `analysisHistory_${currentUser.id}`,
      JSON.stringify(analysisHistory)
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    window.location.href = "/";
  };

  const goToDashboard = () => {
    window.location.href = "/dashboard";
  };

  const downloadReportPDF = async () => {
    if (!results || !currentUser) return;

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Crop Analysis Report - ${results.plantType || 'Unknown Crop'}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #333; line-height: 1.6; }
            .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .header h1 { color: #10b981; margin: 0; font-size: 2.5em; }
            .header p { margin: 5px 0; color: #666; }
            .status-banner {
              background: ${results.isHealthy ? '#d1fae5' : '#fee2e2'};
              color: ${results.isHealthy ? '#065f46' : '#991b1b'};
              padding: 20px; border-radius: 10px; text-align: center;
              font-size: 1.5em; font-weight: bold; margin: 20px 0;
            }
            .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
            .info-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; }
            .info-card h3 { color: #374151; margin-top: 0; }
            .section { margin: 30px 0; }
            .section h2 { color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
            .confidence-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
            .confidence-fill { background: linear-gradient(90deg, #10b981, #059669); height: 100%; border-radius: 10px; }
            .treatment-section { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #3b82f6; }
            .weather-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0; }
            .weather-item { background: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
            .footer { text-align: center; margin-top: 50px; color: #666; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🌱 CropGuard AI Analysis Report</h1>
            <p><strong>Farm:</strong> ${results.farmName || currentUser.farmName}</p>
            <p><strong>Farmer:</strong> ${results.analyzedBy || currentUser.name}</p>
            <p><strong>Analysis Date:</strong> ${new Date(results.timestamp || '').toLocaleString()}</p>
          </div>

          <div class="status-banner">
            ${results.isHealthy ? '✅ HEALTHY CROP DETECTED' : '⚠️ DISEASE DETECTED'}
          </div>

          <div class="info-grid">
            <div class="info-card">
              <h3>🌿 Plant Type</h3>
              <p style="font-size: 1.2em; font-weight: bold;">${results.plantType || 'Not identified'}</p>
            </div>
            <div class="info-card">
              <h3>🔍 Disease Detection</h3>
              <p style="font-size: 1.2em; font-weight: bold; color: ${results.isHealthy ? '#10b981' : '#ef4444'};">
                ${results.detectedDisease || 'None Found'}
              </p>
            </div>
            <div class="info-card">
              <h3>🎯 AI Confidence</h3>
              <p style="font-size: 1.2em; font-weight: bold;">${Math.round(results.confidence || 0)}%</p>
              <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${Math.round(results.confidence || 0)}%"></div>
              </div>
            </div>
            <div class="info-card">
              <h3>📊 Severity Level</h3>
              <p style="font-size: 1.2em; font-weight: bold; color: ${
                results.severity === 'high' ? '#ef4444' :
                results.severity === 'medium' ? '#f59e0b' : '#10b981'
              };">
                ${results.severity || 'Not assessed'}
              </p>
            </div>
          </div>

          ${results.observations ? `
            <div class="section">
              <h2>🔬 AI Observations</h2>
              <p style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1;">
                ${results.observations}
              </p>
            </div>
          ` : ''}

          ${results.treatment ? `
            <div class="section">
              <h2>🩺 Treatment Recommendations</h2>
              <div class="treatment-section">
                <h3 style="color: #1e40af;">Immediate Treatment:</h3>
                <p>${results.treatment.immediate}</p>
              </div>
              <div class="treatment-section">
                <h3 style="color: #1e40af;">Prevention Measures:</h3>
                <p>${results.treatment.prevention}</p>
              </div>
              ${results.treatment.followUp ? `
                <div class="treatment-section">
                  <h3 style="color: #1e40af;">Follow-up Care:</h3>
                  <p>${results.treatment.followUp}</p>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${results.currentWeather ? `
            <div class="section">
              <h2>🌤️ Weather Conditions During Analysis</h2>
              <div class="weather-grid">
                <div class="weather-item">
                  <strong>Temperature</strong><br>
                  ${results.currentWeather.temperature}°C
                </div>
                <div class="weather-item">
                  <strong>Humidity</strong><br>
                  ${results.currentWeather.humidity}%
                </div>
                <div class="weather-item">
                  <strong>Conditions</strong><br>
                  ${results.currentWeather.description}
                </div>
                <div class="weather-item">
                  <strong>Wind Speed</strong><br>
                  ${results.currentWeather.windSpeed} m/s
                </div>
              </div>
            </div>
          ` : ''}

          ${results.environmentalFactors ? `
            <div class="section">
              <h2>🌱 Environmental Impact Analysis</h2>
              <p style="background: #ecfdf5; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
                ${results.environmentalFactors}
              </p>
            </div>
          ` : ''}

          ${results.farmSpecificAdvice ? `
            <div class="section">
              <h2>🏡 Farm-Specific Recommendations</h2>
              <p style="background: #fefce8; padding: 20px; border-radius: 8px; border-left: 4px solid #eab308;">
                ${results.farmSpecificAdvice}
              </p>
            </div>
          ` : ''}

          <div class="footer">
            <p><strong>Generated by CropGuard AI</strong></p>
            <p>Advanced AI-powered crop disease detection and analysis</p>
            <p>Report generated on ${new Date().toLocaleString()}</p>
            <p>For questions or support, contact your agricultural advisor</p>
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
      console.error('PDF generation failed:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>CropGuard AI - Intelligent Crop Disease Detection</title>
        <meta
          name="description"
          content="AI-powered crop disease detection and treatment recommendations"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.nav}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>🌱</div>
              <span>CropGuard AI</span>
            </div>
            <div className={styles.navLinks}>
              <div className={styles.userInfo}>
                <span className={styles.welcomeText}>
                  Welcome, {currentUser?.name}
                </span>
                <span className={styles.farmInfo}>
                  {currentUser?.farmName}
                </span>
              </div>
              <button
                className={styles.dashboardBtn}
                onClick={() => (window.location.href = "/crop-advisor")}
              >
                Crop Advisor
              </button>
              <button
                className={styles.dashboardBtn}
                onClick={goToDashboard}
              >
                Dashboard
              </button>
              <button
                className={styles.logoutBtn}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.hero}>
            <div className={styles.analysisCard}>
              <div className={styles.cardHeader}>
                <div className={styles.statusIndicator}>
                  <span className={styles.statusDots}></span>
                  <span>CropGuard AI Analysis</span>
                </div>
              </div>

              <div className={styles.uploadArea}>
                {showWebcam ? (
                  <div className={styles.webcamContainer}>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className={styles.webcamVideo}
                    />
                    <div className={styles.webcamActions}>
                      <button
                        className={styles.captureBtn}
                        onClick={capturePhoto}
                      >
                        📷 Capture Photo
                      </button>
                      <button
                        className={styles.cancelWebcamBtn}
                        onClick={stopWebcam}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : imagePreview ? (
                  <div className={styles.imagePreview}>
                    <img src={imagePreview} alt="Selected crop" />
                    <div className={styles.imageActions}>
                      <button
                        className={styles.changeImageBtn}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Image
                      </button>
                      <button
                        className={styles.resetBtn}
                        onClick={resetAnalysis}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      className={styles.uploadPlaceholder}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className={styles.uploadIcon}>📸</div>
                      <p>Click to upload crop image</p>
                      <p className={styles.uploadHint}>
                        Support JPG, PNG, WEBP formats (max 10MB)
                      </p>
                    </div>
                    <div className={styles.orDivider}>
                      <span>OR</span>
                    </div>
                    <button
                      className={styles.webcamBtn}
                      onClick={startWebcam}
                    >
                      📷 Use Camera
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleImageUpload}
                  className={styles.hiddenFileInput}
                  aria-label="Upload crop image for analysis"
                  title="Select an image file to analyze for crop diseases"
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
              </div>

              <button
                className={`${styles.analyzeBtn} ${
                  analyzing ? styles.analyzing : ""
                }`}
                onClick={analyzeImage}
                disabled={analyzing || !selectedImage}
              >
                {analyzing ? (
                  <>
                    <span className={styles.spinner}></span>
                    Analyzing...
                  </>
                ) : (
                  "Analyze"
                )}
              </button>

              {error && (
                <div className={styles.error}>
                  <p>❌ {error}</p>
                </div>
              )}

              {results && (
                <div className={styles.results}>
                  <div className={styles.analysisHeader}>
                    <div className={styles.analysisInfo}>
                      <span className={styles.analysisBy}>
                        Analyzed by: {results.analyzedBy}
                      </span>
                      {results.farmName && (
                        <span className={styles.farmName}>
                          Farm: {results.farmName}
                        </span>
                      )}
                      <span className={styles.timestamp}>
                        {new Date(results.timestamp || '').toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={downloadReportPDF}
                      className={styles.downloadButton}
                      title="Download analysis report as PDF"
                    >
                      📄 Download Report
                    </button>
                  </div>

                  <div className={styles.healthStatus}>
                    <span className={styles.statusLabel}>Overall Health</span>
                    <span
                      className={`${styles.statusValue} ${
                        results.isHealthy ? styles.excellent : styles.warning
                      }`}
                    >
                      {results.isHealthy ? "Healthy" : "Disease Detected"}
                    </span>
                  </div>

                  <div className={styles.diseaseDetection}>
                    <div className={styles.detectionHeader}>
                      <span>🔍 Disease Detection</span>
                      <span className={styles.detectionResult}>
                        {results.detectedDisease || "None Found"}
                      </span>
                    </div>
                  </div>

                  {results.plantType && (
                    <div className={styles.plantInfo}>
                      <span className={styles.plantLabel}>
                        🌿 Plant Identified:
                      </span>
                      <span className={styles.plantType}>
                        {results.plantType}
                      </span>
                    </div>
                  )}

                  {results.confidence && (
                    <div className={styles.confidence}>
                      <div className={styles.confidenceBar}>
                        <span>AI Confidence</span>
                        <span>{Math.round(results.confidence)}%</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progress}
                          style={{
                            width: `${Math.round(results.confidence)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {results.observations && (
                    <div className={styles.observations}>
                      <h4>🔬 AI Observations</h4>
                      <p>{results.observations}</p>
                    </div>
                  )}

                  {results.treatment && (
                    <div className={styles.treatmentInfo}>
                      <h4>🩺 Treatment Recommendations</h4>
                      <div className={styles.treatmentCard}>
                        <div className={styles.treatmentSection}>
                          <h5>Immediate Treatment:</h5>
                          <p>{results.treatment.immediate}</p>
                        </div>
                        <div className={styles.treatmentSection}>
                          <h5>Prevention Measures:</h5>
                          <p>{results.treatment.prevention}</p>
                        </div>
                        {results.treatment.followUp && (
                          <div className={styles.treatmentSection}>
                            <h5>Follow-up Care:</h5>
                            <p>{results.treatment.followUp}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {results.severity && (
                    <div className={styles.severity}>
                      <span className={styles.severityLabel}>
                        Severity Level:
                      </span>
                      <span
                        className={`${styles.severityValue} ${
                          styles[results.severity.toLowerCase()]
                        }`}
                      >
                        {results.severity}
                      </span>
                    </div>
                  )}

                  {results.currentWeather && (
                    <div className={styles.weatherInfo}>
                      <h4>🌤️ Current Weather Conditions</h4>
                      <div className={styles.weatherGrid}>
                        <div className={styles.weatherItem}>
                          <span>Temperature:</span>
                          <span>{results.currentWeather.temperature}°C</span>
                        </div>
                        <div className={styles.weatherItem}>
                          <span>Humidity:</span>
                          <span>{results.currentWeather.humidity}%</span>
                        </div>
                        <div className={styles.weatherItem}>
                          <span>Conditions:</span>
                          <span>{results.currentWeather.description}</span>
                        </div>
                        <div className={styles.weatherItem}>
                          <span>Wind:</span>
                          <span>{results.currentWeather.windSpeed} m/s</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {results.environmentalFactors && (
                    <div className={styles.environmentalFactors}>
                      <h4>🌱 Environmental Impact</h4>
                      <p>{results.environmentalFactors}</p>
                    </div>
                  )}

                  {results.farmSpecificAdvice && (
                    <div className={styles.farmAdvice}>
                      <h4>🏡 Farm-Specific Recommendations</h4>
                      <p>{results.farmSpecificAdvice}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={styles.features}>
            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.featureIconRed}`}>
                🔍
              </div>
              <h3>Detect</h3>
              <p>
                Identify crop diseases early using advanced AI image analysis
                across 13+ plant species with 95%+ accuracy.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.featureIconGreen}`}>
                🛡️
              </div>
              <h3>Protect</h3>
              <p>
                Get instant treatment recommendations and preventive measures
                tailored to your specific crop and condition.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={`${styles.featureIcon} ${styles.featureIconBlue}`}>
                📈
              </div>
              <h3>Optimize</h3>
              <p>
                Monitor crop health trends and receive data-driven insights to
                maximize yield and minimize losses.
              </p>
            </div>
          </div>
        </main>

        <footer className={styles.footer}>
          <p>&copy; 2024 CropGuard AI. Powered by advanced machine learning.</p>
        </footer>
      </div>
    </>
  );
}
