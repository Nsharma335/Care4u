import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Activity, Phone, Volume2, ZoomIn, ZoomOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import type { MedicationSchedule, MedicationLog } from '@care4u/shared';

const CandidateDashboard = () => {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [fontSize, setFontSize] = useState(18);
  const [highContrast, setHighContrast] = useState(false);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { label: 'Dashboard', path: '/candidate/dashboard', icon: <Activity className="w-5 h-5" /> },
  ];

  useEffect(() => {
    if (profile?.id) {
      fetchMedicationData();
    }
  }, [profile]);

  const fetchMedicationData = async () => {
    try {
      const [schedulesRes, logsRes] = await Promise.all([
        api.get(`/api/medications/schedule/${profile?.id}`),
        api.get(`/api/medications/logs/${profile?.id}`)
      ]);

      setSchedules(schedulesRes.data.schedules);
      setLogs(logsRes.data.logs);
    } catch (error: any) {
      console.error('Error fetching medication data:', error);
      toast.error('Failed to load medication data');
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = logs.filter(log => log.scheduled_time.startsWith(today));

  const todayScheduleItems = schedules.flatMap(schedule => 
    schedule.times.map(time => ({
      schedule,
      time,
      log: todayLogs.find(log => 
        log.schedule_id === schedule.id && 
        log.scheduled_time === `${today}T${time}:00`
      )
    }))
  ).sort((a, b) => a.time.localeCompare(b.time));

  const getStatusIcon = (status?: string) => {
    if (status === 'taken') return '✓';
    if (status === 'missed') return '✗';
    if (status === 'skipped') return '○';
    return '⏱';
  };

  if (loading) {
    return (
      <DashboardLayout title="My Health" navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Health" navItems={navItems}>
      <div className={highContrast ? 'high-contrast' : ''}>
        {/* Accessibility Controls */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setFontSize(Math.max(14, fontSize - 2))}
            className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ZoomOut className="w-5 h-5" />
            <span style={{ fontSize: `${fontSize}px` }}>Smaller Text</span>
          </button>
          <button
            onClick={() => setFontSize(Math.min(28, fontSize + 2))}
            className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ZoomIn className="w-5 h-5" />
            <span style={{ fontSize: `${fontSize}px` }}>Larger Text</span>
          </button>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span style={{ fontSize: `${fontSize}px` }}>
              {highContrast ? 'Normal' : 'High'} Contrast
            </span>
          </button>
        </div>

        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <h1 style={{ fontSize: `${fontSize + 12}px` }} className="font-bold mb-2">
            Hello, {profile?.first_name}!
          </h1>
          <p style={{ fontSize: `${fontSize}px` }}>
            Here's your medication schedule for {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>

        {/* Today's Medications */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 style={{ fontSize: `${fontSize + 6}px` }} className="font-semibold text-gray-900">
                Today's Medications
              </h2>
              <button
                onClick={() => handleSpeak('Today\'s medication schedule')}
                className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {todayScheduleItems.length === 0 ? (
              <p style={{ fontSize: `${fontSize}px` }} className="text-gray-500 text-center py-8">
                No medications scheduled for today
              </p>
            ) : (
              todayScheduleItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-6 border-2 border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-6 flex-1">
                    <div className="text-4xl" style={{ fontSize: `${fontSize + 16}px` }}>
                      {item.time}
                    </div>
                    <div>
                      <h3 style={{ fontSize: `${fontSize + 4}px` }} className="font-semibold text-gray-900 mb-1">
                        {item.schedule.medicine_name}
                      </h3>
                      <p style={{ fontSize: `${fontSize}px` }} className="text-gray-600">
                        {item.schedule.dosage}
                      </p>
                      {item.schedule.instructions && (
                        <p style={{ fontSize: `${fontSize - 2}px` }} className="text-gray-500 mt-1 italic">
                          {item.schedule.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span style={{ fontSize: `${fontSize + 8}px` }}>
                      {getStatusIcon(item.log?.status)}
                    </span>
                    <button
                      onClick={() => handleSpeak(
                        `${item.time}. ${item.schedule.medicine_name}. ${item.schedule.dosage}. ${item.schedule.instructions || ''}`
                      )}
                      className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Volume2 className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => {
              handleSpeak('Calling your caregiver');
              toast.success('Notifying your caregiver');
            }}
            className="bg-green-600 text-white rounded-2xl p-8 hover:bg-green-700 transition-colors shadow-xl hover:shadow-2xl flex items-center justify-center space-x-4"
          >
            <Phone className="w-10 h-10" />
            <span style={{ fontSize: `${fontSize + 4}px` }} className="font-semibold">
              Call My Caregiver
            </span>
          </button>
          
          <div className="bg-primary-100 rounded-2xl p-8 shadow-xl">
            <h3 style={{ fontSize: `${fontSize + 4}px` }} className="font-semibold text-primary-900 mb-4">
              Today's Progress
            </h3>
            <div className="text-center">
              <div style={{ fontSize: `${fontSize + 16}px` }} className="font-bold text-primary-700">
                {todayLogs.filter(l => l.status === 'taken').length} / {todayLogs.length}
              </div>
              <p style={{ fontSize: `${fontSize}px` }} className="text-primary-600 mt-2">
                Medications taken
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateDashboard;

