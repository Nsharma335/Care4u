import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Home,
  Calendar as CalendarIcon,
  Users,
  Pill,
  Phone,
  Volume2,
  Bell,
  Check,
  Clock,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { format, addMinutes, isAfter, isBefore } from "date-fns";
import type {
  MedicationSchedule,
  MedicationLog,
  FamilyMember,
} from "@care4u/shared";

const CandidateDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "home" | "calendar" | "family" | "medications"
  >("home");
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const navItems = [
    {
      label: "Dashboard",
      path: "/candidate/dashboard",
      icon: <Home className="w-5 h-5" />,
    },
  ];

  useEffect(() => {
    if (profile?.id) {
      fetchData();
    }
    // Refresh data every 2 minutes to keep medication status updated (reduced frequency)
    const interval = setInterval(fetchData, 120000);
    return () => clearInterval(interval);
  }, [profile?.id]); // Only depend on profile ID, not the entire profile object

  const fetchData = async () => {
    try {
      const [schedulesRes, logsRes, familyRes] = await Promise.all([
        api.get(`/api/medications/schedule/${profile?.id}`),
        api.get(`/api/medications/logs/${profile?.id}`),
        api.get(`/api/admin/candidates/${profile?.id}/family-members`),
      ]);

      setSchedules(schedulesRes.data.schedules);
      setLogs(logsRes.data.logs);
      setFamilyMembers(familyRes.data.family_members || []);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Get today's medication schedule
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();

  const todayScheduleItems = schedules
    .flatMap((schedule) =>
      schedule.times.map((time) => {
        const scheduledDateTime = new Date(`${today}T${time}:00`);
        const log = logs.find(
          (l) =>
            l.schedule_id === schedule.id &&
            l.scheduled_time === `${today}T${time}:00.000Z`
        );

        return {
          schedule,
          time,
          scheduledDateTime,
          log,
          isPast: isBefore(scheduledDateTime, now),
          isUpcoming:
            isAfter(scheduledDateTime, now) &&
            isBefore(scheduledDateTime, addMinutes(now, 60)),
          isNext:
            isAfter(scheduledDateTime, now) &&
            isBefore(scheduledDateTime, addMinutes(now, 30)),
        };
      })
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  const nextMedication = todayScheduleItems.find(
    (item) => !item.isPast && !item.log
  );

  // Calendar data
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

  const renderHomeTab = () => (
    <div className="space-y-6">
      {/* Next Medication Alert */}
      {nextMedication && (
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-3xl p-8 shadow-2xl animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Bell className="w-12 h-12" />
              <div>
                <h2 className="text-3xl font-bold">Next Medication</h2>
                <p className="text-xl opacity-90">
                  {format(nextMedication.scheduledDateTime, "h:mm a")}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                handleSpeak(
                  `Next medication at ${format(
                    nextMedication.scheduledDateTime,
                    "h:mm a"
                  )}. ${nextMedication.schedule.medicine_name}. ${
                    nextMedication.schedule.dosage
                  }`
                )
              }
              className="p-4 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-all"
            >
              <Volume2 className="w-8 h-8" />
            </button>
          </div>
          <div className="bg-white bg-opacity-20 rounded-2xl p-6">
            <h3 className="text-2xl font-bold mb-2">
              {nextMedication.schedule.medicine_name}
            </h3>
            <p className="text-xl">{nextMedication.schedule.dosage}</p>
            {nextMedication.schedule.instructions && (
              <p className="text-lg mt-2 opacity-90">
                {nextMedication.schedule.instructions}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Medications Summary */}
      <div className="bg-white rounded-3xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <span>Today's Schedule</span>
          </h2>
          <button
            onClick={() =>
              handleSpeak(
                `You have ${todayScheduleItems.length} medications scheduled for today`
              )
            }
            className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {todayScheduleItems.length === 0 ? (
            <p className="text-xl text-gray-500 text-center py-12">
              No medications scheduled for today
            </p>
          ) : (
            todayScheduleItems.map((item, index) => {
              const status = item.log?.status;
              const isCurrent =
                item.isNext && (!status || status === "pending");

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-6 rounded-2xl border-3 transition-all ${
                    isCurrent
                      ? "bg-blue-50 border-blue-400 shadow-lg scale-105"
                      : status === "taken"
                      ? "bg-green-50 border-green-300"
                      : status === "missed"
                      ? "bg-red-50 border-red-300"
                      : status === "skipped"
                      ? "bg-yellow-50 border-yellow-300"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className="flex items-center space-x-6 flex-1">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">
                        {item.time}
                      </div>
                      {isCurrent && (
                        <span className="text-sm text-blue-600 font-semibold">
                          NEXT
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {item.schedule.medicine_name}
                      </h3>
                      <p className="text-xl text-gray-600">
                        {item.schedule.dosage}
                      </p>
                      {item.schedule.instructions && (
                        <p className="text-base text-gray-500 mt-1 italic">
                          {item.schedule.instructions}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {status === "taken" && (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-green-700 mt-1">
                          Taken
                        </span>
                      </div>
                    )}
                    {status === "missed" && (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                          <X className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-red-700 mt-1">
                          Missed
                        </span>
                      </div>
                    )}
                    {status === "skipped" && (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-3xl text-white">○</span>
                        </div>
                        <span className="text-sm font-semibold text-yellow-700 mt-1">
                          Skipped
                        </span>
                      </div>
                    )}
                    {(!status || status === "pending") && !item.isPast && (
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                          <Clock className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 mt-1">
                          Pending
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() =>
                        handleSpeak(
                          `${item.time}. ${item.schedule.medicine_name}. ${
                            item.schedule.dosage
                          }. ${item.schedule.instructions || ""}`
                        )
                      }
                      className="p-4 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                    >
                      <Volume2 className="w-7 h-7" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Today's Progress */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-3xl p-8 shadow-xl">
        <h2 className="text-2xl font-bold mb-4">Today's Progress</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-6xl font-bold">
              {
                logs.filter(
                  (l) =>
                    l.status === "taken" && l.scheduled_time.startsWith(today)
                ).length
              }
              <span className="text-4xl opacity-80">
                /{todayScheduleItems.length}
              </span>
            </div>
            <p className="text-xl mt-2 opacity-90">Medications taken</p>
          </div>
          <div className="text-8xl opacity-20">
            <Check />
          </div>
        </div>
      </div>

      {/* Call Caregiver Button */}
      <button
        onClick={() => {
          handleSpeak("Calling your caregiver");
          toast.success("Your caregiver has been notified");
        }}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-3xl p-8 hover:from-blue-700 hover:to-blue-800 transition-all shadow-xl hover:shadow-2xl flex items-center justify-center space-x-4"
      >
        <Phone className="w-12 h-12" />
        <span className="text-3xl font-bold">Call My Caregiver</span>
      </button>
    </div>
  );

  const renderCalendarTab = () => {
    const currentDate = new Date();
    const monthStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );
    const monthEnd = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const days: Date[] = [];
    for (
      let d = new Date(monthStart);
      d <= monthEnd;
      d.setDate(d.getDate() + 1)
    ) {
      days.push(new Date(d));
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
            <CalendarIcon className="w-10 h-10 text-purple-600" />
            <span>My Medication Calendar</span>
          </h2>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-center text-gray-900">
              {format(currentDate, "MMMM yyyy")}
            </h3>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-3">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-lg font-bold text-gray-600 py-3"
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
              const isToday =
                format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

              return (
                <div
                  key={day.toISOString()}
                  className={`aspect-square flex flex-col items-center justify-center rounded-2xl border-4 ${
                    isToday ? "border-blue-500" : "border-transparent"
                  } ${
                    adherence.color
                  } hover:opacity-80 transition-all cursor-pointer`}
                  title={`${format(day, "MMM d")}: ${adherence.rate.toFixed(
                    0
                  )}% adherence`}
                >
                  <span
                    className={`text-xl ${
                      isToday ? "font-bold" : "font-semibold"
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 flex items-center justify-center flex-wrap gap-6 text-lg">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-lg"></div>
              <span className="text-gray-700">100%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-300 rounded-lg"></div>
              <span className="text-gray-700">75-99%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-300 rounded-lg"></div>
              <span className="text-gray-700">50-74%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-300 rounded-lg"></div>
              <span className="text-gray-700">1-49%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-red-300 rounded-lg"></div>
              <span className="text-gray-700">0%</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFamilyTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
          <Users className="w-10 h-10 text-pink-600" />
          <span>My Family</span>
        </h2>

        {familyMembers.length === 0 ? (
          <p className="text-xl text-gray-500 text-center py-12">
            No family members connected yet
          </p>
        ) : (
          <div className="grid gap-6">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200"
              >
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {member.first_name.charAt(0)}
                    {member.last_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {member.first_name} {member.last_name}
                    </h3>
                    <p className="text-lg text-gray-600">{member.email}</p>
                    {member.is_caregiver && (
                      <span className="inline-block mt-2 px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        Caregiver
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    handleSpeak(`Calling ${member.first_name}`);
                    toast.success(`Calling ${member.first_name}...`);
                  }}
                  className="p-6 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-colors shadow-lg hover:shadow-xl"
                >
                  <Phone className="w-10 h-10" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMedicationsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
          <Pill className="w-10 h-10 text-blue-600" />
          <span>My Medications</span>
        </h2>

        {schedules.length === 0 ? (
          <p className="text-xl text-gray-500 text-center py-12">
            No medications scheduled
          </p>
        ) : (
          <div className="grid gap-6">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-900 mb-2">
                      {schedule.medicine_name}
                    </h3>
                    <p className="text-xl text-gray-700 mb-4">
                      <span className="font-semibold">Dosage:</span>{" "}
                      {schedule.dosage}
                    </p>
                    <p className="text-xl text-gray-700 mb-4">
                      <span className="font-semibold">Frequency:</span>{" "}
                      {schedule.frequency}
                    </p>

                    {schedule.instructions && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <p className="text-lg text-gray-700 italic">
                          <span className="font-semibold not-italic">
                            Instructions:{" "}
                          </span>
                          {schedule.instructions}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      handleSpeak(
                        `${schedule.medicine_name}. Dosage: ${
                          schedule.dosage
                        }. Frequency: ${schedule.frequency}. ${
                          schedule.instructions
                            ? "Instructions: " + schedule.instructions
                            : ""
                        }`
                      )
                    }
                    className="p-4 bg-purple-100 text-purple-600 rounded-xl hover:bg-purple-200 transition-colors ml-4"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>
                </div>

                <div className="mt-6">
                  <p className="text-lg font-semibold text-gray-700 mb-3">
                    Times:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {schedule.times.map((time, i) => (
                      <div
                        key={i}
                        className="px-6 py-3 bg-purple-500 text-white rounded-xl text-xl font-bold"
                      >
                        {time}
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
      <DashboardLayout title="My Health" navItems={navItems}>
        <div className="flex items-center justify-center h-screen">
          <div className="w-16 h-16 border-8 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Health" navItems={navItems}>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-3xl shadow-2xl p-8 mb-8 text-white">
        <h1 className="text-4xl font-bold mb-2">
          Hello, {profile?.first_name}! 👋
        </h1>
        <p className="text-2xl opacity-90">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8 bg-white rounded-3xl shadow-lg p-2">
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => setActiveTab("home")}
            className={`py-6 px-4 rounded-2xl font-bold text-lg transition-all ${
              activeTab === "home"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <Home className="w-8 h-8" />
              <span>Home</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("calendar")}
            className={`py-6 px-4 rounded-2xl font-bold text-lg transition-all ${
              activeTab === "calendar"
                ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg scale-105"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <CalendarIcon className="w-8 h-8" />
              <span>Calendar</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("family")}
            className={`py-6 px-4 rounded-2xl font-bold text-lg transition-all ${
              activeTab === "family"
                ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg scale-105"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <Users className="w-8 h-8" />
              <span>Family</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab("medications")}
            className={`py-6 px-4 rounded-2xl font-bold text-lg transition-all ${
              activeTab === "medications"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <Pill className="w-8 h-8" />
              <span>Medications</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "home" && renderHomeTab()}
      {activeTab === "calendar" && renderCalendarTab()}
      {activeTab === "family" && renderFamilyTab()}
      {activeTab === "medications" && renderMedicationsTab()}
    </DashboardLayout>
  );
};

export default CandidateDashboard;
