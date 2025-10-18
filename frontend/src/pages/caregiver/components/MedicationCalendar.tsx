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

    if (dayLogs.length === 0)
      return { color: "bg-gray-100", rate: 0, count: 0, taken: 0 };

    const taken = dayLogs.filter((log) => log.status === "taken").length;
    const rate = (taken / dayLogs.length) * 100;

    if (rate === 100)
      return { color: "bg-green-500", rate, count: dayLogs.length, taken };
    if (rate >= 75)
      return { color: "bg-green-300", rate, count: dayLogs.length, taken };
    if (rate >= 50)
      return { color: "bg-yellow-300", rate, count: dayLogs.length, taken };
    if (rate > 0)
      return { color: "bg-orange-300", rate, count: dayLogs.length, taken };
    return { color: "bg-red-300", rate, count: dayLogs.length, taken };
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-secondary-50 to-primary-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Medication Calendar
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Monthly adherence overview
            </p>
          </div>
          <CalendarIcon className="w-6 h-6 text-secondary-600" />
        </div>
      </div>

      <div className="p-4">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
              )
            }
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Prev
          </button>
          <h3 className="text-base font-semibold text-gray-900">
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
        <div className="grid grid-cols-7 gap-1.5">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div
              key={`${day}-${index}`}
              className="text-center text-xs font-semibold text-gray-500 py-1"
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
                className={`aspect-square flex flex-col items-center justify-center rounded-md border ${
                  isCurrentDay
                    ? "border-primary-600 border-2"
                    : "border-gray-200"
                } ${
                  adherence.color
                } hover:opacity-80 transition-all cursor-pointer relative group`}
                title={`${format(day, "MMM d")}: ${
                  adherence.count > 0
                    ? `${adherence.taken}/${
                        adherence.count
                      } meds (${adherence.rate.toFixed(0)}%)`
                    : "No medications"
                }`}
              >
                <span
                  className={`text-xs ${
                    isCurrentDay ? "font-bold" : "font-medium"
                  } ${adherence.count > 0 ? "text-gray-900" : "text-gray-400"}`}
                >
                  {format(day, "d")}
                </span>
                {adherence.count > 0 && (
                  <span className="text-[10px] font-semibold mt-0.5 text-gray-700">
                    {adherence.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs">
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">100%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-green-300 rounded"></div>
            <span className="text-gray-600">75-99%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-yellow-300 rounded"></div>
            <span className="text-gray-600">50-74%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-orange-300 rounded"></div>
            <span className="text-gray-600">1-49%</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <div className="w-3 h-3 bg-red-300 rounded"></div>
            <span className="text-gray-600">0%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationCalendar;
