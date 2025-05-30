import React, { useState, useRef, useCallback } from 'react';
import { 
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link, Image, Video, FileText, Code,
  Quote, Strikethrough, Subscript, Superscript, Palette,
  Type, MoreHorizontal, Eye, EyeOff
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  readOnly?: boolean;
  showPreview?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
  minHeight = "200px",
  readOnly = false,
  showPreview = true
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

  const checkActiveFormats = useCallback(() => {
    const formats = new Set<string>();
    
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('underline')) formats.add('underline');
    if (document.queryCommandState('strikeThrough')) formats.add('strikethrough');
    if (document.queryCommandState('justifyLeft')) formats.add('alignLeft');
    if (document.queryCommandState('justifyCenter')) formats.add('alignCenter');
    if (document.queryCommandState('justifyRight')) formats.add('alignRight');
    if (document.queryCommandState('insertUnorderedList')) formats.add('bulletList');
    if (document.queryCommandState('insertOrderedList')) formats.add('numberedList');
    
    setActiveFormats(formats);
  }, []);

  const execCommand = (command: string, value?: string) => {
    if (readOnly) return;
    
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    checkActiveFormats();
  };

  const handleInput = () => {
    if (editorRef.current && !readOnly) {
      onChange(editorRef.current.innerHTML);
      checkActiveFormats();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        case 'k':
          e.preventDefault();
          setShowLinkDialog(true);
          break;
      }
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      const selection = window.getSelection();
      const text = linkText || selection?.toString() || linkUrl;
      
      if (selection?.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const link = document.createElement('a');
        link.href = linkUrl;
        link.textContent = text;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        
        range.insertNode(link);
        
        // Move cursor after the link
        range.setStartAfter(link);
        range.setEndAfter(link);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
      
      setLinkUrl('');
      setLinkText('');
      setShowLinkDialog(false);
    }
  };

  const insertImage = () => {
    if (imageUrl) {
      const img = `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />`;
      execCommand('insertHTML', img);
      setImageUrl('');
      setImageAlt('');
      setShowImageDialog(false);
    }
  };

  const insertVideo = () => {
    if (videoUrl) {
      let embedUrl = videoUrl;
      
      // Handle YouTube URLs
      if (videoUrl.includes('youtube.com/watch')) {
        const videoId = videoUrl.split('v=')[1]?.split('&')[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      } else if (videoUrl.includes('youtu.be/')) {
        const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      const iframe = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 16px 0;"><iframe src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; border-radius: 8px;" allowfullscreen></iframe></div>`;
      execCommand('insertHTML', iframe);
      setVideoUrl('');
      setShowVideoDialog(false);
    }
  };

  const formatCode = () => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      const code = `<code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 0.875em; color: #1e293b;">${selection.toString()}</code>`;
      execCommand('insertHTML', code);
    }
  };

  const insertCodeBlock = () => {
    const code = prompt('Enter code:');
    if (code) {
      const codeBlock = `<pre style="background-color: #1e293b; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; margin: 16px 0; border-left: 4px solid #3b82f6;"><code>${code}</code></pre>`;
      execCommand('insertHTML', codeBlock);
    }
  };

  const insertQuote = () => {
    execCommand('formatBlock', 'blockquote');
  };

  const changeTextColor = () => {
    const color = prompt('Enter color (hex, rgb, or color name):');
    if (color) {
      execCommand('foreColor', color);
    }
  };

  const changeBackgroundColor = () => {
    const color = prompt('Enter background color (hex, rgb, or color name):');
    if (color) {
      execCommand('backColor', color);
    }
  };

  React.useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  React.useEffect(() => {
    const handleSelectionChange = () => {
      checkActiveFormats();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [checkActiveFormats]);

  const ToolbarButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    active?: boolean;
    disabled?: boolean;
  }> = ({ onClick, icon, title, active = false, disabled = false }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || readOnly}
      className={cn(
        "p-2 rounded transition-colors",
        active 
          ? "bg-primary-100 text-primary-700" 
          : "hover:bg-gray-100 text-gray-600",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title={title}
    >
      {icon}
    </button>
  );

  if (readOnly) {
    return (
      <div className={cn("prose prose-sm max-w-none", className)}>
        <div dangerouslySetInnerHTML={{ __html: value }} />
      </div>
    );
  }

  return (
    <div className={cn("border border-gray-300 rounded-md overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => execCommand('bold')}
              icon={<Bold className="h-4 w-4" />}
              title="Bold (Ctrl+B)"
              active={activeFormats.has('bold')}
            />
            <ToolbarButton
              onClick={() => execCommand('italic')}
              icon={<Italic className="h-4 w-4" />}
              title="Italic (Ctrl+I)"
              active={activeFormats.has('italic')}
            />
            <ToolbarButton
              onClick={() => execCommand('underline')}
              icon={<Underline className="h-4 w-4" />}
              title="Underline (Ctrl+U)"
              active={activeFormats.has('underline')}
            />
            <ToolbarButton
              onClick={() => execCommand('strikeThrough')}
              icon={<Strikethrough className="h-4 w-4" />}
              title="Strikethrough"
              active={activeFormats.has('strikethrough')}
            />
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => execCommand('justifyLeft')}
              icon={<AlignLeft className="h-4 w-4" />}
              title="Align Left"
              active={activeFormats.has('alignLeft')}
            />
            <ToolbarButton
              onClick={() => execCommand('justifyCenter')}
              icon={<AlignCenter className="h-4 w-4" />}
              title="Align Center"
              active={activeFormats.has('alignCenter')}
            />
            <ToolbarButton
              onClick={() => execCommand('justifyRight')}
              icon={<AlignRight className="h-4 w-4" />}
              title="Align Right"
              active={activeFormats.has('alignRight')}
            />
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => execCommand('insertUnorderedList')}
              icon={<List className="h-4 w-4" />}
              title="Bullet List"
              active={activeFormats.has('bulletList')}
            />
            <ToolbarButton
              onClick={() => execCommand('insertOrderedList')}
              icon={<ListOrdered className="h-4 w-4" />}
              title="Numbered List"
              active={activeFormats.has('numberedList')}
            />
            <ToolbarButton
              onClick={insertQuote}
              icon={<Quote className="h-4 w-4" />}
              title="Quote"
            />
          </div>

          {/* Media & Links */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => setShowLinkDialog(true)}
              icon={<Link className="h-4 w-4" />}
              title="Insert Link (Ctrl+K)"
            />
            <ToolbarButton
              onClick={() => setShowImageDialog(true)}
              icon={<Image className="h-4 w-4" />}
              title="Insert Image"
            />
            <ToolbarButton
              onClick={() => setShowVideoDialog(true)}
              icon={<Video className="h-4 w-4" />}
              title="Insert Video"
            />
          </div>

          {/* Code */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={formatCode}
              icon={<Code className="h-4 w-4" />}
              title="Inline Code"
            />
            <ToolbarButton
              onClick={insertCodeBlock}
              icon={<FileText className="h-4 w-4" />}
              title="Code Block"
            />
          </div>

          {/* Formatting */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <select
              onChange={(e) => execCommand('formatBlock', e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              defaultValue=""
            >
              <option value="">Normal</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
              <option value="h4">Heading 4</option>
              <option value="h5">Heading 5</option>
              <option value="h6">Heading 6</option>
              <option value="p">Paragraph</option>
            </select>
            
            <ToolbarButton
              onClick={changeTextColor}
              icon={<Type className="h-4 w-4" />}
              title="Text Color"
            />
            <ToolbarButton
              onClick={changeBackgroundColor}
              icon={<Palette className="h-4 w-4" />}
              title="Background Color"
            />
          </div>

          {/* Script */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => execCommand('superscript')}
              icon={<Superscript className="h-4 w-4" />}
              title="Superscript"
            />
            <ToolbarButton
              onClick={() => execCommand('subscript')}
              icon={<Subscript className="h-4 w-4" />}
              title="Subscript"
            />
          </div>

          {/* Preview Toggle */}
          {showPreview && (
            <div className="flex gap-1">
              <ToolbarButton
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                icon={isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
                active={isPreviewMode}
              />
            </div>
          )}
        </div>
      </div>

      {/* Editor/Preview */}
      {isPreviewMode ? (
        <div className="p-4 prose prose-sm max-w-none" style={{ minHeight }}>
          <div dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          className="p-4 focus:outline-none prose prose-sm max-w-none"
          style={{ minHeight }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
      )}

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text (optional)
                </label>
                <input
                  type="text"
                  placeholder="Link text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                disabled={!linkUrl}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Insert Image</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text (optional)
                </label>
                <input
                  type="text"
                  placeholder="Image description"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              {imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview
                  </label>
                  <img 
                    src={imageUrl} 
                    alt={imageAlt} 
                    className="max-w-full h-32 object-contain border rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowImageDialog(false);
                  setImageUrl('');
                  setImageAlt('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={insertImage}
                disabled={!imageUrl}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Dialog */}
      {showVideoDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">Insert Video</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video URL
                </label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supports YouTube, Vimeo, and direct video URLs
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowVideoDialog(false);
                  setVideoUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={insertVideo}
                disabled={!videoUrl}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Insert Video
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
        
        [contenteditable] h1, [contenteditable] h2, [contenteditable] h3,
        [contenteditable] h4, [contenteditable] h5, [contenteditable] h6 {
          margin: 16px 0 8px 0;
          font-weight: 600;
          line-height: 1.25;
        }
        
        [contenteditable] h1 { font-size: 2em; }
        [contenteditable] h2 { font-size: 1.5em; }
        [contenteditable] h3 { font-size: 1.17em; }
        [contenteditable] h4 { font-size: 1em; }
        [contenteditable] h5 { font-size: 0.83em; }
        [contenteditable] h6 { font-size: 0.67em; }
        
        [contenteditable] p {
          margin: 8px 0;
          line-height: 1.6;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 8px 0;
          padding-left: 24px;
        }
        
        [contenteditable] li {
          margin: 4px 0;
          line-height: 1.5;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
        }
        
        [contenteditable] iframe {
          max-width: 100%;
          border-radius: 8px;
          border: 0;
        }
        
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        [contenteditable] a:hover {
          color: #1d4ed8;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #6b7280;
          background-color: #f9fafb;
          padding: 12px 16px;
          border-radius: 0 8px 8px 0;
        }
        
        [contenteditable] code {
          background-color: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.875em;
          color: #1e293b;
        }
        
        [contenteditable] pre {
          background-color: #1e293b;
          color: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          margin: 16px 0;
          border-left: 4px solid #3b82f6;
        }
        
        [contenteditable] pre code {
          background: transparent;
          padding: 0;
          color: inherit;
        }
        
        [contenteditable] table {
          width: 100%;
          border-collapse: collapse;
          margin: 16px 0;
        }
        
        [contenteditable] table th,
        [contenteditable] table td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }
        
        [contenteditable] table th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        
        [contenteditable] hr {
          border: none;
          border-top: 2px solid #e5e7eb;
          margin: 24px 0;
        }
        
        /* Focus styles */
        [contenteditable]:focus {
          outline: none;
        }
        
        /* Selection styles */
        [contenteditable]::selection {
          background-color: #dbeafe;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;