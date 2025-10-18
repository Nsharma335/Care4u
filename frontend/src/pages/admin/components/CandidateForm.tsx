import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import type { Candidate } from '@care4u/shared';

interface CandidateFormProps {
  candidate: Candidate | null;
  onClose: () => void;
  onSaved: () => void;
}

const CandidateForm = ({ candidate, onClose, onSaved }: CandidateFormProps) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (candidate) {
      setFirstName(candidate.first_name);
      setLastName(candidate.last_name);
      setAge(candidate.age.toString());
    }
  }, [candidate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !age) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      
      if (candidate) {
        // Update existing candidate
        await api.put(`/api/admin/candidates/${candidate.id}`, {
          first_name: firstName,
          last_name: lastName,
          age: parseInt(age)
        });
        toast.success('Candidate updated successfully');
      } else {
        // Create new candidate
        await api.post('/api/admin/candidates', {
          first_name: firstName,
          last_name: lastName,
          age: parseInt(age)
        });
        toast.success('Candidate added successfully');
      }

      onSaved();
    } catch (error: any) {
      console.error('Error saving candidate:', error);
      toast.error(error.response?.data?.error || 'Failed to save candidate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {candidate ? 'Edit Candidate' : 'Add New Candidate'}
          </h2>
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
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="John"
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
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="65"
              min="0"
              max="150"
              required
            />
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
              {saving ? 'Saving...' : candidate ? 'Update' : 'Add Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CandidateForm;

