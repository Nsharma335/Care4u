import { useState } from "react";
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import type { CandidateWithRelations } from "@care4u/shared";

interface MedicationCalendarProps {
  candidate: CandidateWithRelations;
  onClose: () => void;
  onDateSelect: (date: Date) => void;
}

const MedicationCalendar = ({
  candidate,
  onClose,
  onDateSelect,
}: MedicationCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDateClick = (day: Date) => {
    onDateSelect(day);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add Medication Schedule</h2>
              <p className="text-purple-100 mt-1">
                For {candidate.first_name} {candidate.last_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="p-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Select a date to add medication
                </p>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-700" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-xl p-4 shadow-md">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-gray-600 py-2"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}

                {/* Actual days */}
                {days.map((day) => {
                  const isCurrentDay = isToday(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDateClick(day)}
                      className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                        isCurrentDay
                          ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105"
                          : isCurrentMonth
                          ? "bg-gray-50 hover:bg-gradient-to-br hover:from-purple-100 hover:to-pink-100 text-gray-900 hover:scale-105 hover:shadow-md"
                          : "text-gray-300"
                      }`}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <CalendarIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-blue-900 font-medium">
                    Click on any date to add medication schedule
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    You can add multiple medications for the same date by
                    clicking the date multiple times
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationCalendar;
