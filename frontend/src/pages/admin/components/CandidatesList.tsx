import {
  Edit2,
  UserPlus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users2,
  Heart,
  Pill,
} from "lucide-react";
import type { CandidateWithRelations } from "@care4u/shared";
import { useState } from "react";
import api from "../../../lib/api";
import toast from "react-hot-toast";

interface CandidatesListProps {
  candidates: CandidateWithRelations[];
  onEdit: (candidate: CandidateWithRelations) => void;
  onAddFamily: (candidateId: string) => void;
  onRefresh: () => void;
  onAddMedication: (candidate: CandidateWithRelations) => void;
}

const CandidatesList = ({
  candidates,
  onEdit,
  onAddFamily,
  onRefresh,
  onAddMedication,
}: CandidatesListProps) => {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (candidateId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId);
    } else {
      newExpanded.add(candidateId);
    }
    setExpandedRows(newExpanded);
  };

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
              Family & Caregivers
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
          {candidates.map((candidate) => {
            const isExpanded = expandedRows.has(candidate.id);
            const totalFamily =
              (candidate.family_members?.length || 0) +
              (candidate.caregivers?.length || 0);
            const hasFamilyOrCaregivers = totalFamily > 0;

            return (
              <>
                <tr
                  key={candidate.id}
                  className="hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() =>
                    window.open(`/candidate/view/${candidate.id}`, "_blank")
                  }
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {hasFamilyOrCaregivers && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(candidate.id);
                          }}
                          className="mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
                        {candidate.first_name[0]}
                        {candidate.last_name[0]}
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-3">
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.first_name} {candidate.last_name}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddMedication(candidate);
                            }}
                            className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-xs font-medium"
                            title="Add Medicines"
                          >
                            <Pill className="w-3 h-3" />
                            <span>Add Medicines</span>
                          </button>
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
                    <div className="flex items-center space-x-4 text-sm">
                      {candidate.caregivers &&
                        candidate.caregivers.length > 0 && (
                          <div className="flex items-center text-primary-600">
                            <Heart className="w-4 h-4 mr-1" />
                            <span className="font-medium">
                              {candidate.caregivers.length}
                            </span>
                            <span className="ml-1 text-gray-500">
                              caregiver
                              {candidate.caregivers.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      {candidate.family_members &&
                        candidate.family_members.length > 0 && (
                          <div className="flex items-center text-blue-600">
                            <Users2 className="w-4 h-4 mr-1" />
                            <span className="font-medium">
                              {candidate.family_members.length}
                            </span>
                            <span className="ml-1 text-gray-500">family</span>
                          </div>
                        )}
                      {!hasFamilyOrCaregivers && (
                        <span className="text-gray-400 italic">
                          No contacts
                        </span>
                      )}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddFamily(candidate.id);
                        }}
                        className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                        title="Add Family Member"
                      >
                        <UserPlus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(candidate);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(candidate.id);
                        }}
                        disabled={deleting === candidate.id}
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && hasFamilyOrCaregivers && (
                  <tr key={`${candidate.id}-expanded`}>
                    <td colSpan={5} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        {/* Caregivers Section */}
                        {candidate.caregivers &&
                          candidate.caregivers.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <Heart className="w-4 h-4 mr-2 text-primary-600" />
                                Caregivers ({candidate.caregivers.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {candidate.caregivers.map((caregiver) => (
                                  <div
                                    key={caregiver.id}
                                    className="bg-white rounded-lg p-3 border border-primary-200 shadow-sm"
                                  >
                                    <div className="flex items-start space-x-3">
                                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-xs">
                                        {caregiver.first_name[0]}
                                        {caregiver.last_name[0]}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {caregiver.first_name}{" "}
                                          {caregiver.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                          {caregiver.email}
                                        </p>
                                        <p className="text-xs text-primary-600 mt-1">
                                          Professional Caregiver
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Family Members Section */}
                        {candidate.family_members &&
                          candidate.family_members.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                                <Users2 className="w-4 h-4 mr-2 text-blue-600" />
                                Family Members (
                                {candidate.family_members.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {candidate.family_members.map((family) => (
                                  <div
                                    key={family.id}
                                    className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm"
                                  >
                                    <div className="flex items-start space-x-3">
                                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs">
                                        {family.first_name[0]}
                                        {family.last_name[0]}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {family.first_name} {family.last_name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                          {family.email}
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                          Family Contact
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CandidatesList;
