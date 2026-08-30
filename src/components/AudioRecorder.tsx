import React, { useState, useRef } from 'react';
import { Mic, Square, Trash2, Loader2 } from 'lucide-react';
import { uploadVoiceNote } from '../services/api';

interface AudioRecorderProps {
  issueId?: string;
  onUploadComplete: (url: string) => void;
  existingAudioUrl?: string | null;
  onRemoveAudio: () => void;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ issueId, onUploadComplete, existingAudioUrl, onRemoveAudio }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsUploading(true);
        try {
          const url = await uploadVoiceNote(audioBlob, issueId);
          setAudioUrl(url);
          onUploadComplete(url);
        } catch (error) {
          console.error("Failed to upload audio:", error);
          alert("Failed to upload voice note.");
        } finally {
          setIsUploading(false);
        }
        
        // stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const removeAudio = () => {
    setAudioUrl(null);
    onRemoveAudio();
  };

  if (audioUrl) {
    return (
      <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
        <audio src={audioUrl} controls className="h-8 max-w-[200px]" />
        <button
          type="button"
          onClick={removeAudio}
          className="text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors p-1"
          title="Remove Voice Note"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isRecording ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg text-sm font-medium transition-colors"
        >
          <Square size={16} className="fill-current" />
          Stop Recording
        </button>
      ) : (
        <button
          type="button"
          onClick={startRecording}
          disabled={isUploading}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
          {isUploading ? "Uploading..." : "Record Voice Note"}
        </button>
      )}
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-500 animate-pulse">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          Recording...
        </div>
      )}
    </div>
  );
};
