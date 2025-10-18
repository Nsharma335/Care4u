import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Check, AlertCircle, Bot, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface MedicationScheduleItem {
  name: string;
  dosage: string;
  frequency: string;
  times: string[];
  instructions?: string;
}

const Onboarding = () => {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to Care4U! I'm here to help you get started. Please upload your candidate's prescription, and I'll extract the medication schedule for you."
    }
  ]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extractedSchedule, setExtractedSchedule] = useState<MedicationScheduleItem[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessages(prev => [...prev, {
      role: 'user',
      content: `Uploaded: ${file.name}`
    }]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('candidate_id', profile?.candidate_id || '');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Processing your prescription... This may take a moment.'
      }]);

      setProcessing(true);
      const { data } = await api.post('/api/chat/process-prescription', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setExtractedSchedule(data.schedule);
      setShowSchedule(true);

      if (data.schedule.length === 0) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I couldn't extract any medications from the prescription. Please try uploading a clearer image or a different file."
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `Great! I found ${data.schedule.length} medication(s). Please review the schedule below and confirm if everything looks correct.`
        }]);
      }
    } catch (error: any) {
      console.error('Error uploading prescription:', error);
      toast.error(error.response?.data?.error || 'Failed to process prescription');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, there was an error processing your prescription. Please try again.'
      }]);
    } finally {
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleConfirmSchedule = async () => {
    try {
      await api.post('/api/chat/save-schedule', {
        candidate_id: profile?.candidate_id,
        medications: extractedSchedule
      });

      toast.success('Medication schedule saved successfully!');
      await refreshProfile();
      
      // Navigate to appropriate dashboard based on role
      if (profile?.role === 'caregiver' || profile?.role === 'family_member') {
        navigate('/caregiver/dashboard');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      toast.error(error.response?.data?.error || 'Failed to save schedule');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-6">
            <h1 className="text-2xl font-bold text-white">Getting Started</h1>
            <p className="text-primary-100 mt-1">Let's set up your medication schedule</p>
          </div>

          {/* Chat Area */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' ? 'bg-primary-600' : 'bg-secondary-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}

            {processing && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2 bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Upload Section */}
          {!showSchedule && (
            <div className="border-t border-gray-200 p-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || processing}
                className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
              >
                <Upload className="w-5 h-5" />
                <span>{uploading ? 'Uploading...' : 'Upload Prescription'}</span>
              </button>
              <p className="text-sm text-gray-500 text-center mt-3">
                Supported formats: Images (JPG, PNG), PDF, or text files
              </p>
            </div>
          )}

          {/* Schedule Review */}
          {showSchedule && extractedSchedule.length > 0 && (
            <div className="border-t border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Extracted Medication Schedule</h3>
              <div className="space-y-3 mb-6">
                {extractedSchedule.map((med, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{med.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Dosage: {med.dosage} • {med.frequency}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs font-medium text-gray-500">Times:</span>
                          {med.times.map((time, i) => (
                            <span key={i} className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full">
                              {time}
                            </span>
                          ))}
                        </div>
                        {med.instructions && (
                          <p className="text-xs text-gray-500 mt-2 italic">{med.instructions}</p>
                        )}
                      </div>
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-800">
                  Please verify this information matches your prescription. You can edit schedules later from your dashboard.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowSchedule(false);
                    setExtractedSchedule([]);
                    setMessages(prev => [...prev, {
                      role: 'assistant',
                      content: 'No problem! Please upload a new prescription file.'
                    }]);
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={handleConfirmSchedule}
                  className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Confirm & Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;

