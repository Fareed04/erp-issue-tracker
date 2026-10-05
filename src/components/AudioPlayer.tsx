import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface AudioPlayerProps {
  src: string;
}

const PLAYBACK_SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Set playback speed on audio element
  const applyPlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      audioRef.current.defaultPlaybackRate = rate;
    }
  };

  const cyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_SPEEDS.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    applyPlaybackRate(PLAYBACK_SPEEDS[nextIndex]);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playbackRate;
    audio.defaultPlaybackRate = playbackRate;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const updateDuration = () => {
      setDuration(audio.duration || 0);
      audio.playbackRate = playbackRate;
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    const handlePlay = () => {
      audio.playbackRate = playbackRate;
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
    };
  }, [src, playbackRate]);

  // Close speed menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false);
      }
    };

    if (showSpeedMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSpeedMenu]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.playbackRate = playbackRate;
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = (Number(e.target.value) / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(Number(e.target.value));
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full p-2 pr-3.5 shadow-sm w-full max-w-md relative select-none">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* Play / Pause Button */}
      <button
        type="button"
        onClick={togglePlayPause}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-tawny-port text-white hover:bg-tawny-port/90 active:scale-95 transition-all shrink-0 shadow-sm"
        title={isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-0.5" />}
      </button>

      {/* Progress slider and duration */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-tawny-port [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 transition-all"
        />
        <div className="flex justify-between mt-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          <span>{formatTime((progress / 100) * duration)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Playback Speed Control */}
      <div className="relative shrink-0" ref={speedMenuRef}>
        <div className={clsx(
          "inline-flex items-center rounded-full transition-all border",
          playbackRate !== 1
            ? "bg-tawny-port/10 dark:bg-rose-950/40 border-tawny-port/30 dark:border-rose-900/50 text-tawny-port dark:text-rose-300 font-bold"
            : "bg-slate-100 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
        )}>
          {/* Main button: click to cycle speeds */}
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="px-2 py-1 text-xs transition-colors rounded-l-full hover:opacity-80 active:scale-95"
            title={`Speed: ${playbackRate}x (Click to cycle, arrow for menu)`}
          >
            {playbackRate}x
          </button>

          {/* Dropdown toggle */}
          <button
            type="button"
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="pr-1.5 py-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-r-full"
            title="Choose playback speed"
          >
            <ChevronDown size={12} className={clsx("transition-transform duration-150", showSpeedMenu && "rotate-180")} />
          </button>
        </div>

        {/* Speed Selection Popover */}
        {showSpeedMenu && (
          <div className="absolute bottom-full right-0 mb-2 py-1.5 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 min-w-[105px] animate-in fade-in zoom-in-95 duration-150">
            <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
              Speed
            </div>
            {PLAYBACK_SPEEDS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  applyPlaybackRate(rate);
                  setShowSpeedMenu(false);
                }}
                className={clsx(
                  "w-full text-left px-3 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors",
                  playbackRate === rate
                    ? "bg-tawny-port/10 text-tawny-port dark:bg-rose-950/40 dark:text-rose-300"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                )}
              >
                <span>{rate}x {rate === 1 && <span className="text-[10px] opacity-75 font-normal">(Normal)</span>}</span>
                {playbackRate === rate && <span className="text-xs font-bold">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Mute / Unmute Button */}
      <button
        type="button"
        onClick={toggleMute}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
};
