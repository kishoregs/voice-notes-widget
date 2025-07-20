import { useState, useEffect, useRef, useCallback } from 'react';

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const socketRef = useRef(null);
  const micStreamRef = useRef(null);

  const getToken = async () => {
    try {
      const response = await fetch('/api/assemblyai', { method: 'POST' });
      const data = await response.json();
      if (response.status !== 200) {
        throw new Error(data.error || 'Failed to fetch AssemblyAI token');
      }
      return data.token;
    } catch (err) {
      console.error('Error fetching AssemblyAI token:', err);
      setError('Failed to connect to speech service.');
      return null;
    }
  };

  const startListening = useCallback(async () => {
    if (isListening) return;

    setError(null);
    const token = await getToken();
    if (!token) return;

    try {
      socketRef.current = new WebSocket(`wss://streaming.assemblyai.com/v3/ws?token=${token}&sample_rate=44100&encoding=pcm_s16le`);

      socketRef.current.onopen = () => {
        console.log('WebSocket connected to AssemblyAI');
        setIsListening(true);
      };

      socketRef.current.onclose = () => {
        setIsListening(false);
      };

      socketRef.current.onmessage = (message) => {
        console.log('WebSocket message received:', message.data);
        const data = JSON.parse(message.data);
        console.log('Parsed data:', data);
        
        if (data.type === 'Turn') {
          if (data.end_of_turn && data.transcript) {
            console.log('Final transcript:', data.transcript);
            setTranscript(data.transcript);
            setInterimTranscript('');
          } else if (!data.end_of_turn && data.transcript) {
            console.log('Partial transcript:', data.transcript);
            setInterimTranscript(data.transcript);
          }
        }
      };

      socketRef.current.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Transcription error.');
        setIsListening(false);
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create Web Audio API context and processor
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Convert Float32Array to PCM16 (16-bit signed integers)
        const pcm16Buffer = new ArrayBuffer(inputData.length * 2);
        const pcm16View = new Int16Array(pcm16Buffer);
        
        for (let i = 0; i < inputData.length; i++) {
          // Convert from [-1, 1] float to [-32768, 32767] int16
          const sample = Math.max(-1, Math.min(1, inputData[i]));
          pcm16View[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
        
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(pcm16Buffer);
        } else {
          console.log('WebSocket not ready, state:', socketRef.current?.readyState);
        }
      };
      
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      // Store references for cleanup
      micStreamRef.current = {
        stream,
        audioContext,
        source,
        processor,
        stop: () => {
          processor.disconnect();
          source.disconnect();
          audioContext.close();
          stream.getTracks().forEach(track => track.stop());
        }
      };

    } catch (err) {
      console.error('Error starting transcription:', err);
      setError('Failed to start transcription.');
      setIsListening(false);
    }
  }, [isListening]);

  const stopListening = useCallback(async () => {
    if (!isListening || !socketRef.current) return;

    if (micStreamRef.current) {
      micStreamRef.current.stop();
      micStreamRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsListening(false);
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    fullTranscript: transcript + interimTranscript,
  };
};