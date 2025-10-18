import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Activity,
  Heart,
  MessageCircle,
  TrendingUp,
  Calendar as CalendarIcon,
  FileText,
  Upload,
  Eye,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import type {
  Candidate,
  MedicationLog,
  MedicationSchedule,
} from "@care4u/shared";
import MedicationCalendar from "../caregiver/components/MedicationCalendar";
import CandidateInsights from "../../components/CandidateInsights";

interface MedicationScheduleItem {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  instructions?: string;
}

const FamilyDashboard = () => {
  const { profile } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "calendar" | "prescriptions"
  >("overview");
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedSchedule, setExtractedSchedule] = useState<
    MedicationScheduleItem[]
  >([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [showInsights, setShowInsights] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    {
      label: "Dashboard",
      path: "/family/dashboard",
      icon: <Activity className="w-5 h-5" />,
    },
  ];

  useEffect(() => {
    if (profile?.candidate_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      const candidateId = profile?.candidate_id;

      const [logsRes, activitiesRes, schedulesRes] = await Promise.all([
        api.get(`/api/medications/logs/${candidateId}`),
        api.get(`/api/caregiver/activity-log/${candidateId}`),
        api.get(`/api/medications/schedule/${candidateId}`),
      ]);

      setLogs(logsRes.data.logs);
      setActivities(activitiesRes.data.activities);
      setSchedules(schedulesRes.data.schedules);

      // Get candidate info from profile
      if (profile) {
        setCandidate({
          id: candidateId || "",
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          age: 0,
          created_at: "",
        });
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setShowSchedule(false);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("candidate_id", profile?.candidate_id || "");

      setProcessing(true);
      const { data } = await api.post(
        "/api/chat/process-prescription",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setExtractedSchedule(data.schedule);
      setShowSchedule(true);

      if (data.schedule.length === 0) {
        toast.error("Couldn't extract any medications from the prescription.");
      } else {
        toast.success(`Found ${data.schedule.length} medication(s)!`);
      }
    } catch (error: any) {
      console.error("Error uploading prescription:", error);
      toast.error(
        error.response?.data?.error || "Failed to process prescription"
      );
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleConfirmSchedule = async () => {
    try {
      await api.post("/api/chat/save-schedule", {
        candidate_id: profile?.candidate_id,
        medications: extractedSchedule,
      });

      toast.success("Medication schedule saved successfully!");
      setShowSchedule(false);
      setExtractedSchedule([]);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      toast.error(error.response?.data?.error || "Failed to save schedule");
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Family Portal" navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  const last7Days = logs.filter((log) => {
    const logDate = new Date(log.scheduled_time);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  });

  const adherenceRate =
    last7Days.length > 0
      ? Math.round(
          (last7Days.filter((l) => l.status === "taken").length /
            last7Days.length) *
            100
        )
      : 0;

  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter((log) => log.scheduled_time.startsWith(today));
  const takenToday = todayLogs.filter((l) => l.status === "taken").length;
  const totalToday = todayLogs.length;

  const renderOverviewTab = () => (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-10 h-10 opacity-80" />
            <span className="text-4xl font-bold">{adherenceRate}%</span>
          </div>
          <h3 className="text-lg font-semibold opacity-90">Weekly Adherence</h3>
          <p className="text-sm opacity-75 mt-1">Last 7 days</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Heart className="w-10 h-10 opacity-80" />
            <span className="text-4xl font-bold">
              {takenToday}/{totalToday}
            </span>
          </div>
          <h3 className="text-lg font-semibold opacity-90">
            Today's Medications
          </h3>
          <p className="text-sm opacity-75 mt-1">
            {format(new Date(), "MMM d, yyyy")}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-10 h-10 opacity-80" />
            <span className="text-4xl font-bold">{activities.length}</span>
          </div>
          <h3 className="text-lg font-semibold opacity-90">Recent Updates</h3>
          <p className="text-sm opacity-75 mt-1">Last 30 days</p>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Activity
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Updates from your caregiver
              </p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="p-6">
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No recent activities</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.slice(0, 10).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {activity.title}
                    </h4>
                    {activity.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(activity.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Medication History */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Medication History
          </h2>
          <p className="text-sm text-gray-600 mt-1">Last 7 days</p>
        </div>

        <div className="p-6">
          {last7Days.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No medication history available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {last7Days.slice(0, 15).map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {format(new Date(log.scheduled_time), "MMM d, h:mm a")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            log.status === "taken"
                              ? "bg-green-100 text-green-700"
                              : log.status === "missed"
                              ? "bg-red-100 text-red-700"
                              : log.status === "skipped"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const renderCalendarTab = () => (
    <div className="space-y-6">
      <MedicationCalendar candidateId={profile?.candidate_id} logs={logs} />

      {/* Current Medications */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-gray-900">
            Active Medications
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Current medication schedule
          </p>
        </div>

        <div className="p-6">
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No active medications</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <h4 className="font-semibold text-gray-900">
                    {schedule.medicine_name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Dosage: {schedule.dosage} • {schedule.frequency}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs font-medium text-gray-500">
                      Times:
                    </span>
                    {schedule.times.map((time, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                  {schedule.instructions && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      {schedule.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderPrescriptionsTab = () => (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <h2 className="text-xl font-semibold text-gray-900">
            Upload Prescription
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Add new medications by uploading a prescription
          </p>
        </div>

        <div className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || processing}
            className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
          >
            <Upload className="w-5 h-5" />
            <span>
              {uploading
                ? "Uploading..."
                : processing
                ? "Processing..."
                : "Upload Prescription"}
            </span>
          </button>
          <p className="text-sm text-gray-500 text-center mt-3">
            Supported formats: Images (JPG, PNG), PDF, or text files
          </p>
        </div>
      </div>

      {/* Schedule Review */}
      {showSchedule && extractedSchedule.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-xl font-semibold text-gray-900">
              Review Extracted Medications
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Please verify the information before saving
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-3 mb-6">
              {extractedSchedule.map((med, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <h4 className="font-semibold text-gray-900">{med.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Dosage: {med.dosage} • {med.frequency}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs font-medium text-gray-500">
                      Times:
                    </span>
                    {med.times.map((time, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full"
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                  {med.instructions && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      {med.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSchedule(false);
                  setExtractedSchedule([]);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSchedule}
                className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
              >
                Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout title="Family Portal" navItems={navItems}>
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {profile?.first_name}!
          </h1>
          <p className="text-gray-600">Stay updated on your loved one's care</p>
        </div>
        {candidate && (
          <button
            onClick={() => setShowInsights(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Eye className="w-5 h-5" />
            <span>View Full Insights</span>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "overview"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Overview</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "calendar"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>Calendar</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "prescriptions"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Prescriptions</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && renderOverviewTab()}
      {activeTab === "calendar" && renderCalendarTab()}
      {activeTab === "prescriptions" && renderPrescriptionsTab()}

      {/* Candidate Insights Modal */}
      {showInsights && candidate && (
        <CandidateInsights
          candidate={candidate}
          onClose={() => setShowInsights(false)}
        />
      )}
    </DashboardLayout>
  );
};

export default FamilyDashboard;
