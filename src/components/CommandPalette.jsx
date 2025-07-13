import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { 
  Search,
  FileText,
  Mic,
  Download,
  Moon,
  Sun,
  Settings,
  Archive,
  Star,
  Trash2,
  Copy,
  Plus,
  FolderPlus,
  Tag,
  Calendar,
  Clock,
  Filter
} from 'lucide-react';

const CommandPalette = ({ 
  isOpen, 
  onClose, 
  onCreateNote, 
  onStartRecording, 
  onToggleDarkMode, 
  onExportNotes,
  onToggleArchive,
  onToggleStar,
  onDeleteNote,
  currentNote,
  darkMode 
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const commands = [
    {
      id: 'new-note',
      title: 'Create New Note',
      description: 'Start a new note',
      icon: FileText,
      action: () => {
        onCreateNote();
        onClose();
      },
      keywords: ['new', 'create', 'note', 'add']
    },
    {
      id: 'start-recording',
      title: 'Start Recording',
      description: 'Begin voice transcription',
      icon: Mic,
      action: () => {
        onStartRecording();
        onClose();
      },
      keywords: ['record', 'voice', 'transcribe', 'mic', 'start']
    },
    {
      id: 'toggle-theme',
      title: `Switch to ${darkMode ? 'Light' : 'Dark'} Mode`,
      description: 'Toggle between light and dark themes',
      icon: darkMode ? Sun : Moon,
      action: () => {
        onToggleDarkMode();
        onClose();
      },
      keywords: ['theme', 'dark', 'light', 'mode', 'toggle']
    },
    {
      id: 'export-notes',
      title: 'Export All Notes',
      description: 'Download notes in various formats',
      icon: Download,
      action: () => {
        onExportNotes('json');
        onClose();
      },
      keywords: ['export', 'download', 'save', 'backup']
    },
    ...(currentNote ? [
      {
        id: 'star-note',
        title: currentNote.isStarred ? 'Unstar Note' : 'Star Note',
        description: 'Toggle star status of current note',
        icon: Star,
        action: () => {
          onToggleStar(currentNote.id);
          onClose();
        },
        keywords: ['star', 'favorite', 'important']
      },
      {
        id: 'archive-note',
        title: currentNote.isArchived ? 'Unarchive Note' : 'Archive Note',
        description: 'Toggle archive status of current note',
        icon: Archive,
        action: () => {
          onToggleArchive(currentNote.id);
          onClose();
        },
        keywords: ['archive', 'hide', 'store']
      },
      {
        id: 'delete-note',
        title: 'Delete Note',
        description: 'Permanently delete current note',
        icon: Trash2,
        action: () => {
          if (confirm('Are you sure you want to delete this note?')) {
            onDeleteNote(currentNote.id);
            onClose();
          }
        },
        keywords: ['delete', 'remove', 'trash']
      },
      {
        id: 'copy-note',
        title: 'Copy Note Content',
        description: 'Copy note content to clipboard',
        icon: Copy,
        action: () => {
          navigator.clipboard.writeText(currentNote.content.replace(/<[^>]*>/g, ''));
          onClose();
        },
        keywords: ['copy', 'clipboard', 'content']
      }
    ] : []),
    {
      id: 'new-folder',
      title: 'Create New Folder',
      description: 'Organize notes in folders',
      icon: FolderPlus,
      action: () => {
        // TODO: Implement folder creation
        onClose();
      },
      keywords: ['folder', 'organize', 'category']
    },
    {
      id: 'add-tag',
      title: 'Add Tag',
      description: 'Tag current note',
      icon: Tag,
      action: () => {
        // TODO: Implement tag addition
        onClose();
      },
      keywords: ['tag', 'label', 'organize']
    }
  ];

  const filteredCommands = commands.filter(command => {
    if (!query) return true;
    const searchTerm = query.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchTerm) ||
      command.description.toLowerCase().includes(searchTerm) ||
      command.keywords.some(keyword => keyword.includes(searchTerm))
    );
  });

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]">
      <div className="bg-background border rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[60vh] overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="border-none focus-visible:ring-0 text-lg"
          />
          <kbd className="px-2 py-1 text-xs bg-muted rounded">ESC</kbd>
        </div>

        {/* Commands List */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No commands found for "{query}"</p>
            </div>
          ) : (
            filteredCommands.map((command, index) => {
              const Icon = command.icon;
              const isSelected = index === selectedIndex;
              
              return (
                <button
                  key={command.id}
                  onClick={command.action}
                  className={`
                    w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors
                    ${isSelected ? 'bg-muted' : ''}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{command.title}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {command.description}
                    </div>
                  </div>
                  {isSelected && (
                    <kbd className="px-2 py-1 text-xs bg-background border rounded">
                      ↵
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-3 bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded">ESC</kbd>
                Close
              </span>
            </div>
            <span>{filteredCommands.length} commands</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;

