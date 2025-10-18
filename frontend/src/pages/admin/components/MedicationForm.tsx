import { useState } from "react";
import { X, Plus, Minus, Clock, Pill, Calendar } from "lucide-react";
import { format } from "date-fns";
import api from "../../../lib/api";
import toast from "react-hot-toast";
import type { CandidateWithRelations } from "@care4u/shared";

interface MedicationFormProps {
  candidate: CandidateWithRelations;
  selectedDate: Date;
  onClose: () => void;
  onSaved: () => void;
}

const MedicationForm = ({
  candidate,
  selectedDate,
  onClose,
  onSaved,
}: MedicationFormProps) => {
  const [formData, setFormData] = useState({
    medicine_name: "",
    dosage: "",
    frequency: "daily",
    instructions: "",
    start_date: format(selectedDate, "yyyy-MM-dd"),
    end_date: "",
  });
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [loading, setLoading] = useState(false);

  const handleAddTime = () => {
    setTimes([...times, "12:00"]);
  };

  const handleRemoveTime = (index: number) => {
    if (times.length > 1) {
      setTimes(times.filter((_, i) => i !== index));
    }
  };

  const handleTimeChange = (index: number, value: string) => {
    const newTimes = [...times];
    newTimes[index] = value;
    setTimes(newTimes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.medicine_name || !formData.dosage) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (times.length === 0 || times.some((t) => !t)) {
      toast.error("Please specify at least one valid time");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/admin/medications/schedule", {
        candidate_id: candidate.id,
        medicine_name: formData.medicine_name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        times: times,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        instructions: formData.instructions,
      });

      toast.success("Medication schedule added successfully!");
      onSaved();
      onClose();
    } catch (error: any) {
      console.error("Error adding medication schedule:", error);
      toast.error(
        error.response?.data?.error || "Failed to add medication schedule"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Add Medication</h2>
              <p className="text-blue-100 mt-1">
                For {candidate.first_name} {candidate.last_name} •{" "}
                {format(selectedDate, "MMMM d, yyyy")}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Medicine Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Pill className="w-4 h-4 inline mr-1" />
              Medicine Name *
            </label>
            <input
              type="text"
              value={formData.medicine_name}
              onChange={(e) =>
                setFormData({ ...formData, medicine_name: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Aspirin, Metformin"
              required
            />
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Dosage *
            </label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) =>
                setFormData({ ...formData, dosage: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., 500mg, 2 tablets"
              required
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Frequency *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({ ...formData, frequency: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="twice_daily">Twice Daily</option>
              <option value="three_times_daily">Three Times Daily</option>
              <option value="weekly">Weekly</option>
              <option value="as_needed">As Needed</option>
            </select>
          </div>

          {/* Times */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Scheduled Times *
            </label>
            <div className="space-y-3">
              {times.map((time, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  {times.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTime(index)}
                      className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddTime}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Time</span>
              </button>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                min={formData.start_date}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Instructions (Optional)
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) =>
                setFormData({ ...formData, instructions: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="e.g., Take with food, Take before bedtime"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Add Medication"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicationForm;
