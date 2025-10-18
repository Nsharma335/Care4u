import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  CheckCircle,
  XCircle,
  BarChart3
} from "lucide-react";
import type { Candidate, MedicationSchedule, MedicationLog } from "@care4u/shared";

interface CareInsightsProps {
  candidate: Candidate;
  schedules: MedicationSchedule[];
  logs: MedicationLog[];
}

const CareInsights = ({ candidate, schedules, logs }: CareInsightsProps) => {
  const [loading, setLoading] = useState(true);

  // Removed console.log to prevent unnecessary logging on every render

  // Memoized medication adherence data to prevent recalculation on every render
  const medicationData = useMemo(() => 
    schedules.filter(s => s.active).map(schedule => {
      const scheduleLogs = logs.filter(log => log.schedule_id === schedule.id);
      const taken = scheduleLogs.filter(log => log.status === 'taken').length;
      const missed = scheduleLogs.filter(log => log.status === 'missed').length;
      const total = taken + missed;
      const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;
      
      return {
        name: schedule.medicine_name.length > 10 
          ? schedule.medicine_name.substring(0, 10) + '...' 
          : schedule.medicine_name,
        adherence,
        taken,
        missed
      };
    }), [schedules, logs]);

  // Memoized overall stats
  const { totalLogs, takenLogs, missedLogs, overallAdherence } = useMemo(() => {
    const total = logs.length;
    const taken = logs.filter(log => log.status === 'taken').length;
    const missed = logs.filter(log => log.status === 'missed').length;
    const adherence = total > 0 ? Math.round((taken / total) * 100) : 0;
    
    return { totalLogs: total, takenLogs: taken, missedLogs: missed, overallAdherence: adherence };
  }, [logs]);

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
          Medication Adherence for {candidate.first_name} {candidate.last_name}
        </h3>
      </div>

      {/* Simple Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{overallAdherence}%</div>
          <div className="text-sm text-gray-600">Overall Adherence</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{takenLogs}</div>
          <div className="text-sm text-gray-600">Medications Taken</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 text-center">
          <div className="text-3xl font-bold text-red-600">{missedLogs}</div>
          <div className="text-sm text-gray-600">Missed Doses</div>
        </div>
      </div>

      {/* Single Simple Chart */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Medication Adherence by Medicine</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={medicationData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value: any) => [`${value}%`, 'Adherence']}
                labelFormatter={(label) => `Medicine: ${label}`}
              />
              <Bar dataKey="adherence" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default CareInsights;
