import cron from 'node-cron';
import { supabase } from '../config/supabase.js';
import type { MedicationSchedule, Notification } from '@care4u/shared';

export class ReminderService {
  private cronJob: cron.ScheduledTask | null = null;

  start() {
    // Run every minute
    this.cronJob = cron.schedule('* * * * *', async () => {
      await this.checkUpcomingMedications();
    });

    console.log('Reminder service started');
  }

  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      console.log('Reminder service stopped');
    }
  }

  private async checkUpcomingMedications() {
    try {
      const now = new Date();
      const currentTime = this.formatTime(now);
      const currentDate = now.toISOString().split('T')[0];

      // Get all active medication schedules
      const { data: schedules, error: schedulesError } = await supabase
        .from('medication_schedules')
        .select('*')
        .eq('active', true);

      if (schedulesError) {
        console.error('Error fetching schedules:', schedulesError);
        return;
      }

      for (const schedule of schedules || []) {
        // Check if any of the times match current time (within 1 minute window)
        for (const time of schedule.times) {
          if (this.isTimeMatch(time, currentTime)) {
            await this.createReminderNotification(schedule, time, currentDate);
            await this.createMedicationLog(schedule, time, currentDate);
          }
        }
      }
    } catch (error) {
      console.error('Error checking medications:', error);
    }
  }

  private async createReminderNotification(
    schedule: MedicationSchedule,
    time: string,
    date: string
  ) {
    try {
      // Get family members and caregivers for this candidate
      const { data: familyMembers } = await supabase
        .from('family_members')
        .select('user_id')
        .eq('candidate_id', schedule.candidate_id);

      const { data: caregivers } = await supabase
        .from('caregivers')
        .select('user_id')
        .contains('candidate_ids', [schedule.candidate_id]);

      const userIds = [
        ...(familyMembers?.map(fm => fm.user_id) || []),
        ...(caregivers?.map(c => c.user_id) || [])
      ];

      // Create notifications for all related users
      for (const userId of userIds) {
        // Check if notification already exists for this time
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'medication_reminder')
          .eq('metadata->>schedule_id', schedule.id)
          .eq('metadata->>scheduled_time', `${date}T${time}`)
          .single();

        if (!existing) {
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'medication_reminder',
            title: 'Medication Reminder',
            message: `Time to take ${schedule.medicine_name} (${schedule.dosage})`,
            read: false,
            metadata: {
              schedule_id: schedule.id,
              candidate_id: schedule.candidate_id,
              scheduled_time: `${date}T${time}`,
              medicine_name: schedule.medicine_name,
              dosage: schedule.dosage
            }
          });
        }
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  private async createMedicationLog(
    schedule: MedicationSchedule,
    time: string,
    date: string
  ) {
    try {
      const scheduledTime = `${date}T${time}:00`;

      // Check if log already exists
      const { data: existing } = await supabase
        .from('medication_logs')
        .select('id')
        .eq('schedule_id', schedule.id)
        .eq('scheduled_time', scheduledTime)
        .single();

      if (!existing) {
        await supabase.from('medication_logs').insert({
          schedule_id: schedule.id,
          candidate_id: schedule.candidate_id,
          scheduled_time: scheduledTime,
          status: 'pending'
        });
      }
    } catch (error) {
      console.error('Error creating medication log:', error);
    }
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private isTimeMatch(scheduledTime: string, currentTime: string): boolean {
    // Simple exact match for now
    return scheduledTime === currentTime;
  }
}

export const reminderService = new ReminderService();

