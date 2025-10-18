import { useState } from 'react';
import { X, Mail } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import type { Candidate } from '@care4u/shared';

interface FamilyMemberFormProps {
  candidateId: string;
  candidates: Candidate[];
  onClose: () => void;
  onSaved: () => void;
}

const FamilyMemberForm = ({ candidateId, candidates, onClose, onSaved }: FamilyMemberFormProps) => {
  const [selectedCandidate, setSelectedCandidate] = useState(candidateId);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isCaregiver, setIsCaregiver] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCandidate || !firstName || !lastName || !email) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      
      await api.post('/api/admin/family-members', {
        candidate_id: selectedCandidate,
        first_name: firstName,
        last_name: lastName,
        email,
        is_caregiver: isCaregiver
      });

      toast.success('Family member registered and magic link sent!');
      onSaved();
    } catch (error: any) {
      console.error('Error registering family member:', error);
      toast.error(error.response?.data?.error || 'Failed to register family member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Register Family Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="candidate" className="block text-sm font-medium text-gray-700 mb-2">
              Candidate
            </label>
            <select
              id="candidate"
              value={selectedCandidate}
              onChange={(e) => setSelectedCandidate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Select a candidate</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.first_name} {candidate.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Jane"
              required
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="Doe"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                placeholder="jane@example.com"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              A magic link will be sent to this email for login
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isCaregiver"
              checked={isCaregiver}
              onChange={(e) => setIsCaregiver(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="isCaregiver" className="ml-2 text-sm text-gray-700">
              This family member is also a caregiver
            </label>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Registering...' : 'Register & Send Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamilyMemberForm;

