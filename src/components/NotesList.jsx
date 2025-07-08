import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Clock, 
  FileText, 
  Calendar,
  Filter,
  SortAsc,
  SortDesc,
  MoreVertical,
  Download,
  Copy
} from 'lucide-react';

export const NotesList = ({
  notes,
  currentNote,
  searchTerm,
  onSearchChange,
  onNoteSelect,
  onNoteCreate,
  onNoteDelete,
  onNoteUpdate,
  sortBy,
  sortOrder,
  onSortChange,
  onExport
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString();
  };

  const handleEditStart = (note) => {
    setEditingId(note.id);
    setEditTitle(note.title);
  };

  const handleEditSave = (noteId) => {
    onNoteUpdate(noteId, { title: editTitle });
    setEditingId(null);
    setEditTitle('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyPress = (e, noteId) => {
    if (e.key === 'Enter') {
      handleEditSave(noteId);
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const copyNoteContent = async (note) => {
    try {
      await navigator.clipboard.writeText(note.content);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy note content:', error);
    }
  };

  const exportSingleNote = (note, format = 'markdown') => {
    let content = '';
    
    switch (format) {
      case 'markdown':
        content = `# ${note.title}\n\n` +
                 `**Created:** ${new Date(note.createdAt).toLocaleString()}\n` +
                 `**Duration:** ${formatTime(note.duration)}\n` +
                 `**Words:** ${note.wordCount}\n\n` +
                 `${note.content}`;
        break;
      case 'txt':
        content = `${note.title}\n` +
                 `${new Date(note.createdAt).toLocaleString()}\n` +
                 `${'-'.repeat(50)}\n` +
                 `${note.content}`;
        break;
      default:
        content = JSON.stringify(note, null, 2);
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSortIcon = () => {
    return sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />;
  };

  const sortOptions = [
    { value: 'date', label: 'Date Modified' },
    { value: 'title', label: 'Title' },
    { value: 'duration', label: 'Duration' },
    { value: 'wordCount', label: 'Word Count' }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Notes ({notes.length})</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={onNoteCreate}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {showFilters && (
          <div className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg">
            <span className="text-sm font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value, sortOrder)}
              className="px-2 py-1 text-sm border rounded bg-background"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {getSortIcon()}
            </Button>
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {notes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchTerm ? 'No notes match your search' : 'No notes yet'}
              </p>
              {!searchTerm && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onNoteCreate}
                  className="mt-3"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first note
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card
              key={note.id}
              className={`cursor-pointer transition-all hover:shadow-md group ${
                currentNote?.id === note.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/30'
              }`}
              onClick={() => onNoteSelect(note)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {editingId === note.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, note.id)}
                        onBlur={() => handleEditSave(note.id)}
                        className="font-medium mb-2"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h4 className="font-medium text-sm truncate mb-1 group-hover:text-primary transition-colors">
                        {note.title}
                      </h4>
                    )}
                    
                    <p className="text-xs text-muted-foreground mb-2">
                      {formatDate(note.updatedAt)}
                    </p>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(note.duration)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {note.wordCount} words
                      </Badge>
                      {note.isRecording && (
                        <Badge variant="destructive" className="text-xs animate-pulse">
                          Recording
                        </Badge>
                      )}
                    </div>
                    
                    {note.content && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {note.content.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditStart(note);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyNoteContent(note);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        exportSingleNote(note, 'markdown');
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNoteDelete(note.id);
                      }}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Bulk Actions */}
      {notes.length > 0 && (
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-xs text-muted-foreground">
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('markdown')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      )}
    </div>
  );
};

