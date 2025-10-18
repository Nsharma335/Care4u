import { Edit2, UserPlus, Trash2 } from "lucide-react";
import type { Candidate } from "@care4u/shared";
import { useState } from "react";
import api from "../../../lib/api";
import toast from "react-hot-toast";

interface CandidatesListProps {
  candidates: Candidate[];
  onEdit: (candidate: Candidate) => void;
  onAddFamily: (candidateId: string) => void;
  onRefresh: () => void;
}

const CandidatesList = ({
  candidates,
  onEdit,
  onAddFamily,
  onRefresh,
}: CandidatesListProps) => {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this candidate? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(id);
      await api.delete(`/api/admin/candidates/${id}`);
      toast.success("Candidate deleted successfully");
      onRefresh();
    } catch (error: any) {
      console.error("Error deleting candidate:", error);
      toast.error(error.response?.data?.error || "Failed to delete candidate");
    } finally {
      setDeleting(null);
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">
          No candidates yet. Add your first candidate to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Age
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Added On
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {candidates.map((candidate) => (
            <tr
              key={candidate.id}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                    {candidate.first_name[0]}
                    {candidate.last_name[0]}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {candidate.first_name} {candidate.last_name}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {candidate.age} years
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {new Date(candidate.created_at).toLocaleDateString()}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onAddFamily(candidate.id)}
                    className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                    title="Add Family Member"
                  >
                    <UserPlus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onEdit(candidate)}
                    className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(candidate.id)}
                    disabled={deleting === candidate.id}
                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CandidatesList;
