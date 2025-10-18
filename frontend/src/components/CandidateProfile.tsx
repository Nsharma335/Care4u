import { useState, useEffect } from "react";
import { 
  User, 
  Calendar, 
  Pill, 
  Heart, 
  Activity, 
  AlertTriangle, 
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Phone,
  Mail
} from "lucide-react";
import type { Candidate, MedicationSchedule, MedicationLog } from "@care4u/shared";
import api from "../lib/api";

interface CandidateProfileProps {
  candidate: Candidate;
  schedules: MedicationSchedule[];
  logs: MedicationLog[];
}

interface MedicalHistory {
  id: string;
  condition: string;
  diagnosis_date: string;
  severity: 'mild' | 'moderate' | 'severe';
  status: 'active' | 'resolved' | 'chronic';
  notes?: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  is_primary: boolean;
}

const CandidateProfile = ({ candidate, schedules, logs }: CandidateProfileProps) => {
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  // Sample data for demonstration - in real app, this would come from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setMedicalHistory([
        {
          id: "1",
          condition: "Hypertension",
          diagnosis_date: "2020-03-15",
          severity: "moderate",
          status: "chronic",
          notes: "Well controlled with medication"
        },
        {
          id: "2", 
          condition: "Type 2 Diabetes",
          diagnosis_date: "2019-08-22",
          severity: "mild",
          status: "chronic",
          notes: "Diet controlled, monitoring blood sugar"
        },
        {
          id: "3",
          condition: "Arthritis",
          diagnosis_date: "2021-01-10",
          severity: "mild",
          status: "active",
          notes: "Joint pain in knees and hands"
        }
      ]);

      setEmergencyContacts([
        {
          id: "1",
          name: "Sarah Johnson",
          relationship: "Daughter",
          phone: "+1 (555) 123-4567",
          email: "sarah.johnson@email.com",
          is_primary: true
        },
        {
          id: "2",
          name: "Dr. Michael Chen",
          relationship: "Primary Care Physician",
          phone: "+1 (555) 987-6543",
          email: "m.chen@healthcare.com",
          is_primary: false
        }
      ]);

      setLoading(false);
    }, 500);
  }, [candidate.id]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'text-green-600 bg-green-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'severe': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'chronic': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateAdherenceRate = () => {
    if (logs.length === 0) return 0;
    const taken = logs.filter(log => log.status === 'taken').length;
    return Math.round((taken / logs.length) * 100);
  };

  const getUpcomingMedications = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    return schedules.filter(schedule => {
      if (!schedule.active) return false;
      const todayLogs = logs.filter(log => 
        log.scheduled_time.startsWith(today) && 
        log.schedule_id === schedule.id
      );
      return todayLogs.length === 0 || todayLogs.some(log => log.status === 'pending');
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Candidate Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {candidate.first_name} {candidate.last_name}
            </h2>
            <p className="text-gray-600 mb-2">Candidate Profile</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Age: {candidate.age}
              </span>
              <span className="flex items-center">
                <Activity className="w-4 h-4 mr-1" />
                Adherence: {calculateAdherenceRate()}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Medical History */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-primary-600" />
            Medical History
          </h3>
          <div className="space-y-3">
            {medicalHistory.map((condition) => (
              <div key={condition.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{condition.condition}</h4>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(condition.severity)}`}>
                      {condition.severity}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(condition.status)}`}>
                      {condition.status}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Diagnosed: {new Date(condition.diagnosis_date).toLocaleDateString()}
                </p>
                {condition.notes && (
                  <p className="text-sm text-gray-500">{condition.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Medications */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Pill className="w-5 h-5 mr-2 text-primary-600" />
            Current Medications
          </h3>
          <div className="space-y-3">
            {schedules.filter(s => s.active).map((medication) => (
              <div key={medication.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{medication.medicine_name}</h4>
                  <span className="text-sm text-gray-500">{medication.dosage}</span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  Frequency: {medication.frequency}
                </p>
                <p className="text-sm text-gray-500">
                  Times: {medication.times.join(', ')}
                </p>
                {medication.instructions && (
                  <p className="text-sm text-gray-500 mt-1 italic">
                    {medication.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-primary-600" />
            Emergency Contacts
          </h3>
          <div className="space-y-3">
            {emergencyContacts.map((contact) => (
              <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{contact.name}</h4>
                  {contact.is_primary && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                      Primary
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{contact.relationship}</p>
                <p className="text-sm text-gray-500 mb-1">{contact.phone}</p>
                {contact.email && (
                  <p className="text-sm text-gray-500">{contact.email}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Medication Adherence */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Heart className="w-5 h-5 mr-2 text-primary-600" />
            Medication Adherence
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Overall Adherence</span>
              <span className="text-lg font-semibold text-primary-600">
                {calculateAdherenceRate()}%
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Upcoming Today</span>
                <span className="font-medium">{getUpcomingMedications().length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Medications</span>
                <span className="font-medium">{schedules.filter(s => s.active).length}</span>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Activity</h4>
              <div className="space-y-2">
                {logs.slice(0, 3).map((log) => (
                  <div key={log.id} className="flex items-center space-x-2 text-sm">
                    {log.status === 'taken' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : log.status === 'missed' ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-gray-600">
                      {new Date(log.scheduled_time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    <span className="text-gray-500 capitalize">{log.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
