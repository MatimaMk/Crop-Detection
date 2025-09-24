"use client";
import { useState, useRef, useEffect } from "react";
import styles from "./styles/Home.module.css";
import Head from "next/head";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
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
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze image. Please try again."
      );
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
  };

  const saveAnalysisToHistory = (analysisResult: AnalysisResults) => {
    if (!currentUser) return;

    const analysisHistory = JSON.parse(
      localStorage.getItem(`analysisHistory_${currentUser.id}`) || "[]"
    );

    const newAnalysis = {
      id: Date.now().toString(),
      ...analysisResult,
      image: imagePreview, // Save the image preview too
    };

    analysisHistory.unshift(newAnalysis); // Add to beginning

    // Keep only last 50 analyses
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
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Whatever crop you <br />
                <span className={styles.highlight}>wanna protect</span> <br />
                and whatever <br />
                disease you want <br />
                <span className={styles.detectText}>to detect</span>
              </h1>
              <p className={styles.subtitle}>
                DO IT WITH OUR way with our guided AI detection programme
              </p>
              <p className={styles.description}>
                Try it now, powered by advanced AI technology for real-time crop
                analysis
              </p>
            </div>

            <div className={styles.analysisCard}>
              <div className={styles.cardHeader}>
                <div className={styles.statusIndicator}>
                  <span className={styles.statusDots}></span>
                  <span>CropGuard AI Analysis</span>
                </div>
              </div>

              <div className={styles.uploadArea}>
                {imagePreview ? (
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
                    AI Analyzing...
                  </>
                ) : (
                  "🔍 Analyze Crop Health with AI"
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
