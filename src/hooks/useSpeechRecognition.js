import { useState, useEffect, useRef, useCallback } from 'react';

// Check for browser support
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

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
  const interimLengthRef = useRef(0);
  const lastPushTimeRef = useRef(Date.now());
  const autoPushCallbackRef = useRef(null);

  // Set auto-push callback
  const setAutoPushCallback = useCallback((callback) => {
    autoPushCallbackRef.current = callback;
  }, []);

  // Auto-push logic for long interim transcripts
  const checkAndPushInterim = useCallback(() => {
    const currentTime = Date.now();
    const timeSinceLastPush = currentTime - lastPushTimeRef.current;
    
    // Push if interim transcript is long (>200 chars) or if it's been 10 seconds since last push
    if (interimTranscript && 
        ((interimTranscript.length > 200) || 
         (interimTranscript.length > 50 && timeSinceLastPush > 10000))) {
      
      if (autoPushCallbackRef.current) {
        autoPushCallbackRef.current(interimTranscript);
        lastPushTimeRef.current = currentTime;
        
        // Clear interim transcript after pushing
        setInterimTranscript('');
        
        // Add to final transcript
        finalTranscriptRef.current += interimTranscript + ' ';
        setTranscript(finalTranscriptRef.current.trim());
      }
    }
  }, [interimTranscript]);

  // Check for auto-push when interim transcript changes
  useEffect(() => {
    if (isListening && interimTranscript) {
      checkAndPushInterim();
    }
  }, [interimTranscript, isListening, checkAndPushInterim]);

  // Initialize speech recognition
  useEffect(() => {
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;
      
      // Handle results
      recognition.onresult = (event) => {
        let newInterimTranscript = '';
        let finalSegment = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptPart = result[0].transcript;

          if (result.isFinal) {
            finalSegment += transcriptPart + ' ';
            setConfidence(result[0].confidence);
          } else {
            newInterimTranscript += transcriptPart;
          }
        }

        if (finalSegment) {
          setLatestFinalSegment(finalSegment.trim());
          // Update the full transcript by appending the new final segment
          finalTranscriptRef.current += finalSegment;
          setTranscript(finalTranscriptRef.current.trim());
        }
        
        setInterimTranscript(newInterimTranscript);
      };

      // Handle errors
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error, event);
        setError(event.error);

        // Auto-restart on certain errors
        if (event.error === "no-speech" || event.error === "audio-capture" || event.error === "not-allowed") {
          console.warn("Attempting to restart speech recognition due to error:", event.error);
          setTimeout(() => {
            if (isListening) {
              startListening();
            }
          }, 1000);
        }
      };
      
      // Handle end event
      recognition.onend = () => {
        if (isListening) {
          // Auto-restart if we're supposed to be listening
          setTimeout(() => {
            if (isListening) {
              recognition.start();
            }
          }, 100);
        }
      };
      
      // Handle start event
      recognition.onstart = () => {
        setError(null);
      };
      
      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition not supported');
      return;
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        setIsListening(true);
        setError(null);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Failed to start speech recognition');
        setIsListening(false);
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  }, [isListening]);

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
    
    // Restart if we were listening
    if (wasListening) {
      setTimeout(() => {
        startListening();
      }, 100);
    }
  }, [isListening, stopListening, startListening]);

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
    fullTranscript: transcript + interimTranscript
  };
};

