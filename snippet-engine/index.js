// Snippet Engine Plugin — tab stops, placeholders, transforms, per-language snippets
// Snippet Motoru Eklentisi — tab durakları, yer tutucular, dönüşümler, dile özel snippetler

// Snippet registry: language -> Map<prefix, snippetDef>
// Snippet kayıt defteri: dil -> Map<prefix, snippetDef>
const registry_ = new Map();

// Active snippet session (tab stop navigation state)
// Aktif snippet oturumu (tab durağı gezinme durumu)
let activeSession_ = null;

// ─── Snippet Parsing ─────────────────────────────────────
// ─── Snippet Ayrıştırma ─────────────────────────────────

// Parse tab stops and placeholders from a snippet body line
// Bir snippet gövde satırından tab duraklarını ve yer tutucuları ayrıştır
function parseTabStops_(text) {
  const stops = [];
  let result = '';
  let i = 0;

  while (i < text.length) {
    // Check for escaped dollar sign
    // Kaçırılmış dolar işaretini kontrol et
    if (text[i] === '\\' && text[i + 1] === '$') {
      result += '$';
      i += 2;
      continue;
    }

    // Check for ${N:placeholder} pattern
    // ${N:placeholder} desenini kontrol et
    if (text[i] === '$' && text[i + 1] === '{') {
      const closeIdx = findMatchingBrace_(text, i + 1);
      if (closeIdx !== -1) {
        const inner = text.substring(i + 2, closeIdx);
        const colonIdx = inner.indexOf(':');

        if (colonIdx !== -1) {
          const index = parseInt(inner.substring(0, colonIdx), 10);
          const placeholder = inner.substring(colonIdx + 1);

          stops.push({
            index,
            placeholder,
            offset: result.length,
            length: placeholder.length
          });
          result += placeholder;
        } else {
          // Simple ${N} — same as $N
          // Basit ${N} — $N ile aynı
          const index = parseInt(inner, 10);
          stops.push({
            index,
            placeholder: '',
            offset: result.length,
            length: 0
          });
        }

        i = closeIdx + 1;
        continue;
      }
    }

    // Check for $N pattern (simple tab stop)
    // $N desenini kontrol et (basit tab durağı)
    if (text[i] === '$' && i + 1 < text.length) {
      const digitMatch = text.substring(i + 1).match(/^(\d+)/);
      if (digitMatch) {
        const index = parseInt(digitMatch[1], 10);
        stops.push({
          index,
          placeholder: '',
          offset: result.length,
          length: 0
        });
        i += 1 + digitMatch[1].length;
        continue;
      }
    }

    result += text[i];
    i++;
  }

  return { text: result, stops };
}

// Find matching closing brace, handling nested braces
// Eşleşen kapanış ayracını bul, iç içe ayraçları işle
function findMatchingBrace_(text, openIdx) {
  let depth = 1;
  for (let i = openIdx + 1; i < text.length; i++) {
    if (text[i] === '{') depth++;
    if (text[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

// ─── Snippet Session ─────────────────────────────────────
// ─── Snippet Oturumu ─────────────────────────────────────

class SnippetSession {
  constructor(tabStops, insertLine, insertCol) {
    // All tab stops across all lines, sorted by index
    // Tüm satırlardaki tüm tab durakları, dizine göre sıralı
    this.tabStops_ = tabStops;
    this.currentStopIdx_ = 0;
    this.insertLine_ = insertLine;
    this.insertCol_ = insertCol;

    // Unique sorted indices (excluding $0 which is always last)
    // Benzersiz sıralı dizinler ($0 her zaman son olduğundan hariç)
    const indices = [...new Set(tabStops.map(s => s.index))].sort((a, b) => a - b);

    // Move 0 to end (final cursor position)
    // 0'ı sona taşı (son imleç konumu)
    const zeroIdx = indices.indexOf(0);
    if (zeroIdx > -1) {
      indices.splice(zeroIdx, 1);
      indices.push(0);
    }

    this.orderedIndices_ = indices;
    this.currentOrderIdx_ = 0;
  }

  // Get current tab stop group
  // Geçerli tab durağı grubunu al
  current() {
    if (this.currentOrderIdx_ >= this.orderedIndices_.length) {
      return null;
    }

    const targetIndex = this.orderedIndices_[this.currentOrderIdx_];
    return this.tabStops_.filter(s => s.index === targetIndex);
  }

  // Move to next tab stop, return the stops or null if done
  // Sonraki tab durağına geç, durakları döndür veya bittiyse null
  next() {
    this.currentOrderIdx_++;
    const stops = this.current();
    if (!stops || stops.length === 0) {
      return null;
    }
    return stops;
  }

  // Move to previous tab stop
  // Önceki tab durağına geç
  prev() {
    if (this.currentOrderIdx_ > 0) {
      this.currentOrderIdx_--;
    }
    return this.current();
  }

  // Check if session is finished
  // Oturumun bitip bitmediğini kontrol et
  isFinished() {
    return this.currentOrderIdx_ >= this.orderedIndices_.length;
  }
}

// ─── Core Functions ──────────────────────────────────────
// ─── Temel İşlevler ──────────────────────────────────────

// Register snippets for a language
// Bir dil için snippet'leri kaydet
function register(language, snippets) {
  if (!registry_.has(language)) {
    registry_.set(language, new Map());
  }

  const langMap = registry_.get(language);

  for (const snippet of snippets) {
    if (!snippet.prefix || !snippet.body) {
      editor.log.warn('[snippet-engine] Skipping invalid snippet: missing prefix or body');
      continue;
    }

    langMap.set(snippet.prefix, {
      prefix: snippet.prefix,
      body: Array.isArray(snippet.body) ? snippet.body : [snippet.body],
      description: snippet.description || '',
      language
    });
  }

  editor.log.info(`[snippet-engine] Registered ${snippets.length} snippets for "${language}"`);
}

// Expand a snippet by prefix at the current cursor position
// Geçerli imleç konumunda bir snippet'i önek ile genişlet
async function expand(prefix) {
  // Determine current language
  // Geçerli dili belirle
  const buf = editor.buffers.current();
  const language = (buf && buf.language) || 'plaintext';

  // Look up snippet in language-specific registry, then fallback to 'all'
  // Dile özel kayıt defterinde snippet'i ara, sonra 'all'a geri dön
  let snippet = null;
  const langMap = registry_.get(language);
  if (langMap && langMap.has(prefix)) {
    snippet = langMap.get(prefix);
  }

  if (!snippet) {
    const allMap = registry_.get('all');
    if (allMap && allMap.has(prefix)) {
      snippet = allMap.get(prefix);
    }
  }

  if (!snippet) {
    editor.log.warn(`[snippet-engine] No snippet found for prefix "${prefix}" in language "${language}"`);
    return false;
  }

  // Get cursor position
  // İmleç konumunu al
  const cursor = editor.cursor.get();
  const line = cursor.line;
  const col = cursor.col;

  // Remove the prefix text that the user typed
  // Kullanıcının yazdığı önek metnini kaldır
  const prefixStart = col - prefix.length;
  if (prefixStart >= 0) {
    editor.buffer.deleteRange(line, prefixStart, line, col);
  }

  // Parse each body line for tab stops
  // Her gövde satırını tab durakları için ayrıştır
  const allStops = [];
  const expandedLines = [];

  for (let i = 0; i < snippet.body.length; i++) {
    const parsed = parseTabStops_(snippet.body[i]);
    expandedLines.push(parsed.text);

    // Adjust stop positions with line offset
    // Durak konumlarını satır ofsetiyle ayarla
    for (const stop of parsed.stops) {
      allStops.push({
        index: stop.index,
        placeholder: stop.placeholder,
        line: line + i,
        col: (i === 0 ? prefixStart : 0) + stop.offset,
        length: stop.length
      });
    }
  }

  // Insert the expanded text
  // Genişletilmiş metni ekle
  const insertCol = prefixStart >= 0 ? prefixStart : col;
  const fullText = expandedLines.join('\n');
  editor.buffer.insert(line, insertCol, fullText);

  // Create session if there are tab stops
  // Tab durakları varsa oturum oluştur
  if (allStops.length > 0) {
    activeSession_ = new SnippetSession(allStops, line, insertCol);

    // Jump to first tab stop
    // İlk tab durağına atla
    const firstStops = activeSession_.current();
    if (firstStops && firstStops.length > 0) {
      const first = firstStops[0];
      editor.cursor.set(first.line, first.col);

      // If placeholder has length, select it
      // Yer tutucu uzunluğa sahipse, seç
      if (first.length > 0) {
        editor.selection.set(first.line, first.col, first.line, first.col + first.length);
      }
    }
  } else {
    // No tab stops — place cursor at end of inserted text
    // Tab durağı yok — imleci eklenen metnin sonuna yerleştir
    const lastLine = line + expandedLines.length - 1;
    const lastCol = expandedLines.length === 1
      ? insertCol + expandedLines[0].length
      : expandedLines[expandedLines.length - 1].length;
    editor.cursor.set(lastLine, lastCol);
  }

  editor.log.info(`[snippet-engine] Expanded snippet "${prefix}"`);
  return true;
}

// Jump to next tab stop
// Sonraki tab durağına atla
function next() {
  if (!activeSession_) {
    editor.log.warn('[snippet-engine] No active snippet session');
    return false;
  }

  const stops = activeSession_.next();
  if (!stops || stops.length === 0) {
    // Session finished
    // Oturum bitti
    activeSession_ = null;
    editor.log.info('[snippet-engine] Snippet session completed');
    return false;
  }

  // Jump to the first stop in the group
  // Gruptaki ilk durağa atla
  const target = stops[0];
  editor.cursor.set(target.line, target.col);

  if (target.length > 0) {
    editor.selection.set(target.line, target.col, target.line, target.col + target.length);
  }

  return true;
}

// Jump to previous tab stop
// Önceki tab durağına atla
function prev() {
  if (!activeSession_) {
    editor.log.warn('[snippet-engine] No active snippet session');
    return false;
  }

  const stops = activeSession_.prev();
  if (!stops || stops.length === 0) {
    return false;
  }

  const target = stops[0];
  editor.cursor.set(target.line, target.col);

  if (target.length > 0) {
    editor.selection.set(target.line, target.col, target.line, target.col + target.length);
  }

  return true;
}

// List available snippets for a language
// Bir dil için mevcut snippet'leri listele
function listFor(language) {
  const results = [];

  // Language-specific snippets
  // Dile özel snippet'ler
  const langMap = registry_.get(language);
  if (langMap) {
    for (const [prefix, snippet] of langMap) {
      results.push({
        prefix,
        description: snippet.description,
        language: snippet.language,
        bodyPreview: snippet.body[0] || ''
      });
    }
  }

  // Global 'all' snippets
  // Genel 'all' snippet'leri
  const allMap = registry_.get('all');
  if (allMap) {
    for (const [prefix, snippet] of allMap) {
      // Don't duplicate if language already has same prefix
      // Dil zaten aynı öneke sahipse çoğaltma
      if (!langMap || !langMap.has(prefix)) {
        results.push({
          prefix,
          description: snippet.description,
          language: 'all',
          bodyPreview: snippet.body[0] || ''
        });
      }
    }
  }

  return results;
}

// Check if there is an active snippet session
// Aktif bir snippet oturumu olup olmadığını kontrol et
function isActive() {
  return activeSession_ !== null;
}

// Cancel active session
// Aktif oturumu iptal et
function cancel() {
  activeSession_ = null;
  editor.log.info('[snippet-engine] Snippet session cancelled');
}

// ─── Built-in Snippets ──────────────────────────────────
// ─── Yerleşik Snippet'ler ───────────────────────────────

// JavaScript snippets
// JavaScript snippet'leri
const jsSnippets = [
  {
    prefix: 'fn',
    body: [
      'function ${1:name}(${2:params}) {',
      '  $0',
      '}'
    ],
    description: 'Function declaration'
  },
  {
    prefix: 'log',
    body: ['console.log(${1:value});$0'],
    description: 'Console log'
  },
  {
    prefix: 'if',
    body: [
      'if (${1:condition}) {',
      '  $0',
      '}'
    ],
    description: 'If statement'
  },
  {
    prefix: 'for',
    body: [
      'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {',
      '  $0',
      '}'
    ],
    description: 'For loop'
  },
  {
    prefix: 'class',
    body: [
      'class ${1:ClassName} {',
      '  constructor(${2:params}) {',
      '    $0',
      '  }',
      '}'
    ],
    description: 'Class declaration'
  },
  {
    prefix: 'import',
    body: ["import { $1 } from '${2:module}';$0"],
    description: 'ES6 import'
  }
];

// Python snippets
// Python snippet'leri
const pySnippets = [
  {
    prefix: 'def',
    body: [
      'def ${1:function_name}(${2:params}):',
      '    ${3:pass}$0'
    ],
    description: 'Function definition'
  },
  {
    prefix: 'class',
    body: [
      'class ${1:ClassName}:',
      '    def __init__(self${2:, params}):',
      '        $0'
    ],
    description: 'Class definition'
  },
  {
    prefix: 'if',
    body: [
      'if ${1:condition}:',
      '    $0'
    ],
    description: 'If statement'
  },
  {
    prefix: 'for',
    body: [
      'for ${1:item} in ${2:iterable}:',
      '    $0'
    ],
    description: 'For loop'
  },
  {
    prefix: 'main',
    body: [
      "if __name__ == '__main__':",
      '    ${1:main()}$0'
    ],
    description: 'Main guard'
  }
];

// HTML snippets
// HTML snippet'leri
const htmlSnippets = [
  {
    prefix: 'html5',
    body: [
      '<!DOCTYPE html>',
      '<html lang="${1:en}">',
      '<head>',
      '  <meta charset="UTF-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>${2:Document}</title>',
      '</head>',
      '<body>',
      '  $0',
      '</body>',
      '</html>'
    ],
    description: 'HTML5 boilerplate'
  },
  {
    prefix: 'div',
    body: ['<div class="${1:class}">$0</div>'],
    description: 'Div element'
  },
  {
    prefix: 'link',
    body: ['<link rel="stylesheet" href="${1:style.css}">$0'],
    description: 'CSS link tag'
  },
  {
    prefix: 'script',
    body: ['<script src="${1:script.js}"></script>$0'],
    description: 'Script tag'
  }
];

// Register built-in snippets
// Yerleşik snippet'leri kaydet
register('javascript', jsSnippets);
register('python', pySnippets);
register('html', htmlSnippets);

// ─── Expose API ──────────────────────────────────────────
// ─── API'yi Aç ──────────────────────────────────────────

editor.snippet = {
  register,
  expand,
  next,
  prev,
  listFor,
  isActive,
  cancel
};

// ─── Register Commands ───────────────────────────────────
// ─── Komutları Kaydet ────────────────────────────────────

editor.commands.register('snippet.expand', async (args) => {
  if (!args || !args.prefix) throw new Error('prefix required');
  return await expand(args.prefix);
});

editor.commands.register('snippet.next', () => {
  return next();
});

editor.commands.register('snippet.prev', () => {
  return prev();
});

editor.commands.register('snippet.register', (args) => {
  if (!args || !args.language || !args.snippets) {
    throw new Error('language and snippets required');
  }
  register(args.language, args.snippets);
  return { registered: true, language: args.language, count: args.snippets.length };
});

editor.commands.register('snippet.list', (args) => {
  const language = (args && args.language) || 'javascript';
  return listFor(language);
});

// Log activation
// Aktivasyonu logla
editor.log.info('[snippet-engine] Plugin activated');
