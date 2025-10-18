import { useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import type { Notification } from '@care4u/shared';

interface MedicationReminderProps {
  notification: Notification;
  onConfirm: () => void;
}

const MedicationReminder = ({ notification, onConfirm }: MedicationReminderProps) => {
  const [visible, setVisible] = useState(true);
  const [hasSpoken, setHasSpoken] = useState(false);

  useEffect(() => {
    // Speak the reminder using Web Speech API
    if ('speechSynthesis' in window && !hasSpoken) {
      const utterance = new SpeechSynthesisUtterance(
        `Medication reminder: ${notification.message}`
      );
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      setHasSpoken(true);
    }

    // Play a notification sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVq3n77BeFQxBmeH0xHMpBSiB0PPZizsIGmm98OWSUAwHQJzi9bpZDwk8ltrzxnUsBSuD0/TZiDcGG2/A7+WVTgwGPJvh9MR4KgUuhM/z04JBAhltv+7mnEYPBz2a4fW2YhoJMILN89qJOAgZbL/v4p1LDAhDneL1sm4aCS1+zPLaizsKGW3A7+OYSw0JQZvh9bppHgg0g87z2Ys5CBhqwO/lmk4PBzyc4fW6ZRsJMYPO89qKOwgYbL/u5Z1MDAxDnOH1t2QdCDGAzvPbi0ADGm3A7+OdTA4KQpzh9bllHAgwhM7z2os6CBhsv+7inUsOCEKd4vW4ZBsKMIPN89qJOQcZbL/u5Jx');//shortened for brevity
      audio.volume = 0.3;
      audio.play().catch(() => {/* ignore audio errors */});
    } catch (error) {
      // Ignore audio errors
    }
  }, [notification, hasSpoken]);

  const handleConfirm = async () => {
    if (!notification.metadata?.schedule_id) return;

    try {
      // Find or create the medication log
      const scheduledTime = notification.metadata.scheduled_time;
      const scheduleId = notification.metadata.schedule_id;

      // First, try to get the log
      const { data: logsData } = await api.get(
        `/api/medications/logs/${notification.metadata.candidate_id}`
      );
      
      const log = logsData.logs.find(
        (l: any) => l.schedule_id === scheduleId && l.scheduled_time === scheduledTime
      );

      if (log) {
        await api.post('/api/medications/confirm', { log_id: log.id });
      }

      // Mark notification as read
      await api.put(`/api/medications/notifications/${notification.id}/read`);

      toast.success('Medication confirmed!');
      setVisible(false);
      onConfirm();
    } catch (error: any) {
      console.error('Error confirming medication:', error);
      toast.error('Failed to confirm medication');
    }
  };

  const handleDismiss = async () => {
    try {
      await api.put(`/api/medications/notifications/${notification.id}/read`);
      setVisible(false);
      onConfirm();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-primary-500 p-6 max-w-sm">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-primary-100 rounded-full flex-shrink-0 animate-pulse">
            <Bell className="w-8 h-8 text-primary-600" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              {notification.title}
            </h3>
            <p className="text-gray-600 mb-4">{notification.message}</p>
            
            <div className="flex space-x-2">
              <button
                onClick={handleConfirm}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                <Check className="w-5 h-5" />
                <span>Confirm Taken</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationReminder;

