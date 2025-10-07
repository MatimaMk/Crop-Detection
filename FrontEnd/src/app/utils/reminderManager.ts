// Smart Reminder Manager - Intelligent farming reminders

export interface Reminder {
  id: string;
  userId: string;
  type: "treatment" | "weather" | "harvest" | "supply" | "seasonal" | "rescan";
  priority: "urgent" | "high" | "normal" | "low";
  title: string;
  message: string;
  scheduledFor: Date;
  createdAt: Date;
  completed: boolean;
  actionRequired: boolean;
  relatedCrop?: string;
  relatedScanId?: string;
  metadata?: any;
}

class ReminderManager {
  private storageKey = "smartReminders";

  // Get all reminders for user
  getAllReminders(userId: string): Reminder[] {
    const data = localStorage.getItem(`${this.storageKey}_${userId}`);
    if (!data) return [];

    const reminders = JSON.parse(data);
    return reminders.map((r: any) => ({
      ...r,
      scheduledFor: new Date(r.scheduledFor),
      createdAt: new Date(r.createdAt),
    }));
  }

  // Get active (non-completed) reminders
  getActiveReminders(userId: string): Reminder[] {
    return this.getAllReminders(userId)
      .filter((r) => !r.completed)
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  // Get overdue reminders
  getOverdueReminders(userId: string): Reminder[] {
    const now = new Date();
    return this.getActiveReminders(userId).filter((r) => r.scheduledFor < now);
  }

  // Get upcoming reminders (next 7 days)
  getUpcomingReminders(userId: string): Reminder[] {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return this.getActiveReminders(userId).filter(
      (r) => r.scheduledFor >= now && r.scheduledFor <= weekFromNow
    );
  }

  // Add reminder
  addReminder(reminder: Omit<Reminder, "id" | "createdAt">): Reminder {
    const newReminder: Reminder = {
      ...reminder,
      id: this.generateId(),
      createdAt: new Date(),
    };

    const reminders = this.getAllReminders(reminder.userId);
    reminders.push(newReminder);
    this.saveReminders(reminder.userId, reminders);

    return newReminder;
  }

  // Create treatment reminder from analysis
  createTreatmentReminder(
    userId: string,
    cropType: string,
    disease: string,
    treatment: string,
    daysUntilApplication: number = 0
  ): Reminder {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysUntilApplication);

    return this.addReminder({
      userId,
      type: "treatment",
      priority: daysUntilApplication === 0 ? "urgent" : "high",
      title: `Treat ${cropType} - ${disease}`,
      message: treatment,
      scheduledFor: scheduledDate,
      completed: false,
      actionRequired: true,
      relatedCrop: cropType,
    });
  }

  // Create rescan reminder
  createRescanReminder(
    userId: string,
    cropType: string,
    scanId: string,
    daysUntilRescan: number = 7
  ): Reminder {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysUntilRescan);

    return this.addReminder({
      userId,
      type: "rescan",
      priority: "normal",
      title: `Rescan ${cropType}`,
      message: `Time to check ${cropType} progress after treatment. Take a new photo to track improvement.`,
      scheduledFor: scheduledDate,
      completed: false,
      actionRequired: true,
      relatedCrop: cropType,
      relatedScanId: scanId,
    });
  }

  // Create weather-based alert
  createWeatherAlert(
    userId: string,
    cropTypes: string[],
    weatherCondition: string,
    recommendation: string,
    priority: "urgent" | "high" | "normal" = "high"
  ): Reminder {
    return this.addReminder({
      userId,
      type: "weather",
      priority,
      title: `Weather Alert - ${weatherCondition}`,
      message: `${recommendation}\n\nAffected crops: ${cropTypes.join(", ")}`,
      scheduledFor: new Date(),
      completed: false,
      actionRequired: true,
      metadata: { weatherCondition, crops: cropTypes },
    });
  }

  // Create seasonal reminder
  createSeasonalReminder(
    userId: string,
    title: string,
    message: string,
    scheduledFor: Date
  ): Reminder {
    return this.addReminder({
      userId,
      type: "seasonal",
      priority: "normal",
      title,
      message,
      scheduledFor,
      completed: false,
      actionRequired: false,
    });
  }

  // Create supply reminder
  createSupplyReminder(
    userId: string,
    item: string,
    estimatedDaysRemaining: number
  ): Reminder {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + estimatedDaysRemaining);

    return this.addReminder({
      userId,
      type: "supply",
      priority: estimatedDaysRemaining <= 3 ? "high" : "normal",
      title: `Reorder ${item}`,
      message: `You may be running low on ${item}. Consider ordering more supplies.`,
      scheduledFor: scheduledDate,
      completed: false,
      actionRequired: true,
      metadata: { item },
    });
  }

  // Mark reminder as completed
  completeReminder(userId: string, reminderId: string): void {
    const reminders = this.getAllReminders(userId);
    const reminder = reminders.find((r) => r.id === reminderId);
    if (reminder) {
      reminder.completed = true;
      this.saveReminders(userId, reminders);
    }
  }

  // Delete reminder
  deleteReminder(userId: string, reminderId: string): void {
    let reminders = this.getAllReminders(userId);
    reminders = reminders.filter((r) => r.id !== reminderId);
    this.saveReminders(userId, reminders);
  }

  // Snooze reminder (reschedule)
  snoozeReminder(userId: string, reminderId: string, hours: number): void {
    const reminders = this.getAllReminders(userId);
    const reminder = reminders.find((r) => r.id === reminderId);
    if (reminder) {
      const newDate = new Date(reminder.scheduledFor);
      newDate.setHours(newDate.getHours() + hours);
      reminder.scheduledFor = newDate;
      this.saveReminders(userId, reminders);
    }
  }

  // Clean old completed reminders (older than 30 days)
  cleanOldReminders(userId: string): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let reminders = this.getAllReminders(userId);
    reminders = reminders.filter(
      (r) => !r.completed || r.createdAt > thirtyDaysAgo
    );
    this.saveReminders(userId, reminders);
  }

  // Get reminder count by priority
  getReminderCounts(userId: string) {
    const active = this.getActiveReminders(userId);
    return {
      total: active.length,
      urgent: active.filter((r) => r.priority === "urgent").length,
      high: active.filter((r) => r.priority === "high").length,
      normal: active.filter((r) => r.priority === "normal").length,
      low: active.filter((r) => r.priority === "low").length,
      overdue: this.getOverdueReminders(userId).length,
    };
  }

  // Generate unique ID
  private generateId(): string {
    return `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save reminders
  private saveReminders(userId: string, reminders: Reminder[]): void {
    localStorage.setItem(`${this.storageKey}_${userId}`, JSON.stringify(reminders));
  }

  // Auto-generate smart reminders based on weather
  generateWeatherBasedReminders(
    userId: string,
    weatherData: {
      temperature: number;
      humidity: number;
      description: string;
      forecast?: any;
    },
    userCrops: string[]
  ): Reminder[] {
    const newReminders: Reminder[] = [];

    // High humidity + warm = fungal disease risk
    if (weatherData.humidity > 75 && weatherData.temperature > 20) {
      newReminders.push(
        this.createWeatherAlert(
          userId,
          userCrops,
          "High Humidity",
          "High risk of fungal diseases. Consider preventive fungicide application and ensure good air circulation.",
          "high"
        )
      );
    }

    // Very hot weather
    if (weatherData.temperature > 35) {
      newReminders.push(
        this.createWeatherAlert(
          userId,
          userCrops,
          "Extreme Heat",
          "Provide shade for sensitive crops and increase watering frequency. Monitor for heat stress.",
          "urgent"
        )
      );
    }

    // Cold weather
    if (weatherData.temperature < 5) {
      newReminders.push(
        this.createWeatherAlert(
          userId,
          userCrops,
          "Frost Warning",
          "Protect sensitive crops from frost. Cover plants or move containers indoors if possible.",
          "urgent"
        )
      );
    }

    return newReminders;
  }
}

export const reminderManager = new ReminderManager();
