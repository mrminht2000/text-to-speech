import { useState } from 'react';
import { SubtitleSegment } from '../../types/subtitles';
import { formatTime } from '../../utils/subtitleUtils';

interface SubtitleTimelineEditorProps {
  segments: SubtitleSegment[];
  currentTime: number;
  onSeek: (time: number) => void;
  onSegmentsChange: (segments: SubtitleSegment[]) => void;
}

export function SubtitleTimelineEditor({
  segments,
  currentTime,
  onSeek,
  onSegmentsChange,
}: SubtitleTimelineEditorProps) {
  const [filterText, setFilterText] = useState('');

  const handleTextChange = (id: number, newText: string) => {
    const updated = segments.map((s) => (s.id === id ? { ...s, text: newText } : s));
    onSegmentsChange(updated);
  };

  const handleTimeChange = (id: number, field: 'start' | 'end', delta: number) => {
    const updated = segments.map((s) => {
      if (s.id === id) {
        const val = Math.max(0, Math.round((s[field] + delta) * 100) / 100);
        return { ...s, [field]: val };
      }
      return s;
    });
    onSegmentsChange(updated);
  };

  const handleDelete = (id: number) => {
    const updated = segments.filter((s) => s.id !== id);
    onSegmentsChange(updated);
  };

  const handleAddSegment = () => {
    const lastSeg = segments[segments.length - 1];
    const newStart = lastSeg ? Math.round((lastSeg.end + 0.2) * 100) / 100 : Math.round(currentTime * 100) / 100;
    const newEnd = Math.round((newStart + 3.0) * 100) / 100;

    const newSegment: SubtitleSegment = {
      id: Date.now(),
      start: newStart,
      end: newEnd,
      text: 'Nhập nội dung phụ đề...',
      words: [],
    };

    onSegmentsChange([...segments, newSegment]);
  };

  const handleShiftAll = (delta: number) => {
    const updated = segments.map((s) => ({
      ...s,
      start: Math.max(0, Math.round((s.start + delta) * 100) / 100),
      end: Math.max(0, Math.round((s.end + delta) * 100) / 100),
    }));
    onSegmentsChange(updated);
  };

  const filteredSegments = segments.filter((s) =>
    s.text.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="subtitle-timeline-editor">
      {/* Top Action Bar */}
      <div className="editor-top-actions">
        <div className="search-filter-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm câu phụ đề..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="timeline-action-buttons">
          <button
            type="button"
            className="btn-action-small"
            onClick={() => handleShiftAll(-0.5)}
            title="Lùi toàn bộ phụ đề 0.5 giây"
          >
            ⏪ -0.5s
          </button>
          <button
            type="button"
            className="btn-action-small"
            onClick={() => handleShiftAll(0.5)}
            title="Tiến toàn bộ phụ đề 0.5 giây"
          >
            ⏩ +0.5s
          </button>
          <button
            type="button"
            className="btn-primary-small"
            onClick={handleAddSegment}
            title="Thêm dòng phụ đề mới"
          >
            ➕ Thêm câu
          </button>
        </div>
      </div>

      {/* Segments List */}
      <div className="segments-scroll-list">
        {filteredSegments.length === 0 ? (
          <div className="empty-segments-state">
            <p>Chưa có phụ đề nào. Hãy bấm <strong>Tạo Phụ Đề AI</strong> hoặc <strong>Thêm câu</strong>.</p>
          </div>
        ) : (
          filteredSegments.map((seg, index) => {
            const isActive = currentTime >= seg.start && currentTime <= seg.end;
            return (
              <div
                key={seg.id}
                className={`segment-row-card ${isActive ? 'active-playing' : ''}`}
              >
                <div className="segment-left-controls">
                  <button
                    type="button"
                    className="btn-play-segment"
                    onClick={() => onSeek(seg.start)}
                    title={`Phát đoạn này (${formatTime(seg.start)})`}
                  >
                    ▶️
                  </button>
                  <span className="segment-index-badge">#{index + 1}</span>
                </div>

                <div className="segment-main-content">
                  <div className="segment-time-badges">
                    <div className="time-stepper">
                      <span className="time-label">Bắt đầu:</span>
                      <button
                        type="button"
                        onClick={() => handleTimeChange(seg.id, 'start', -0.1)}
                        className="btn-step"
                      >
                        -
                      </button>
                      <span className="time-val">{formatTime(seg.start)}</span>
                      <button
                        type="button"
                        onClick={() => handleTimeChange(seg.id, 'start', 0.1)}
                        className="btn-step"
                      >
                        +
                      </button>
                    </div>

                    <div className="time-stepper">
                      <span className="time-label">Kết thúc:</span>
                      <button
                        type="button"
                        onClick={() => handleTimeChange(seg.id, 'end', -0.1)}
                        className="btn-step"
                      >
                        -
                      </button>
                      <span className="time-val">{formatTime(seg.end)}</span>
                      <button
                        type="button"
                        onClick={() => handleTimeChange(seg.id, 'end', 0.1)}
                        className="btn-step"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={2}
                    value={seg.text}
                    onChange={(e) => handleTextChange(seg.id, e.target.value)}
                    className="segment-text-input"
                    placeholder="Nội dung phụ đề..."
                  />
                </div>

                <div className="segment-right-actions">
                  <button
                    type="button"
                    className="btn-delete-segment"
                    onClick={() => handleDelete(seg.id)}
                    title="Xóa dòng phụ đề này"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
