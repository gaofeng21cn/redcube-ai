// @ts-nocheck
export function summarizeError(error) {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

export function optionalText(value) {
  const text = String(value || '').trim();
  return text || null;
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text.trim()) {
    return {};
  }
  return JSON.parse(text);
}

export function compactStringArray(value) {
  return Array.isArray(value)
    ? Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean))).sort()
    : [];
}
