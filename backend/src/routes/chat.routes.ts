import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { supabase } from '../config/supabase.js';
import { openAIService } from '../services/openai.service.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDF, and text files are allowed.'));
    }
  }
});

router.use(authenticateToken);

// Process prescription upload
router.post('/process-prescription', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { candidate_id } = req.body;

    if (!candidate_id) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ error: 'candidate_id is required' });
    }

    // Process the prescription with OpenAI
    const medications = await openAIService.processPrescription(req.file.path);

    // Store prescription in Supabase Storage
    const fileBuffer = await fs.readFile(req.file.path);
    const fileName = `prescriptions/${candidate_id}/${Date.now()}-${req.file.originalname}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('prescriptions')
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype
      });

    if (uploadError) {
      console.error('Error uploading to Supabase storage:', uploadError);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('prescriptions')
      .getPublicUrl(fileName);

    // Save prescription record
    const { data: prescription, error: prescriptionError } = await supabase
      .from('prescriptions')
      .insert({
        candidate_id,
        uploaded_by: req.user!.id,
        file_url: publicUrl,
        processed_data: medications
      })
      .select()
      .single();

    if (prescriptionError) throw prescriptionError;

    // Clean up local file
    await fs.unlink(req.file.path);

    res.json({
      prescription_id: prescription.id,
      schedule: medications,
      file_url: publicUrl
    });
  } catch (error: any) {
    console.error('Error processing prescription:', error);
    
    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({ error: error.message });
  }
});

// Save extracted medication schedule
router.post('/save-schedule', async (req: AuthRequest, res) => {
  try {
    const { candidate_id, medications } = req.body;

    if (!candidate_id || !medications || !Array.isArray(medications)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Insert all medications into schedule
    const schedulePromises = medications.map(med => 
      supabase.from('medication_schedules').insert({
        candidate_id,
        medicine_name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        times: med.times,
        instructions: med.instructions,
        start_date: new Date().toISOString(),
        active: true
      })
    );

    await Promise.all(schedulePromises);

    // Mark user as onboarded
    await supabase.auth.admin.updateUserById(req.user!.id, {
      user_metadata: {
        onboarded: true
      }
    });

    res.json({ message: 'Medication schedule saved successfully' });
  } catch (error: any) {
    console.error('Error saving schedule:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoint for general conversation
router.post('/message', async (req: AuthRequest, res) => {
  try {
    const { message, candidate_id, conversation_history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Save user message
    if (candidate_id) {
      await supabase.from('chat_messages').insert({
        user_id: req.user!.id,
        candidate_id,
        role: 'user',
        content: message
      });
    }

    // Get AI response
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant for Care4U, a family caregiver app. Help users with medication management, provide guidance, and be supportive.'
      },
      ...(conversation_history || []),
      { role: 'user', content: message }
    ];

    const response = await openAIService.chatWithAssistant(messages);

    // Save assistant response
    if (candidate_id) {
      await supabase.from('chat_messages').insert({
        user_id: req.user!.id,
        candidate_id,
        role: 'assistant',
        content: response
      });
    }

    res.json({ response });
  } catch (error: any) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get chat history
router.get('/history/:candidate_id', async (req: AuthRequest, res) => {
  try {
    const { candidate_id } = req.params;

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('candidate_id', candidate_id)
      .eq('user_id', req.user!.id)
      .order('timestamp', { ascending: true })
      .limit(50);

    if (error) throw error;

    res.json({ messages: data || [] });
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

