"use client";

import React, { useState } from "react";
import {
  Leaf,
  Smartphone,
  Brain,
  Database,
  Search,
  Shield,
  TrendingUp,
  Menu,
  X,
  ArrowRight,
  Camera,
  Clock,
  BarChart3,
  Users,
} from "lucide-react";
import styles from "./page.module.css";

export default function CropDiseaseLanding() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    email: string;
    password: string;
    farmName: string;
    location: string;
    farmSize: number;
    cropTypes: string[];
    experienceYears: number;
    phone: string;
  } | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [users, setUsers] = useState([
    {
      id: "1",
      email: "farmer@example.com",
      password: "password123",
      name: "John Farmer",
      farmName: "Greenfield Farm",
      location: "Iowa, USA",
      farmSize: 150,
      cropTypes: ["Corn", "Soybeans"],
      experienceYears: 15,
      phone: "+1-555-0123",
    },
  ]);

  const cropOptions = ["Corn", "Wheat", "Soybeans", "Rice", "Barley", "Oats", "Cotton", "Tomatoes", "Potatoes", "Carrots"];

  // Load users from localStorage on component mount
  React.useEffect(() => {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (error) {
        console.error('Error loading users from localStorage:', error);
      }
    }
  }, []);

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    farmName: "",
    location: "",
    farmSize: "",
    cropTypes: [] as string[],
    experienceYears: "",
    phone: "",
  });
  const [loginError, setLoginError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError("");

    if (!loginForm.email || !loginForm.password) {
      setLoginError("Please fill in all fields");
      return;
    }

    if (!validateEmail(loginForm.email)) {
      setLoginError("Please enter a valid email address");
      return;
    }

    const user = users.find(
      (u) => u.email === loginForm.email && u.password === loginForm.password
    );
    if (user) {
      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(user));

      setIsLoggedIn(true);
      setCurrentUser(user);
      setShowLoginModal(false);
      setLoginForm({ email: "", password: "" });

      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      setLoginError("Invalid email or password");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");
    setIsRegistering(true);

    // Trim whitespace from all string fields
    const trimmedForm = {
      ...registerForm,
      name: registerForm.name.trim(),
      email: registerForm.email.trim().toLowerCase(),
      farmName: registerForm.farmName.trim(),
      location: registerForm.location.trim(),
      phone: registerForm.phone.trim(),
    };

    // Comprehensive validation
    if (
      !trimmedForm.name ||
      !trimmedForm.email ||
      !trimmedForm.password ||
      !trimmedForm.confirmPassword ||
      !trimmedForm.farmName ||
      !trimmedForm.location ||
      !trimmedForm.farmSize ||
      !trimmedForm.experienceYears ||
      !trimmedForm.phone ||
      trimmedForm.cropTypes.length === 0
    ) {
      setRegisterError("Please fill in all fields");
      setIsRegistering(false);
      return;
    }

    // Name validation
    if (trimmedForm.name.length < 2) {
      setRegisterError("Full name must be at least 2 characters");
      setIsRegistering(false);
      return;
    }

    // Email validation
    if (!validateEmail(trimmedForm.email)) {
      setRegisterError("Please enter a valid email address");
      setIsRegistering(false);
      return;
    }

    // Check if email already exists
    if (users.find((u) => u.email === trimmedForm.email)) {
      setRegisterError("An account with this email already exists");
      setIsRegistering(false);
      return;
    }

    // Password validation
    if (trimmedForm.password.length < 6) {
      setRegisterError("Password must be at least 6 characters");
      setIsRegistering(false);
      return;
    }

    if (trimmedForm.password !== trimmedForm.confirmPassword) {
      setRegisterError("Passwords do not match");
      setIsRegistering(false);
      return;
    }

    // Farm size validation
    const farmSizeNum = parseFloat(trimmedForm.farmSize);
    if (isNaN(farmSizeNum) || farmSizeNum <= 0) {
      setRegisterError("Please enter a valid farm size");
      setIsRegistering(false);
      return;
    }

    // Experience validation
    const experienceNum = parseInt(trimmedForm.experienceYears);
    if (isNaN(experienceNum) || experienceNum < 0 || experienceNum > 100) {
      setRegisterError("Please enter valid years of experience (0-100)");
      setIsRegistering(false);
      return;
    }

    // Phone validation (basic)
    if (trimmedForm.phone.length < 10) {
      setRegisterError("Please enter a valid phone number");
      setIsRegistering(false);
      return;
    }

    try {
      const newUser = {
        id: Date.now().toString(),
        name: trimmedForm.name,
        email: trimmedForm.email,
        password: trimmedForm.password,
        farmName: trimmedForm.farmName,
        location: trimmedForm.location,
        farmSize: farmSizeNum,
        cropTypes: trimmedForm.cropTypes,
        experienceYears: experienceNum,
        phone: trimmedForm.phone,
      };

      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);

      // Save to localStorage
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      localStorage.setItem('currentUser', JSON.stringify(newUser));

      setIsLoggedIn(true);
      setCurrentUser(newUser);
      setShowRegisterModal(false);

      // Reset form
      setRegisterForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        farmName: "",
        location: "",
        farmSize: "",
        cropTypes: [],
        experienceYears: "",
        phone: "",
      });

      // Show success message and redirect
      console.log('Registration successful! Redirecting to dashboard...');

      // Use setTimeout to ensure state updates complete before redirect
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 100);

    } catch (error) {
      console.error('Registration error:', error);
      setRegisterError("Registration failed. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const Modal = ({
    show,
    onClose,
    children,
    isRegister = false,
  }: {
    show: boolean;
    onClose: () => void;
    children: React.ReactNode;
    isRegister?: boolean;
  }) => {
    if (!show) return null;

    return (
      <div className={styles.modal}>
        <div className={`${styles.modalContent} ${isRegister ? styles.modalContentRegister : ''}`}>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseButton}
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Background Images */}
      <div className={styles.bgElementTopRight}>
        <div></div>
      </div>
      <div className={styles.bgElementBottomLeft}>
        <div></div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <div className={styles.navContent}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className={styles.logoText}>
                CropGuard AI
              </span>
            </div>

            {/* Desktop Menu */}
            <div className={styles.navLinks}>
              <a href="#about" className={`${styles.navLink} ${styles.navLinkActive}`}>
                About
              </a>
              <a
                href="#how-it-works"
                className={styles.navLink}
              >
                How it works
              </a>
              <a
                href="#features"
                className={styles.navLink}
              >
                Features
              </a>
              <a
                href="#blog"
                className={styles.navLink}
              >
                Blog
              </a>
            </div>

            <div className={styles.userSection}>
              {isLoggedIn ? (
                <div className={styles.userActions}>
                  <span className={styles.userGreeting}>
                    Hello, {currentUser?.name}
                  </span>
                  <div className={styles.aiBadge}>
                    AI ✓
                  </div>
                  <button
                    onClick={handleLogout}
                    className={styles.loginBtn}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className={styles.loginBtn}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className={styles.registerBtn}
                  >
                    Register
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className={styles.mobileMenuButton}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className={styles.mobileMenu}>
              <div className={styles.mobileMenuLinks}>
                <a href="#about" className={`${styles.navLink} ${styles.navLinkActive}`}>
                  About
                </a>
                <a href="#how-it-works" className={styles.navLink}>
                  How it works
                </a>
                <a href="#features" className={styles.navLink}>
                  Features
                </a>
                <a href="#blog" className={styles.navLink}>
                  Blog
                </a>
                <div className={styles.mobileAuthSection}>
                  {isLoggedIn ? (
                    <>
                      <span className={styles.userGreeting}>
                        Hello, {currentUser?.name}
                      </span>
                      <button
                        onClick={handleLogout}
                        className={styles.mobileLoginBtn}
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowLoginModal(true)}
                        className={styles.mobileLoginBtn}
                      >
                        Login
                      </button>
                      <button
                        onClick={() => setShowRegisterModal(true)}
                        className={styles.mobileRegisterBtn}
                      >
                        Register
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`${styles.heroDecorative} ${styles.heroDecorative1}`}>
          <Leaf className="w-10 h-10 text-green-600" />
        </div>
        <div className={`${styles.heroDecorative} ${styles.heroDecorative2}`}></div>
        <div className={`${styles.heroDecorative} ${styles.heroDecorative3}`}></div>

        <div className={styles.heroContent}>
          <div className={styles.heroGrid}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Whatever crop you{" "}
                <span className={styles.heroTitleOrange}>wanna protect</span>
                <br />
                and whatever disease you want
                <br />
                <span className={styles.heroTitleGreen}>to detect</span>
              </h1>
              <p className={styles.heroSubtitle}>
                DO IT WITH OUR way with our guided AI detection programme
              </p>

              <div className={styles.heroTrial}>
                <p className={styles.heroTrialText}>
                  Try it now, download a free
                </p>
                <button className={styles.heroTrialLink}>
                  Sample menu
                </button>
              </div>
            </div>

            {/* Advanced Crop Analysis Dashboard */}
            <div className={styles.mockup}>
              <div className={styles.mockupCard}>
                {/* Header */}
                <div className={styles.mockupHeader}>
                  <div className={styles.mockupDots}>
                    <div className={`${styles.mockupDot} ${styles.mockupDotRed}`}></div>
                    <div className={`${styles.mockupDot} ${styles.mockupDotYellow}`}></div>
                    <div className={`${styles.mockupDot} ${styles.mockupDotGreen}`}></div>
                  </div>
                  <span className={styles.mockupTitle}>
                    CropGuard AI Analysis
                  </span>
                </div>

                {/* Main Image with overlays */}
                <div className={styles.mockupResultsContainer}>
                  <div className={styles.mockupImageArea}>
                    {/* Simulated crop field */}
                    <div className={styles.mockupImageOverlay}></div>
                    <div className={styles.mockupCameraIcon}>
                      <Camera className="w-4 h-4 text-white" />
                    </div>

                    {/* Analysis points */}
                    <div className={`${styles.mockupAnalysisPoint} ${styles.mockupAnalysisPointGreen} ${styles.mockupAnalysisPoint1}`}></div>
                    <div className={`${styles.mockupAnalysisPoint} ${styles.mockupAnalysisPointYellow} ${styles.mockupAnalysisPoint2}`}></div>
                    <div className={`${styles.mockupAnalysisPoint} ${styles.mockupAnalysisPointGreen} ${styles.mockupAnalysisPoint3}`}></div>

                    {/* Scanning overlay */}
                    <div className={styles.mockupStatus}>
                      AI Analyzing...
                    </div>

                    {/* Center crop illustration */}
                    <div className={styles.mockupCropIllustration}>
                      <div className={styles.mockupCropIcon}>
                        <Leaf className="w-16 h-16 text-green-700" />
                        <div className={styles.mockupAiIndicator}>
                          <Brain className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysis Results */}
                <div className={styles.mockupResults}>
                  {/* Health Status */}
                  <div className={`${styles.mockupResultRow} ${styles.mockupResultRowGreen}`}>
                    <div className={styles.mockupResultLabel}>
                      <div className={`${styles.mockupResultIndicator} ${styles.mockupResultIndicatorGreen}`}></div>
                      <span>Overall Health</span>
                    </div>
                    <span className={`${styles.mockupResultValue} ${styles.mockupResultValueGreen}`}>
                      Excellent
                    </span>
                  </div>

                  {/* Disease Detection */}
                  <div className={`${styles.mockupResultRow} ${styles.mockupResultRowGray}`}>
                    <div className={styles.mockupResultLabel}>
                      <Search className="w-4 h-4 text-gray-600" />
                      <span>Disease Detection</span>
                    </div>
                    <span className={`${styles.mockupResultValue} ${styles.mockupResultValueGray}`}>
                      None Found
                    </span>
                  </div>

                  {/* Growth Analysis */}
                  <div className={styles.mockupGrowthAnalysis}>
                    <div className={styles.mockupGrowthHeader}>
                      <span className={styles.mockupGrowthLabel}>
                        Growth Rate
                      </span>
                      <span className={styles.mockupGrowthValue}>
                        94%
                      </span>
                    </div>
                    <div className={styles.mockupProgressBar}>
                      <div
                        className={styles.mockupProgress}
                        style={{ width: "94%" }}
                      ></div>
                    </div>
                  </div>

                  {/* Multiple confidence indicators */}
                  <div className={styles.mockupConfidenceGrid}>
                    <div className={styles.mockupConfidenceItem}>
                      <div className={styles.mockupConfidenceLabel}>
                        AI Confidence
                      </div>
                      <div className={styles.mockupConfidenceValueGreen}>
                        96%
                      </div>
                    </div>
                    <div className={styles.mockupConfidenceItem}>
                      <div className={styles.mockupConfidenceLabel}>
                        Data Points
                      </div>
                      <div className={styles.mockupConfidenceValueBlue}>
                        1,247
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced decorative elements */}
              <div className={styles.mockupDecorative1}></div>
              <div className={styles.mockupDecorative2}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Card Section */}
      <section className={styles.cardsSection}>
        <div className={styles.cardsContainer}>
          <div className={styles.cardsGrid}>
            {/* Detect Card */}
            <div className={`${styles.card} ${styles.cardDetect}`}>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>
                  Detect
                </h3>
                <p className={styles.cardDescription}>
                  Identify crop diseases early and analyze plant health with our
                  AI-powered detection system for optimal crop protection.
                </p>
                <button className={`${styles.cardButton} ${styles.cardButtonRed}`}>
                  VIEW MORE
                </button>
              </div>
              <div className={styles.cardIcon}>
                <Search className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Protect Card */}
            <div className={`${styles.card} ${styles.cardProtect}`}>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>
                  Protect
                </h3>
                <p className={styles.cardDescription}>
                  Use smart recommendations and real-time alerts to shield your
                  crops from threats and ensure healthy growth.
                </p>
                <button className={`${styles.cardButton} ${styles.cardButtonGreen}`}>
                  VIEW MORE
                </button>
              </div>
              <div className={styles.cardIcon}>
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Optimize Card */}
            <div className={`${styles.card} ${styles.cardImprove}`}>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>
                  Optimize
                </h3>
                <p className={styles.cardDescription}>
                  Leverage data insights and AI analytics to boost crop yield
                  and maximize farm productivity.
                </p>
                <button className={`${styles.cardButton} ${styles.cardButtonBlue}`}>
                  VIEW MORE
                </button>
              </div>
              <div className={styles.cardIcon}>
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.featuresContainer}>
          <div className={styles.featuresHeader}>
            <h2 className={styles.featuresTitle}>
              Powered by Advanced AI Technology
            </h2>
            <p className={styles.featuresSubtitle}>
              Our cutting-edge features help farmers make informed decisions and
              protect their crops with precision.
            </p>
          </div>

          <div className={styles.featuresGrid}>
            {[
              {
                icon: Camera,
                title: "Smart Image Recognition",
                description:
                  "Advanced AI analyzes crop photos to identify diseases with 95% accuracy",
              },
              {
                icon: Smartphone,
                title: "Mobile App",
                description:
                  "Easy-to-use mobile application for field diagnosis and monitoring",
              },
              {
                icon: Brain,
                title: "Machine Learning",
                description:
                  "Continuously improving AI models trained on millions of crop images",
              },
              {
                icon: Database,
                title: "Comprehensive Database",
                description:
                  "Extensive library of crop diseases and treatment recommendations",
              },
            ].map((feature, index) => (
              <div key={index} className={styles.featureItem}>
                <div className={styles.featureCard}>
                  <feature.icon className={styles.featureIcon} />
                  <h3 className={styles.featureTitle}>
                    {feature.title}
                  </h3>
                  <p className={styles.featureDescription}>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaOverlay}>
          <div></div>
        </div>

        <div className={styles.ctaContainer}>
          <h2 className={styles.ctaTitle}>
            Start Protecting Your Crops Today
          </h2>
          <p className={styles.ctaSubtitle}>
            Join thousands of farmers who trust CropGuard AI for their crop
            protection needs.
          </p>

          <div className={styles.ctaButtons}>
            <button
              onClick={() => setShowRegisterModal(true)}
              className={styles.ctaButtonPrimary}
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <button className={styles.ctaButtonSecondary}>
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.footerLogo}>
                <div className={styles.footerLogoIcon}>
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <span className={styles.footerLogoText}>
                  CropGuard AI
                </span>
              </div>
              <p className={styles.footerDescription}>
                Protecting crops with intelligent AI technology for a
                sustainable future.
              </p>
            </div>

            <div>
              <h3 className={styles.footerTitle}>Product</h3>
              <ul className={styles.footerList}>
                <li className={styles.footerListItem}>Features</li>
                <li className={styles.footerListItem}>Pricing</li>
                <li className={styles.footerListItem}>API</li>
                <li className={styles.footerListItem}>Documentation</li>
              </ul>
            </div>

            <div>
              <h3 className={styles.footerTitle}>Company</h3>
              <ul className={styles.footerList}>
                <li className={styles.footerListItem}>About Us</li>
                <li className={styles.footerListItem}>Blog</li>
                <li className={styles.footerListItem}>Careers</li>
                <li className={styles.footerListItem}>Contact</li>
              </ul>
            </div>

            <div>
              <h3 className={styles.footerTitle}>Get Started</h3>
              <button
                onClick={() => setShowRegisterModal(true)}
                className={styles.footerButton}
              >
                Try CropGuard AI
              </button>
            </div>
          </div>

          <div className={styles.footerBottom}>
            © 2025 CropGuard AI. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <Modal show={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <h2 className={styles.modalTitle}>Welcome Back</h2>
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="login-email" className={styles.formLabel}>
              Email
            </label>
            <input
              id="login-email"
              type="email"
              placeholder="Enter your email"
              value={loginForm.email}
              onChange={(e) =>
                setLoginForm({ ...loginForm, email: e.target.value })
              }
              className={styles.formInput}
              required
              aria-describedby={loginError ? "login-error" : undefined}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="login-password" className={styles.formLabel}>
              Password
            </label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={loginForm.password}
              onChange={(e) =>
                setLoginForm({ ...loginForm, password: e.target.value })
              }
              className={styles.formInput}
              required
              aria-describedby={loginError ? "login-error" : undefined}
            />
          </div>
          {loginError && (
            <p id="login-error" className={styles.formError} role="alert">
              {loginError}
            </p>
          )}
          <button type="submit" className={styles.submitButton}>
            Sign In
          </button>
        </form>
        <p className={styles.modalFooterText}>
          Don't have an account?{" "}
          <button
            onClick={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
              setLoginError("");
            }}
            className={styles.modalFooterLink}
          >
            Sign up
          </button>
        </p>
        <p className={styles.demoText}>
          Demo: farmer@example.com / password123
        </p>
      </Modal>

      {/* Register Modal */}
      <Modal
        show={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        isRegister={true}
      >
        <h2 className={styles.modalTitle}>Create Your CropGuard AI Account</h2>
        <form onSubmit={handleRegister} className={styles.form}>
          {/* Personal Information Section */}
          <h3 className={styles.formSectionTitle}>Personal Information</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="register-name" className={styles.formLabel}>
                Full Name *
              </label>
              <input
                id="register-name"
                type="text"
                placeholder="Enter your full name"
                value={registerForm.name}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, name: e.target.value })
                }
                className={styles.formInput}
                required
                aria-describedby={registerError ? "register-error" : undefined}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="register-email" className={styles.formLabel}>
                Email *
              </label>
              <input
                id="register-email"
                type="email"
                placeholder="Enter your email"
                value={registerForm.email}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, email: e.target.value })
                }
                className={styles.formInput}
                required
                aria-describedby={registerError ? "register-error" : undefined}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="register-password" className={styles.formLabel}>
                Password *
              </label>
              <input
                id="register-password"
                type="password"
                placeholder="Enter password (min. 6 characters)"
                value={registerForm.password}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, password: e.target.value })
                }
                className={styles.formInput}
                required
                minLength={6}
                aria-describedby={registerError ? "register-error" : undefined}
              />
            </div>
            <div className={styles.formGroup}>
              <label
                htmlFor="register-confirm-password"
                className={styles.formLabel}
              >
                Confirm Password *
              </label>
              <input
                id="register-confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={registerForm.confirmPassword}
                onChange={(e) =>
                  setRegisterForm({
                    ...registerForm,
                    confirmPassword: e.target.value,
                  })
                }
                className={styles.formInput}
                required
                aria-describedby={registerError ? "register-error" : undefined}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="register-phone" className={styles.formLabel}>
                Phone Number *
              </label>
              <input
                id="register-phone"
                type="tel"
                placeholder="Enter phone number"
                value={registerForm.phone}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, phone: e.target.value })
                }
                className={styles.formInput}
                required
                aria-describedby={registerError ? "register-error" : undefined}
              />
            </div>
          </div>

          {/* Farm Information Section */}
          <h3 className={styles.formSectionTitle}>Farm Information</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="register-farm-name" className={styles.formLabel}>
                Farm Name *
              </label>
              <input
                id="register-farm-name"
                type="text"
                placeholder="Enter your farm name"
                value={registerForm.farmName}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, farmName: e.target.value })
                }
                className={styles.formInput}
                required
                aria-describedby={registerError ? "register-error" : undefined}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="register-location" className={styles.formLabel}>
                Location *
              </label>
              <input
                id="register-location"
                type="text"
                placeholder="City, State/Country"
                value={registerForm.location}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, location: e.target.value })
                }
                className={styles.formInput}
                required
                aria-describedby={registerError ? "register-error" : undefined}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="register-farm-size" className={styles.formLabel}>
                Farm Size (acres) *
              </label>
              <input
                id="register-farm-size"
                type="number"
                placeholder="Enter farm size in acres"
                value={registerForm.farmSize}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, farmSize: e.target.value })
                }
                className={styles.formInput}
                required
                min="0"
                step="0.1"
                aria-describedby={registerError ? "register-error" : undefined}
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="register-experience" className={styles.formLabel}>
                Years of Experience *
              </label>
              <input
                id="register-experience"
                type="number"
                placeholder="Years of farming experience"
                value={registerForm.experienceYears}
                onChange={(e) =>
                  setRegisterForm({ ...registerForm, experienceYears: e.target.value })
                }
                className={styles.formInput}
                required
                min="0"
                max="100"
                aria-describedby={registerError ? "register-error" : undefined}
              />
            </div>
          </div>

          {/* Crop Types Section */}
          <h3 className={styles.formSectionTitle}>Crop Selection</h3>
          <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
            <label htmlFor="register-crop-types" className={styles.formLabel}>
              Crop Types *
            </label>
            <select
              id="register-crop-types"
              multiple
              value={registerForm.cropTypes}
              onChange={(e) => {
                const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                setRegisterForm({ ...registerForm, cropTypes: selectedValues });
              }}
              className={`${styles.formSelect} ${styles.formSelectMultiple}`}
              required
              aria-describedby={registerError ? "register-error" : "crop-help"}
              size={4}
            >
              {cropOptions.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
            <small id="crop-help" className={styles.helpText}>
              Hold Ctrl/Cmd to select multiple crops. Selected: {registerForm.cropTypes.length > 0 ? registerForm.cropTypes.join(', ') : 'None'}
            </small>
          </div>
          {registerError && (
            <p id="register-error" className={styles.formError} role="alert">
              {registerError}
            </p>
          )}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isRegistering}
            aria-describedby={registerError ? "register-error" : undefined}
          >
            {isRegistering ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        <p className={styles.modalFooterText}>
          Already have an account?{" "}
          <button
            onClick={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
              setRegisterError("");
            }}
            className={styles.modalFooterLink}
          >
            Sign in
          </button>
        </p>
      </Modal>
    </div>
  );
}
