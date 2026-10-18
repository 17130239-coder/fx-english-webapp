'use client';

import React, { useState, useRef } from 'react';
import { Paperclip, ArrowRight, Play } from 'lucide-react';
import { parseSubtitles, analyzeSubtitlesOffline } from '@/lib/analyzer';

interface UnifiedInputProps {
  onAnalysisComplete: (result: any, cues: any[], title: string) => void;
  onToast: (msg: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
}

const SAMPLE_INCEPTION = `1
00:00:01,500 --> 00:00:04,200
What is the most resilient parasite? An idea.

2
00:00:05,000 --> 00:00:08,800
A single idea from the human mind can build cities.

3
00:00:09,100 --> 00:00:13,400
An idea can transform the world and rewrite all the rules.

4
00:00:14,000 --> 00:00:18,500
Which is why I have to steal it from your subconscious.`;

const SAMPLE_INTERSTELLAR = `WEBVTT

00:00:02.000 --> 00:00:06.500
We used to look up at the sky and wonder at our place in the stars.

00:00:07.000 --> 00:00:12.000
Now we just look down and worry about our place in the dirt.

00:00:13.000 --> 00:00:17.500
Mankind was born on Earth. It was never meant to die here.`;

const SAMPLE_TED = `Every difficult journey begins with courageous decisions.
The brilliant astronomer suddenly realized the extraordinary secret of the universe.
We must explore unknown horizons and discover our true potential together.`;

export default function UnifiedInput({ onAnalysisComplete, onToast }: UnifiedInputProps) {
  const [text, setText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessText = (content: string, title = 'Phụ đề tải lên') => {
    const clean = content.trim();
    if (!clean) {
      onToast('Vui lòng nhập hoặc kéo thả file phụ đề trước.', 'warning');
      return;
    }

    setIsProcessing(true);
    try {
      const cues = parseSubtitles(clean);
      if (!cues || cues.length === 0) {
        onToast('Không tìm thấy dòng phụ đề hợp lệ.', 'error');
        setIsProcessing(false);
        return;
      }

      const result = analyzeSubtitlesOffline(cues);
      onAnalysisComplete(result, cues, title);
      onToast(`Đã phân tích ${result?.totals?.uniqueWords || 0} từ vựng ngoại tuyến (Zero AI).`, 'success');
    } catch (err: any) {
      console.error('NLP Error:', err);
      onToast(`Lỗi phân tích: ${err.message || 'Lỗi xử lý'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setText(content);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      handleProcessText(content, nameWithoutExt);
    };
    reader.readAsText(file);
  };

  return (
    <section className="fx-input-section">
      <div className="fx-section-header">
        <h2>Nguồn Phụ Đề & Tách Từ Vựng</h2>
      </div>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".srt,.vtt,.txt,.xml"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Unified Input Box (Dropzone + Paste + File Attachment) */}
      <div
        className={`fx-unified-input-box ${isDragging ? 'dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
      >
        <textarea
          id="fx-raw-subtitles"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Dán nội dung phụ đề tiếng Anh vào đây, hoặc kéo thả file .srt, .vtt, .txt trực tiếp vào khung này..."
          spellCheck={false}
        />

        <div className="fx-unified-toolbar">
          <div className="fx-unified-left">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="fx-btn-attach"
              title="Chọn file từ máy tính (.srt, .vtt, .txt)"
            >
              <Paperclip size={14} />
              <span>Đính kèm file</span>
            </button>
          </div>

          <div className="fx-unified-right">
            <button
              type="button"
              onClick={() => {
                setText(SAMPLE_INCEPTION);
                handleProcessText(SAMPLE_INCEPTION, 'Inception (2010)');
              }}
              className="fx-btn-text"
              title="Thử mẫu Inception (.srt)"
            >
              Mẫu Inception
            </button>

            <button
              type="button"
              onClick={() => {
                setText(SAMPLE_INTERSTELLAR);
                handleProcessText(SAMPLE_INTERSTELLAR, 'Interstellar (2014)');
              }}
              className="fx-btn-text"
              title="Thử mẫu Interstellar (.vtt)"
            >
              Mẫu Interstellar
            </button>

            <button
              type="button"
              onClick={() => {
                setText(SAMPLE_TED);
                handleProcessText(SAMPLE_TED, 'TED Talk (Text)');
              }}
              className="fx-btn-text"
              title="Thử mẫu TED Talk (.txt)"
            >
              Mẫu TED Talk
            </button>

            <button
              type="button"
              disabled={isProcessing || !text.trim()}
              onClick={() => handleProcessText(text)}
              className="fx-btn-tesla-primary-sm"
              style={{
                opacity: isProcessing || !text.trim() ? 0.4 : 1,
                cursor: isProcessing || !text.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              <span>{isProcessing ? 'Đang phân tích...' : 'Tách từ vựng'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
