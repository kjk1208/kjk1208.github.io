import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Bold, Italic, Underline, Image, Code, List, ListOrdered, Link, Quote, Heading1, Heading2, Heading3 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "내용을 입력하세요...", height = "400px" }: RichTextEditorProps) {
  const [images, setImages] = useState<{ [key: string]: string }>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertText = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Reset cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + before.length, start + before.length + selectedText.length);
      }
    }, 0);
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageId = `img_${Date.now()}`;
      const imageUrl = reader.result as string;
      setImages(prev => ({ ...prev, [imageId]: imageUrl }));
      insertText(`![이미지](${imageId})`);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleImageUpload(file);
        }
        break;
      }
    }
  };

  const renderPreview = React.useMemo(() => {
    let content = value;
    
    // Replace image placeholders with actual images
    Object.entries(images).forEach(([id, url]) => {
      const regex = new RegExp(`!\\[([^\\]]*)\\]\\(${id}\\)`, 'g');
      content = content.replace(regex, `<img src="${url}" alt="$1" class="max-w-full h-auto rounded-lg my-2" />`);
    });

    // LaTeX math rendering (simple version)
    content = content
      .replace(/\$\$([\s\S]*?)\$\$/g, '<div class="math-display bg-muted/50 p-2 rounded text-center font-mono">$1</div>')
      .replace(/\$([^$\n]+)\$/g, '<span class="math-inline bg-muted/30 px-1 rounded font-mono">$1</span>');

    // Split content into lines for better parsing
    const lines = content.split('\n');
    const parsedLines: string[] = [];
    let inCodeBlock = false;
    let inList = false;
    let listItems: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          parsedLines.push('</code></pre>');
          inCodeBlock = false;
        } else {
          // Start code block
          const language = line.substring(3).trim();
          parsedLines.push(`<pre class="bg-muted p-3 rounded overflow-x-auto my-3"><code class="language-${language}">`);
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        parsedLines.push(line);
        continue;
      }

      // Handle lists
      const listMatch = line.match(/^(\s*)[\*\-\+]\s+(.*)/) || line.match(/^(\s*)(\d+)\.\s+(.*)/);
      if (listMatch) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        const content = listMatch[3] || listMatch[2];
        listItems.push(`<li class="ml-4">${parseInlineMarkdown(content)}</li>`);
        continue;
      } else if (inList) {
        // End of list
        parsedLines.push('<ul class="list-disc list-inside my-2 space-y-1">');
        parsedLines.push(...listItems);
        parsedLines.push('</ul>');
        inList = false;
        listItems = [];
      }

      // Handle headers with proper styling
      if (line.startsWith('### ')) {
        parsedLines.push(`<h3 class="text-lg font-medium mt-4 mb-2">${parseInlineMarkdown(line.substring(4))}</h3>`);
      } else if (line.startsWith('## ')) {
        parsedLines.push(`<h2 class="text-xl font-medium mt-4 mb-2">${parseInlineMarkdown(line.substring(3))}</h2>`);
      } else if (line.startsWith('# ')) {
        parsedLines.push(`<h1 class="text-2xl font-medium mt-4 mb-2">${parseInlineMarkdown(line.substring(2))}</h1>`);
      } else if (line.startsWith('> ')) {
        parsedLines.push(`<blockquote class="border-l-4 border-muted pl-4 italic my-2 text-muted-foreground">${parseInlineMarkdown(line.substring(2))}</blockquote>`);
      } else if (line.trim() === '') {
        parsedLines.push('<br>');
      } else {
        parsedLines.push(`<p class="my-2">${parseInlineMarkdown(line)}</p>`);
      }
    }

    // Close any remaining list
    if (inList) {
      parsedLines.push('<ul class="list-disc list-inside my-2 space-y-1">');
      parsedLines.push(...listItems);
      parsedLines.push('</ul>');
    }

    return parsedLines.join('\n');
  }, [value, images]);

  // Helper function for inline markdown parsing
  const parseInlineMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded text-sm">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 underline hover:text-blue-700" target="_blank" rel="noopener noreferrer">$1</a>');
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 sm:gap-2 p-2 border rounded-lg bg-muted/50">
        {/* Heading buttons */}
        <div className="flex gap-1 border-r border-border pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('# ')}
            title="제목 1"
            className="text-xs sm:text-sm"
          >
            <Heading1 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('## ')}
            title="제목 2"
            className="text-xs sm:text-sm"
          >
            <Heading2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('### ')}
            title="제목 3"
            className="text-xs sm:text-sm"
          >
            <Heading3 className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Text formatting */}
        <div className="flex gap-1 border-r border-border pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('**', '**')}
            title="굵게"
            className="text-xs sm:text-sm"
          >
            <Bold className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('*', '*')}
            title="기울임"
            className="text-xs sm:text-sm"
          >
            <Italic className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('__', '__')}
            title="밑줄"
            className="text-xs sm:text-sm"
          >
            <Underline className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Lists and formatting */}
        <div className="flex gap-1 border-r border-border pr-2 mr-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('* ')}
            title="목록"
            className="text-xs sm:text-sm"
          >
            <List className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('1. ')}
            title="번호 목록"
            className="text-xs sm:text-sm"
          >
            <ListOrdered className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('> ')}
            title="인용"
            className="text-xs sm:text-sm"
          >
            <Quote className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Media and code */}
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('`', '`')}
            title="인라인 코드"
            className="text-xs sm:text-sm"
          >
            <Code className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertText('[링크 텍스트](URL)')}
            title="링크"
            className="text-xs sm:text-sm"
          >
            <Link className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFileSelect}
            title="이미지 업로드"
            className="text-xs sm:text-sm"
          >
            <Image className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files) {
              Array.from(files).forEach(handleImageUpload);
            }
          }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="flex-1">
          <label className="block text-sm mb-2 font-medium">편집</label>
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            style={{ height }}
            className="resize-none font-mono text-sm leading-relaxed"
          />
          <div className="text-xs text-muted-foreground mt-2 px-1 space-y-1">
            <p>📝 마크다운 문법: # 제목, **굵게**, *기울임*, `코드`, &gt; 인용</p>
            <p>🖼️ 이미지 복사-붙여넣기 가능 | 🧮 수식: $인라인$ 또는 $블록$</p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1">
          <label className="block text-sm mb-2 font-medium">미리보기</label>
          <div 
            className="border rounded-lg p-4 sm:p-6 bg-background overflow-y-auto"
            style={{ height }}
          >
            <div 
              className="prose prose-sm max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: renderPreview }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}