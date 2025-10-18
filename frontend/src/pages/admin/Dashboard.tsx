import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { Users, Activity, UserPlus } from "lucide-react";
import api from "../../lib/api";
import toast from "react-hot-toast";
import StatsCards from "./components/StatsCards";
import CandidatesList from "./components/CandidatesList";
import CandidateForm from "./components/CandidateForm";
import FamilyMemberForm from "./components/FamilyMemberForm";
import type { DashboardStats, Candidate } from "@care4u/shared";

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [selectedCandidateForFamily, setSelectedCandidateForFamily] =
    useState<string>("");

  const navItems = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: <Activity className="w-5 h-5" />,
    },
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, candidatesRes] = await Promise.all([
        api.get("/api/admin/stats"),
        api.get("/api/admin/candidates"),
      ]);

      setStats(statsRes.data);
      setCandidates(candidatesRes.data.candidates);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = () => {
    setSelectedCandidate(null);
    setShowCandidateForm(true);
  };

  const handleEditCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setShowCandidateForm(true);
  };

  const handleAddFamilyMember = (candidateId: string) => {
    setSelectedCandidateForFamily(candidateId);
    setShowFamilyForm(true);
  };

  const handleCandidateSaved = () => {
    setShowCandidateForm(false);
    setSelectedCandidate(null);
    fetchData();
  };

  const handleFamilyMemberSaved = () => {
    setShowFamilyForm(false);
    setSelectedCandidateForFamily("");
    toast.success("Family member registered successfully");
  };

  if (loading) {
    return (
      <DashboardLayout title="Admin Dashboard" navItems={navItems}>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Admin Dashboard" navItems={navItems}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">
          Manage candidates and monitor medication adherence
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && <StatsCards stats={stats} />}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={handleAddCandidate}
          className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                All Candidates
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your residents and their care
              </p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </div>
        <CandidatesList
          candidates={candidates}
          onEdit={handleEditCandidate}
          onAddFamily={handleAddFamilyMember}
          onRefresh={fetchData}
        />
      </div>

      {/* Modals */}
      {showCandidateForm && (
        <CandidateForm
          candidate={selectedCandidate}
          onClose={() => {
            setShowCandidateForm(false);
            setSelectedCandidate(null);
          }}
          onSaved={handleCandidateSaved}
        />
      )}

      {showFamilyForm && (
        <FamilyMemberForm
          candidateId={selectedCandidateForFamily}
          candidates={candidates}
          onClose={() => {
            setShowFamilyForm(false);
            setSelectedCandidateForFamily("");
          }}
          onSaved={handleFamilyMemberSaved}
        />
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
