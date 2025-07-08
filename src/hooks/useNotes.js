import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'voice-notes-data';

export const useNotes = () => {
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'title', 'duration', 'wordCount'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTags, setSelectedTags] = useState([]);

  // Load notes from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setNotes(parsedData.notes || []);
      }
    } catch (error) {
      console.error('Error loading notes from localStorage:', error);
    }
  }, []);

  // Save notes to localStorage whenever notes change
  useEffect(() => {
    try {
      const dataToSave = {
        notes,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving notes to localStorage:', error);
    }
  }, [notes]);

  // Create a new note
  const createNote = useCallback((title = '', category = 'general') => {
    const newNote = {
      id: Date.now().toString(),
      title: title || `Meeting ${new Date().toLocaleDateString()}`,
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      duration: 0,
      wordCount: 0,
      language: 'en-US',
      isRecording: false,
      category: category,
      tags: [],
      priority: 'normal', // 'low', 'normal', 'high'
      isStarred: false,
      isArchived: false,
      metadata: {
        startTime: null,
        endTime: null,
        confidence: 0,
        speakers: [],
        location: '',
        attendees: []
      }
    };
    
    setNotes(prev => [newNote, ...prev]);
    setCurrentNote(newNote);
    return newNote;
  }, []);

  // Update a note
  const updateNote = useCallback((noteId, updates) => {
    setNotes(prev => prev.map(note => {
      if (note.id === noteId) {
        const updatedNote = {
          ...note,
          ...updates,
          updatedAt: new Date().toISOString(),
          wordCount: updates.content ? updates.content.split(/\s+/).filter(word => word.length > 0).length : note.wordCount
        };
        
        // Update current note if it's the one being updated
        setCurrentNote(prevCurrentNote => 
          prevCurrentNote && prevCurrentNote.id === noteId ? updatedNote : prevCurrentNote
        );
        
        return updatedNote;
      }
      return note;
    }));
  }, []);

  // Delete a note
  const deleteNote = useCallback((noteId) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    
    // Clear current note if it's the one being deleted
    if (currentNote && currentNote.id === noteId) {
      setCurrentNote(null);
    }
  }, [currentNote]);

  // Archive/unarchive a note
  const toggleArchiveNote = useCallback((noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, { isArchived: !note.isArchived });
    }
  }, [notes, updateNote]);

  // Star/unstar a note
  const toggleStarNote = useCallback((noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, { isStarred: !note.isStarred });
    }
  }, [notes, updateNote]);

  // Add tag to a note
  const addTagToNote = useCallback((noteId, tag) => {
    const note = notes.find(n => n.id === noteId);
    if (note && !note.tags.includes(tag)) {
      updateNote(noteId, { tags: [...note.tags, tag] });
    }
  }, [notes, updateNote]);

  // Remove tag from a note
  const removeTagFromNote = useCallback((noteId, tag) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      updateNote(noteId, { tags: note.tags.filter(t => t !== tag) });
    }
  }, [notes, updateNote]);

  // Start recording for a note
  const startRecording = useCallback((noteId) => {
    updateNote(noteId, {
      isRecording: true,
      metadata: {
        ...notes.find(n => n.id === noteId)?.metadata,
        startTime: new Date().toISOString()
      }
    });
  }, [updateNote, notes]);

  // Stop recording for a note
  const stopRecording = useCallback((noteId) => {
    const note = notes.find(n => n.id === noteId);
    if (note && note.metadata.startTime) {
      const startTime = new Date(note.metadata.startTime);
      const endTime = new Date();
      const duration = Math.floor((endTime - startTime) / 1000); // in seconds
      
      updateNote(noteId, {
        isRecording: false,
        duration: note.duration + duration,
        metadata: {
          ...note.metadata,
          endTime: endTime.toISOString()
        }
      });
    }
  }, [updateNote, notes]);

  // Append text to a note's content
  const appendToNote = useCallback((noteId, text) => {
    if (!text) return;
    
    setNotes(prev => prev.map(note => {
      if (note.id === noteId) {
        const newContent = (note.content ? note.content + ' ' : '') + text;
        const updatedNote = {
          ...note,
          content: newContent,
          updatedAt: new Date().toISOString(),
          wordCount: newContent.split(/\s+/).filter(Boolean).length
        };

        setCurrentNote(prevCurrentNote => 
          prevCurrentNote && prevCurrentNote.id === noteId ? updatedNote : prevCurrentNote
        );
        
        return updatedNote;
      }
      return note;
    }));
  }, []);

  // Get all unique categories
  const getCategories = useCallback(() => {
    const categories = [...new Set(notes.map(note => note.category))];
    return ['all', ...categories.sort()];
  }, [notes]);

  // Get all unique tags
  const getAllTags = useCallback(() => {
    const allTags = notes.flatMap(note => note.tags || []);
    return [...new Set(allTags)].sort();
  }, [notes]);

  // Filter and sort notes
  const filteredAndSortedNotes = useCallback(() => {
    let filtered = notes;
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply category filter
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(note => note.category === selectedCategory);
    }
    
    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note => 
        selectedTags.every(tag => note.tags.includes(tag))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'duration':
          aValue = a.duration;
          bValue = b.duration;
          break;
        case 'wordCount':
          aValue = a.wordCount;
          bValue = b.wordCount;
          break;
        case 'priority':
          const priorityOrder = { 'high': 3, 'normal': 2, 'low': 1 };
          aValue = priorityOrder[a.priority] || 2;
          bValue = priorityOrder[b.priority] || 2;
          break;
        case 'date':
        default:
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
      }
      
      // Always show starred notes first
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [notes, searchTerm, sortBy, sortOrder, selectedCategory, selectedTags]);

  // Export notes
  const exportNotes = useCallback((format = 'json') => {
    const dataToExport = {
      notes,
      exportedAt: new Date().toISOString(),
      totalNotes: notes.length,
      totalWords: notes.reduce((sum, note) => sum + note.wordCount, 0),
      categories: getCategories(),
      tags: getAllTags()
    };
    
    switch (format) {
      case 'json':
        return JSON.stringify(dataToExport, null, 2);
      case 'markdown':
        return notes.map(note => 
          `# ${note.title}\n\n` +
          `**Created:** ${new Date(note.createdAt).toLocaleString()}\n` +
          `**Category:** ${note.category}\n` +
          `**Tags:** ${note.tags.join(', ')}\n` +
          `**Duration:** ${Math.floor(note.duration / 60)}:${(note.duration % 60).toString().padStart(2, '0')}\n` +
          `**Words:** ${note.wordCount}\n` +
          `**Priority:** ${note.priority}\n\n` +
          `${note.content}\n\n---\n\n`
        ).join('');
      case 'txt':
        return notes.map(note => 
          `${note.title}\n` +
          `${new Date(note.createdAt).toLocaleString()}\n` +
          `Category: ${note.category} | Tags: ${note.tags.join(', ')}\n` +
          `${'-'.repeat(50)}\n` +
          `${note.content}\n\n`
        ).join('');
      default:
        return JSON.stringify(dataToExport, null, 2);
    }
  }, [notes, getCategories, getAllTags]);

  // Get statistics
  const getStats = useCallback(() => {
    const totalNotes = notes.length;
    const totalWords = notes.reduce((sum, note) => sum + note.wordCount, 0);
    const totalDuration = notes.reduce((sum, note) => sum + note.duration, 0);
    const averageWordsPerNote = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0;
    const averageDurationPerNote = totalNotes > 0 ? Math.round(totalDuration / totalNotes) : 0;
    const starredNotes = notes.filter(note => note.isStarred).length;
    const archivedNotes = notes.filter(note => note.isArchived).length;
    
    return {
      totalNotes,
      totalWords,
      totalDuration,
      averageWordsPerNote,
      averageDurationPerNote,
      starredNotes,
      archivedNotes,
      categories: getCategories().length - 1, // exclude 'all'
      totalTags: getAllTags().length,
      lastUpdated: notes.length > 0 ? notes[0].updatedAt : null
    };
  }, [notes, getCategories, getAllTags]);

  return {
    notes: filteredAndSortedNotes(),
    allNotes: notes,
    currentNote,
    searchTerm,
    sortBy,
    sortOrder,
    selectedCategory,
    selectedTags,
    createNote,
    updateNote,
    deleteNote,
    toggleArchiveNote,
    toggleStarNote,
    addTagToNote,
    removeTagFromNote,
    startRecording,
    stopRecording,
    appendToNote,
    setCurrentNote,
    setSearchTerm,
    setSortBy,
    setSortOrder,
    setSelectedCategory,
    setSelectedTags,
    getCategories,
    getAllTags,
    exportNotes,
    getStats
  };
};

