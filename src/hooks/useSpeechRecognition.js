import { useState, useEffect, useRef, useCallback } from 'react';

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [latestFinalSegment, setLatestFinalSegment] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [language, setLanguage] = useState('en-US');
  
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const autoPushCallbackRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const isRestartingRef = useRef(false);
  const lastResultTimeRef = useRef(Date.now());
  const consecutiveErrorsRef = useRef(0);
  const maxConsecutiveErrors = 5;
  const restartDelayRef = useRef(1000); // Start with 1 second, exponential backoff
  const sessionStartTimeRef = useRef(null);
  const forceRestartIntervalRef = useRef(null);

  // Set auto-push callback
  const setAutoPushCallback = useCallback((callback) => {
    autoPushCallbackRef.current = callback;
  }, []);

  // Robust restart mechanism with exponential backoff
  const restartRecognition = useCallback(() => {
    if (isRestartingRef.current || !isListening) return;
    
    isRestartingRef.current = true;
    
    // Stop current recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn('Error aborting recognition:', e);
      }
    }

    // Clear any existing restart timeout
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(restartDelayRef.current, 10000); // Max 10 seconds
    
    restartTimeoutRef.current = setTimeout(() => {
      if (isListening) {
        try {
          initializeRecognition();
          recognitionRef.current?.start();
          consecutiveErrorsRef.current = 0;
          restartDelayRef.current = 1000; // Reset delay on success
        } catch (e) {
          console.error('Error restarting recognition:', e);
          consecutiveErrorsRef.current++;
          restartDelayRef.current *= 2; // Exponential backoff
          
          if (consecutiveErrorsRef.current < maxConsecutiveErrors) {
            restartRecognition(); // Try again
          } else {
            setError('Speech recognition failed after multiple attempts');
            setIsListening(false);
          }
        }
      }
      isRestartingRef.current = false;
    }, delay);
  }, [isListening]);

  // Initialize speech recognition with robust error handling
  const initializeRecognition = useCallback(() => {
    if (!SpeechRecognition) {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
      return null;
    }

    const recognition = new SpeechRecognition();
    
    // Optimal settings for continuous recording
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;
    
    // Handle results with chunked processing
    recognition.onresult = (event) => {
      lastResultTimeRef.current = Date.now();
      let newInterimTranscript = '';
      let finalSegment = '';

      // Process all results from the last processed index
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPart = result[0].transcript;

        if (result.isFinal) {
          finalSegment += transcriptPart + ' ';
          setConfidence(result[0].confidence || 0.8);
          
          // Auto-push final segments immediately
          if (autoPushCallbackRef.current && transcriptPart.trim()) {
            autoPushCallbackRef.current(transcriptPart.trim());
          }
        } else {
          newInterimTranscript += transcriptPart;
        }
      }

      // Update state
      if (finalSegment.trim()) {
        const cleanSegment = finalSegment.trim();
        setLatestFinalSegment(cleanSegment);
        finalTranscriptRef.current += cleanSegment + ' ';
        setTranscript(finalTranscriptRef.current.trim());
      }
      
      setInterimTranscript(newInterimTranscript);

      // Auto-push long interim transcripts
      if (newInterimTranscript.length > 150 && autoPushCallbackRef.current) {
        autoPushCallbackRef.current(newInterimTranscript);
        setInterimTranscript(''); // Clear after pushing
      }
    };

    // Comprehensive error handling
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error, event);
      
      const errorType = event.error;
      consecutiveErrorsRef.current++;
      
      switch (errorType) {
        case 'no-speech':
          // Don't treat no-speech as a real error, just restart
          if (isListening) {
            setTimeout(() => restartRecognition(), 500);
          }
          break;
          
        case 'audio-capture':
          setError('Microphone access denied or unavailable');
          setIsListening(false);
          break;
          
        case 'not-allowed':
          setError('Microphone permission denied');
          setIsListening(false);
          break;
          
        case 'network':
          setError('Network error - check your connection');
          if (consecutiveErrorsRef.current < maxConsecutiveErrors) {
            setTimeout(() => restartRecognition(), 2000);
          } else {
            setIsListening(false);
          }
          break;
          
        case 'service-not-allowed':
          setError('Speech recognition service not allowed');
          setIsListening(false);
          break;
          
        case 'language-not-supported':
          setError(`Language ${language} not supported`);
          setIsListening(false);
          break;
          
        default:
          if (consecutiveErrorsRef.current < maxConsecutiveErrors && isListening) {
            setTimeout(() => restartRecognition(), 1000);
          } else {
            setError(`Speech recognition error: ${errorType}`);
            setIsListening(false);
          }
      }
    };
    
    // Handle end event with immediate restart
    recognition.onend = () => {
      if (isListening && !isRestartingRef.current) {
        // Immediate restart for seamless recording
        setTimeout(() => {
          if (isListening) {
            restartRecognition();
          }
        }, 100);
      }
    };
    
    // Handle start event
    recognition.onstart = () => {
      setError(null);
      consecutiveErrorsRef.current = 0;
      lastResultTimeRef.current = Date.now();
    };
    
    recognitionRef.current = recognition;
    return recognition;
  }, [language, isListening, restartRecognition]);

  // Monitor for stalled recognition and force restart
  useEffect(() => {
    if (isListening) {
      const monitorInterval = setInterval(() => {
        const timeSinceLastResult = Date.now() - lastResultTimeRef.current;
        
        // Force restart if no results for 30 seconds
        if (timeSinceLastResult > 30000 && !isRestartingRef.current) {
          console.warn('No speech results for 30 seconds, forcing restart');
          restartRecognition();
        }
      }, 5000);

      return () => clearInterval(monitorInterval);
    }
  }, [isListening, restartRecognition]);

  // Force restart every 4 minutes to prevent browser timeouts
  useEffect(() => {
    if (isListening) {
      sessionStartTimeRef.current = Date.now();
      
      forceRestartIntervalRef.current = setInterval(() => {
        if (isListening && !isRestartingRef.current) {
          console.log('Preventive restart after 4 minutes');
          restartRecognition();
        }
      }, 240000); // 4 minutes

      return () => {
        if (forceRestartIntervalRef.current) {
          clearInterval(forceRestartIntervalRef.current);
        }
      };
    }
  }, [isListening, restartRecognition]);

  // Initialize on mount
  useEffect(() => {
    setIsSupported(!!SpeechRecognition);
    if (SpeechRecognition) {
      initializeRecognition();
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (forceRestartIntervalRef.current) {
        clearInterval(forceRestartIntervalRef.current);
      }
    };
  }, [initializeRecognition]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition not supported');
      return;
    }
    
    if (!isListening) {
      setIsListening(true);
      setError(null);
      consecutiveErrorsRef.current = 0;
      restartDelayRef.current = 1000;
      
      try {
        if (!recognitionRef.current) {
          initializeRecognition();
        }
        recognitionRef.current?.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Failed to start speech recognition');
        setIsListening(false);
      }
    }
  }, [isSupported, isListening, initializeRecognition]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    isRestartingRef.current = false;
    
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    if (forceRestartIntervalRef.current) {
      clearInterval(forceRestartIntervalRef.current);
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setLatestFinalSegment('');
    finalTranscriptRef.current = '';
    setConfidence(0);
  }, []);

  const changeLanguage = useCallback((newLanguage) => {
    const wasListening = isListening;
    if (wasListening) {
      stopListening();
    }
    
    setLanguage(newLanguage);
    
    // Reinitialize with new language
    setTimeout(() => {
      initializeRecognition();
      if (wasListening) {
        startListening();
      }
    }, 100);
  }, [isListening, stopListening, startListening, initializeRecognition]);

  return {
    isListening,
    transcript,
    interimTranscript,
    latestFinalSegment,
    error,
    isSupported,
    confidence,
    language,
    startListening,
    stopListening,
    resetTranscript,
    changeLanguage,
    setAutoPushCallback,
    // Combined transcript for display
    fullTranscript: transcript + (interimTranscript ? ' ' + interimTranscript : '')
  };
};

