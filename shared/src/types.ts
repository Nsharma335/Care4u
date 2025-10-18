// User Roles
export enum UserRole {
  INSTITUTE_ADMIN = 'institute_admin',
  CANDIDATE = 'candidate',
  FAMILY_MEMBER = 'family_member',
  CAREGIVER = 'caregiver'
}

// Database Types
export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  institute_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_caregiver: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Caregiver {
  id: string;
  user_id: string;
  candidate_ids: string[];
  created_at: string;
  updated_at?: string;
}

export interface InstituteAdmin {
  id: string;
  user_id: string;
  institute_name: string;
  created_at: string;
  updated_at?: string;
}

export interface Prescription {
  id: string;
  candidate_id: string;
  uploaded_by: string;
  file_url: string;
  processed_data: MedicationScheduleItem[];
  upload_date: string;
}

export interface MedicationScheduleItem {
  name: string;
  dosage: string;
  frequency: string;
  times: string[]; // Array of time strings like ["08:00", "20:00"]
  instructions?: string;
}

export interface MedicationSchedule {
  id: string;
  candidate_id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  times: string[];
  start_date: string;
  end_date?: string;
  active: boolean;
  instructions?: string;
  created_at: string;
  updated_at?: string;
}

export enum MedicationStatus {
  PENDING = 'pending',
  TAKEN = 'taken',
  MISSED = 'missed',
  SKIPPED = 'skipped'
}

export interface MedicationLog {
  id: string;
  schedule_id: string;
  candidate_id: string;
  scheduled_time: string;
  confirmed_at?: string;
  confirmed_by?: string;
  status: MedicationStatus;
  notes?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  candidate_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'medication_reminder' | 'call_request' | 'alert' | 'info';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

// API Request/Response Types
export interface CreateCandidateRequest {
  first_name: string;
  last_name: string;
  age: number;
  institute_id?: string;
}

export interface RegisterFamilyMemberRequest {
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_caregiver: boolean;
}

export interface ProcessPrescriptionRequest {
  candidate_id: string;
  file: File | any; // Buffer for Node.js, File for browser
}

export interface ProcessPrescriptionResponse {
  schedule: MedicationScheduleItem[];
  prescription_id: string;
}

export interface ConfirmMedicationRequest {
  log_id: string;
  notes?: string;
}

export interface DashboardStats {
  total_candidates: number;
  total_caregivers: number;
  total_family_members: number;
  medication_adherence_rate: number;
  missed_doses_today: number;
  upcoming_doses: number;
}

export interface CandidateDetailStats {
  candidate: Candidate;
  adherence_rate: number;
  total_medications: number;
  missed_today: number;
  upcoming_today: number;
  recent_logs: MedicationLog[];
}

// Activity Feed
export interface ActivityLog {
  id: string;
  candidate_id: string;
  caregiver_id?: string;
  type: 'medication' | 'wellness' | 'note' | 'photo' | 'call';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Wellness Check-in
export interface WellnessCheckIn {
  id: string;
  caregiver_id: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'stressed' | 'exhausted';
  stress_level: number; // 1-10
  notes?: string;
  created_at: string;
}

// User Profile with Role
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  onboarded: boolean;
  candidate_id?: string;
  institute_id?: string;
  first_name?: string;
  last_name?: string;
}

// Institute and Donation Types
export interface Institute {
  id: string;
  name: string;
  description?: string;
  type: 'institute' | 'non_profit' | 'charity' | 'hospital' | 'clinic';
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Donation {
  id: string;
  donor_id: string;
  institute_id: string;
  candidate_id?: string;
  amount: number;
  currency: string;
  donation_type: 'general' | 'specific_patient';
  message?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'approved' | 'rejected';
  payment_method?: string;
  transaction_id?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
  // Related data
  institutes?: Institute;
  candidates?: { first_name: string; last_name: string };
  auth?: { users?: { email: string } };
}

export interface CreateDonationRequest {
  institute_id: string;
  candidate_id?: string;
  amount: number;
  currency?: string;
  donation_type: 'general' | 'specific_patient';
  message?: string;
  payment_method?: string;
}

// Candidate with related data
export interface CandidateWithRelations extends Candidate {
  family_members?: FamilyMember[];
  caregivers?: FamilyMember[];
}

