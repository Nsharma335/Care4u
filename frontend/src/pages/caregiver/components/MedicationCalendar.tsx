import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import type { MedicationLog, MedicationSchedule } from "@care4u/shared";
import { useState } from "react";
import api from "../../../lib/api";
import { useEffect } from "react";

interface MedicationCalendarProps {
  candidateId?: string;
  logs: MedicationLog[];
}

const MedicationCalendar = ({ candidateId, logs }: MedicationCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<MedicationSchedule[]>([]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    if (candidateId) {
      fetchSchedules();
    }
  }, [candidateId]);

  const fetchSchedules = async () => {
    if (!candidateId) return;
    try {
      const { data } = await api.get(
        `/api/medications/schedule/${candidateId}`
      );
      setSchedules(data.schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

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
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
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
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
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

export default MedicationCalendar;
