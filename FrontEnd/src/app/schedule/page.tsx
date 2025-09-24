"use client";

import React, { useState, useEffect } from "react";
import {
  Leaf,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Save,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  X,
} from "lucide-react";
import styles from "./schedule.module.css";

interface Farmer {
  id: string;
  name: string;
  email: string;
  farmName: string;
  location: string;
}

interface ScheduledScan {
  id: string;
  cropType: string;
  scheduledDate: string;
  scheduledTime: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  notes?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

interface Notification {
  id: string;
  type: 'scan_scheduled' | 'scan_reminder' | 'scan_completed' | 'disease_detected' | 'weather_alert';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  relatedScanId?: string;
}

export default function SchedulePage() {
  const [currentUser, setCurrentUser] = useState<Farmer | null>(null);
  const [scheduledScans, setScheduledScans] = useState<ScheduledScan[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingScan, setEditingScan] = useState<ScheduledScan | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    cropType: '',
    date: '',
    time: '',
    location: '',
    lat: 0,
    lng: 0,
    notes: '',
  });

  useEffect(() => {
    // Load user data from localStorage
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      loadUserData(user.id);
    } else {
      // Redirect to login if no user data
      window.location.href = '/';
    }
  }, []);

  const loadUserData = (userId: string) => {
    // Load scheduled scans
    const savedScans = localStorage.getItem(`scheduledScans_${userId}`);
    if (savedScans) {
      setScheduledScans(JSON.parse(savedScans));
    }

    // Load notifications
    const savedNotifications = localStorage.getItem(`notifications_${userId}`);
    if (savedNotifications) {
      setNotifications(JSON.parse(savedNotifications));
    }
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    if (!currentUser) return;

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isRead: false,
    };

    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    localStorage.setItem(`notifications_${currentUser.id}`, JSON.stringify(updatedNotifications));
  };

  const handleScheduleScan = () => {
    if (!currentUser || !scheduleForm.cropType || !scheduleForm.date || !scheduleForm.time) {
      return;
    }

    const scanData = {
      cropType: scheduleForm.cropType,
      scheduledDate: scheduleForm.date,
      scheduledTime: scheduleForm.time,
      location: {
        lat: scheduleForm.lat || -25.7479 + (Math.random() * 0.1),
        lng: scheduleForm.lng || 28.2293 + (Math.random() * 0.1),
        address: scheduleForm.location || 'Farm Location',
      },
      notes: scheduleForm.notes,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    let updatedScans;
    if (editingScan) {
      // Update existing scan
      updatedScans = scheduledScans.map(scan =>
        scan.id === editingScan.id ? { ...scan, ...scanData } : scan
      );
      addNotification({
        type: 'scan_scheduled',
        title: 'Scan Updated',
        message: `${scheduleForm.cropType} scan updated for ${new Date(scheduleForm.date).toLocaleDateString()} at ${scheduleForm.time}`,
        relatedScanId: editingScan.id,
      });
    } else {
      // Create new scan
      const newScan: ScheduledScan = {
        ...scanData,
        id: Date.now().toString(),
      };
      updatedScans = [...scheduledScans, newScan];
      addNotification({
        type: 'scan_scheduled',
        title: 'Scan Scheduled Successfully',
        message: `${scheduleForm.cropType} scan scheduled for ${new Date(scheduleForm.date).toLocaleDateString()} at ${scheduleForm.time}`,
        relatedScanId: newScan.id,
      });
    }

    setScheduledScans(updatedScans);
    localStorage.setItem(`scheduledScans_${currentUser.id}`, JSON.stringify(updatedScans));

    // Reset form
    setScheduleForm({
      cropType: '',
      date: '',
      time: '',
      location: '',
      lat: 0,
      lng: 0,
      notes: '',
    });
    setShowScheduleModal(false);
    setEditingScan(null);
  };

  const editScan = (scan: ScheduledScan) => {
    setEditingScan(scan);
    setScheduleForm({
      cropType: scan.cropType,
      date: scan.scheduledDate,
      time: scan.scheduledTime,
      location: scan.location.address,
      lat: scan.location.lat,
      lng: scan.location.lng,
      notes: scan.notes || '',
    });
    setShowScheduleModal(true);
  };

  const deleteScan = (scanId: string) => {
    if (!currentUser) return;

    const updatedScans = scheduledScans.filter(scan => scan.id !== scanId);
    setScheduledScans(updatedScans);
    localStorage.setItem(`scheduledScans_${currentUser.id}`, JSON.stringify(updatedScans));

    addNotification({
      type: 'scan_reminder',
      title: 'Scan Deleted',
      message: 'A scheduled scan has been deleted.',
    });
  };

  const completeScan = (scanId: string) => {
    if (!currentUser) return;

    const updatedScans = scheduledScans.map(scan =>
      scan.id === scanId ? { ...scan, status: 'completed' as const } : scan
    );
    setScheduledScans(updatedScans);
    localStorage.setItem(`scheduledScans_${currentUser.id}`, JSON.stringify(updatedScans));

    const completedScan = scheduledScans.find(scan => scan.id === scanId);
    if (completedScan) {
      addNotification({
        type: 'scan_completed',
        title: 'Scan Completed',
        message: `${completedScan.cropType} scan has been completed successfully.`,
        relatedScanId: scanId,
      });
    }
  };

  const upcomingScans = scheduledScans
    .filter(scan => scan.status === 'pending')
    .sort((a, b) => new Date(a.scheduledDate + 'T' + a.scheduledTime).getTime() - new Date(b.scheduledDate + 'T' + b.scheduledTime).getTime());

  const completedScans = scheduledScans.filter(scan => scan.status === 'completed');

  return (
    <div className={styles.schedulePage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className={styles.backButton}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div className={styles.headerText}>
                <h1 className={styles.pageTitle}>Schedule Management</h1>
                <p className={styles.pageSubtitle}>Manage your crop scanning schedule</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingScan(null);
              setScheduleForm({
                cropType: '',
                date: '',
                time: '',
                location: '',
                lat: 0,
                lng: 0,
                notes: '',
              });
              setShowScheduleModal(true);
            }}
            className={styles.addButton}
          >
            <Plus className="w-5 h-5" />
            <span>Schedule New Scan</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{upcomingScans.length}</h3>
                <p className={styles.statLabel}>Upcoming Scans</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{completedScans.length}</h3>
                <p className={styles.statLabel}>Completed Scans</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{scheduledScans.length}</h3>
                <p className={styles.statLabel}>Total Scheduled</p>
              </div>
            </div>
          </div>

          {/* Upcoming Scans */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Upcoming Scans</h2>
            <div className={styles.scansList}>
              {upcomingScans.length === 0 ? (
                <div className={styles.emptyState}>
                  <Calendar className="w-16 h-16 text-gray-300" />
                  <p className={styles.emptyText}>No upcoming scans scheduled</p>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className={styles.emptyButton}
                  >
                    Schedule Your First Scan
                  </button>
                </div>
              ) : (
                upcomingScans.map((scan) => (
                  <div key={scan.id} className={styles.scanCard}>
                    <div className={styles.scanHeader}>
                      <div className={styles.scanStatus}>
                        <Clock className="w-5 h-5 text-yellow-600" />
                        <span className={styles.statusBadge}>Pending</span>
                      </div>
                      <div className={styles.scanActions}>
                        <button
                          onClick={() => editScan(scan)}
                          className={styles.actionButton}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => completeScan(scan.id)}
                          className={`${styles.actionButton} ${styles.completeButton}`}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteScan(scan.id)}
                          className={`${styles.actionButton} ${styles.deleteButton}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className={styles.scanContent}>
                      <h3 className={styles.scanTitle}>{scan.cropType}</h3>
                      <div className={styles.scanDetails}>
                        <div className={styles.scanDetail}>
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{new Date(scan.scheduledDate).toLocaleDateString()}</span>
                        </div>
                        <div className={styles.scanDetail}>
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{scan.scheduledTime}</span>
                        </div>
                        <div className={styles.scanDetail}>
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span>{scan.location.address}</span>
                        </div>
                      </div>
                      {scan.notes && (
                        <div className={styles.scanNotes}>
                          <p>{scan.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Completed Scans */}
          {completedScans.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Recently Completed</h2>
              <div className={styles.completedList}>
                {completedScans.slice(0, 5).map((scan) => (
                  <div key={scan.id} className={styles.completedItem}>
                    <div className={styles.completedIcon}>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className={styles.completedContent}>
                      <h4 className={styles.completedTitle}>{scan.cropType}</h4>
                      <p className={styles.completedDate}>
                        {new Date(scan.scheduledDate).toLocaleDateString()} at {scan.scheduledTime}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingScan ? 'Edit Scan' : 'Schedule New Scan'}
              </h2>
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingScan(null);
                }}
                className={styles.closeButton}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleScheduleScan(); }}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Crop Type</label>
                  <select
                    value={scheduleForm.cropType}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, cropType: e.target.value })}
                    className={styles.formSelect}
                    required
                  >
                    <option value="">Select crop type</option>
                    <option value="Corn">Corn</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Soybeans">Soybeans</option>
                    <option value="Rice">Rice</option>
                    <option value="Tomatoes">Tomatoes</option>
                    <option value="Potatoes">Potatoes</option>
                    <option value="Cotton">Cotton</option>
                    <option value="Sunflower">Sunflower</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Date</label>
                  <input
                    type="date"
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Time</label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className={styles.formInput}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Location</label>
                  <input
                    type="text"
                    value={scheduleForm.location}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                    placeholder="e.g., North Field, Section A"
                    className={styles.formInput}
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes (Optional)</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  placeholder="Any additional notes for the scan..."
                  rows={3}
                  className={styles.formTextarea}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setEditingScan(null);
                  }}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!scheduleForm.cropType || !scheduleForm.date || !scheduleForm.time}
                  className={styles.saveButton}
                >
                  <Save className="w-4 h-4" />
                  <span>{editingScan ? 'Update Scan' : 'Schedule Scan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}