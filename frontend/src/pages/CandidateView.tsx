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
  Bell,
  CheckCircle,
  Sparkles,
  RefreshCw,
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
  const [aiSummary, setAiSummary] = useState<string>("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryGeneratedAt, setSummaryGeneratedAt] = useState<string>("");

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

  // Find next upcoming medication
  const now = new Date();
  const upcomingLogs = logs
    .filter((log) => {
      const logTime = new Date(log.scheduled_time);
      return logTime > now && log.status === "pending";
    })
    .sort(
      (a, b) =>
        new Date(a.scheduled_time).getTime() -
        new Date(b.scheduled_time).getTime()
    );

  const nextMedication = upcomingLogs[0];

  // Handle marking medication as taken
  const handleMarkAsTaken = async (logId: string) => {
    try {
      await api.post("/api/medications/confirm", { log_id: logId });
      toast.success("Medication marked as taken!");
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error("Error marking medication as taken:", error);
      toast.error("Failed to mark medication as taken");
    }
  };

  // Generate AI summary
  const handleGenerateSummary = async () => {
    if (!id) return;

    try {
      setLoadingSummary(true);
      const response = await api.post(`/api/medications/summary/${id}`);
      setAiSummary(response.data.summary);
      setSummaryGeneratedAt(response.data.generatedAt);
      toast.success("Summary generated successfully!");
    } catch (error: any) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Calendar functions
  const getAdherenceForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayLogs = logs.filter((log) => log.scheduled_time.startsWith(dayStr));

    if (dayLogs.length === 0) return { color: "bg-gray-50", rate: 0 };

    const taken = dayLogs.filter((log) => log.status === "taken").length;
    const rate = (taken / dayLogs.length) * 100;

    if (rate === 100) return { color: "bg-green-50", rate };
    if (rate >= 75) return { color: "bg-green-50", rate };
    if (rate >= 50) return { color: "bg-yellow-50", rate };
    if (rate > 0) return { color: "bg-orange-50", rate };
    return { color: "bg-red-50", rate };
  };

  const getMedicationsForDay = (day: Date) => {
    const dayStr = format(day, "yyyy-MM-dd");
    const dayLogs = logs.filter((log) => log.scheduled_time.startsWith(dayStr));

    return dayLogs.map((log) => ({
      ...log,
      schedule: schedules.find((s) => s.id === log.schedule_id),
    }));
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-semibold text-gray-900">
              {adherenceRate7Days}%
            </span>
          </div>
          <h3 className="text-xs font-medium text-gray-600">7-Day Adherence</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <CalendarIcon className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-semibold text-gray-900">
              {adherenceRate30Days}%
            </span>
          </div>
          <h3 className="text-xs font-medium text-gray-600">
            30-Day Adherence
          </h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <Check className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-semibold text-gray-900">
              {takenToday}/{todayLogs.length}
            </span>
          </div>
          <h3 className="text-xs font-medium text-gray-600">Today's Taken</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <AlertCircle className="w-5 h-5 text-gray-400" />
            <span className="text-2xl font-semibold text-gray-900">
              {missedToday}
            </span>
          </div>
          <h3 className="text-xs font-medium text-gray-600">Missed Today</h3>
        </div>
      </div>

      {/* Today's Medications */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gray-600" />
            <span>Today's Medications ({todayLogs.length})</span>
          </h2>
        </div>

        <div className="p-4">
          {todayLogs.length === 0 ? (
            <p className="text-gray-500 text-center text-sm py-6">
              No medications scheduled for today
            </p>
          ) : (
            <div className="grid gap-2">
              {todayLogs.map((log) => {
                const schedule = schedules.find(
                  (s) => s.id === log.schedule_id
                );
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      log.status === "taken"
                        ? "bg-green-50 border-green-200"
                        : log.status === "missed"
                        ? "bg-red-50 border-red-200"
                        : log.status === "skipped"
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          log.status === "taken"
                            ? "bg-green-100"
                            : log.status === "missed"
                            ? "bg-red-100"
                            : log.status === "skipped"
                            ? "bg-yellow-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Pill
                          className={`w-4 h-4 ${
                            log.status === "taken"
                              ? "text-green-600"
                              : log.status === "missed"
                              ? "text-red-600"
                              : log.status === "skipped"
                              ? "text-yellow-600"
                              : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {schedule?.medicine_name || "Unknown"}
                        </h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs text-gray-600">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {format(new Date(log.scheduled_time), "h:mm a")}
                          </span>
                          <span className="text-xs text-gray-600">
                            {schedule?.dosage}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                    </div>
                    {log.status === "pending" && (
                      <button
                        onClick={() => handleMarkAsTaken(log.id)}
                        className="ml-3 flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" />
                        <span>Mark Taken</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active Medications */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
            <Pill className="w-5 h-5 text-gray-600" />
            <span>Active Medications ({schedules.length})</span>
          </h2>
        </div>

        <div className="p-4">
          {schedules.length === 0 ? (
            <p className="text-gray-500 text-center text-sm py-6">
              No active medications
            </p>
          ) : (
            <div className="grid gap-3">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {schedule.medicine_name}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        <span className="font-medium">Dosage:</span>{" "}
                        {schedule.dosage} •{" "}
                        <span className="font-medium">Frequency:</span>{" "}
                        {schedule.frequency}
                      </p>
                      <div className="flex items-center flex-wrap gap-1.5 mt-2">
                        <span className="text-xs font-medium text-gray-500">
                          Times:
                        </span>
                        {schedule.times.map((time, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded font-medium"
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
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <span>Recent Medication Activity</span>
          </h2>
        </div>

        <div className="p-4">
          {last7Days.length === 0 ? (
            <p className="text-gray-500 text-center text-sm py-6">
              No recent medication activity
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Medicine
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {last7Days.slice(0, 20).map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {schedules.find((s) => s.id === log.schedule_id)
                          ?.medicine_name || "Unknown"}
                      </td>
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
                      <td className="px-4 py-3">
                        {log.status === "pending" && (
                          <button
                            onClick={() => handleMarkAsTaken(log.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Taken</span>
                          </button>
                        )}
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
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            Medication Calendar
          </h2>
          <p className="text-xs text-gray-600 mt-0.5">
            Monthly overview of medication compliance
          </p>
        </div>

        <div className="p-4">
          {/* Month Selector */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1
                  )
                )
              }
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Previous
            </button>
            <h3 className="text-sm font-semibold text-gray-900">
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
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-gray-500 py-2"
              >
                {day}
              </div>
            ))}

            {/* Add empty cells for days before month starts */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[120px]"></div>
            ))}

            {days.map((day) => {
              const adherence = getAdherenceForDay(day);
              const isCurrentDay = isToday(day);
              const dayMedications = getMedicationsForDay(day);
              const visibleMeds = dayMedications.slice(0, 2);
              const remainingCount = dayMedications.length - 2;

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[120px] p-2 flex flex-col rounded-lg border ${
                    isCurrentDay
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 bg-white"
                  } ${adherence.color} hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs ${
                        isCurrentDay
                          ? "font-bold text-blue-700"
                          : "font-medium text-gray-600"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayMedications.length > 0 && (
                      <span className="text-[10px] text-gray-400">
                        {
                          dayMedications.filter((m) => m.status === "taken")
                            .length
                        }
                        /{dayMedications.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    {visibleMeds.map((med) => (
                      <div
                        key={med.id}
                        className={`text-[10px] px-1.5 py-1 rounded truncate ${
                          med.status === "taken"
                            ? "bg-green-100 text-green-700"
                            : med.status === "missed"
                            ? "bg-red-100 text-red-700"
                            : med.status === "skipped"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                        title={`${med.schedule?.medicine_name} - ${format(
                          new Date(med.scheduled_time),
                          "h:mm a"
                        )}`}
                      >
                        {med.schedule?.medicine_name}
                      </div>
                    ))}
                    {remainingCount > 0 && (
                      <div className="text-[10px] text-gray-500 font-medium px-1">
                        +{remainingCount} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
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
      {/* AI Summary Card */}
      <div className="mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  AI Health Summary
                </h3>
                {summaryGeneratedAt && (
                  <p className="text-xs text-gray-500">
                    Generated{" "}
                    {format(new Date(summaryGeneratedAt), "MMM d, h:mm a")}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleGenerateSummary}
              disabled={loadingSummary}
              className="flex items-center space-x-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingSummary ? (
                <>
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  <span>Generate Summary</span>
                </>
              )}
            </button>
          </div>

          {aiSummary ? (
            <div className="bg-white/80 rounded-lg p-3 text-sm text-gray-700 leading-relaxed">
              {aiSummary}
            </div>
          ) : (
            <div className="bg-white/80 rounded-lg p-3 text-sm text-gray-500 text-center italic">
              Click "Generate Summary" to get an AI-powered health overview
              based on today's medication status
            </div>
          )}
        </div>
      </div>

      {/* Next Medication Notification */}
      {nextMedication && (
        <div className="mb-6 animate-fadeIn">
          <div
            className={`border rounded-lg p-4 ${
              nextMedication.status === "taken"
                ? "bg-green-50 border-green-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div
                  className={`p-2 rounded-lg ${
                    nextMedication.status === "taken"
                      ? "bg-green-100"
                      : "bg-blue-100"
                  }`}
                >
                  <Bell
                    className={`w-5 h-5 ${
                      nextMedication.status === "taken"
                        ? "text-green-600"
                        : "text-blue-600"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    Next Medication
                  </h3>
                  <div className="space-y-0.5 text-sm text-gray-700">
                    <p>
                      <span className="font-medium">Medicine:</span>{" "}
                      {schedules.find(
                        (s) => s.id === nextMedication.schedule_id
                      )?.medicine_name || "Unknown"}
                    </p>
                    <p>
                      <span className="font-medium">Time:</span>{" "}
                      {format(
                        new Date(nextMedication.scheduled_time),
                        "h:mm a"
                      )}
                    </p>
                    <p>
                      <span className="font-medium">Dosage:</span>{" "}
                      {
                        schedules.find(
                          (s) => s.id === nextMedication.schedule_id
                        )?.dosage
                      }
                    </p>
                  </div>
                </div>
              </div>
              {nextMedication.status === "taken" ? (
                <div className="ml-4 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Taken</span>
                </div>
              ) : (
                <button
                  onClick={() => handleMarkAsTaken(nextMedication.id)}
                  className="ml-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow transition-all flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark as Taken</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === "overview"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === "calendar"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab("medications")}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === "medications"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100"
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
