import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, DollarSign, User, Calendar, Building2, TrendingUp, PieChart } from "lucide-react";
import api from "../../../lib/api";
import toast from "react-hot-toast";
import type { Donation } from "@care4u/shared";

interface DonationsManagementProps {
  onClose: () => void;
}

interface InstituteBreakdown {
  institute_id: string;
  institute_name: string;
  institute_type: string;
  total_amount: number;
  count: number;
  pending_amount: number;
  approved_amount: number;
  percentage: number;
}

interface PatientBreakdown {
  candidate_id: string;
  candidate_name: string;
  total_amount: number;
  count: number;
  pending_amount: number;
  approved_amount: number;
  percentage: number;
}

const DonationsManagement = ({ onClose }: DonationsManagementProps) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [instituteBreakdown, setInstituteBreakdown] = useState<InstituteBreakdown[]>([]);
  const [patientBreakdown, setPatientBreakdown] = useState<PatientBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [activeTab, setActiveTab] = useState<'donations' | 'spending'>('donations');

  useEffect(() => {
    fetchDonations();
    fetchStats();
    fetchSpendingAnalytics();
  }, []);

  const fetchDonations = async () => {
    try {
      const { data } = await api.get("/api/admin/donations");
      setDonations(data.donations);
    } catch (error: any) {
      console.error("Error fetching donations:", error);
      toast.error("Failed to load donations");
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/api/admin/donations/stats");
      setStats(data);
    } catch (error: any) {
      console.error("Error fetching donation stats:", error);
    }
  };

  const fetchSpendingAnalytics = async () => {
    try {
      const [instituteRes, patientRes] = await Promise.all([
        api.get("/api/admin/donations/spending/institute"),
        api.get("/api/admin/donations/spending/patient")
      ]);
      setInstituteBreakdown(instituteRes.data.institute_breakdown || []);
      setPatientBreakdown(patientRes.data.patient_breakdown || []);
    } catch (error: any) {
      console.error("Error fetching spending analytics:", error);
    }
  };

  const handleApprove = async (donation: Donation) => {
    try {
      await api.patch(`/api/admin/donations/${donation.id}/approve`, {
        transaction_id: transactionId
      });
      toast.success("Donation approved successfully");
      setTransactionId('');
      fetchDonations();
      fetchStats();
      fetchSpendingAnalytics();
    } catch (error: any) {
      console.error("Error approving donation:", error);
      toast.error(error.response?.data?.error || "Failed to approve donation");
    }
  };

  const handleReject = async () => {
    if (!selectedDonation || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await api.patch(`/api/admin/donations/${selectedDonation.id}/reject`, {
        rejection_reason: rejectionReason
      });
      toast.success("Donation rejected");
      setShowRejectModal(false);
      setSelectedDonation(null);
      setRejectionReason('');
      fetchDonations();
      fetchStats();
      fetchSpendingAnalytics();
    } catch (error: any) {
      console.error("Error rejecting donation:", error);
      toast.error(error.response?.data?.error || "Failed to reject donation");
    }
  };

  const openRejectModal = (donation: Donation) => {
    setSelectedDonation(donation);
    setShowRejectModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDonations = donations.filter(donation => {
    if (filter === 'all') return true;
    return donation.status === filter;
  });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Donations Management</h2>
              <p className="text-gray-600 mt-1">Manage and approve pending donations</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('donations')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'donations'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Donations
            </button>
            <button
              onClick={() => setActiveTab('spending')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'spending'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Spending Analytics
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'donations' ? (
          <>
            {/* Stats */}
            {stats && (
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.total_donations}</div>
                    <div className="text-sm text-gray-600">Total Donations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending_donations}</div>
                    <div className="text-sm text-gray-600">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.approved_donations}</div>
                    <div className="text-sm text-gray-600">Approved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">${stats.total_amount.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">Total Raised</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.recent_donations}</div>
                    <div className="text-sm text-gray-600">This Week</div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex space-x-2">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Donations List */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {filteredDonations.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No donations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredDonations.map((donation) => (
                    <div
                      key={donation.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getStatusIcon(donation.status)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                              {donation.status}
                            </span>
                            <span className="text-lg font-semibold text-gray-900">
                              ${donation.amount} {donation.currency}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>
                                {donation.auth?.users?.email || 'Unknown Donor'}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(donation.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            <div>
                              <span className="font-medium">Institute:</span> {donation.institutes?.name || 'Unknown'}
                            </div>
                            
                            {donation.candidates && (
                              <div className="flex items-center p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                <User className="w-4 h-4 text-blue-600 mr-2" />
                                <div>
                                  <span className="font-medium text-blue-900">Patient:</span> 
                                  <span className="ml-1 text-blue-800">
                                    {donation.candidates.first_name} {donation.candidates.last_name}
                                  </span>
                                  <p className="text-xs text-blue-700">Specific patient donation</p>
                                </div>
                              </div>
                            )}
                            {donation.donation_type === 'general' && !donation.candidates && (
                              <div className="flex items-center p-2 bg-green-50 border border-green-200 rounded-lg">
                                <Building2 className="w-4 h-4 text-green-600 mr-2" />
                                <div>
                                  <span className="font-medium text-green-900">General Donation</span>
                                  <p className="text-xs text-green-700">Donation to institute</p>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {donation.message && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Message:</span> {donation.message}
                            </div>
                          )}
                          
                          {donation.rejection_reason && (
                            <div className="mt-2 text-sm text-red-600">
                              <span className="font-medium">Rejection Reason:</span> {donation.rejection_reason}
                            </div>
                          )}
                        </div>
                        
                        {donation.status === 'pending' && (
                          <div className="flex space-x-2 ml-4">
                            <div className="flex flex-col space-y-2">
                              <input
                                type="text"
                                placeholder="Transaction ID (optional)"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded text-sm"
                              />
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleApprove(donation)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => openRejectModal(donation)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                                >
                                  <XCircle className="w-4 h-4" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Spending Analytics Tab */
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="space-y-8">
              {/* Spending by Institute */}
              <div>
                <div className="flex items-center mb-4">
                  <Building2 className="w-5 h-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Spending by Institute</h3>
                </div>
                
                {instituteBreakdown.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No institute spending data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {instituteBreakdown.map((institute) => (
                      <div key={institute.institute_id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{institute.institute_name}</h4>
                            <p className="text-sm text-gray-600 capitalize">{institute.institute_type}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              ${institute.total_amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">{institute.count} donations</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <span className="text-yellow-700">
                              Pending: ${institute.pending_amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-700">
                              Approved: ${institute.approved_amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Spending by Patient */}
              <div>
                <div className="flex items-center mb-4">
                  <User className="w-5 h-5 text-primary-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Spending by Patient</h3>
                </div>
                
                {patientBreakdown.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No patient-specific donations available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {patientBreakdown.map((patient) => (
                      <div key={patient.candidate_id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">{patient.candidate_name}</h4>
                            <p className="text-sm text-gray-600">Patient ID: {patient.candidate_id}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              ${patient.total_amount.toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-600">{patient.count} donations</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-yellow-500" />
                            <span className="text-yellow-700">
                              Pending: ${patient.pending_amount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-700">
                              Approved: ${patient.approved_amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Donation</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Please provide a reason for rejection..."
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleReject}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Reject Donation
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedDonation(null);
                  setRejectionReason('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsManagement;
