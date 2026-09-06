import React, { useState, useRef } from 'react';
import { Mic, Square, Trash2, Loader2 } from 'lucide-react';
import { uploadVoiceNote } from '../services/api';
import { AudioPlayer } from './AudioPlayer';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      analyser.getByteTimeDomainData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };
    
    draw();
  };

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

      // Set up Audio Context for visualization
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Delay drawing slightly to ensure canvas is rendered
      setTimeout(drawWaveform, 50);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error);
      }
    }
  };

  const removeAudio = () => {
    setAudioUrl(null);
    onRemoveAudio();
  };

  if (audioUrl) {
    return (
      <div className="flex items-center gap-3 w-full">
        <AudioPlayer src={audioUrl} />
        <button
          type="button"
          onClick={removeAudio}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-500 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors shrink-0"
          title="Remove Voice Note"
        >
          <Trash2 size={18} />
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
        <div className="flex flex-1 items-center gap-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-sm text-red-500 animate-pulse shrink-0">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            Rec
          </div>
          <canvas ref={canvasRef} width="200" height="24" className="w-full max-w-[200px] h-6" />
        </div>
      )}
    </div>
  );
};
