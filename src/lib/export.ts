import { VocabItem, MasterItem } from './types';

function escapeHtml(str = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportVocabToAnki(items: VocabItem[], movieTitle = 'fx_vocab') {
  if (!items || items.length === 0) return '';

  const lines = [
    '#separator:Tab',
    '#html:true',
    '#tags column:6',
    '#deck:FX English::' + movieTitle.replace(/[^\w\s\-_]/g, '_')
  ];

  items.forEach((item) => {
    if (item.sentence) {
      const front = `<div style="font-size:20px; font-weight:bold; color:#1e293b;">"${escapeHtml(item.sentence)}"</div>` +
        (item.highlightPhrase ? `<div style="font-size:14px; color:#475569; margin-top:6px;">Cốt lõi: <b>${escapeHtml(item.highlightPhrase)}</b></div>` : '');
      const back = `<div style="font-size:18px; color:#0f766e; font-weight:bold;">${escapeHtml(item.vietnamese || '')}</div>` +
        (item.usageNote ? `<div style="font-size:13px; color:#64748b; margin-top:8px; font-style:italic;">Ghi chú: ${escapeHtml(item.usageNote)}</div>` : '');
      const tag = (item.tag || 'Sentences').replace(/\s+/g, '_');
      lines.push([front, back, '', '', '', `FX_English ${tag}`].join('\t'));
      return;
    }

    const word = item.word || '';
    const ipa = item.ipa ? `<span style="color:#64748b; font-size:14px;">${escapeHtml(item.ipa)}</span>` : '';
    const posLabel = item.posLabelVi || item.pos || '';
    const cefr = item.cefr ? `<span style="background:#e2e8f0; color:#334155; padding:2px 6px; border-radius:4px; font-size:12px; font-weight:bold;">${item.cefr}</span>` : '';
    const contextText = item.contexts?.[0]?.text || '';
    const escapedContext = escapeHtml(contextText);
    const highlightedContext = escapedContext.replace(
      new RegExp(`\\b(${escapeHtml(word)})\\b`, 'gi'),
      '<b style="color:#2563eb; text-decoration:underline;">$1</b>'
    );

    const front = `<div style="font-size:22px; font-weight:bold; color:#0f172a;">${escapeHtml(word)}</div>` +
      `<div style="margin:4px 0 10px 0;">${ipa} &nbsp; ${cefr}</div>` +
      (contextText ? `<div style="font-size:14px; color:#475569; background:#f8fafc; padding:8px 12px; border-left:3px solid #3b82f6; border-radius:4px; font-style:italic;">"${highlightedContext}"</div>` : '');

    const trans = item.vietnamese || item.meaningVi || '';
    const lemma = (item.lemma && item.lemma !== item.word) ? `<div style="font-size:13px; color:#94a3b8; margin-top:4px;">Từ gốc: ${escapeHtml(item.lemma)}</div>` : '';
    const back = `<div style="font-size:18px; color:#059669; font-weight:600;">${escapeHtml(trans)}</div>` +
      `<div style="font-size:13px; color:#64748b; margin-top:6px;">Loại từ: <b>${escapeHtml(posLabel)}</b></div>` +
      lemma;

    const tag = `FX_English ${item.pos || 'Word'}`;
    lines.push([front, back, '', '', '', tag].join('\t'));
  });

  return lines.join('\n');
}

export function exportVocabToCsv(items: VocabItem[]): string {
  if (!items || items.length === 0) return '';

  const rows = [
    ['"Từ vựng / Câu"', '"Loại từ"', '"Cấp độ CEFR"', '"Phiên âm IPA"', '"Nghĩa tiếng Việt"', '"Tần suất"', '"Câu ngữ cảnh trong phim"'].join(',')
  ];

  items.forEach((item) => {
    if (item.sentence) {
      rows.push([
        `"${(item.sentence || '').replace(/"/g, '""')}"`,
        `"${(item.tag || 'Câu hay').replace(/"/g, '""')}"`,
        `"Giao tiếp"`,
        `""`,
        `"${(item.vietnamese || '').replace(/"/g, '""')}"`,
        `1`,
        `"${(item.sentence || '').replace(/"/g, '""')}"`
      ].join(','));
      return;
    }

    rows.push([
      `"${(item.word || '').replace(/"/g, '""')}"`,
      `"${(item.posLabelVi || item.pos || '').replace(/"/g, '""')}"`,
      `"${item.cefr || ''}"`,
      `"${(item.ipa || '').replace(/"/g, '""')}"`,
      `"${(item.vietnamese || item.meaningVi || '').replace(/"/g, '""')}"`,
      item.frequency || 1,
      `"${(item.contexts?.[0]?.text || '').replace(/"/g, '""')}"`
    ].join(','));
  });

  return rows.join('\n');
}

export function exportMasterToAnki(items: MasterItem[]): string {
  if (!items || items.length === 0) return '';

  const lines = [
    '#separator:Tab',
    '#html:true',
    '#tags column:6',
    '#deck:FX English::Master_Known_List'
  ];

  items.forEach((item) => {
    const text = item.text || '';
    const pos = item.pos || 'N';
    const cefr = item.cefr ? `<span style="background:#e2e8f0; color:#334155; padding:2px 6px; border-radius:4px; font-size:12px; font-weight:bold;">${item.cefr}</span>` : '';
    const ipa = item.ipa ? `<span style="color:#64748b; font-size:14px;">${escapeHtml(item.ipa)}</span>` : '';

    const front = `<div style="font-size:22px; font-weight:bold; color:#0f172a;">${escapeHtml(text)}</div>` +
      `<div style="margin:4px 0 10px 0;">${ipa} &nbsp; ${cefr}</div>` +
      (item.context ? `<div style="font-size:14px; color:#475569; background:#f8fafc; padding:8px 12px; border-left:3px solid #3b82f6; border-radius:4px; font-style:italic;">"${escapeHtml(item.context)}"</div>` : '');

    const meanings = Array.isArray(item.knownMeanings) ? item.knownMeanings.join(', ') : '';
    const back = `<div style="font-size:18px; color:#059669; font-weight:600;">${escapeHtml(meanings)}</div>` +
      `<div style="font-size:13px; color:#64748b; margin-top:6px;">Loại từ: <b>${escapeHtml(pos)}</b> (Mastered)</div>`;

    lines.push([front, back, '', '', '', 'FX_English MasterList'].join('\t'));
  });

  return lines.join('\n');
}

export function exportMasterToCsv(items: MasterItem[]): string {
  if (!items || items.length === 0) return '';

  const rows = [
    ['"Từ vựng / Câu"', '"Loại từ"', '"Cấp độ CEFR"', '"Phiên âm IPA"', '"Các nghĩa đã biết"', '"Ngữ cảnh tiêu biểu"'].join(',')
  ];

  items.forEach((item) => {
    const meanings = Array.isArray(item.knownMeanings) ? item.knownMeanings.join(', ') : '';
    rows.push([
      `"${(item.text || '').replace(/"/g, '""')}"`,
      `"${item.pos || 'N'}"`,
      `"${item.cefr || ''}"`,
      `"${(item.ipa || '').replace(/"/g, '""')}"`,
      `"${meanings.replace(/"/g, '""')}"`,
      `"${(item.context || '').replace(/"/g, '""')}"`
    ].join(','));
  });

  return rows.join('\n');
}

export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
