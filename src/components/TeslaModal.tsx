'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface TeslaModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isPrompt?: boolean;
  promptLabel?: string;
  promptPlaceholder?: string;
  defaultPromptValue?: string;
  onConfirm: (promptValue?: string) => void;
  onCancel: () => void;
}

export default function TeslaModal({
  isOpen,
  title,
  subtitle,
  message,
  confirmText = 'Đồng ý',
  cancelText = 'Hủy',
  isDanger = false,
  isPrompt = false,
  promptLabel = 'Nội dung',
  promptPlaceholder = '',
  defaultPromptValue = '',
  onConfirm,
  onCancel
}: TeslaModalProps) {
  const [val, setVal] = useState(defaultPromptValue);

  useEffect(() => {
    if (isOpen) {
      setVal(defaultPromptValue);
    }
  }, [isOpen, defaultPromptValue]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter' && !isPrompt) {
        e.preventDefault();
        onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPrompt, onCancel, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onCancel}
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-[420px] rounded-xl bg-[#141416] border border-[rgba(255,255,255,0.08)] p-6 shadow-2xl flex flex-col gap-4.5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[rgba(255,255,255,0.06)] pb-3.5">
          <div>
            <h3 className="text-[16px] font-semibold text-[#F4F4F6] tracking-tight">{title}</h3>
            {subtitle && <p className="text-[12px] text-[#71717A] mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onCancel}
            className="text-[#71717A] hover:text-[#F4F4F6] transition-colors p-1"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 py-1">
          <p className="text-[13.5px] leading-relaxed text-[#71717A]">{message}</p>

          {isPrompt && (
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[12px] font-medium text-[#71717A]">{promptLabel}</label>
              <input
                type="text"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={promptPlaceholder}
                className="w-full h-10 px-3 rounded-lg bg-[#0A0A0B] border border-[rgba(255,255,255,0.1)] text-[#F4F4F6] text-[13.5px] focus:outline-none focus:border-white transition-colors"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onConfirm(val);
                  }
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[rgba(255,255,255,0.06)] pt-3.5">
          {cancelText && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-[13px] font-medium text-[#F4F4F6] border border-[rgba(255,255,255,0.1)] hover:bg-[#1C1C1F] hover:border-[rgba(255,255,255,0.2)] transition-all"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => onConfirm(val)}
            className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all ${
              isDanger
                ? 'bg-[#E50914] text-white hover:bg-red-700'
                : 'bg-white text-black hover:bg-[#E4E4E7]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
