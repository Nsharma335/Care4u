import { useState } from 'react';
import { Heart, Smile, Meh, Frown } from 'lucide-react';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const WellnessCheck = () => {
  const [mood, setMood] = useState<'great' | 'good' | 'okay' | 'stressed' | 'exhausted'>('good');
  const [stressLevel, setStressLevel] = useState(5);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await api.post('/api/caregiver/wellness', {
        mood,
        stress_level: stressLevel,
        notes
      });

      toast.success('Wellness check-in saved!');
      setNotes('');
    } catch (error: any) {
      console.error('Error saving wellness check:', error);
      toast.error('Failed to save wellness check-in');
    } finally {
      setSubmitting(false);
    }
  };

  const moods = [
    { value: 'great', label: 'Great', icon: <Smile className="w-6 h-6" />, color: 'text-green-600' },
    { value: 'good', label: 'Good', icon: <Smile className="w-6 h-6" />, color: 'text-green-500' },
    { value: 'okay', label: 'Okay', icon: <Meh className="w-6 h-6" />, color: 'text-yellow-600' },
    { value: 'stressed', label: 'Stressed', icon: <Frown className="w-6 h-6" />, color: 'text-orange-600' },
    { value: 'exhausted', label: 'Exhausted', icon: <Frown className="w-6 h-6" />, color: 'text-red-600' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-accent-50 to-pink-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Caregiver Wellness Check</h2>
            <p className="text-sm text-gray-600 mt-1">How are you feeling today?</p>
          </div>
          <Heart className="w-8 h-8 text-accent-600" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Mood Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            My Mood
          </label>
          <div className="grid grid-cols-5 gap-2">
            {moods.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMood(m.value as any)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  mood === m.value
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`${m.color} mb-1`}>{m.icon}</div>
                <span className="text-xs font-medium text-gray-700">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stress Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stress Level: {stressLevel}/10
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={stressLevel}
            onChange={(e) => setStressLevel(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            placeholder="Any thoughts or concerns..."
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : 'Submit Check-in'}
        </button>
      </form>
    </div>
  );
};

export default WellnessCheck;

