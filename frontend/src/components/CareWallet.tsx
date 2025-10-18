import { useState, useEffect } from "react";
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Building2, 
  Users, 
  Calendar,
  CreditCard,
  Target,
  BarChart3
} from "lucide-react";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import api from "../lib/api";
import toast from "react-hot-toast";
import type { Donation, Institute, Candidate } from "@care4u/shared";

interface CareWalletProps {
  candidates: Candidate[];
}

interface SpendingData {
  totalSpent: number;
  totalDonations: number;
  averageDonation: number;
  instituteBreakdown: Array<{
    institute_id: string;
    institute_name: string;
    institute_type: string;
    total_amount: number;
    count: number;
    percentage: number;
  }>;
  candidateBreakdown: Array<{
    candidate_id: string;
    candidate_name: string;
    total_amount: number;
    count: number;
    percentage: number;
  }>;
  monthlySpending: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  recentDonations: Donation[];
}

const CareWallet = ({ candidates }: CareWalletProps) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [spendingData, setSpendingData] = useState<SpendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('all');

  useEffect(() => {
    fetchDonations();
  }, [selectedPeriod]);

  useEffect(() => {
    if (donations.length > 0) {
      calculateSpendingData();
    }
  }, [donations]);

  const fetchDonations = async () => {
    try {
      const { data } = await api.get("/api/caregiver/donations");
      let filteredDonations = data.donations || [];

      // Filter by selected period
      const now = new Date();
      const filterDate = new Date();
      
      switch (selectedPeriod) {
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          filterDate.setFullYear(2000); // Show all
      }

      filteredDonations = filteredDonations.filter((donation: Donation) => 
        new Date(donation.created_at) >= filterDate
      );

      setDonations(filteredDonations);
    } catch (error: any) {
      console.error("Error fetching donations:", error);
      toast.error("Failed to load donation data");
    } finally {
      setLoading(false);
    }
  };

  const calculateSpendingData = () => {
    const pendingDonations = donations.filter(d => d.status === 'pending');
    const completedDonations = donations.filter(d => d.status === 'completed');
    
    const totalPending = pendingDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalCompleted = completedDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalDonations = donations.length;
    const averageDonation = totalDonations > 0 ? (totalPending + totalCompleted) / totalDonations : 0;

    // Institute breakdown for pending donations
    const instituteMap = new Map();
    pendingDonations.forEach(donation => {
      const key = donation.institute_id;
      if (!instituteMap.has(key)) {
        instituteMap.set(key, {
          institute_id: key,
          institute_name: donation.institutes?.name || 'Unknown',
          institute_type: donation.institutes?.type || 'unknown',
          total_amount: 0,
          count: 0
        });
      }
      const entry = instituteMap.get(key);
      entry.total_amount += donation.amount;
      entry.count += 1;
    });

    const instituteBreakdown = Array.from(instituteMap.values())
      .map(entry => ({
        ...entry,
        percentage: totalPending > 0 ? (entry.total_amount / totalPending) * 100 : 0
      }))
      .sort((a, b) => b.total_amount - a.total_amount);

    // Candidate breakdown for pending donations
    const candidateDonations = pendingDonations.filter(d => d.candidate_id);
    const candidateMap = new Map();
    candidateDonations.forEach(donation => {
      const key = donation.candidate_id!;
      if (!candidateMap.has(key)) {
        candidateMap.set(key, {
          candidate_id: key,
          candidate_name: donation.candidates ? 
            `${donation.candidates.first_name} ${donation.candidates.last_name}` : 
            'Unknown',
          total_amount: 0,
          count: 0
        });
      }
      const entry = candidateMap.get(key);
      entry.total_amount += donation.amount;
      entry.count += 1;
    });

    const candidateBreakdown = Array.from(candidateMap.values())
      .map(entry => ({
        ...entry,
        percentage: totalPending > 0 ? (entry.total_amount / totalPending) * 100 : 0
      }))
      .sort((a, b) => b.total_amount - a.total_amount);

    // Monthly pending amounts
    const monthlyMap = new Map();
    pendingDonations.forEach(donation => {
      const date = new Date(donation.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthName,
          amount: 0,
          count: 0
        });
      }
      const entry = monthlyMap.get(monthKey);
      entry.amount += donation.amount;
      entry.count += 1;
    });

    const monthlySpending = Array.from(monthlyMap.values())
      .sort((a, b) => a.month.localeCompare(b.month));

    setSpendingData({
      totalSpent: totalPending, // Show pending amount as primary
      totalDonations: pendingDonations.length, // Show pending count
      averageDonation,
      instituteBreakdown,
      candidateBreakdown,
      monthlySpending,
      recentDonations: donations.slice(0, 5)
    });
  };

  const getInstituteIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return <Building2 className="w-5 h-5 text-red-500" />;
      case 'clinic':
        return <Building2 className="w-5 h-5 text-blue-500" />;
      case 'non_profit':
        return <Target className="w-5 h-5 text-pink-500" />;
      case 'charity':
        return <Target className="w-5 h-5 text-green-500" />;
      default:
        return <Building2 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPieChartColor = (index: number) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
    ];
    return colors[index % colors.length];
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-medium">${data.value.toFixed(2)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Percentage: <span className="font-medium">{data.percentage.toFixed(1)}%</span>
          </p>
          <p className="text-sm text-gray-600">
            Donations: <span className="font-medium">{data.count}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Wallet className="w-8 h-8 mr-3 text-primary-600" />
            CareWallet
          </h2>
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
        <p className="text-gray-600">
          Track your pending donations and spending patterns across institutes and candidates.
        </p>
      </div>

      {/* Summary Cards */}
      {spendingData && (
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">${spendingData.totalSpent.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Donations</p>
                <p className="text-2xl font-bold text-gray-900">{spendingData.totalDonations}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Pending</p>
                <p className="text-2xl font-bold text-gray-900">${spendingData.averageDonation.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Institutes Pending</p>
                <p className="text-2xl font-bold text-gray-900">{spendingData.instituteBreakdown.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Institute Pending Amounts */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-primary-600" />
            Pending Amounts by Institute
          </h3>
          
          {spendingData && spendingData.instituteBreakdown.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={spendingData.instituteBreakdown.map((institute, index) => ({
                      name: institute.institute_name,
                      value: institute.total_amount,
                      percentage: institute.percentage,
                      count: institute.count,
                      type: institute.institute_type
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {spendingData.instituteBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={getPieChartColor(index)} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color, fontSize: '12px' }}>
                        {value}
                      </span>
                    )}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <PieChart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No pending donations</p>
              <p className="text-sm">for the selected period</p>
            </div>
          )}
        </div>

        {/* Candidate Pending Amounts */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary-600" />
            Pending Amounts by Candidate
          </h3>
          
          {spendingData && spendingData.candidateBreakdown.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={spendingData.candidateBreakdown.map((candidate, index) => ({
                      name: candidate.candidate_name,
                      value: candidate.total_amount,
                      percentage: candidate.percentage,
                      count: candidate.count
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {spendingData.candidateBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={getPieChartColor(index)} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color, fontSize: '12px' }}>
                        {value}
                      </span>
                    )}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No pending candidate donations</p>
              <p className="text-sm">in this period</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Pending Trend */}
      {spendingData && spendingData.monthlySpending.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary-600" />
            Monthly Pending Amounts
          </h3>
          
          <div className="space-y-4">
            {spendingData.monthlySpending.map((month, index) => {
              const maxAmount = Math.max(...spendingData.monthlySpending.map(m => m.amount));
              const percentage = maxAmount > 0 ? (month.amount / maxAmount) * 100 : 0;
              
              return (
                <div key={month.month} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{month.month}</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">${month.amount.toFixed(2)}</span>
                      <span className="text-sm text-gray-500 ml-2">({month.count} donations)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Donations */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CreditCard className="w-5 h-5 mr-2 text-primary-600" />
          Recent Donations
        </h3>
        
        {donations.length > 0 ? (
          <div className="space-y-4">
            {donations.slice(0, 5).map((donation) => (
              <div key={donation.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    {getInstituteIcon(donation.institutes?.type || 'unknown')}
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {donation.institutes?.name || 'Unknown Institute'}
                      </h4>
                      {donation.candidates && (
                        <p className="text-sm text-gray-600">
                          For: {donation.candidates.first_name} {donation.candidates.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${donation.amount} {donation.currency}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                      {donation.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <p>{new Date(donation.created_at).toLocaleDateString()}</p>
                  <p>{donation.payment_method}</p>
                </div>
                
                {donation.message && (
                  <p className="mt-2 text-sm text-gray-600 italic">"{donation.message}"</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">No donations found</p>
            <p className="text-sm">for the selected period</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareWallet;
