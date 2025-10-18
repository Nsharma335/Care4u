import { useState, useEffect } from "react";
import { Activity, Plus } from "lucide-react";
import api from "../../../lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

interface ActivityLog {
  id: string;
  type: "medication" | "wellness" | "note" | "photo" | "call";
  title: string;
  description?: string;
  created_at: string;
}

interface ActivityFeedProps {
  candidateId: string;
}

const ActivityFeed = ({ candidateId }: ActivityFeedProps) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDescription, setNoteDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [candidateId]);

  const fetchActivities = async () => {
    try {
      const { data } = await api.get(
        `/api/caregiver/activity-log/${candidateId}`
      );
      setActivities(data.activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      await api.post("/api/caregiver/activity-log", {
        candidate_id: candidateId,
        type: "note",
        title: noteTitle,
        description: noteDescription,
      });

      toast.success("Note added successfully");
      setNoteTitle("");
      setNoteDescription("");
      setShowAddNote(false);
      fetchActivities();
    } catch (error: any) {
      console.error("Error adding note:", error);
      toast.error("Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  const getActivityIcon = () => {
    return <Activity className="w-5 h-5" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Activity Feed
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Recent updates and notes
            </p>
          </div>
          <button
            onClick={() => setShowAddNote(!showAddNote)}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Add Note Form */}
        {showAddNote && (
          <form
            onSubmit={handleAddNote}
            className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3"
          >
            <input
              type="text"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
            <textarea
              value={noteDescription}
              onChange={(e) => setNoteDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
              >
                {submitting ? "Adding..." : "Add Note"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddNote(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Activity List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No activities yet</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg flex-shrink-0">
                  {getActivityIcon()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">
                    {activity.title}
                  </h4>
                  {activity.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {format(new Date(activity.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
