import { useState, useEffect } from "react";
import { Building2, Heart, Users, DollarSign, CreditCard, MessageCircle, CheckCircle } from "lucide-react";
import api from "../lib/api";
import toast from "react-hot-toast";
import type { Institute, Donation, Candidate, CreateDonationRequest } from "@care4u/shared";

interface CareConnectProps {
  candidates: Candidate[];
}

const CareConnect = ({ candidates }: CareConnectProps) => {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<Institute | null>(null);
  const [instituteCandidates, setInstituteCandidates] = useState<Candidate[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationType, setDonationType] = useState<'general' | 'specific_patient'>('general');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');

  useEffect(() => {
    fetchInstitutes();
    fetchDonations();
  }, []);

  useEffect(() => {
    if (selectedInstitute) {
      fetchInstituteCandidates(selectedInstitute.id);
    }
  }, [selectedInstitute]);

  const fetchInstitutes = async () => {
    try {
      const { data } = await api.get("/api/caregiver/institutes");
      setInstitutes(data.institutes);
    } catch (error: any) {
      console.error("Error fetching institutes:", error);
      toast.error("Failed to load institutes");
    } finally {
      setLoading(false);
    }
  };

  const fetchInstituteCandidates = async (instituteId: string) => {
    try {
      const { data } = await api.get(`/api/caregiver/institutes/${instituteId}/candidates`);
      setInstituteCandidates(data.candidates);
    } catch (error: any) {
      console.error("Error fetching institute candidates:", error);
      toast.error("Failed to load institute candidates");
    }
  };

  const fetchDonations = async () => {
    try {
      const { data } = await api.get("/api/caregiver/donations");
      setDonations(data.donations);
    } catch (error: any) {
      console.error("Error fetching donations:", error);
      toast.error("Failed to load donation history");
    }
  };

  const handleDonate = async () => {
    if (!selectedInstitute || !donationAmount) {
      toast.error("Please select an institute and enter an amount");
      return;
    }

    if (donationType === 'specific_patient' && !selectedCandidate) {
      toast.error("Please select a patient for specific donation");
      return;
    }

    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setDonating(true);

    try {
      const donationData: CreateDonationRequest = {
        institute_id: selectedInstitute.id,
        candidate_id: donationType === 'specific_patient' ? selectedCandidate?.id : undefined,
        amount,
        currency: 'USD',
        donation_type: donationType,
        message: donationMessage || undefined,
        payment_method: 'card'
      };

      await api.post("/api/caregiver/donations", donationData);
      
      toast.success("Donation submitted successfully!");
      setShowDonationForm(false);
      setDonationAmount('');
      setDonationMessage('');
      setSelectedCandidate(null);
      setDonationType('general');
      fetchDonations();
    } catch (error: any) {
      console.error("Error creating donation:", error);
      toast.error(error.response?.data?.error || "Failed to submit donation");
    } finally {
      setDonating(false);
    }
  };

  const getInstituteIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return <Building2 className="w-6 h-6 text-red-500" />;
      case 'clinic':
        return <Building2 className="w-6 h-6 text-blue-500" />;
      case 'non_profit':
        return <Heart className="w-6 h-6 text-pink-500" />;
      case 'charity':
        return <Heart className="w-6 h-6 text-green-500" />;
      default:
        return <Building2 className="w-6 h-6 text-gray-500" />;
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
            <Heart className="w-8 h-8 mr-3 text-primary-600" />
            CareConnect
          </h2>
          <button
            onClick={() => setShowDonationForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
          >
            <DollarSign className="w-5 h-5" />
            <span>Make Donation</span>
          </button>
        </div>
        <p className="text-gray-600">
          Connect with institutes and non-profit organizations to support care initiatives and specific patients.
        </p>
      </div>

      {/* Institutes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {institutes.map((institute) => (
          <div
            key={institute.id}
            className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
              selectedInstitute?.id === institute.id ? 'ring-2 ring-primary-500' : ''
            }`}
            onClick={() => setSelectedInstitute(institute)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getInstituteIcon(institute.type)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{institute.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{institute.type.replace('_', ' ')}</p>
                </div>
              </div>
              {selectedInstitute?.id === institute.id && (
                <CheckCircle className="w-6 h-6 text-primary-600" />
              )}
            </div>
            
            {institute.description && (
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{institute.description}</p>
            )}
            
            <div className="space-y-2 text-sm text-gray-500">
              {institute.address && (
                <p className="flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  {institute.address}
                </p>
              )}
              {institute.phone && (
                <p>{institute.phone}</p>
              )}
              {institute.website && (
                <a 
                  href={institute.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  Visit Website
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Institute Details */}
      {selectedInstitute && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-6 h-6 mr-2 text-primary-600" />
            Patients at {selectedInstitute.name}
          </h3>
          
          {instituteCandidates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {instituteCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedCandidate?.id === candidate.id 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {candidate.first_name} {candidate.last_name}
                      </h4>
                      <p className="text-sm text-gray-500">Age: {candidate.age}</p>
                    </div>
                    {selectedCandidate?.id === candidate.id && (
                      <CheckCircle className="w-5 h-5 text-primary-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No patients found for this institute</p>
            </div>
          )}
        </div>
      )}

      {/* Donation History */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-primary-600" />
          Your Donation History
        </h3>
        
        {donations.length > 0 ? (
          <div className="space-y-4">
            {donations.map((donation) => (
              <div key={donation.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">
                    {donation.institutes?.name || 'Unknown Institute'}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                    {donation.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    <p className="font-medium">${donation.amount} {donation.currency}</p>
                    {donation.candidates && (
                      <p>For: {donation.candidates.first_name} {donation.candidates.last_name}</p>
                    )}
                    {donation.message && (
                      <p className="italic">"{donation.message}"</p>
                    )}
                  </div>
                  <p>{new Date(donation.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No donations yet. Make your first donation to get started!</p>
          </div>
        )}
      </div>

      {/* Donation Modal */}
      {showDonationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Make a Donation</h3>
            
            <div className="space-y-4">
              {/* Institute Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institute
                </label>
                <select
                  value={selectedInstitute?.id || ''}
                  onChange={(e) => {
                    const institute = institutes.find(i => i.id === e.target.value);
                    setSelectedInstitute(institute || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                >
                  <option value="">Select an institute</option>
                  {institutes.map((institute) => (
                    <option key={institute.id} value={institute.id}>
                      {institute.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Donation Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="general"
                      checked={donationType === 'general'}
                      onChange={(e) => setDonationType(e.target.value as 'general')}
                      className="mr-2"
                    />
                    General donation to institute
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="specific_patient"
                      checked={donationType === 'specific_patient'}
                      onChange={(e) => setDonationType(e.target.value as 'specific_patient')}
                      className="mr-2"
                    />
                    Donation for specific patient
                  </label>
                </div>
              </div>

              {/* Patient Selection (if specific patient) */}
              {donationType === 'specific_patient' && selectedInstitute && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient
                  </label>
                  <select
                    value={selectedCandidate?.id || ''}
                    onChange={(e) => {
                      const candidate = instituteCandidates.find(c => c.id === e.target.value);
                      setSelectedCandidate(candidate || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a patient</option>
                    {instituteCandidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.first_name} {candidate.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={donationMessage}
                  onChange={(e) => setDonationMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowDonationForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDonate}
                disabled={donating}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {donating ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Donate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareConnect;
