import { Users, Heart, AlertTriangle, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '@care4u/shared';

interface StatsCardsProps {
  stats: DashboardStats;
}

const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Candidates"
        value={stats.total_candidates}
        icon={<Users className="w-8 h-8" />}
        color="blue"
      />
      <StatCard
        title="Adherence Rate"
        value={`${stats.medication_adherence_rate}%`}
        icon={<TrendingUp className="w-8 h-8" />}
        color="green"
      />
      <StatCard
        title="Missed Doses Today"
        value={stats.missed_doses_today}
        icon={<AlertTriangle className="w-8 h-8" />}
        color="red"
      />
      <StatCard
        title="Upcoming Doses"
        value={stats.upcoming_doses}
        icon={<Heart className="w-8 h-8" />}
        color="purple"
      />
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple';
}

const StatCard = ({ title, value, icon, color }: StatCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCards;

