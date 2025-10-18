import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';
import type { CreateCandidateRequest, RegisterFamilyMemberRequest } from '@care4u/shared';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireRole('institute_admin'));

// Get all candidates for the admin's institute
router.get('/candidates', async (req: AuthRequest, res) => {
  try {
    const { data: admin } = await supabase
      .from('institute_admins')
      .select('id')
      .eq('user_id', req.user!.id)
      .single();

    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('institute_id', admin?.id || '')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch family members and caregivers for all candidates
    const candidatesWithRelations = await Promise.all(
      (candidates || []).map(async (candidate) => {
        // Get all family members for this candidate
        const { data: familyMembers } = await supabase
          .from('family_members')
          .select('*')
          .eq('candidate_id', candidate.id)
          .order('created_at', { ascending: false });

        // Separate caregivers and regular family members
        const caregivers = familyMembers?.filter(fm => fm.is_caregiver) || [];
        const regularFamily = familyMembers?.filter(fm => !fm.is_caregiver) || [];

        return {
          ...candidate,
          family_members: regularFamily,
          caregivers: caregivers
        };
      })
    );

    res.json({ candidates: candidatesWithRelations });
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new candidate
router.post('/candidates', async (req: AuthRequest, res) => {
  try {
    const { first_name, last_name, age, institute_id }: CreateCandidateRequest = req.body;

    // Get admin's id (which serves as institute identifier) if not provided
    let finalInstituteId = institute_id;
    if (!finalInstituteId) {
      const { data: admin } = await supabase
        .from('institute_admins')
        .select('id')
        .eq('user_id', req.user!.id)
        .single();
      finalInstituteId = admin?.id;
    }

    const { data, error } = await supabase
      .from('candidates')
      .insert({
        first_name,
        last_name,
        age,
        institute_id: finalInstituteId
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ candidate: data });
  } catch (error: any) {
    console.error('Error creating candidate:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a candidate
router.put('/candidates/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, age } = req.body;

    const { data, error } = await supabase
      .from('candidates')
      .update({ first_name, last_name, age, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ candidate: data });
  } catch (error: any) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a candidate
router.delete('/candidates/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Candidate deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting candidate:', error);
    res.status(500).json({ error: error.message });
  }
});

// Register a family member and send magic link
router.post('/family-members', async (req: AuthRequest, res) => {
  try {
    const {
      candidate_id,
      first_name,
      last_name,
      email,
      is_caregiver
    }: RegisterFamilyMemberRequest = req.body;

    // Send magic link via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          first_name,
          last_name,
          role: is_caregiver ? 'caregiver' : 'family_member',
          candidate_id,
          onboarded: false
        },
        redirectTo: `${process.env.FRONTEND_URL}/onboarding`
      }
    );

    if (authError) throw authError;

    // Create family member record
    const { data: familyMember, error: familyError } = await supabase
      .from('family_members')
      .insert({
        user_id: authData.user.id,
        candidate_id,
        first_name,
        last_name,
        email,
        is_caregiver
      })
      .select()
      .single();

    if (familyError) throw familyError;

    // If is_caregiver, also create caregiver record
    if (is_caregiver) {
      await supabase.from('caregivers').insert({
        user_id: authData.user.id,
        candidate_ids: [candidate_id]
      });
    }

    res.status(201).json({
      message: 'Family member registered and magic link sent',
      family_member: familyMember
    });
  } catch (error: any) {
    console.error('Error registering family member:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all family members for a candidate
router.get('/candidates/:id/family-members', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('candidate_id', id);

    if (error) throw error;

    res.json({ family_members: data || [] });
  } catch (error: any) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const { data: admin } = await supabase
      .from('institute_admins')
      .select('id')
      .eq('user_id', req.user!.id)
      .single();

    // Get total candidates
    const { count: totalCandidates } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })
      .eq('institute_id', admin?.id || '');

    // Get total caregivers
    const { count: totalCaregivers } = await supabase
      .from('caregivers')
      .select('*', { count: 'exact', head: true });

    // Get total family members
    const { count: totalFamilyMembers } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true });

    // Get today's medication stats
    const today = new Date().toISOString().split('T')[0];
    const { data: todayLogs } = await supabase
      .from('medication_logs')
      .select('*, candidates!inner(institute_id)')
      .gte('scheduled_time', `${today}T00:00:00`)
      .lt('scheduled_time', `${today}T23:59:59`);

    const relevantLogs = todayLogs?.filter(log => 
      (log.candidates as any).institute_id === admin?.id
    ) || [];

    const missedToday = relevantLogs.filter(log => log.status === 'missed').length;
    const takenToday = relevantLogs.filter(log => log.status === 'taken').length;
    const totalToday = relevantLogs.length;
    const adherenceRate = totalToday > 0 ? (takenToday / totalToday) * 100 : 0;

    // Get upcoming doses (next 2 hours)
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    const { count: upcomingDoses } = await supabase
      .from('medication_logs')
      .select('*, candidates!inner(institute_id)', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gte('scheduled_time', now.toISOString())
      .lt('scheduled_time', twoHoursLater.toISOString());

    res.json({
      total_candidates: totalCandidates || 0,
      total_caregivers: totalCaregivers || 0,
      total_family_members: totalFamilyMembers || 0,
      medication_adherence_rate: Math.round(adherenceRate),
      missed_doses_today: missedToday,
      upcoming_doses: upcomingDoses || 0
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create medication schedule
router.post('/medications/schedule', async (req: AuthRequest, res) => {
  try {
    const {
      candidate_id,
      medicine_name,
      dosage,
      frequency,
      times,
      start_date,
      end_date,
      instructions
    } = req.body;

    // Validate required fields
    if (!candidate_id || !medicine_name || !dosage || !frequency || !times || !start_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Insert medication schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('medication_schedules')
      .insert({
        candidate_id,
        medicine_name,
        dosage,
        frequency,
        times,
        start_date,
        end_date,
        instructions,
        active: true
      })
      .select()
      .single();

    if (scheduleError) throw scheduleError;

    // Create medication logs for the schedule
    // For now, create logs for the next 30 days
    const logs = [];
    const startDateObj = new Date(start_date);
    const endDateObj = end_date ? new Date(end_date) : new Date(startDateObj);
    endDateObj.setDate(endDateObj.getDate() + 30); // Default 30 days if no end date

    for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
      for (const time of times) {
        const [hours, minutes] = time.split(':');
        const scheduledTime = new Date(d);
        scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        logs.push({
          schedule_id: schedule.id,
          candidate_id,
          scheduled_time: scheduledTime.toISOString(),
          status: 'pending'
        });
      }

      // For weekly frequency, skip 6 days
      if (frequency === 'weekly') {
        d.setDate(d.getDate() + 6);
      }
    }

    // Insert logs in batches to avoid overwhelming the database
    if (logs.length > 0) {
      const { error: logsError } = await supabase
        .from('medication_logs')
        .insert(logs);

      if (logsError) throw logsError;
    }

    res.status(201).json({ schedule, logs_created: logs.length });
  } catch (error: any) {
    console.error('Error creating medication schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get detailed stats for a specific candidate
router.get('/candidates/:id/stats', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Get candidate info
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (candidateError) throw candidateError;

    // Get medication logs for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('candidate_id', id)
      .gte('scheduled_time', thirtyDaysAgo.toISOString())
      .order('scheduled_time', { ascending: false });

    const totalMeds = logs?.length || 0;
    const takenMeds = logs?.filter(log => log.status === 'taken').length || 0;
    const adherenceRate = totalMeds > 0 ? (takenMeds / totalMeds) * 100 : 0;

    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs?.filter(log => 
      log.scheduled_time.startsWith(today)
    ) || [];
    
    const missedToday = todayLogs.filter(log => log.status === 'missed').length;
    const upcomingToday = todayLogs.filter(log => log.status === 'pending').length;

    // Get active medications count
    const { count: totalMedications } = await supabase
      .from('medication_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', id)
      .eq('active', true);

    res.json({
      candidate,
      adherence_rate: Math.round(adherenceRate),
      total_medications: totalMedications || 0,
      missed_today: missedToday,
      upcoming_today: upcomingToday,
      recent_logs: logs?.slice(0, 10) || []
    });
  } catch (error: any) {
    console.error('Error fetching candidate stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all donations for the admin's institute
router.get('/donations', async (req: AuthRequest, res) => {
  try {
    const { data: admin } = await supabase
      .from('institute_admins')
      .select('id, institute_id')
      .eq('user_id', req.user!.id)
      .single();

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (!admin.institute_id) {
      return res.status(400).json({ error: 'Admin not associated with any institute' });
    }

    const { data: donations, error } = await supabase
      .from('donations')
      .select(`
        *,
        institutes(name, type),
        candidates(first_name, last_name),
        auth.users!donations_donor_id_fkey(email)
      `)
      .eq('institute_id', admin.institute_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ donations: donations || [] });
  } catch (error: any) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Approve a donation
router.patch('/donations/:id/approve', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { transaction_id } = req.body;

    const { data: admin } = await supabase
      .from('institute_admins')
      .select('id, institute_id')
      .eq('user_id', req.user!.id)
      .single();

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (!admin.institute_id) {
      return res.status(400).json({ error: 'Admin not associated with any institute' });
    }

    // Verify the donation belongs to this admin's institute
    const { data: donation, error: fetchError } = await supabase
      .from('donations')
      .select('institute_id, status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!donation || donation.institute_id !== admin.institute_id) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (donation.status !== 'pending') {
      return res.status(400).json({ error: 'Donation is not pending' });
    }

    // Update donation status to approved
    const { data: updatedDonation, error: updateError } = await supabase
      .from('donations')
      .update({
        status: 'approved',
        approved_by: req.user!.id,
        approved_at: new Date().toISOString(),
        transaction_id: transaction_id || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        institutes(name, type),
        candidates(first_name, last_name),
        auth.users!donations_donor_id_fkey(email)
      `)
      .single();

    if (updateError) throw updateError;

    res.json({ donation: updatedDonation });
  } catch (error: any) {
    console.error('Error approving donation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reject a donation
router.patch('/donations/:id/reject', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const { data: admin } = await supabase
      .from('institute_admins')
      .select('id, institute_id')
      .eq('user_id', req.user!.id)
      .single();

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (!admin.institute_id) {
      return res.status(400).json({ error: 'Admin not associated with any institute' });
    }

    // Verify the donation belongs to this admin's institute
    const { data: donation, error: fetchError } = await supabase
      .from('donations')
      .select('institute_id, status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!donation || donation.institute_id !== admin.institute_id) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    if (donation.status !== 'pending') {
      return res.status(400).json({ error: 'Donation is not pending' });
    }

    // Update donation status to rejected
    const { data: updatedDonation, error: updateError } = await supabase
      .from('donations')
      .update({
        status: 'rejected',
        approved_by: req.user!.id,
        approved_at: new Date().toISOString(),
        rejection_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        institutes(name, type),
        candidates(first_name, last_name),
        auth.users!donations_donor_id_fkey(email)
      `)
      .single();

    if (updateError) throw updateError;

    res.json({ donation: updatedDonation });
  } catch (error: any) {
    console.error('Error rejecting donation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get donation statistics
router.get('/donations/stats', async (req: AuthRequest, res) => {
  try {
    const { data: admin } = await supabase
      .from('institute_admins')
      .select('id, institute_id')
      .eq('user_id', req.user!.id)
      .single();

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (!admin.institute_id) {
      return res.status(400).json({ error: 'Admin not associated with any institute' });
    }

    // Get total donations count
    const { count: totalDonations } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('institute_id', admin.institute_id);

    // Get pending donations count
    const { count: pendingDonations } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('institute_id', admin.institute_id)
      .eq('status', 'pending');

    // Get approved donations count
    const { count: approvedDonations } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('institute_id', admin.institute_id)
      .eq('status', 'approved');

    // Get total amount raised
    const { data: totalAmountData } = await supabase
      .from('donations')
      .select('amount')
      .eq('institute_id', admin.institute_id)
      .eq('status', 'approved');

    const totalAmount = totalAmountData?.reduce((sum, donation) => sum + parseFloat(donation.amount), 0) || 0;

    // Get recent donations (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentDonations } = await supabase
      .from('donations')
      .select('*', { count: 'exact', head: true })
      .eq('institute_id', admin.institute_id)
      .gte('created_at', sevenDaysAgo.toISOString());

    res.json({
      total_donations: totalDonations || 0,
      pending_donations: pendingDonations || 0,
      approved_donations: approvedDonations || 0,
      total_amount: totalAmount,
      recent_donations: recentDonations || 0
    });
  } catch (error: any) {
    console.error('Error fetching donation stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get spending analytics by institute
router.get('/donations/spending/institute', async (req: AuthRequest, res) => {
  try {
    const { data: admin } = await supabase
      .from('institute_admins')
      .select('id, institute_id')
      .eq('user_id', req.user!.id)
      .single();

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (!admin.institute_id) {
      return res.status(400).json({ error: 'Admin not associated with any institute' });
    }

    // Get all donations for this institute (including pending)
    const { data: donations, error } = await supabase
      .from('donations')
      .select(`
        *,
        institutes(name, type),
        candidates(first_name, last_name),
        auth.users!donations_donor_id_fkey(email)
      `)
      .eq('institute_id', admin.institute_id)
      .in('status', ['pending', 'approved', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate institute breakdown
    const instituteMap = new Map();
    (donations || []).forEach(donation => {
      const key = donation.institute_id;
      if (!instituteMap.has(key)) {
        instituteMap.set(key, {
          institute_id: key,
          institute_name: donation.institutes?.name || 'Unknown Institute',
          institute_type: donation.institutes?.type || 'unknown',
          total_amount: 0,
          count: 0,
          pending_amount: 0,
          approved_amount: 0
        });
      }
      const entry = instituteMap.get(key);
      entry.total_amount += donation.amount;
      entry.count += 1;
      
      if (donation.status === 'pending') {
        entry.pending_amount += donation.amount;
      } else if (donation.status === 'approved' || donation.status === 'completed') {
        entry.approved_amount += donation.amount;
      }
    });

    const instituteBreakdown = Array.from(instituteMap.values())
      .map(entry => ({
        ...entry,
        percentage: entry.total_amount > 0 ? (entry.total_amount / entry.total_amount) * 100 : 0
      }))
      .sort((a, b) => b.total_amount - a.total_amount);

    res.json({ institute_breakdown: instituteBreakdown });
  } catch (error: any) {
    console.error('Error fetching institute spending analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get spending analytics by candidate
router.get('/donations/spending/candidate', async (req: AuthRequest, res) => {
  try {
    const { data: admin } = await supabase
      .from('institute_admins')
      .select('id, institute_id')
      .eq('user_id', req.user!.id)
      .single();

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    if (!admin.institute_id) {
      return res.status(400).json({ error: 'Admin not associated with any institute' });
    }

    // Get all donations for this institute (including pending)
    const { data: donations, error } = await supabase
      .from('donations')
      .select(`
        *,
        institutes(name, type),
        candidates(first_name, last_name),
        auth.users!donations_donor_id_fkey(email)
      `)
      .eq('institute_id', admin.institute_id)
      .in('status', ['pending', 'approved', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate candidate breakdown (only for specific candidate donations)
    const candidateDonations = (donations || []).filter(d => d.candidate_id);
    const candidateMap = new Map();
    
    candidateDonations.forEach(donation => {
      const key = donation.candidate_id!;
      if (!candidateMap.has(key)) {
        candidateMap.set(key, {
          candidate_id: key,
          candidate_name: donation.candidates ? 
            `${donation.candidates.first_name} ${donation.candidates.last_name}` : 
            'Unknown Candidate',
          total_amount: 0,
          count: 0,
          pending_amount: 0,
          approved_amount: 0
        });
      }
      const entry = candidateMap.get(key);
      entry.total_amount += donation.amount;
      entry.count += 1;
      
      if (donation.status === 'pending') {
        entry.pending_amount += donation.amount;
      } else if (donation.status === 'approved' || donation.status === 'completed') {
        entry.approved_amount += donation.amount;
      }
    });

    const candidateBreakdown = Array.from(candidateMap.values())
      .map(entry => ({
        ...entry,
        percentage: entry.total_amount > 0 ? (entry.total_amount / entry.total_amount) * 100 : 0
      }))
      .sort((a, b) => b.total_amount - a.total_amount);

    res.json({ candidate_breakdown: candidateBreakdown });
  } catch (error: any) {
    console.error('Error fetching candidate spending analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

