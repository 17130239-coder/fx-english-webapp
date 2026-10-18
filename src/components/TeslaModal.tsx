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
    <div className="fx-modal">
      {/* Backdrop */}
      <div className="fx-modal-backdrop" onClick={onCancel} />

      {/* Modal Box */}
      <div className="fx-modal-container fx-modal-container-sm">
        {/* Header */}
        <div className="fx-modal-header">
          <div className="fx-modal-title-group">
            <h3 className="fx-modal-title">{title}</h3>
            {subtitle && <p className="fx-modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="fx-btn-icon-raw fx-modal-close"
            title="Đóng"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="fx-modal-body">
          <p className="fx-confirm-text">{message}</p>

          {isPrompt && (
            <div className="fx-form-group">
              <label className="fx-label">{promptLabel}</label>
              <input
                type="text"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={promptPlaceholder}
                className="fx-input"
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
        <div className="fx-modal-footer">
          {cancelText && (
            <button
              type="button"
              onClick={onCancel}
              className="fx-btn-tesla-ghost"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => onConfirm(val)}
            className={isDanger ? 'fx-btn-tesla-danger' : 'fx-btn-tesla-primary'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
