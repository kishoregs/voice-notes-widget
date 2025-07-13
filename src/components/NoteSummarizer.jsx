import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { 
  Sparkles, 
  Copy, 
  Download, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Clock,
  Target,
  List
} from 'lucide-react';

const NoteSummarizer = ({ note, onSummaryGenerated }) => {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [summaryType, setSummaryType] = useState('brief'); // 'brief', 'detailed', 'bullets', 'action-items'

  // Simple client-side summarization (in a real app, you'd use an AI API)
  const generateSummary = async (type = 'brief') => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const content = note.content.replace(/<[^>]*>/g, ''); // Strip HTML
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      let generatedSummary;
      
      switch (type) {
        case 'brief':
          // Take first few sentences and key points
          generatedSummary = {
            type: 'Brief Summary',
            content: sentences.slice(0, 3).join('. ') + '.',
            wordCount: sentences.slice(0, 3).join('. ').split(' ').length,
            keyPoints: extractKeyPoints(content).slice(0, 3)
          };
          break;
          
        case 'detailed':
          generatedSummary = {
            type: 'Detailed Summary',
            content: sentences.slice(0, 6).join('. ') + '.',
            wordCount: sentences.slice(0, 6).join('. ').split(' ').length,
            keyPoints: extractKeyPoints(content).slice(0, 5),
            sections: extractSections(content)
          };
          break;
          
        case 'bullets':
          generatedSummary = {
            type: 'Bullet Points',
            content: extractKeyPoints(content).slice(0, 8).map(point => `• ${point}`).join('\n'),
            wordCount: extractKeyPoints(content).slice(0, 8).join(' ').split(' ').length,
            keyPoints: extractKeyPoints(content).slice(0, 8)
          };
          break;
          
        case 'action-items':
          generatedSummary = {
            type: 'Action Items',
            content: extractActionItems(content).map(item => `□ ${item}`).join('\n'),
            wordCount: extractActionItems(content).join(' ').split(' ').length,
            actionItems: extractActionItems(content),
            keyPoints: extractKeyPoints(content).slice(0, 3)
          };
          break;
          
        default:
          generatedSummary = {
            type: 'Summary',
            content: sentences.slice(0, 3).join('. ') + '.',
            wordCount: sentences.slice(0, 3).join('. ').split(' ').length,
            keyPoints: extractKeyPoints(content).slice(0, 3)
          };
      }
      
      setSummary(generatedSummary);
      if (onSummaryGenerated) {
        onSummaryGenerated(generatedSummary);
      }
    } catch (err) {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Extract key points from content
  const extractKeyPoints = (content) => {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    // Simple heuristic: longer sentences often contain key information
    return sentences
      .sort((a, b) => b.length - a.length)
      .slice(0, 8)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  // Extract sections from content
  const extractSections = (content) => {
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const sections = [];
    let currentSection = null;
    
    lines.forEach(line => {
      // Simple heuristic: lines that are short and don't end with punctuation might be headers
      if (line.length < 50 && !line.match(/[.!?]$/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: line.trim(), content: [] };
      } else if (currentSection) {
        currentSection.content.push(line.trim());
      }
    });
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections.slice(0, 5);
  };

  // Extract action items from content
  const extractActionItems = (content) => {
    const actionWords = ['todo', 'action', 'follow up', 'next steps', 'assign', 'complete', 'finish', 'implement', 'review', 'schedule'];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return sentences
      .filter(sentence => 
        actionWords.some(word => 
          sentence.toLowerCase().includes(word)
        )
      )
      .slice(0, 6)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const copyToClipboard = () => {
    if (summary) {
      navigator.clipboard.writeText(summary.content);
    }
  };

  const downloadSummary = () => {
    if (summary) {
      const blob = new Blob([summary.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title}-summary.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!note || !note.content || note.content.replace(/<[^>]*>/g, '').trim().length < 50) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            Note needs more content to generate a summary
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Add at least 50 characters to enable summarization
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          AI Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Type Selection */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'brief', label: 'Brief', icon: FileText },
            { id: 'detailed', label: 'Detailed', icon: List },
            { id: 'bullets', label: 'Bullets', icon: List },
            { id: 'action-items', label: 'Actions', icon: Target }
          ].map(type => {
            const Icon = type.icon;
            return (
              <Button
                key={type.id}
                variant={summaryType === type.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSummaryType(type.id)}
                className="h-8"
              >
                <Icon className="w-3 h-3 mr-1" />
                {type.label}
              </Button>
            );
          })}
        </div>

        {/* Generate Button */}
        <Button
          onClick={() => generateSummary(summaryType)}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Summary...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate {summaryType.charAt(0).toUpperCase() + summaryType.slice(1)} Summary
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        )}

        {/* Summary Display */}
        {summary && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {summary.type}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {summary.wordCount} words
                </span>
                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadSummary}>
                  <Download className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => generateSummary(summaryType)}>
                  <RefreshCw className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {summary.content}
              </pre>
            </div>

            {/* Key Points */}
            {summary.keyPoints && summary.keyPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Key Points:</h4>
                <ul className="space-y-1">
                  {summary.keyPoints.slice(0, 5).map((point, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items */}
            {summary.actionItems && summary.actionItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Action Items:
                </h4>
                <ul className="space-y-1">
                  {summary.actionItems.map((item, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="w-3 h-3 border border-muted-foreground rounded-sm mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sections */}
            {summary.sections && summary.sections.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Sections:</h4>
                <div className="space-y-2">
                  {summary.sections.map((section, index) => (
                    <div key={index} className="border-l-2 border-primary/30 pl-3">
                      <h5 className="text-sm font-medium">{section.title}</h5>
                      <p className="text-xs text-muted-foreground">
                        {section.content.join(' ').substring(0, 100)}...
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NoteSummarizer;

