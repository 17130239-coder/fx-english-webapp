'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, Play, FileText, ArrowRight } from 'lucide-react';
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
      onToast(`Đã phân tích ${result?.totals?.uniqueWords || 0} từ vựng ngoại tuyến (Không dùng AI).`, 'success');
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
    <div className="w-full rounded-xl bg-[#141416] border border-[rgba(255,255,255,0.06)] p-5 flex flex-col gap-4">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".srt,.vtt,.txt"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
          }
        }}
      />

      {/* Dropzone & Text Input Box */}
      <div
        className={`relative w-full rounded-lg border transition-all ${
          isDragging
            ? 'border-white bg-[#1C1C1F]'
            : 'border-[rgba(255,255,255,0.08)] bg-[#0A0A0B] focus-within:border-[rgba(255,255,255,0.2)]'
        }`}
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
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Kéo thả file .SRT / .VTT / .TXT hoặc dán phụ đề tiếng Anh vào đây..."
          rows={3}
          className="w-full p-4 bg-transparent text-[#F4F4F6] text-[13.5px] font-mono leading-relaxed resize-none focus:outline-none placeholder:text-[#52525B]"
          spellCheck={false}
        />

        <div className="flex items-center justify-between border-t border-[rgba(255,255,255,0.04)] px-4 py-2.5 bg-[#141416]/50">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 text-[12px] font-medium text-[#71717A] hover:text-[#F4F4F6] transition-colors"
          >
            <UploadCloud size={14} />
            <span>Chọn file từ máy tính</span>
          </button>

          <button
            type="button"
            disabled={isProcessing || !text.trim()}
            onClick={() => handleProcessText(text)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-white text-black text-[12.5px] font-semibold hover:bg-[#E4E4E7] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <span>{isProcessing ? 'Đang phân tích...' : 'Tách từ vựng'}</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* One-click Sample Presets */}
      <div className="flex items-center justify-between gap-3 flex-wrap text-[12px] text-[#71717A]">
        <div className="flex items-center gap-2">
          <FileText size={13} />
          <span>Mẫu phụ đề thử nhanh:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setText(SAMPLE_INCEPTION);
              handleProcessText(SAMPLE_INCEPTION, 'Inception (2010)');
            }}
            className="px-2.5 py-1 rounded bg-[#0A0A0B] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.18)] text-[#A1A1AA] hover:text-[#F4F4F6] transition-all"
          >
            Inception (SRT)
          </button>
          <button
            onClick={() => {
              setText(SAMPLE_INTERSTELLAR);
              handleProcessText(SAMPLE_INTERSTELLAR, 'Interstellar (2014)');
            }}
            className="px-2.5 py-1 rounded bg-[#0A0A0B] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.18)] text-[#A1A1AA] hover:text-[#F4F4F6] transition-all"
          >
            Interstellar (VTT)
          </button>
          <button
            onClick={() => {
              setText(SAMPLE_TED);
              handleProcessText(SAMPLE_TED, 'TED Talk (Text)');
            }}
            className="px-2.5 py-1 rounded bg-[#0A0A0B] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.18)] text-[#A1A1AA] hover:text-[#F4F4F6] transition-all"
          >
            TED Talk (TXT)
          </button>
        </div>
      </div>
    </div>
  );
}
