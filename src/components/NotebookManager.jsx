import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Folder, 
  FolderPlus, 
  FolderOpen, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Filter,
  Star,
  Archive
} from 'lucide-react';

const NotebookItem = ({ 
  notebook, 
  isSelected, 
  isExpanded, 
  onSelect, 
  onToggleExpand, 
  onEdit, 
  onDelete, 
  noteCount,
  level = 0 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(notebook.name);
  const [showActions, setShowActions] = useState(false);

  const handleSave = () => {
    if (editName.trim()) {
      onEdit(notebook.id, { name: editName.trim() });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(notebook.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div 
      className={`
        group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors
        ${isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}
      `}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Expand/Collapse Button */}
      {notebook.children && notebook.children.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(notebook.id);
          }}
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </Button>
      )}

      {/* Folder Icon */}
      <div className="flex-shrink-0">
        {isExpanded ? (
          <FolderOpen className="w-4 h-4 text-primary" />
        ) : (
          <Folder className="w-4 h-4 text-muted-foreground" />
        )}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0" onClick={() => onSelect(notebook)}>
        {isEditing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="h-6 text-sm"
            autoFocus
          />
        ) : (
          <span className="text-sm font-medium truncate">{notebook.name}</span>
        )}
      </div>

      {/* Note Count */}
      <Badge variant="secondary" className="text-xs">
        {noteCount}
      </Badge>

      {/* Actions */}
      {showActions && !isEditing && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Edit3 className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Delete notebook "${notebook.name}"?`)) {
                onDelete(notebook.id);
              }
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

const NotebookManager = ({ 
  notebooks = [], 
  selectedNotebook, 
  onNotebookSelect, 
  onNotebookCreate, 
  onNotebookEdit, 
  onNotebookDelete,
  notes = [],
  onFilterByNotebook 
}) => {
  const [expandedNotebooks, setExpandedNotebooks] = useState(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Default notebooks if none exist
  const defaultNotebooks = [
    { id: 'all', name: 'All Notes', isDefault: true },
    { id: 'starred', name: 'Starred', isDefault: true },
    { id: 'archived', name: 'Archived', isDefault: true },
    { id: 'recent', name: 'Recent', isDefault: true }
  ];

  const allNotebooks = [...defaultNotebooks, ...notebooks];

  const toggleExpand = (notebookId) => {
    const newExpanded = new Set(expandedNotebooks);
    if (newExpanded.has(notebookId)) {
      newExpanded.delete(notebookId);
    } else {
      newExpanded.add(notebookId);
    }
    setExpandedNotebooks(newExpanded);
  };

  const handleCreateNotebook = () => {
    if (newNotebookName.trim()) {
      onNotebookCreate({
        name: newNotebookName.trim(),
        color: '#3b82f6',
        description: ''
      });
      setNewNotebookName('');
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCreateNotebook();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewNotebookName('');
    }
  };

  const getNotebookNoteCount = (notebookId) => {
    switch (notebookId) {
      case 'all':
        return notes.length;
      case 'starred':
        return notes.filter(note => note.isStarred).length;
      case 'archived':
        return notes.filter(note => note.isArchived).length;
      case 'recent':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return notes.filter(note => new Date(note.updatedAt) > weekAgo).length;
      default:
        return notes.filter(note => note.notebookId === notebookId).length;
    }
  };

  const filteredNotebooks = allNotebooks.filter(notebook =>
    notebook.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderNotebook = (notebook, level = 0) => {
    const noteCount = getNotebookNoteCount(notebook.id);
    const isExpanded = expandedNotebooks.has(notebook.id);
    const isSelected = selectedNotebook?.id === notebook.id;

    return (
      <div key={notebook.id}>
        <NotebookItem
          notebook={notebook}
          isSelected={isSelected}
          isExpanded={isExpanded}
          onSelect={onNotebookSelect}
          onToggleExpand={toggleExpand}
          onEdit={onNotebookEdit}
          onDelete={onNotebookDelete}
          noteCount={noteCount}
          level={level}
        />
        
        {/* Render children if expanded */}
        {isExpanded && notebook.children && (
          <div className="ml-4">
            {notebook.children.map(child => renderNotebook(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Folder className="w-5 h-5" />
          Notebooks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notebooks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Create New Notebook */}
        {isCreating ? (
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Notebook name..."
              value={newNotebookName}
              onChange={(e) => setNewNotebookName(e.target.value)}
              onBlur={handleCreateNotebook}
              onKeyDown={handleKeyDown}
              className="flex-1"
              autoFocus
            />
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="w-full justify-start"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Notebook
          </Button>
        )}

        {/* Notebooks List */}
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {filteredNotebooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Folder className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No notebooks found</p>
            </div>
          ) : (
            filteredNotebooks.map(notebook => renderNotebook(notebook))
          )}
        </div>

        {/* Quick Actions */}
        <div className="border-t pt-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-2">Quick Filters</div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilterByNotebook('starred')}
              className="justify-start"
            >
              <Star className="w-3 h-3 mr-1" />
              Starred
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilterByNotebook('archived')}
              className="justify-start"
            >
              <Archive className="w-3 h-3 mr-1" />
              Archived
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="border-t pt-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Total Notes:</span>
              <span>{notes.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Notebooks:</span>
              <span>{notebooks.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Starred:</span>
              <span>{notes.filter(note => note.isStarred).length}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotebookManager;

