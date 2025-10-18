import { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import TabContainer from "../../components/TabContainer";
import { Activity, Heart, Eye, Users, BarChart3, MessageCircle, Wallet, Music } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";
import toast from "react-hot-toast";
import TodaySchedule from "./components/TodaySchedule";
import MedicationCalendar from "./components/MedicationCalendar";
import WellnessCheck from "./components/WellnessCheck";
import ActivityFeed from "./components/ActivityFeed";
import MedicationReminder from "../../components/MedicationReminder";
import CandidateInsights from "../../components/CandidateInsights";
import CandidateProfile from "../../components/CandidateProfile";
import CareInsights from "../../components/CareInsights";
import CareConnect from "../../components/CareConnect";
import CareWallet from "../../components/CareWallet";
import type {
  Candidate,
  MedicationSchedule,
  MedicationLog,
  Notification as NotificationType,
} from "@care4u/shared";

const CaregiverDashboard = () => {
  const { profile } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInsights, setShowInsights] = useState(false);

  const navItems = [
    {
      label: "Dashboard",
      path: "/caregiver/dashboard",
      icon: <Activity className="w-5 h-5" />,
    },
  ];

  useEffect(() => {
    fetchCandidates();
    fetchNotifications();

    // Poll for notifications every 2 minutes instead of 30 seconds to reduce refresh frequency
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCandidate) {
      fetchMedicationData();
    }
  }, [selectedCandidate?.id]); // Only depend on candidate ID, not the entire object

  const fetchCandidates = useCallback(async () => {
    try {
      const { data } = await api.get("/api/caregiver/candidates");
      setCandidates(data.candidates);
      if (data.candidates.length > 0 && !selectedCandidate) {
        setSelectedCandidate(data.candidates[0]);
      }
    } catch (error: any) {
      console.error("Error fetching candidates:", error);
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  }, [selectedCandidate]);

  const fetchMedicationData = useCallback(async () => {
    if (!selectedCandidate) return;

    try {
      const [schedulesRes, logsRes] = await Promise.all([
        api.get(`/api/medications/schedule/${selectedCandidate.id}`),
        api.get(`/api/medications/logs/${selectedCandidate.id}`),
      ]);

      setSchedules(schedulesRes.data.schedules);
      setLogs(logsRes.data.logs);
    } catch (error: any) {
      console.error("Error fetching medication data:", error);
      toast.error("Failed to load medication data");
    }
  }, [selectedCandidate]);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/api/medications/notifications");
      setNotifications(data.notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, []);

  const handleMedicationConfirmed = useCallback(() => {
    fetchMedicationData();
    fetchNotifications();
  }, [fetchMedicationData, fetchNotifications]);

  // Tab content components - memoized to prevent unnecessary re-renders
  const CareScheduleContent = useMemo(() => (
    <div className="space-y-6">
      {/* Candidate Selector */}
      {candidates.length > 0 && (
        <div className="mb-6 flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Candidate
            </label>
            <select
              value={selectedCandidate?.id || ""}
              onChange={(e) => {
                const candidate = candidates.find(
                  (c) => c.id === e.target.value
                );
                setSelectedCandidate(candidate || null);
              }}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.first_name} {candidate.last_name}
                </option>
              ))}
            </select>
          </div>
          {selectedCandidate && (
            <button
              onClick={() => setShowInsights(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Eye className="w-5 h-5" />
              <span>View Insights</span>
            </button>
          )}
        </div>
      )}

      {selectedCandidate && (
        <>
          {/* Today's Schedule */}
          <TodaySchedule
            candidate={selectedCandidate}
            schedules={schedules}
            logs={logs}
            onRefresh={handleMedicationConfirmed}
          />

          {/* Medication Calendar */}
          <MedicationCalendar candidateId={selectedCandidate.id} logs={logs} />

          <div className="grid md:grid-cols-2 gap-6">
            {/* Wellness Check */}
            <WellnessCheck />

            {/* Activity Feed */}
            <ActivityFeed candidateId={selectedCandidate.id} />
          </div>
        </>
      )}
    </div>
  ), [candidates, selectedCandidate, schedules, logs, handleMedicationConfirmed]);

  const CareCircleContent = useMemo(() => (
    <div className="space-y-6">
      {/* Candidate Selector */}
      {candidates.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary-600" />
              Candidate Profile
            </h3>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Candidate
            </label>
            <select
              value={selectedCandidate?.id || ""}
              onChange={(e) => {
                const candidate = candidates.find(
                  (c) => c.id === e.target.value
                );
                setSelectedCandidate(candidate || null);
              }}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.first_name} {candidate.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Candidate Profile */}
      {selectedCandidate ? (
        <CandidateProfile 
          candidate={selectedCandidate}
          schedules={schedules}
          logs={logs}
        />
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Candidate Selected</h3>
            <p className="text-gray-500">Please select a candidate to view their profile</p>
          </div>
        </div>
      )}
    </div>
  ), [candidates, selectedCandidate, schedules, logs]);

  const CareInsightsContent = useMemo(() => (
    <div className="space-y-6">
      {/* Candidate Selector */}
      {candidates.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
              Care Insights
            </h3>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Candidate
            </label>
            <select
              value={selectedCandidate?.id || ""}
              onChange={(e) => {
                const candidate = candidates.find(
                  (c) => c.id === e.target.value
                );
                setSelectedCandidate(candidate || null);
              }}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.first_name} {candidate.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Care Insights Dashboard */}
      {selectedCandidate ? (
        <CareInsights 
          candidate={selectedCandidate}
          schedules={schedules}
          logs={logs}
        />
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Candidate Selected</h3>
            <p className="text-gray-500">Please select a candidate to view their care insights</p>
          </div>
        </div>
      )}
    </div>
  ), [candidates, selectedCandidate, schedules, logs]);

  const CareConnectContent = useMemo(() => (
    <CareConnect candidates={candidates} />
  ), [candidates]);

  const CareWalletContent = useMemo(() => (
    <CareWallet candidates={candidates} />
  ), [candidates]);

  const CareTunesContent = useMemo(() => (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <div className="text-center">
        <Music className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">CareTunes</h3>
        <p className="text-gray-500">Coming soon...</p>
      </div>
    </div>
  ), []);

  const tabs = useMemo(() => [
    {
      id: "care-schedule",
      label: "CareSchedule",
      content: CareScheduleContent
    },
    {
      id: "care-circle",
      label: "CareCircle",
      content: CareCircleContent
    },
    {
      id: "care-insights",
      label: "CareInsights",
      content: CareInsightsContent
    },
    {
      id: "care-connect",
      label: "CareConnect",
      content: CareConnectContent
    },
    {
      id: "care-wallet",
      label: "CareWallet",
      content: CareWalletContent
    },
    {
      id: "care-tunes",
      label: "CareTunes",
      content: CareTunesContent
    }
  ], [CareScheduleContent, CareCircleContent, CareInsightsContent, CareConnectContent, CareWalletContent, CareTunesContent]);

  if (loading) {
    return (
      <DashboardLayout title="Caregiver Portal" navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (candidates.length === 0) {
    return (
      <DashboardLayout title="Caregiver Portal" navItems={navItems}>
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Candidates Assigned
          </h2>
          <p className="text-gray-600">
            Please contact your administrator to get assigned to candidates.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Caregiver Portal" navItems={navItems}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {profile?.first_name}!
        </h1>
        <p className="text-gray-600">Manage care for your assigned residents</p>
      </div>

      {/* Tab Container */}
      <TabContainer tabs={tabs} defaultTab="care-schedule" />

      {/* Medication Reminders */}
      {notifications
        .filter((n) => n.type === "medication_reminder" && !n.read)
        .map((notification) => (
          <MedicationReminder
            key={notification.id}
            notification={notification}
            onConfirm={handleMedicationConfirmed}
          />
        ))}

      {/* Candidate Insights Modal */}
      {showInsights && selectedCandidate && (
        <CandidateInsights
          candidate={selectedCandidate}
          onClose={() => setShowInsights(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default CaregiverDashboard;
