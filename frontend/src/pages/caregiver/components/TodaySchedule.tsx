import { Check, Clock } from "lucide-react";
import { format } from "date-fns";
import type {
  Candidate,
  MedicationSchedule,
  MedicationLog,
} from "@care4u/shared";
import api from "../../../lib/api";
import toast from "react-hot-toast";

interface TodayScheduleProps {
  candidate: Candidate;
  schedules: MedicationSchedule[];
  logs: MedicationLog[];
  onRefresh: () => void;
}

const TodaySchedule = ({
  candidate,
  schedules,
  logs,
  onRefresh,
}: TodayScheduleProps) => {
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter((log) => log.scheduled_time.startsWith(today));

  // Create a map of schedule times for today
  const todayScheduleItems = schedules
    .flatMap((schedule) =>
      schedule.times.map((time) => ({
        schedule,
        time,
        scheduledTime: `${today}T${time}:00`,
        log: todayLogs.find(
          (log) =>
            log.schedule_id === schedule.id &&
            log.scheduled_time === `${today}T${time}:00`
        ),
      }))
    )
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleConfirm = async (logId: string) => {
    try {
      await api.post("/api/medications/confirm", { log_id: logId });
      toast.success("Medication marked as taken");
      onRefresh();
    } catch (error: any) {
      console.error("Error confirming medication:", error);
      toast.error("Failed to confirm medication");
    }
  };

  const handleSkip = async (logId: string) => {
    try {
      await api.post("/api/medications/skip", { log_id: logId });
      toast.success("Medication skipped");
      onRefresh();
    } catch (error: any) {
      console.error("Error skipping medication:", error);
      toast.error("Failed to skip medication");
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "taken":
        return "text-green-600 bg-green-100";
      case "missed":
        return "text-red-600 bg-red-100";
      case "skipped":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-secondary-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Today's Medication Schedule
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {candidate.first_name} {candidate.last_name} •{" "}
              {format(new Date(), "MMMM d, yyyy")}
            </p>
          </div>
          <Clock className="w-8 h-8 text-primary-600" />
        </div>
      </div>

      <div className="p-6">
        {todayScheduleItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No medications scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayScheduleItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold text-primary-600">
                      {item.time}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {item.schedule.medicine_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {item.schedule.dosage}
                      </p>
                      {item.schedule.instructions && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {item.schedule.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {item.log ? (
                    <>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          item.log.status
                        )}`}
                      >
                        {item.log.status === "taken" && "Taken"}
                        {item.log.status === "missed" && "Missed"}
                        {item.log.status === "skipped" && "Skipped"}
                        {item.log.status === "pending" && "Pending"}
                      </span>

                      {item.log.status === "pending" && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleConfirm(item.log!.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            <Check className="w-4 h-4 inline mr-1" />
                            Confirm
                          </button>
                          <button
                            onClick={() => handleSkip(item.log!.id)}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                          >
                            Skip
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">Not yet due</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaySchedule;
