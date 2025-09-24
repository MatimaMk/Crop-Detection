"use client";

import React, { useState, useEffect } from "react";
import {
  Leaf,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import styles from "./calendar.module.css";

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

export default function CalendarPage() {
  const [currentUser, setCurrentUser] = useState<Farmer | null>(null);
  const [scheduledScans, setScheduledScans] = useState<ScheduledScan[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDayView, setShowDayView] = useState(false);

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

  const cancelScan = (scanId: string) => {
    if (!currentUser) return;

    const updatedScans = scheduledScans.map(scan =>
      scan.id === scanId ? { ...scan, status: 'cancelled' as const } : scan
    );
    setScheduledScans(updatedScans);
    localStorage.setItem(`scheduledScans_${currentUser.id}`, JSON.stringify(updatedScans));

    const cancelledScan = scheduledScans.find(scan => scan.id === scanId);
    if (cancelledScan) {
      addNotification({
        type: 'scan_reminder',
        title: 'Scan Cancelled',
        message: `${cancelledScan.cropType} scan scheduled for ${cancelledScan.scheduledDate} has been cancelled.`,
      });
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const currentDayIterator = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDayIterator));
      currentDayIterator.setDate(currentDayIterator.getDate() + 1);
    }

    return days;
  };

  const getScansForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduledScans.filter(scan => scan.scheduledDate === dateStr);
  };

  const selectedDateScans = selectedDate ? getScansForDate(new Date(selectedDate)) : [];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = getDaysInMonth();
  const today = new Date();

  return (
    <div className={styles.calendarPage}>
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
                <h1 className={styles.pageTitle}>Scan Calendar</h1>
                <p className={styles.pageSubtitle}>View and manage scheduled scans</p>
              </div>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => window.location.href = '/schedule'}
              className={styles.addButton}
            >
              <Plus className="w-5 h-5" />
              <span>Schedule Scan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.calendarLayout}>
            {/* Calendar View */}
            <div className={styles.calendarSection}>
              <div className={styles.calendarHeader}>
                <div className={styles.monthNavigation}>
                  <button
                    onClick={() => navigateMonth('prev')}
                    className={styles.navButton}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className={styles.monthTitle}>
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button
                    onClick={() => navigateMonth('next')}
                    className={styles.navButton}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                <div className={styles.legend}>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.pending}`}></div>
                    <span>Pending</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.completed}`}></div>
                    <span>Completed</span>
                  </div>
                  <div className={styles.legendItem}>
                    <div className={`${styles.legendDot} ${styles.cancelled}`}></div>
                    <span>Cancelled</span>
                  </div>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className={styles.calendar}>
                {/* Day Headers */}
                <div className={styles.dayHeaders}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className={styles.dayHeader}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className={styles.calendarGrid}>
                  {days.map((day, index) => {
                    const dayScans = getScansForDate(day);
                    const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                    const isToday = day.toDateString() === today.toDateString();
                    const dateStr = day.toISOString().split('T')[0];
                    const isSelected = selectedDate === dateStr;

                    return (
                      <div
                        key={index}
                        className={`${styles.calendarDay} ${
                          !isCurrentMonth ? styles.otherMonth : ''
                        } ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setShowDayView(true);
                        }}
                      >
                        <div className={styles.dayNumber}>
                          {day.getDate()}
                        </div>
                        <div className={styles.dayScans}>
                          {dayScans.slice(0, 3).map(scan => (
                            <div
                              key={scan.id}
                              className={`${styles.scanIndicator} ${styles[scan.status]}`}
                              title={`${scan.cropType} - ${scan.scheduledTime}`}
                            >
                              {scan.cropType.slice(0, 8)}
                            </div>
                          ))}
                          {dayScans.length > 3 && (
                            <div className={styles.moreScans}>
                              +{dayScans.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Side Panel */}
            <div className={styles.sidePanel}>
              {!showDayView ? (
                <>
                  {/* Upcoming Scans */}
                  <div className={styles.upcomingSection}>
                    <h3 className={styles.sectionTitle}>Upcoming Scans</h3>
                    <div className={styles.upcomingList}>
                      {scheduledScans
                        .filter(scan => scan.status === 'pending')
                        .sort((a, b) => new Date(a.scheduledDate + 'T' + a.scheduledTime).getTime() - new Date(b.scheduledDate + 'T' + b.scheduledTime).getTime())
                        .slice(0, 5)
                        .map(scan => (
                          <div key={scan.id} className={styles.upcomingItem}>
                            <div className={styles.upcomingIcon}>
                              <Clock className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className={styles.upcomingContent}>
                              <h4 className={styles.upcomingTitle}>{scan.cropType}</h4>
                              <p className={styles.upcomingDate}>
                                {new Date(scan.scheduledDate).toLocaleDateString()}
                              </p>
                              <p className={styles.upcomingTime}>{scan.scheduledTime}</p>
                            </div>
                          </div>
                        ))}
                      {scheduledScans.filter(scan => scan.status === 'pending').length === 0 && (
                        <p className={styles.emptyText}>No upcoming scans</p>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className={styles.statsSection}>
                    <h3 className={styles.sectionTitle}>This Month</h3>
                    <div className={styles.statsList}>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>
                          {scheduledScans.filter(scan => {
                            const scanDate = new Date(scan.scheduledDate);
                            return scanDate.getMonth() === currentDate.getMonth() &&
                                   scanDate.getFullYear() === currentDate.getFullYear() &&
                                   scan.status === 'pending';
                          }).length}
                        </span>
                        <span className={styles.statLabel}>Scheduled</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className={styles.statValue}>
                          {scheduledScans.filter(scan => {
                            const scanDate = new Date(scan.scheduledDate);
                            return scanDate.getMonth() === currentDate.getMonth() &&
                                   scanDate.getFullYear() === currentDate.getFullYear() &&
                                   scan.status === 'completed';
                          }).length}
                        </span>
                        <span className={styles.statLabel}>Completed</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Day View */
                <div className={styles.dayView}>
                  <div className={styles.dayViewHeader}>
                    <button
                      onClick={() => {
                        setShowDayView(false);
                        setSelectedDate(null);
                      }}
                      className={styles.backToDayButton}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h3 className={styles.dayViewTitle}>
                      {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </h3>
                  </div>

                  <div className={styles.dayScansContainer}>
                    {selectedDateScans.length === 0 ? (
                      <div className={styles.noDayScans}>
                        <Calendar className="w-12 h-12 text-gray-300" />
                        <p>No scans scheduled for this day</p>
                        <button
                          onClick={() => window.location.href = '/schedule'}
                          className={styles.scheduleButton}
                        >
                          Schedule a Scan
                        </button>
                      </div>
                    ) : (
                      <div className={styles.dayScansGrid}>
                        {selectedDateScans.map(scan => (
                          <div key={scan.id} className={styles.dayScanCard}>
                            <div className={styles.dayScanHeader}>
                              <div className={styles.dayScanStatus}>
                                <div className={`${styles.statusIndicator} ${styles[scan.status]}`} />
                                <span className={styles.cropName}>{scan.cropType}</span>
                              </div>
                              <div className={styles.dayScanActions}>
                                {scan.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => completeScan(scan.id)}
                                      className={styles.actionBtn}
                                      title="Mark as completed"
                                    >
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    </button>
                                    <button
                                      onClick={() => cancelScan(scan.id)}
                                      className={styles.actionBtn}
                                      title="Cancel scan"
                                    >
                                      <X className="w-4 h-4 text-red-600" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className={styles.dayScanDetails}>
                              <div className={styles.dayScanDetail}>
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span>{scan.scheduledTime}</span>
                              </div>
                              <div className={styles.dayScanDetail}>
                                <MapPin className="w-4 h-4 text-gray-500" />
                                <span>{scan.location.address}</span>
                              </div>
                            </div>
                            {scan.notes && (
                              <div className={styles.dayScanNotes}>
                                <p>{scan.notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}