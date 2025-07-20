import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw,
  Volume2,
  VolumeX,
  Clock
} from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer';

export const RecordingControls = ({
  isRecording,
  isListening,
  onStartRecording,
  onStopRecording,
  onPauseRecording,
  onResumeRecording,
  onReset,
  elapsedTime,
  error,
  audioEnabled = true,
  onToggleAudio,
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [audioStream, setAudioStream] = useState(null);

  useEffect(() => {
    if (isListening) {
      // Get audio stream for visualization
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => setAudioStream(stream))
        .catch(console.error);
    } else {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
    }

    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isListening]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMainAction = () => {
    if (!isRecording) {
      onStartRecording();
    } else if (isPaused) {
      onResumeRecording();
      setIsPaused(false);
    } else {
      onPauseRecording();
      setIsPaused(true);
    }
  };

  const handleStop = () => {
    onStopRecording();
    setIsPaused(false);
  };

  const handleReset = () => {
    onReset();
    setIsPaused(false);
  };

  const getMainButtonIcon = () => {
    if (!isRecording) return <Mic className="w-6 h-6" />;
    if (isPaused) return <Play className="w-6 h-6" />;
    return <Pause className="w-6 h-6" />;
  };

  const getMainButtonVariant = () => {
    if (!isRecording) return "default";
    if (isPaused) return "secondary";
    return "destructive";
  };

  const getStatusText = () => {
    if (!isRecording) return "Ready to Record";
    if (isPaused) return "Recording Paused";
    return "Recording...";
  };

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full transition-colors ${
            isRecording && !isPaused 
              ? 'bg-red-500 animate-pulse' 
              : isPaused 
                ? 'bg-yellow-500' 
                : 'bg-muted'
          }`} />
          <div>
            <h3 className="font-semibold">{getStatusText()}</h3>
            <p className="text-sm text-muted-foreground">
              {isRecording ? `${formatTime(elapsedTime)} elapsed` : 'Click record to start'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <Clock className="w-3 h-3 mr-1" />
              {formatTime(elapsedTime)}
            </Badge>
          )}
        </div>
      </div>

      {/* Waveform Visualizer */}
      <div className="relative">
        <WaveformVisualizer 
          isListening={isListening} 
          audioStream={audioStream}
        />
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Reset Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleReset}
          disabled={!isRecording && elapsedTime === 0}
          className="w-12 h-12 rounded-full"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>

        {/* Main Record/Pause Button */}
        <Button
          size="lg"
          variant={getMainButtonVariant()}
          onClick={handleMainAction}
          className="w-16 h-16 rounded-full relative overflow-hidden"
        >
          {getMainButtonIcon()}
          {isRecording && !isPaused && (
            <div className="absolute inset-0 bg-red-500/20 animate-ping rounded-full" />
          )}
        </Button>

        {/* Stop Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleStop}
          disabled={!isRecording}
          className="w-12 h-12 rounded-full"
        >
          <Square className="w-4 h-4" />
        </Button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Audio Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleAudio}
          className="flex items-center gap-2"
        >
          {audioEnabled ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
          <span className="text-sm">
            Audio {audioEnabled ? 'On' : 'Off'}
          </span>
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full" />
            <p className="text-sm text-destructive font-medium">
              Recording Error
            </p>
          </div>
          <p className="text-sm text-destructive/80 mt-1">
            {error}
          </p>
        </div>
      )}

      {/* Recording Tips */}
      {!isRecording && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tips:</strong> Speak clearly and ensure good microphone access
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>• Click to start recording</span>
            <span>• Pause anytime during recording</span>
            <span>• Real-time transcription</span>
          </div>
        </div>
      )}
    </div>
  );
};