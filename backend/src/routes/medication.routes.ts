import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

// Get medication schedule for a candidate
router.get('/schedule/:candidate_id', async (req: AuthRequest, res) => {
  try {
    const { candidate_id } = req.params;

    const { data, error } = await supabase
      .from('medication_schedules')
      .select('*')
      .eq('candidate_id', candidate_id)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ schedules: data || [] });
  } catch (error: any) {
    console.error('Error fetching medication schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get medication logs for a candidate
router.get('/logs/:candidate_id', async (req: AuthRequest, res) => {
  try {
    const { candidate_id } = req.params;
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('medication_logs')
      .select('*, medication_schedules(*)')
      .eq('candidate_id', candidate_id)
      .order('scheduled_time', { ascending: false });

    if (start_date) {
      query = query.gte('scheduled_time', start_date as string);
    }
    if (end_date) {
      query = query.lte('scheduled_time', end_date as string);
    }

    const { data, error } = await query.limit(100);

    if (error) throw error;

    res.json({ logs: data || [] });
  } catch (error: any) {
    console.error('Error fetching medication logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm medication taken
router.post('/confirm', async (req: AuthRequest, res) => {
  try {
    const { log_id, notes } = req.body;

    if (!log_id) {
      return res.status(400).json({ error: 'log_id is required' });
    }

    const { data, error } = await supabase
      .from('medication_logs')
      .update({
        status: 'taken',
        confirmed_at: new Date().toISOString(),
        confirmed_by: req.user!.id,
        notes
      })
      .eq('id', log_id)
      .select()
      .single();

    if (error) throw error;

    // Mark related notification as read
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('metadata->>schedule_id', data.schedule_id)
      .eq('user_id', req.user!.id);

    res.json({ log: data });
  } catch (error: any) {
    console.error('Error confirming medication:', error);
    res.status(500).json({ error: error.message });
  }
});

// Skip medication
router.post('/skip', async (req: AuthRequest, res) => {
  try {
    const { log_id, notes } = req.body;

    if (!log_id) {
      return res.status(400).json({ error: 'log_id is required' });
    }

    const { data, error } = await supabase
      .from('medication_logs')
      .update({
        status: 'skipped',
        confirmed_at: new Date().toISOString(),
        confirmed_by: req.user!.id,
        notes
      })
      .eq('id', log_id)
      .select()
      .single();

    if (error) throw error;

    res.json({ log: data });
  } catch (error: any) {
    console.error('Error skipping medication:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active notifications for user
router.get('/notifications', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user!.id)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ notifications: data || [] });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .select()
      .single();

    if (error) throw error;

    res.json({ notification: data });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update medication schedule
router.put('/schedule/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { medicine_name, dosage, frequency, times, instructions, active } = req.body;

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (medicine_name) updateData.medicine_name = medicine_name;
    if (dosage) updateData.dosage = dosage;
    if (frequency) updateData.frequency = frequency;
    if (times) updateData.times = times;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('medication_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ schedule: data });
  } catch (error: any) {
    console.error('Error updating medication schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete medication schedule
router.delete('/schedule/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('medication_schedules')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Medication schedule deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting medication schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

