import { useState, useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

const QUICK_TAGS = [
  { label: '🔥 Nhấn mạnh', insert: '**văn bản cần nhấn mạnh**' },
  { label: '🤫 [whispers]', insert: '[whispers] ' },
  { label: '😄 [laughs]', insert: '[laughs] ' },
  { label: '⏳ [pause]', insert: '... [pause] ... ' },
  { label: '🗣️ [speaking rate 1.2x]', insert: '[speaking rate 1.2x] ' },
];

function renderSimpleMarkdown(text: string): string {
  if (!text) return '<p class="preview-empty">Chưa có nội dung để xem trước...</p>';

  // Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Audio Tags [tag]
  html = html.replace(/\[(whispers|laughs|sighs|pause|gasp|clears throat|speaking rate [0-9.]+x)\]/gim, '<span class="audio-tag-badge">[$1]</span>');

  // Quotes
  html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

  // Lists
  html = html.replace(/^- (.*$)/gim, '<li>$1</li>');

  // Paragraphs / newlines
  html = html.replace(/\n\n+/g, '</p><p>');
  html = html.replace(/\n/g, '<br />');

  return `<p>${html}</p>`;
}

export function TextInput({ value, onChange, maxLength = 5000, disabled }: Props) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const count = value.length;
  const isNearLimit = count > maxLength * 0.9;
  const isOverLimit = count > maxLength;

  const handleInsertTag = (tagText: string) => {
    if (!textareaRef.current) {
      onChange(value + ' ' + tagText);
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);
    const nextVal = before + tagText + after;
    onChange(nextVal);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagText.length, start + tagText.length);
    }, 50);
  };

  return (
    <div className="text-input-wrapper">
      {/* Editor Header / Tabs */}
      <div className="editor-tabs-row">
        <div className="editor-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            ✍️ Soạn thảo
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
          >
            👁️ Xem trước Markdown
          </button>
        </div>

        {/* Quick Tag Toolbar */}
        <div className="quick-tags-toolbar">
          <span className="tags-label">Gợi ý Tags:</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag.label}
              type="button"
              className="quick-tag-chip"
              onClick={() => handleInsertTag(tag.insert)}
              disabled={disabled || activeTab === 'preview'}
              title={`Chèn ${tag.insert}`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'edit' ? (
        <textarea
          ref={textareaRef}
          id="tts-text-input"
          className="text-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nhập văn bản tiếng Việt hoặc Markdown (Hỗ trợ tiêu đề #, **nhấn mạnh**, [whispers], [laughs]...)"
          maxLength={maxLength}
          disabled={disabled}
          rows={8}
          aria-label="Văn bản cần chuyển đổi"
          aria-describedby="char-count"
        />
      ) : (
        <div
          className="text-input markdown-preview"
          dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(value) }}
        />
      )}

      <div className="input-footer-row">
        <span className="markdown-hint">💡 Hỗ trợ cú pháp Markdown chuẩn & Expressive Audio Tags của Gemini</span>
        <div
          id="char-count"
          className={`char-count ${isNearLimit ? 'warning' : ''} ${isOverLimit ? 'error' : ''}`}
        >
          {count.toLocaleString()} / {maxLength.toLocaleString()} ký tự
        </div>
      </div>
    </div>
  );
}
