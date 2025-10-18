import { openai } from '../config/openai.js';
import type { MedicationScheduleItem } from '@care4u/shared';
import fs from 'fs/promises';

export class OpenAIService {
  async processPrescription(filePath: string): Promise<MedicationScheduleItem[]> {
    try {
      // Read the file
      const fileBuffer = await fs.readFile(filePath);
      const base64File = fileBuffer.toString('base64');
      
      // Determine file type
      const fileExtension = filePath.split('.').pop()?.toLowerCase();
      const mimeType = this.getMimeType(fileExtension || '');

      // Use GPT-4 Vision for image files, or regular GPT-4 for text
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');

      let response;

      if (isImage) {
        response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Please analyze this prescription image and extract all medication information. 
                  
For each medication, provide:
- Medicine name
- Dosage (e.g., "500mg", "10ml")
- Frequency (e.g., "twice daily", "three times daily", "once daily")
- Times to take (e.g., ["08:00", "20:00"] for twice daily, ["08:00", "14:00", "20:00"] for three times daily)
- Any special instructions

Return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "Medicine Name",
    "dosage": "500mg",
    "frequency": "twice daily",
    "times": ["08:00", "20:00"],
    "instructions": "Take with food"
  }
]

If you cannot read the prescription clearly, return an empty array [].`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64File}`
                  }
                }
              ]
            }
          ],
          max_tokens: 1000
        });
      } else {
        // For PDF or text files, use regular GPT-4
        const fileContent = fileBuffer.toString('utf-8');
        
        response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: `Please analyze this prescription and extract all medication information:

${fileContent}

For each medication, provide:
- Medicine name
- Dosage (e.g., "500mg", "10ml")
- Frequency (e.g., "twice daily", "three times daily", "once daily")
- Times to take (e.g., ["08:00", "20:00"] for twice daily, ["08:00", "14:00", "20:00"] for three times daily)
- Any special instructions

Return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "Medicine Name",
    "dosage": "500mg",
    "frequency": "twice daily",
    "times": ["08:00", "20:00"],
    "instructions": "Take with food"
  }
]`
            }
          ],
        });
      }

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('Could not extract JSON from OpenAI response:', content);
        return [];
      }

      const medications: MedicationScheduleItem[] = JSON.parse(jsonMatch[0]);
      return medications;
    } catch (error) {
      console.error('Error processing prescription:', error);
      throw error;
    }
  }

  async chatWithAssistant(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: messages as any,
        max_tokens: 5000
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }

  async generatePatientSummary(patientData: {
    firstName: string;
    lastName: string;
    age: number;
    todaysMedications: Array<{
      medicineName: string;
      dosage: string;
      scheduledTime: string;
      status: string;
    }>;
    adherenceRate7Days: number;
    adherenceRate30Days: number;
    missedToday: number;
    totalToday: number;
  }): Promise<string> {
    try {
      const prompt = `You are a compassionate healthcare assistant providing a brief daily medication summary for a patient.

Patient Information:
- Name: ${patientData.firstName} ${patientData.lastName}
- Age: ${patientData.age} years

Today's Medication Status:
- Total medications scheduled: ${patientData.totalToday}
- Medications taken: ${patientData.totalToday - patientData.missedToday}
- Medications missed: ${patientData.missedToday}

Today's Medications:
${patientData.todaysMedications.map((med, idx) => 
  `${idx + 1}. ${med.medicineName} (${med.dosage}) at ${med.scheduledTime} - Status: ${med.status}`
).join('\n')}

Recent Adherence:
- 7-day adherence rate: ${patientData.adherenceRate7Days}%
- 30-day adherence rate: ${patientData.adherenceRate30Days}%

Please provide a brief, compassionate, and actionable summary (2-3 sentences) that:
1. Acknowledges today's medication status
2. Highlights any concerns if medications were missed
3. Provides gentle encouragement or positive reinforcement
4. Keeps a warm, supportive tone

Keep it concise and patient-friendly.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a compassionate healthcare assistant providing brief, supportive medication summaries for patients.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return response.choices[0].message.content || 'Unable to generate summary at this time.';
    } catch (error) {
      console.error('Error generating patient summary:', error);
      throw error;
    }
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'txt': 'text/plain'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }
}

export const openAIService = new OpenAIService();

