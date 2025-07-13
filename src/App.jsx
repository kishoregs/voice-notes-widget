import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { 
  Mic, 
  FileText,
  Settings,
  Moon,
  Sun,
  Sidebar,
  X
} from 'lucide-react';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useNotes } from './hooks/useNotes';
import { RecordingControls } from './components/RecordingControls';
import { NotesList } from './components/NotesList';
import RichTextEditor from './components/RichTextEditor';
import CommandPalette from './components/CommandPalette';
import './App.css';

function App() {
  const {
    isListening,
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
  } = useSpeechRecognition();

  const {
    notes,
    currentNote,
    searchTerm,
    sortBy,
    sortOrder,
    createNote,
    updateNote,
    deleteNote,
    startRecording,
    stopRecording,
    appendToNote,
    setCurrentNote,
    setSearchTerm,
    setSortBy,
    setSortOrder,
    exportNotes,
    getStats,
    toggleArchiveNote,
    toggleStarNote
  } = useNotes();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      return storedTheme === 'dark';
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [lastProcessedSegment, setLastProcessedSegment] = useState('');

  // Update elapsed time during recording
  useEffect(() => {
    let interval;
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - recordingStartTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingStartTime]);

  // Append the latest final transcript segment to the current note
  useEffect(() => {
    if (latestFinalSegment && latestFinalSegment !== lastProcessedSegment && currentNote) {
      appendToNote(currentNote.id, latestFinalSegment);
      setLastProcessedSegment(latestFinalSegment);
    }
  }, [latestFinalSegment, currentNote, appendToNote, lastProcessedSegment]);

  // Apply dark mode and store preference
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [darkMode]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Command palette shortcut (Ctrl/Cmd + K)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      
      // Quick new note (Ctrl/Cmd + N)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewNote();
      }
      
      // Quick start recording (Ctrl/Cmd + R)
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        if (!isRecording) {
          handleStartRecording();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRecording]);

  const handleStartRecording = () => {
    if (!currentNote) {
      const newNote = createNote();
      setCurrentNote(newNote);
    }
    
    setIsRecording(true);
    setRecordingStartTime(Date.now());
    setElapsedTime(0);
    resetTranscript();
    startListening();
    
    if (currentNote) {
      startRecording(currentNote.id);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setRecordingStartTime(null);
    stopListening();
    
    if (currentNote) {
      stopRecording(currentNote.id);
    }
  };

  const handlePauseRecording = () => {
    stopListening();
  };

  const handleResumeRecording = () => {
    startListening();
  };

  const handleReset = () => {
    resetTranscript();
    setElapsedTime(0);
    if (currentNote) {
      updateNote(currentNote.id, { content: '' });
    }
  };

  const handleNewNote = () => {
    const newNote = createNote();
    setCurrentNote(newNote);
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  const stats = getStats();

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-destructive">
              Speech Recognition Not Supported
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">Chrome ✓</Badge>
              <Badge variant="outline">Edge ✓</Badge>
              <Badge variant="outline">Safari ✓</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden"
              >
                {showSidebar ? <X className="w-4 h-4" /> : <Sidebar className="w-4 h-4" />}
              </Button>
              
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Voice Notes
                </h1>
                <p className="text-sm text-muted-foreground">AI-Powered Meeting Transcription</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex">
                {stats.totalNotes} Notes
              </Badge>
              <Badge variant="outline" className="hidden sm:flex">
                {stats.totalWords} Words
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidebar(!showSidebar)}
                className="hidden lg:flex"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Notes Sidebar */}
          {showSidebar && (
            <div className="lg:col-span-1">
              <Card className="h-fit">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">My Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <NotesList
                    notes={notes}
                    currentNote={currentNote}
                    searchTerm={searchTerm}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSearchChange={setSearchTerm}
                    onNoteSelect={setCurrentNote}
                    onNoteCreate={handleNewNote}
                    onNoteDelete={deleteNote}
                    onNoteUpdate={updateNote}
                    onSortChange={handleSortChange}
                    onExport={exportNotes}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content */}
          <div className={showSidebar ? "lg:col-span-3" : "lg:col-span-4"}>
            <div className="space-y-6">
              {/* Recording Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full transition-colors ${
                      isRecording ? 'bg-red-500 animate-pulse' : 'bg-muted'
                    }`} />
                    Recording Studio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RecordingControls
                    isRecording={isRecording}
                    isListening={isListening}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                    onPauseRecording={handlePauseRecording}
                    onResumeRecording={handleResumeRecording}
                    onReset={handleReset}
                    elapsedTime={elapsedTime}
                    confidence={confidence}
                    error={error}
                    audioEnabled={audioEnabled}
                    onToggleAudio={() => setAudioEnabled(!audioEnabled)}
                    language={language}
                    onLanguageChange={changeLanguage}
                  />
                </CardContent>
              </Card>

              {/* Current Note Editor */}
              {currentNote ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Input
                        value={currentNote.title}
                        onChange={(e) => updateNote(currentNote.id, { title: e.target.value })}
                        className="text-lg font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                        placeholder="Note title..."
                      />
                      {currentNote.isRecording && (
                        <Badge variant="destructive" className="animate-pulse">
                          Recording
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <RichTextEditor
                        content={currentNote.content}
                        onChange={(content) => updateNote(currentNote.id, { content })}
                        placeholder="Your transcription will appear here as you speak..."
                        className="min-h-[300px]"
                      />
                      
                      {interimTranscript && (
                        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-l-4 border-primary">
                          <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            Live transcription:
                          </div>
                          <p className="text-sm italic text-primary">{interimTranscript}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground pt-4 border-t">
                        <div className="flex items-center gap-4">
                          <span>{currentNote.wordCount} words</span>
                          <span>{Math.floor(currentNote.duration / 60)}:{(currentNote.duration % 60).toString().padStart(2, '0')} recorded</span>
                          <span>Updated {new Date(currentNote.updatedAt).toLocaleTimeString()}</span>
                        </div>
                        <Badge variant="outline">
                          Auto-saved
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Welcome Screen */
                <Card>
                  <CardContent className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                      <Mic className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Welcome to Voice Notes</h3>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Transform your meetings, lectures, and conversations into organized, searchable notes with real-time AI transcription.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button onClick={handleNewNote} size="lg">
                        <FileText className="w-4 h-4 mr-2" />
                        Create Your First Note
                      </Button>
                      <Button variant="outline" size="lg" onClick={handleStartRecording}>
                        <Mic className="w-4 h-4 mr-2" />
                        Start Recording
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-sm">
                      <div className="text-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Mic className="w-4 h-4 text-primary" />
                        </div>
                        <p className="font-medium">Real-time Transcription</p>
                        <p className="text-muted-foreground">Instant speech-to-text conversion</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <p className="font-medium">Smart Organization</p>
                        <p className="text-muted-foreground">Search and organize your notes</p>
                      </div>
                      <div className="text-center">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg mx-auto mb-2 flex items-center justify-center">
                          <Settings className="w-4 h-4 text-primary" />
                        </div>
                        <p className="font-medium">Export & Share</p>
                        <p className="text-muted-foreground">Multiple export formats</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onCreateNote={handleNewNote}
        onStartRecording={handleStartRecording}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onExportNotes={exportNotes}
        onToggleArchive={toggleArchiveNote}
        onToggleStar={toggleStarNote}
        onDeleteNote={deleteNote}
        currentNote={currentNote}
        darkMode={darkMode}
      />
    </div>
  );
}

export default App;

