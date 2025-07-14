import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Quote, 
  Heading1, 
  Heading2, 
  Heading3,
  Link,
  Code,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

const RichTextEditor = ({ 
  content = '', 
  onChange, 
  placeholder = 'Start typing...', 
  className = '',
  autoFocus = false,
  isAppending = false
}) => {
  const editorRef = useRef(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [currentFormat, setCurrentFormat] = useState({
    bold: false,
    italic: false,
    underline: false
  });

  // Initialize editor content, with logic to prevent flickering on append
  useEffect(() => {
    if (!editorRef.current) return;

    const currentContent = editorRef.current.innerHTML;
    const newContent = content || '';

    if (isAppending && newContent.startsWith(currentContent)) {
      const diff = newContent.substring(currentContent.length);
      editorRef.current.focus();
      document.execCommand('insertHTML', false, diff);
    } else if (newContent !== currentContent) {
      editorRef.current.innerHTML = newContent;
    }
  }, [content, isAppending]);

  // Auto focus if needed
  useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus();
    }
  }, [autoFocus]);

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      const newContent = editorRef.current.innerHTML;
      onChange(newContent);
    }
  }, [onChange]);

  // Handle selection change to update format state
  const handleSelectionChange = useCallback(() => {
    if (!isEditorFocused) return;
    
    setCurrentFormat({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline')
    });
  }, [isEditorFocused]);

  // Execute formatting command
  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleSelectionChange();
    handleInput();
  }, [handleSelectionChange, handleInput]);

  // Format text
  const formatText = useCallback((format) => {
    execCommand(format);
  }, [execCommand]);

  // Insert heading
  const insertHeading = useCallback((level) => {
    execCommand('formatBlock', `h${level}`);
  }, [execCommand]);

  // Insert list
  const insertList = useCallback((ordered = false) => {
    execCommand(ordered ? 'insertOrderedList' : 'insertUnorderedList');
  }, [execCommand]);

  // Insert blockquote
  const insertBlockquote = useCallback(() => {
    const currentBlock = document.queryCommandValue('formatBlock');
    if (currentBlock.toLowerCase() === 'blockquote') {
      execCommand('formatBlock', 'p'); // Or another default block element
    } else {
      execCommand('formatBlock', 'blockquote');
    }
  }, [execCommand]);

  // Insert link
  const insertLink = useCallback(() => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  // Align text
  const alignText = useCallback((alignment) => {
    execCommand(`justify${alignment}`);
  }, [execCommand]);

  // Handle paste to clean up formatting
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    execCommand('insertText', text);
  }, [execCommand]);

  // Handle key shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          formatText('bold');
          break;
        case 'i':
          e.preventDefault();
          formatText('italic');
          break;
        case 'u':
          e.preventDefault();
          formatText('underline');
          break;
        case 'z':
          if (e.shiftKey) {
            e.preventDefault();
            execCommand('redo');
          } else {
            e.preventDefault();
            execCommand('undo');
          }
          break;
        case 'k':
          e.preventDefault();
          insertLink();
          break;
      }
    }
  }, [formatText, execCommand, insertLink]);

  // Listen for selection changes
  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [handleSelectionChange]);

  const toolbarButtons = [
    {
      icon: Undo,
      action: () => execCommand('undo'),
      title: 'Undo (Ctrl+Z)'
    },
    {
      icon: Redo,
      action: () => execCommand('redo'),
      title: 'Redo (Ctrl+Shift+Z)'
    },
    { divider: true },
    {
      icon: Bold,
      action: () => formatText('bold'),
      active: currentFormat.bold,
      title: 'Bold (Ctrl+B)'
    },
    {
      icon: Italic,
      action: () => formatText('italic'),
      active: currentFormat.italic,
      title: 'Italic (Ctrl+I)'
    },
    {
      icon: Underline,
      action: () => formatText('underline'),
      active: currentFormat.underline,
      title: 'Underline (Ctrl+U)'
    },
    { divider: true },
    {
      icon: Heading1,
      action: () => insertHeading(1),
      title: 'Heading 1'
    },
    {
      icon: Heading2,
      action: () => insertHeading(2),
      title: 'Heading 2'
    },
    {
      icon: Heading3,
      action: () => insertHeading(3),
      title: 'Heading 3'
    },
    { divider: true },
    {
      icon: List,
      action: () => insertList(false),
      title: 'Bullet List'
    },
    {
      icon: ListOrdered,
      action: () => insertList(true),
      title: 'Numbered List'
    },
    {
      icon: Quote,
      action: insertBlockquote,
      title: 'Quote'
    },
    { divider: true },
    {
      icon: Link,
      action: insertLink,
      title: 'Insert Link (Ctrl+K)'
    },
    {
      icon: Code,
      action: () => formatText('formatBlock', 'pre'),
      title: 'Code Block'
    },
    { divider: true },
    {
      icon: AlignLeft,
      action: () => alignText('Left'),
      title: 'Align Left'
    },
    {
      icon: AlignCenter,
      action: () => alignText('Center'),
      title: 'Align Center'
    },
    {
      icon: AlignRight,
      action: () => alignText('Right'),
      title: 'Align Right'
    }
  ];

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-muted/30 p-2 flex flex-wrap gap-1">
        {toolbarButtons.map((button, index) => {
          if (button.divider) {
            return (
              <div key={index} className="w-px bg-border mx-1 self-stretch" />
            );
          }
          
          const Icon = button.icon;
          return (
            <Button
              key={index}
              variant={button.active ? "default" : "ghost"}
              size="sm"
              onClick={button.action}
              title={button.title}
              className="h-8 w-8 p-0"
            >
              <Icon className="w-4 h-4" />
            </Button>
          );
        })}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className={`
          min-h-[300px] p-4 outline-none focus:ring-0 
          prose prose-sm max-w-none
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h1]:mt-6
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5
          [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mb-2 [&_h3]:mt-4
          [&_p]:mb-3 [&_p]:leading-relaxed
          [&_ul]:mb-4 [&_ul]:pl-6 [&_li]:mb-1
          [&_ol]:mb-4 [&_ol]:pl-6 [&_li]:mb-1
          [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-4
          [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-4
          [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/30 [&_a:hover]:decoration-primary
          ${content === '' ? 'text-muted-foreground' : ''}
        `}
        onInput={handleInput}
        onFocus={() => setIsEditorFocused(true)}
        onBlur={() => setIsEditorFocused(false)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{
          minHeight: '300px'
        }}
      />

      {/* Character count */}
      <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground flex justify-between">
        <span>
          {content ? content.replace(/<[^>]*>/g, '').length : 0} characters
        </span>
        <span className="text-xs">
          Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+K for links
        </span>
      </div>
    </div>
  );
};

export default RichTextEditor;

