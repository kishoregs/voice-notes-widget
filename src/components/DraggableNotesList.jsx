import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  GripVertical, 
  Star, 
  Archive, 
  Trash2, 
  MoreHorizontal,
  Calendar,
  Clock,
  FileText
} from 'lucide-react';

const DraggableNoteItem = ({ 
  note, 
  isSelected, 
  onSelect, 
  onDelete, 
  onToggleStar, 
  onToggleArchive,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragging,
  dragOverIndex
}) => {
  const [showActions, setShowActions] = useState(false);
  const dragRef = useRef(null);

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', dragRef.current.outerHTML);
    e.dataTransfer.setData('text/plain', note.id);
    onDragStart(note.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(note.id);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    onDrop(draggedId, note.id);
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

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        group relative p-3 rounded-lg border transition-all duration-200 cursor-pointer
        ${isSelected ? 'bg-primary/10 border-primary' : 'bg-card hover:bg-muted/50'}
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${dragOverIndex !== null ? 'border-primary border-dashed' : ''}
      `}
      onClick={() => onSelect(note)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Drag Handle */}
      <div className={`
        absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity
        ${isDragging ? 'opacity-100' : ''}
      `}>
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      </div>

      {/* Note Content */}
      <div className="ml-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className={`
              font-medium truncate text-sm
              ${isSelected ? 'text-primary' : 'text-foreground'}
            `}>
              {note.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(note.updatedAt)}
              </span>
              {note.duration > 0 && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDuration(note.duration)}
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`
            flex items-center gap-1 transition-opacity
            ${showActions || isSelected ? 'opacity-100' : 'opacity-0'}
          `}>
            {note.isStarred && (
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
            )}
            {note.isArchived && (
              <Archive className="w-3 h-3 text-muted-foreground" />
            )}
            {note.isRecording && (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        {/* Preview */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {note.content ? 
            note.content.replace(/<[^>]*>/g, '').substring(0, 100) + 
            (note.content.length > 100 ? '...' : '') 
            : 'No content yet...'
          }
        </p>

        {/* Tags and Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {note.tags && note.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
            {note.tags && note.tags.length > 2 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{note.tags.length - 2}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {note.wordCount}
            </span>
          </div>
        </div>

        {/* Action Menu */}
        {showActions && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-background border rounded-md shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(note.id);
              }}
            >
              <Star className={`w-3 h-3 ${note.isStarred ? 'text-yellow-500 fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggleArchive(note.id);
              }}
            >
              <Archive className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this note?')) {
                  onDelete(note.id);
                }
              }}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const DraggableNotesList = ({ 
  notes, 
  currentNote, 
  onNoteSelect, 
  onNoteDelete, 
  onToggleStar, 
  onToggleArchive,
  onReorderNotes 
}) => {
  const [draggedId, setDraggedId] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (noteId) => {
    setDraggedId(noteId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (noteId) => {
    if (draggedId && draggedId !== noteId) {
      const draggedIndex = notes.findIndex(note => note.id === draggedId);
      const targetIndex = notes.findIndex(note => note.id === noteId);
      setDragOverIndex(targetIndex);
    }
  };

  const handleDrop = (draggedId, targetId) => {
    if (draggedId === targetId) return;
    
    const draggedIndex = notes.findIndex(note => note.id === draggedId);
    const targetIndex = notes.findIndex(note => note.id === targetId);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const newNotes = [...notes];
      const [draggedNote] = newNotes.splice(draggedIndex, 1);
      newNotes.splice(targetIndex, 0, draggedNote);
      
      onReorderNotes(newNotes);
    }
    
    setDraggedId(null);
    setDragOverIndex(null);
  };

  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-8 h-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No notes yet</p>
        <p className="text-xs">Create your first note to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note, index) => (
        <DraggableNoteItem
          key={note.id}
          note={note}
          isSelected={currentNote?.id === note.id}
          onSelect={onNoteSelect}
          onDelete={onNoteDelete}
          onToggleStar={onToggleStar}
          onToggleArchive={onToggleArchive}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          isDragging={draggedId === note.id}
          dragOverIndex={dragOverIndex === index ? index : null}
        />
      ))}
    </div>
  );
};

export default DraggableNotesList;

