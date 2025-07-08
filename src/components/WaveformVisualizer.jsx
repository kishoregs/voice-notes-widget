import { useEffect, useRef, useState } from 'react';

export const WaveformVisualizer = ({ isListening, audioStream }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const [audioContext, setAudioContext] = useState(null);

  useEffect(() => {
    if (isListening && audioStream) {
      initializeAudioContext();
    } else {
      cleanup();
    }

    return cleanup;
  }, [isListening, audioStream]);

  const initializeAudioContext = async () => {
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = context.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      const source = context.createMediaStreamSource(audioStream);
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      setAudioContext(context);
      
      startVisualization();
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  };

  const startVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas || !analyserRef.current || !dataArrayRef.current) return;

    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    const draw = () => {
      if (!isListening) return;
      
      analyser.getByteFrequencyData(dataArray);
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)'); // blue-500
      gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.8)'); // purple-500
      gradient.addColorStop(1, 'rgba(236, 72, 153, 0.8)'); // pink-500
      
      ctx.fillStyle = gradient;
      
      const barWidth = width / dataArray.length;
      let x = 0;
      
      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.8;
        
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
      
      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();
  };

  const cleanup = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close();
      setAudioContext(null);
    }
  };

  // Fallback visualization for when no audio stream is available
  const drawFallbackVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    if (isListening) {
      // Animated bars for listening state
      const time = Date.now() * 0.005;
      const barCount = 32;
      const barWidth = width / barCount;
      
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.6)');
      gradient.addColorStop(1, 'rgba(147, 51, 234, 0.6)');
      
      ctx.fillStyle = gradient;
      
      for (let i = 0; i < barCount; i++) {
        const barHeight = (Math.sin(time + i * 0.5) * 0.5 + 0.5) * height * 0.6 + 10;
        const x = i * barWidth;
        
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
      }
    }
  };

  useEffect(() => {
    if (!audioStream && isListening) {
      // Use fallback visualization
      const interval = setInterval(drawFallbackVisualization, 50);
      return () => clearInterval(interval);
    }
  }, [isListening, audioStream]);

  return (
    <div className="w-full h-16 bg-muted/20 rounded-lg overflow-hidden border">
      <canvas
        ref={canvasRef}
        width={400}
        height={64}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      {!isListening && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Audio visualization</span>
        </div>
      )}
    </div>
  );
};

