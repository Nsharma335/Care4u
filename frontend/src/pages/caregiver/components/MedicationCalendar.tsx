import { Calendar as CalendarIcon } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
} from "date-fns";
import type { MedicationLog } from "@care4u/shared";
import { useState } from "react";

interface MedicationCalendarProps {
  candidateId?: string;
  logs: MedicationLog[];
}

const MedicationCalendar = ({ logs }: MedicationCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

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

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-secondary-50 to-primary-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Medication Adherence Calendar
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Monthly overview of medication compliance
            </p>
          </div>
          <CalendarIcon className="w-8 h-8 text-secondary-600" />
        </div>
      </div>

      <div className="p-6">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
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
                new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
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

export default MedicationCalendar;
