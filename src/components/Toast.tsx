'use client';

import React from 'react';

export interface ToastItem {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

interface ToastProps {
  toasts: ToastItem[];
}

export default function Toast({ toasts }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fx-toast-container">
      {toasts.map((toast) => {
        let dotClass = 'fx-toast-dot-info';
        if (toast.type === 'success') dotClass = 'fx-toast-dot-success';
        else if (toast.type === 'error') dotClass = 'fx-toast-dot-error';
        else if (toast.type === 'warning') dotClass = 'fx-toast-dot-warning';

        return (
          <div key={toast.id} className="fx-toast-item">
            <span className={`fx-toast-dot ${dotClass}`} />
            <span className="fx-toast-message">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
