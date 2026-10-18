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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let dotColor = 'bg-[#F4F4F6]';
        if (toast.type === 'success') dotColor = 'bg-[#10B981]';
        else if (toast.type === 'error') dotColor = 'bg-[#E50914]';
        else if (toast.type === 'warning') dotColor = 'bg-[#EAB308]';

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-[#141416] border border-[rgba(255,255,255,0.08)] shadow-[0_8px_24px_rgba(0,0,0,0.5)] text-[13px] text-[#F4F4F6] max-w-[380px] animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
            <span className="leading-snug break-words">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
