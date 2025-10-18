import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import {
  ArrowLeft,
  TrendingUp,
  Calendar as CalendarIcon,
  Pill,
  Clock,
  Check,
  AlertCircle,
  Activity,
} from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import type {
  Candidate,
  MedicationLog,
  MedicationSchedule,
} from "@care4u/shared";

const CandidateView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "calendar" | "medications"
  >("overview");
  const [currentDate, setCurrentDate] = useState(new Date());

  const navItems = [
    {
      label: "Back",
      path: "#",
      icon: <ArrowLeft className="w-5 h-5" />,
    },
  ];

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      const [logsRes, schedulesRes] = await Promise.all([
        api.get(`/api/medications/logs/${id}`),
        api.get(`/api/medications/schedule/${id}`),
      ]);

      setLogs(logsRes.data.logs);
      setSchedules(schedulesRes.data.schedules);

      // Get candidate info from first log or schedule
      if (schedulesRes.data.schedules.length > 0) {
        // We'll need to add a candidate endpoint or get it from another source
        // For now, we'll construct a basic candidate object
        setCandidate({
          id: id || "",
          first_name: "Candidate",
          last_name: "Details",
          age: 0,
          created_at: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error("Error fetching candidate data:", error);
      toast.error("Failed to load candidate data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const last7Days = logs.filter((log) => {
    const logDate = new Date(log.scheduled_time);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return logDate >= weekAgo;
  });

  const last30Days = logs.filter((log) => {
    const logDate = new Date(log.scheduled_time);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    return logDate >= monthAgo;
  });

  const adherenceRate7Days =
    last7Days.length > 0
      ? Math.round(
          (last7Days.filter((l) => l.status === "taken").length /
            last7Days.length) *
            100
        )
      : 0;

  const adherenceRate30Days =
    last30Days.length > 0
      ? Math.round(
          (last30Days.filter((l) => l.status === "taken").length /
            last30Days.length) *
            100
        )
      : 0;

  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter((log) => log.scheduled_time.startsWith(today));
  const takenToday = todayLogs.filter((l) => l.status === "taken").length;
  const missedToday = todayLogs.filter((l) => l.status === "missed").length;

  // Calendar functions
  const getAdherenceForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayLogs = logs.filter((log) => log.scheduled_time.startsWith(dayStr));

    if (dayLogs.length === 0) return { color: "bg-gray-100", rate: 0 };

    const taken = dayLogs.filter((log) => log.status === "taken").length;
    const rate = (taken / dayLogs.length) * 100;

    if (rate === 100) return { color: "bg-green-500", rate };
    if (rate >= 75) return { color: "bg-green-300", rate };
    if (rate >= 50) return { color: "bg-yellow-300", rate };
    if (rate > 0) return { color: "bg-orange-300", rate };
    return { color: "bg-red-300", rate };
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{adherenceRate7Days}%</span>
          </div>
          <h3 className="text-sm font-semibold opacity-90">7-Day Adherence</h3>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <CalendarIcon className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{adherenceRate30Days}%</span>
          </div>
          <h3 className="text-sm font-semibold opacity-90">30-Day Adherence</h3>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Check className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">
              {takenToday}/{todayLogs.length}
            </span>
          </div>
          <h3 className="text-sm font-semibold opacity-90">Today's Taken</h3>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{missedToday}</span>
          </div>
          <h3 className="text-sm font-semibold opacity-90">Missed Today</h3>
        </div>
      </div>

      {/* Active Medications */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Pill className="w-6 h-6 text-blue-600" />
            <span>Active Medications ({schedules.length})</span>
          </h2>
        </div>

        <div className="p-6">
          {schedules.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No active medications
            </p>
          ) : (
            <div className="grid gap-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {schedule.medicine_name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Dosage:</span>{" "}
                        {schedule.dosage} •{" "}
                        <span className="font-medium">Frequency:</span>{" "}
                        {schedule.frequency}
                      </p>
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        <span className="text-xs font-medium text-gray-500">
                          Times:
                        </span>
                        {schedule.times.map((time, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium"
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="w-6 h-6 text-green-600" />
            <span>Recent Medication Activity</span>
          </h2>
        </div>

        <div className="p-6">
          {last7Days.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No recent medication activity
            </p>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {last7Days.slice(0, 20).map((log) => (
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
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {log.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-secondary-50 to-primary-50">
          <h2 className="text-xl font-semibold text-gray-900">
            Medication Adherence Calendar
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Monthly overview of medication compliance
          </p>
        </div>

        <div className="p-6">
          {/* Month Selector */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1
                  )
                )
              }
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Previous
            </button>
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentDate, "MMMM yyyy")}
            </h3>
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() + 1
                  )
                )
              }
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-600 py-2"
              >
                {day}
              </div>
            ))}

            {/* Add empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}

            {days.map((day) => {
              const adherence = getAdherenceForDay(day);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg border-2 ${
                    isCurrentDay ? "border-primary-500" : "border-transparent"
                  } ${
                    adherence.color
                  } hover:opacity-80 transition-opacity cursor-pointer`}
                  title={`${format(day, "MMM d")}: ${adherence.rate.toFixed(
                    0
                  )}% adherence`}
                >
                  <span
                    className={`text-sm ${
                      isCurrentDay ? "font-bold" : "font-medium"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">100%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-300 rounded"></div>
              <span className="text-gray-600">75-99%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-300 rounded"></div>
              <span className="text-gray-600">50-74%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-300 rounded"></div>
              <span className="text-gray-600">1-49%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-300 rounded"></div>
              <span className="text-gray-600">0%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMedications = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <h2 className="text-xl font-semibold text-gray-900">
          Medication Schedule Details
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Complete medication information
        </p>
      </div>

      <div className="p-6">
        {schedules.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No medications scheduled
          </p>
        ) : (
          <div className="grid gap-6">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {schedule.medicine_name}
                    </h3>
                    <div className="space-y-2">
                      <p className="text-base text-gray-700">
                        <span className="font-semibold">Dosage:</span>{" "}
                        {schedule.dosage}
                      </p>
                      <p className="text-base text-gray-700">
                        <span className="font-semibold">Frequency:</span>{" "}
                        {schedule.frequency}
                      </p>
                      {schedule.start_date && (
                        <p className="text-base text-gray-700">
                          <span className="font-semibold">Start Date:</span>{" "}
                          {format(new Date(schedule.start_date), "MMM d, yyyy")}
                        </p>
                      )}
                      {schedule.end_date && (
                        <p className="text-base text-gray-700">
                          <span className="font-semibold">End Date:</span>{" "}
                          {format(new Date(schedule.end_date), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>

                    {schedule.instructions && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Instructions: </span>
                          {schedule.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Scheduled Times:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {schedule.times.map((time, i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg"
                      >
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">{time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout title="Candidate Details" navItems={navItems}>
        <div className="flex items-center justify-center h-screen">
          <div className="w-16 h-16 border-8 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!candidate) {
    return (
      <DashboardLayout title="Candidate Details" navItems={navItems}>
        <div className="flex flex-col items-center justify-center h-screen">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Candidate Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The candidate you're looking for could not be found.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Candidate Details" navItems={navItems}>
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white p-8 rounded-2xl shadow-xl">
          <h1 className="text-4xl font-bold">
            {candidate.first_name} {candidate.last_name}
          </h1>
          <p className="text-primary-100 mt-2 text-lg">
            Age: {candidate.age} • Health Insights & Medication Management
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 bg-white rounded-2xl shadow-md p-2">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              activeTab === "calendar"
                ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab("medications")}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
              activeTab === "medications"
                ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Medications
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "calendar" && renderCalendar()}
      {activeTab === "medications" && renderMedications()}
    </DashboardLayout>
  );
};

export default CandidateView;
