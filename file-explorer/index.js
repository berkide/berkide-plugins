// File Explorer Plugin — directory tree, file ops, gitignore filtering
// Dosya Gezgini Eklentisi — dizin ağacı, dosya işlemleri, gitignore filtreleme

// Gitignore pattern matcher (minimatch-like, no dependencies)
// Gitignore desen eşleştirici (minimatch benzeri, bağımlılıksız)
class GitignoreFilter {
  constructor() {
    // Cached patterns per directory
    // Dizin başına önbelleğe alınmış desenler
    this.cache_ = new Map();
  }

  // Convert a gitignore pattern to a RegExp
  // Bir gitignore desenini RegExp'e dönüştür
  patternToRegex_(pattern) {
    // Remove trailing spaces
    // Sondaki boşlukları kaldır
    pattern = pattern.trimEnd();

    // Skip empty lines and comments
    // Boş satırları ve yorumları atla
    if (!pattern || pattern.startsWith('#')) {
      return null;
    }

    // Handle negation
    // Olumsuzlama işlemi
    let negate = false;
    if (pattern.startsWith('!')) {
      negate = true;
      pattern = pattern.slice(1);
    }

    // Remove leading slash (anchored to root)
    // Baştaki eğik çizgiyi kaldır (köke sabitlenmiş)
    const anchored = pattern.startsWith('/');
    if (anchored) {
      pattern = pattern.slice(1);
    }

    // Remove trailing slash (directory only)
    // Sondaki eğik çizgiyi kaldır (yalnızca dizin)
    const dirOnly = pattern.endsWith('/');
    if (dirOnly) {
      pattern = pattern.slice(0, -1);
    }

    // Escape regex special characters except * and ?
    // * ve ? dışındaki regex özel karakterlerini kaçır
    let regex = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '{{GLOBSTAR}}')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '[^/]')
      .replace(/\{\{GLOBSTAR\}\}/g, '.*');

    // If not anchored and no slash in pattern, match any depth
    // Sabitlenmemişse ve desende eğik çizgi yoksa, herhangi bir derinlikte eşleştir
    if (!anchored && !pattern.includes('/')) {
      regex = '(^|.*/?)' + regex;
    } else {
      regex = '^' + regex;
    }

    regex += '(/.*)?$';

    return { regex: new RegExp(regex), negate, dirOnly };
  }

  // Load and parse .gitignore from a directory
  // Bir dizinden .gitignore dosyasını yükle ve ayrıştır
  async loadGitignore_(dirPath) {
    if (this.cache_.has(dirPath)) {
      return this.cache_.get(dirPath);
    }

    const gitignorePath = dirPath + '/.gitignore';
    let patterns = [];

    try {
      const content = await editor.file.read(gitignorePath);
      if (content) {
        const lines = content.split('\n');
        for (const line of lines) {
          const parsed = this.patternToRegex_(line);
          if (parsed) {
            patterns.push(parsed);
          }
        }
      }
    } catch (e) {
      // No .gitignore file, that's fine
      // .gitignore dosyası yok, sorun değil
    }

    this.cache_.set(dirPath, patterns);
    return patterns;
  }

  // Check if a relative path should be ignored
  // Göreceli bir yolun yoksayılıp yoksayılmayacağını kontrol et
  isIgnored(patterns, relativePath, isDir) {
    let ignored = false;

    for (const rule of patterns) {
      // If dirOnly rule but target is a file, skip
      // Yalnızca dizin kuralıysa ama hedef dosyaysa, atla
      if (rule.dirOnly && !isDir) {
        continue;
      }

      if (rule.regex.test(relativePath)) {
        ignored = !rule.negate;
      }
    }

    return ignored;
  }

  // Clear the cache
  // Önbelleği temizle
  clearCache() {
    this.cache_.clear();
  }
}

// Sort entries: folders first, then alphabetical (case-insensitive)
// Girişleri sırala: önce klasörler, sonra alfabetik (büyük/küçük harf duyarsız)
function sortEntries_(entries) {
  return entries.sort((a, b) => {
    // Folders before files
    // Klasörler dosyalardan önce
    if (a.type === 'directory' && b.type !== 'directory') return -1;
    if (a.type !== 'directory' && b.type === 'directory') return 1;

    // Alphabetical within same type
    // Aynı tür içinde alfabetik
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

// Default ignored directories (always filtered)
// Varsayılan yoksayılan dizinler (her zaman filtrelenir)
const DEFAULT_IGNORES = new Set(['.git', 'node_modules', '.DS_Store', 'Thumbs.db']);

// Main explorer object
// Ana gezgin nesnesi
const gitignore = new GitignoreFilter();

// List directory contents (files + folders, sorted: folders first)
// Dizin içeriğini listele (dosyalar + klasörler, sıralı: önce klasörler)
async function list(dirPath) {
  const raw = await editor.file.listDir(dirPath);
  const patterns = await gitignore.loadGitignore_(dirPath);
  const entries = [];

  for (const item of raw) {
    // Skip default ignores
    // Varsayılan yoksayılanları atla
    if (DEFAULT_IGNORES.has(item.name)) {
      continue;
    }

    const isDir = item.type === 'directory';

    // Check gitignore
    // Gitignore kontrol et
    if (gitignore.isIgnored(patterns, item.name, isDir)) {
      continue;
    }

    entries.push({
      name: item.name,
      type: item.type,
      path: dirPath + '/' + item.name,
      size: item.size || 0,
      modified: item.modified || null
    });
  }

  const sorted = sortEntries_(entries);

  // Emit refresh event
  // Yenileme olayı yayınla
  editor.events.emit('explorer.refreshed', { path: dirPath, count: sorted.length });

  return sorted;
}

// Recursive tree up to a given depth
// Verilen derinliğe kadar özyinelemeli ağaç
async function tree(dirPath, maxDepth = 3, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return [];
  }

  const entries = await list(dirPath);
  const result = [];

  for (const entry of entries) {
    const node = {
      name: entry.name,
      type: entry.type,
      path: entry.path,
      depth: currentDepth,
      children: []
    };

    // Recurse into directories
    // Dizinlere özyinelemeli gir
    if (entry.type === 'directory' && currentDepth + 1 < maxDepth) {
      try {
        node.children = await tree(entry.path, maxDepth, currentDepth + 1);
      } catch (e) {
        // Permission denied or other error, skip children
        // İzin reddedildi veya başka hata, alt öğeleri atla
        node.children = [];
      }
    }

    result.push(node);
  }

  return result;
}

// Create a file or folder
// Dosya veya klasör oluştur
async function create(filePath, type = 'file') {
  if (type === 'directory') {
    await editor.file.mkdir(filePath);
  } else {
    // Create empty file
    // Boş dosya oluştur
    await editor.file.write(filePath, '');
  }

  // Emit event
  // Olay yayınla
  editor.events.emit('explorer.refreshed', { path: filePath, action: 'create', type });

  return { path: filePath, type, created: true };
}

// Rename a file or folder
// Dosya veya klasörü yeniden adlandır
async function rename(oldPath, newPath) {
  await editor.file.rename(oldPath, newPath);

  editor.events.emit('explorer.refreshed', {
    oldPath,
    newPath,
    action: 'rename'
  });

  return { oldPath, newPath, renamed: true };
}

// Delete a file or folder
// Dosya veya klasörü sil
async function remove(filePath) {
  await editor.file.remove(filePath);

  editor.events.emit('explorer.refreshed', { path: filePath, action: 'delete' });

  return { path: filePath, deleted: true };
}

// Move a file or folder from src to dest
// Dosya veya klasörü kaynaktan hedefe taşı
async function move(src, dest) {
  await editor.file.rename(src, dest);

  editor.events.emit('explorer.refreshed', {
    src,
    dest,
    action: 'move'
  });

  return { src, dest, moved: true };
}

// Get file/folder info (size, modified, type)
// Dosya/klasör bilgisi al (boyut, değiştirilme, tür)
async function info(filePath) {
  const stat = await editor.file.stat(filePath);

  return {
    path: filePath,
    name: filePath.split('/').pop(),
    type: stat.isDirectory ? 'directory' : 'file',
    size: stat.size,
    modified: stat.modified,
    created: stat.created,
    permissions: stat.permissions || null
  };
}

// Select a file (emits event for UI to handle)
// Dosya seç (UI'nin işlemesi için olay yayınla)
function select(filePath) {
  editor.events.emit('explorer.selected', { path: filePath });
  return { path: filePath, selected: true };
}

// Expose explorer API on editor global
// Gezgin API'sini editor global'ına aç
editor.explorer = {
  list,
  tree,
  create,
  rename,
  delete: remove,
  move,
  info,
  select,
  clearCache: () => gitignore.clearCache()
};

// Register commands
// Komutları kaydet
editor.commands.register('explorer.list', async (args) => {
  const path = (args && args.path) || editor.cwd();
  return await list(path);
});

editor.commands.register('explorer.tree', async (args) => {
  const path = (args && args.path) || editor.cwd();
  const depth = (args && args.depth) || 3;
  return await tree(path, depth);
});

editor.commands.register('explorer.create', async (args) => {
  if (!args || !args.path) throw new Error('Path required');
  return await create(args.path, args.type || 'file');
});

editor.commands.register('explorer.rename', async (args) => {
  if (!args || !args.oldPath || !args.newPath) throw new Error('oldPath and newPath required');
  return await rename(args.oldPath, args.newPath);
});

editor.commands.register('explorer.delete', async (args) => {
  if (!args || !args.path) throw new Error('Path required');
  return await remove(args.path);
});

editor.commands.register('explorer.move', async (args) => {
  if (!args || !args.src || !args.dest) throw new Error('src and dest required');
  return await move(args.src, args.dest);
});

editor.commands.register('explorer.info', async (args) => {
  if (!args || !args.path) throw new Error('Path required');
  return await info(args.path);
});

editor.commands.register('explorer.select', (args) => {
  if (!args || !args.path) throw new Error('Path required');
  return select(args.path);
});

// Log activation
// Aktivasyonu logla
editor.log.info('[file-explorer] Plugin activated');
