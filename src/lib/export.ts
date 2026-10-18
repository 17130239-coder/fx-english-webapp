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
    // 1. Sentence Pattern Card
    if (item.pos === 'pattern' || item.isPattern) {
      const patternText = item.patternTemplate || item.patternFormula || item.word;
      const example = item.sentence || item.contexts?.[0]?.text || '';
      const front = `<div style="font-size:12px; text-transform:uppercase; color:#3b82f6; font-weight:700; letter-spacing:0.05em; margin-bottom:6px;">CẤU TRÚC CÂU</div>` +
        `<div style="font-size:22px; font-weight:bold; color:#0f172a;">${escapeHtml(patternText)}</div>` +
        (example ? `<div style="font-size:14px; color:#475569; background:#f8fafc; padding:8px 12px; border-left:3px solid #3b82f6; border-radius:4px; font-style:italic; margin-top:10px;">"${escapeHtml(example)}"</div>` : '');

      const back = `<div style="font-size:18px; color:#059669; font-weight:600;">${escapeHtml(item.vietnamese || item.meaningVi || '')}</div>` +
        (item.usageNote ? `<div style="font-size:13px; color:#64748b; margin-top:8px; font-style:italic;">💡 ${escapeHtml(item.usageNote)}</div>` : '');

      lines.push([front, back, '', '', '', 'FX_English Cấu_Trúc_Câu'].join('\t'));
      return;
    }

    // 2. Phrase / Collocation / Idiom Card
    if (item.pos === 'phrase' || item.isPhrase) {
      const phraseText = item.word || item.sentence || '';
      const categoryLabel = item.phraseCategory === 'phrasal_verb' ? 'Cụm động từ'
        : item.phraseCategory === 'idiom' ? 'Thành ngữ'
        : item.phraseCategory === 'slang' ? 'Tiếng lóng'
        : 'Cụm từ';
      const example = item.contexts?.[0]?.text || item.sentence || '';
      const escapedExample = escapeHtml(example);
      const highlightedExample = phraseText
        ? escapedExample.replace(new RegExp(`\\b(${escapeHtml(phraseText)})\\b`, 'gi'), '<b style="color:#2563eb; text-decoration:underline;">$1</b>')
        : escapedExample;

      const front = `<div style="font-size:12px; text-transform:uppercase; color:#8b5cf6; font-weight:700; letter-spacing:0.05em; margin-bottom:6px;">${categoryLabel.toUpperCase()}</div>` +
        `<div style="font-size:22px; font-weight:bold; color:#0f172a;">${escapeHtml(phraseText)}</div>` +
        (example ? `<div style="font-size:14px; color:#475569; background:#f8fafc; padding:8px 12px; border-left:3px solid #8b5cf6; border-radius:4px; font-style:italic; margin-top:10px;">"${highlightedExample}"</div>` : '');

      const back = `<div style="font-size:18px; color:#059669; font-weight:600;">${escapeHtml(item.vietnamese || item.meaningVi || '')}</div>` +
        (item.usageNote ? `<div style="font-size:13px; color:#64748b; margin-top:8px; font-style:italic;">💡 ${escapeHtml(item.usageNote)}</div>` : '');

      lines.push([front, back, '', '', '', `FX_English Cụm_Từ`].join('\t'));
      return;
    }

    // 3. Communicative Sentence Card
    if (item.sentence && item.isCommunicative) {
      const front = `<div style="font-size:20px; font-weight:bold; color:#1e293b;">"${escapeHtml(item.sentence)}"</div>` +
        (item.highlightPhrase ? `<div style="font-size:14px; color:#475569; margin-top:6px;">Cốt lõi: <b>${escapeHtml(item.highlightPhrase)}</b></div>` : '');
      const back = `<div style="font-size:18px; color:#0f766e; font-weight:bold;">${escapeHtml(item.vietnamese || '')}</div>` +
        (item.usageNote ? `<div style="font-size:13px; color:#64748b; margin-top:8px; font-style:italic;">Ghi chú: ${escapeHtml(item.usageNote)}</div>` : '');
      const tag = (item.tag || 'Sentences').replace(/\s+/g, '_');
      lines.push([front, back, '', '', '', `FX_English ${tag}`].join('\t'));
      return;
    }

    // 4. Standard Vocabulary Word Card
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
    ['"Từ vựng / Cụm từ / Cấu trúc"', '"Loại"', '"Cấp độ CEFR"', '"Phiên âm IPA"', '"Nghĩa tiếng Việt"', '"Tần suất"', '"Câu ngữ cảnh / Ghi chú"'].join(',')
  ];

  items.forEach((item) => {
    // 1. Pattern
    if (item.pos === 'pattern' || item.isPattern) {
      const patternText = item.patternTemplate || item.patternFormula || item.word;
      const example = item.sentence || item.contexts?.[0]?.text || item.usageNote || '';
      rows.push([
        `"${patternText.replace(/"/g, '""')}"`,
        `"Cấu trúc câu"`,
        `"${item.cefr || ''}"`,
        `""`,
        `"${(item.vietnamese || item.meaningVi || '').replace(/"/g, '""')}"`,
        item.frequency || 1,
        `"${example.replace(/"/g, '""')}"`
      ].join(','));
      return;
    }

    // 2. Phrase
    if (item.pos === 'phrase' || item.isPhrase) {
      const phraseText = item.word || item.sentence || '';
      const note = item.usageNote || item.contexts?.[0]?.text || '';
      rows.push([
        `"${phraseText.replace(/"/g, '""')}"`,
        `"Cụm từ"`,
        `"${item.cefr || ''}"`,
        `""`,
        `"${(item.vietnamese || item.meaningVi || '').replace(/"/g, '""')}"`,
        item.frequency || 1,
        `"${note.replace(/"/g, '""')}"`
      ].join(','));
      return;
    }

    // 3. Sentence
    if (item.sentence && item.isCommunicative) {
      rows.push([
        `"${(item.sentence || '').replace(/"/g, '""')}"`,
        `"${(item.tag || 'Câu hay').replace(/"/g, '""')}"`,
        `"Giao tiếp"`,
        `""`,
        `"${(item.vietnamese || '').replace(/"/g, '""')}"`,
        item.frequency || 1,
        `"${(item.usageNote || item.sentence || '').replace(/"/g, '""')}"`
      ].join(','));
      return;
    }

    // 4. Word
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

  return '\uFEFF' + rows.join('\r\n');
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
      `<div style="font-size:13px; color:#64748b; margin-top:6px;">Loại: <b>${escapeHtml(pos)}</b> (Mastered)</div>`;

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

  return '\uFEFF' + rows.join('\r\n');
}

export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}
