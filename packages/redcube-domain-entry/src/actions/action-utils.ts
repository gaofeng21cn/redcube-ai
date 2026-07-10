export function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

export function requireField(name: string, value: unknown): string {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

export function requireSafeSegment(name: string, value: unknown): string {
  const text = requireField(name, value);
  if (/[\\/]/.test(text)) {
    throw new Error(`${name} 不能包含路径分隔符`);
  }
  if (text.includes('..')) {
    throw new Error(`${name} 不能包含父目录引用`);
  }
  return text;
}
