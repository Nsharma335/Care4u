import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, requireRole, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('caregiver', 'family_member'));

// Get assigned candidates
router.get('/candidates', async (req: AuthRequest, res) => {
  try {
    // Get candidates from family_members table
    const { data: familyMembers } = await supabase
      .from('family_members')
      .select('candidate_id, candidates(*)')
      .eq('user_id', req.user!.id);

    // Also check caregivers table
    const { data: caregiver } = await supabase
      .from('caregivers')
      .select('candidate_ids')
      .eq('user_id', req.user!.id)
      .single();

    const candidateIds = new Set([
      ...(familyMembers?.map(fm => fm.candidate_id) || []),
      ...(caregiver?.candidate_ids || [])
    ]);

    const { data: candidates } = await supabase
      .from('candidates')
      .select('*')
      .in('id', Array.from(candidateIds));

    res.json({ candidates: candidates || [] });
  } catch (error: any) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit wellness check-in
router.post('/wellness', async (req: AuthRequest, res) => {
  try {
    const { mood, stress_level, notes } = req.body;

    const { data, error } = await supabase
      .from('wellness_checkins')
      .insert({
        caregiver_id: req.user!.id,
        date: new Date().toISOString().split('T')[0],
        mood,
        stress_level,
        notes
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ checkin: data });
  } catch (error: any) {
    console.error('Error saving wellness check-in:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get wellness history
router.get('/wellness', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('wellness_checkins')
      .select('*')
      .eq('caregiver_id', req.user!.id)
      .order('date', { ascending: false })
      .limit(30);

    if (error) throw error;

    res.json({ checkins: data || [] });
  } catch (error: any) {
    console.error('Error fetching wellness history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add activity note
router.post('/activity-log', async (req: AuthRequest, res) => {
  try {
    const { candidate_id, type, title, description, metadata } = req.body;

    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        candidate_id,
        caregiver_id: req.user!.id,
        type,
        title,
        description,
        metadata
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ activity: data });
  } catch (error: any) {
    console.error('Error creating activity log:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get activity feed for a candidate
router.get('/activity-log/:candidate_id', async (req: AuthRequest, res) => {
  try {
    const { candidate_id } = req.params;

    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('candidate_id', candidate_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ activities: data || [] });
  } catch (error: any) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({ error: error.message });
  }
});

// Request call with family
router.post('/request-call', async (req: AuthRequest, res) => {
  try {
    const { candidate_id, message } = req.body;

    // Get all family members for this candidate
    const { data: familyMembers } = await supabase
      .from('family_members')
      .select('user_id')
      .eq('candidate_id', candidate_id);

    // Create notifications for all family members
    const notifications = familyMembers?.map(fm => ({
      user_id: fm.user_id,
      type: 'call_request',
      title: 'Caregiver requesting a call',
      message: message || 'Your caregiver would like to speak with you',
      read: false,
      metadata: {
        candidate_id,
        caregiver_id: req.user!.id
      }
    })) || [];

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }

    res.json({ message: 'Call request sent to family members' });
  } catch (error: any) {
    console.error('Error requesting call:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

