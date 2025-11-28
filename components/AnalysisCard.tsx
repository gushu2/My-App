import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResult, StressLevel } from '../types';
import { BrainCircuit, HeartPulse, Stethoscope, Lightbulb, AlertCircle, Music, Play, Pause, Volume2 } from 'lucide-react';

interface AnalysisCardProps {
  result: AnalysisResult | null;
  loading: boolean;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ result, loading }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play music when High Stress is detected
  useEffect(() => {
    if (result?.stressLevel === StressLevel.HighStress) {
      // Attempt to play automatically
      const playPromise = audioRef.current?.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.log("Auto-play prevented by browser policy:", error);
            setIsPlaying(false);
          });
      }
    } else {
      // Pause if stress level drops back to normal/mild
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [result?.stressLevel]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-8 h-full flex flex-col items-center justify-center text-center animate-pulse">
        <div className="bg-indigo-100 p-4 rounded-full mb-4">
          <BrainCircuit size={48} className="text-indigo-500 animate-pulse" />
        </div>
        <h3 className="text-xl font-medium text-slate-700">NeuroCalm is thinking...</h3>
        <p className="text-slate-500 mt-2">Analyzing biometric patterns</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-8 h-full flex flex-col items-center justify-center text-center">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <Stethoscope size={48} className="text-slate-400" />
        </div>
        <h3 className="text-xl font-medium text-slate-700">No Analysis Yet</h3>
        <p className="text-slate-500 mt-2">Start the sensor and click "Analyze" to get insights.</p>
      </div>
    );
  }

  // Determine styling based on stress level
  let statusColor = "text-slate-700";
  let statusBg = "bg-slate-100";
  let statusBorder = "border-slate-200";
  let Icon = HeartPulse;

  switch (result.stressLevel) {
    case StressLevel.Normal:
      statusColor = "text-green-700";
      statusBg = "bg-green-50";
      statusBorder = "border-green-200";
      break;
    case StressLevel.MildStress:
      statusColor = "text-amber-700";
      statusBg = "bg-amber-50";
      statusBorder = "border-amber-200";
      break;
    case StressLevel.HighStress:
      statusColor = "text-red-700";
      statusBg = "bg-red-50";
      statusBorder = "border-red-200";
      break;
    case StressLevel.NoData:
    case StressLevel.Unknown:
      statusColor = "text-slate-500";
      statusBg = "bg-slate-50";
      statusBorder = "border-slate-200";
      Icon = AlertCircle;
      break;
  }

  return (
    <div className={`rounded-xl shadow-lg border p-6 h-full flex flex-col ${statusBg} ${statusBorder} transition-colors duration-500`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2 rounded-lg bg-white/60 ${statusColor}`}>
            <Icon size={24} />
        </div>
        <h2 className={`text-2xl font-bold ${statusColor}`}>{result.stressLevel}</h2>
      </div>

      <div className="space-y-6 flex-grow">
        <div className="bg-white/60 p-4 rounded-xl border border-white/50">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Analysis</h3>
            <p className="text-slate-800 leading-relaxed">{result.reason}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-white/50 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-indigo-600">
                <Lightbulb size={18} />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Recommendation</h3>
            </div>
            <p className="text-slate-700 leading-relaxed italic">
                "{result.suggestion}"
            </p>
        </div>

        {/* Relaxing Audio Player for High Stress */}
        {result.stressLevel === StressLevel.HighStress && (
          <div className="mt-4 bg-indigo-100/50 p-4 rounded-xl border border-indigo-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-800">
                <Music size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider">Calming Audio</h3>
              </div>
              <span className="text-[10px] uppercase font-semibold text-indigo-500 bg-white/50 px-2 py-0.5 rounded-full">
                Auto-Active
              </span>
            </div>
            
            <div className="flex items-center gap-4 bg-white/80 p-3 rounded-lg border border-white/50 shadow-sm">
              <button 
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
              </button>
              
              <div className="flex-grow">
                <p className="text-xs font-semibold text-slate-700 mb-0.5">Gymnopédie No. 1</p>
                <p className="text-[10px] text-slate-500">Erik Satie • Soothing Piano</p>
              </div>

              <Volume2 size={16} className="text-slate-400" />
              
              <audio 
                ref={audioRef}
                src="https://upload.wikimedia.org/wikipedia/commons/transcoded/1/1a/Gymnopedie_No_1.ogg/Gymnopedie_No_1.ogg.mp3"
                loop
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-center">
              Audio plays automatically to help lower heart rate.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisCard;
