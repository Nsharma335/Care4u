import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Get user from Supabase auth
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(userId);

    if (authError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = user.user_metadata?.role;
    const onboarded = user.user_metadata?.onboarded || false;

    let profile: any = {
      id: user.id,
      email: user.email,
      role,
      onboarded
    };

    // Get additional profile data based on role
    if (role === 'institute_admin') {
      const { data: admin } = await supabase
        .from('institute_admins')
        .select('*')
        .eq('user_id', userId)
        .single();
      profile = { ...profile, ...admin };
    } else if (role === 'family_member' || role === 'caregiver') {
      const { data: familyMember } = await supabase
        .from('family_members')
        .select('*, candidates(*)')
        .eq('user_id', userId)
        .single();
      profile = { ...profile, ...familyMember };
    }

    res.json({ user: profile });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user metadata
router.put('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { onboarded, ...otherMetadata } = req.body;

    const { data, error } = await supabase.auth.admin.updateUserById(
      req.user!.id,
      {
        user_metadata: {
          ...otherMetadata,
          onboarded
        }
      }
    );

    if (error) throw error;

    res.json({ user: data.user });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Request magic link (for login)
router.post('/magic-link', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.FRONTEND_URL}/auth/callback`
      }
    });

    if (error) throw error;

    res.json({ message: 'Magic link sent to email' });
  } catch (error: any) {
    console.error('Error sending magic link:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

