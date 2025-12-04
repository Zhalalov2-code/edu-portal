// utils/options.js
const tryJson = (v) => {
  if (typeof v !== 'string') return { ok: false };
  const s = v.trim();
  if (!s) return { ok: false };
  try {
    return { ok: true, value: JSON.parse(s) };
  } catch {
    return { ok: false };
  }
};

const stripOuterQuotes = (s) => {
  if (typeof s !== 'string') return s;
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return s;
};

// Декодирует строки вида \"text\" и \u0414\u043e...
const decodeEscapes = (s) => {
  if (typeof s !== 'string') return String(s ?? '');
  let v = s;

  // 1) попробуем JSON.parse для одиночной строки — это снимет \uXXXX и \"
  //    но только если это валидная JSON-строка (в кавычках)
  if (!(v.startsWith('"') && v.endsWith('"'))) {
    // оборачиваем во временные кавычки
    try {
      const parsed = JSON.parse(`"${v.replace(/"/g, '\\"')}"`);
      return parsed;
    } catch {
      // игнор
    }
  } else {
    try {
      return JSON.parse(v);
    } catch {
      // игнор
    }
  }

  // 2) запасной путь: вручную снимаем экранирование самых частых случаев
  return v
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\');
};

const normalizeScalar = (val) => {
  // прогоняем пару раундов: parse -> снять кавычки -> decode
  let v = val;

  // до 3 попыток «разворачивания» вложенной JSON-строки
  for (let i = 0; i < 3; i++) {
    if (typeof v === 'string') {
      const p = tryJson(v);
      if (p.ok) {
        v = p.value;
        continue; // возможно, там ещё один слой
      }
    }
    break;
  }

  if (Array.isArray(v)) {
    // если нам зашла целая матрёшка массивов — расплющим на верхнем уровне
    return v.map(normalizeScalar).flat();
  }

  // Превращаем в строку и чистим
  if (typeof v !== 'string') v = String(v ?? '');

  v = stripOuterQuotes(v);
  v = decodeEscapes(v);

  // если после декодирования снова получилась JSON-строка — последняя попытка
  const final = tryJson(v);
  if (final.ok && typeof final.value === 'string') {
    return final.value;
  }

  return v;
};

/**
 * Приводит любые входные варианты к массиву человеко-читаемых строк.
 * Примеры:
 *  - "[\"$user\",\"let user\"]"        -> ["$user","let user"]
 *  - "\"$user\""                       -> ["$user"]
 *  - "\\u0414\\u043e..."               -> ["До..."]
 *  - ["\"$user\"","\\u0414..."]        -> ["$user","До..."]
 */
export const ensureArrayOptions = (raw) => {
  let val = raw;

  // разворачиваем строковый JSON до 3 слоёв
  for (let i = 0; i < 3; i++) {
    const parsed = tryJson(typeof val === 'string' ? val : '');
    if (parsed.ok) val = parsed.value;
    else break;
  }

  // если не массив — делаем массив
  if (!Array.isArray(val)) val = [val];

  // нормализуем каждый элемент
  const out = val.map(normalizeScalar).map((s) => {
    // окончательно снимаем возможные внешние кавычки
    return stripOuterQuotes(String(s ?? '').trim());
  });

  // фильтруем пустые
  return out.filter((s) => s !== '');
};
