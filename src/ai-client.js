/**
 * ai-client.js — Cloudflare Worker proxy edition
 * ----------------------------------------------------------------------------
 * All requests go to https://marshall-ai.nhhuy130.workers.dev/proxy.
 * The Worker holds GEMINI_API_KEY as an encrypted Cloudflare secret;
 * users never need to paste a key. Free tier: 100K req/day · no card.
 *
 * Streaming simulated client-side via word-chunked emission (real SSE was
 * dropped to keep the Worker simple — UX impact negligible).
 *
 * API surface preserved: streamPrompt, generateImage, hasApiKey, getApiKey,
 * setApiKey, clearApiKey, fileToPart, describeError. Callers don't change.
 * ----------------------------------------------------------------------------
 */

const WORKER_BASE = 'https://marshall-ai.nhhuy130.workers.dev';
const PROXY_URL = `${WORKER_BASE}/proxy`;

// ---- Key shims (no-op — Worker holds the real key) ------------------------
// Kept so admin UI (src/ai-ui.js) compiles. Returns true so the
// "stream-direct" path is taken; that path now calls the Worker.
export function getApiKey() { return 'managed-by-worker'; }
export function setApiKey() { return true; }
export function clearApiKey() { return true; }
export function hasApiKey() { return true; }

// ---- Streaming wrapper -----------------------------------------------------
// The Worker returns full text in one shot; we emit it in word-sized chunks
// so the existing typing UI keeps its feel.
export async function streamPrompt({
  systemPrompt,
  userPrompt,
  attachments = [],
  onChunk,
  signal,
  temperature = 0.8,
  maxTokens = 4096,
}) {
  let res;
  try {
    res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt,
        userPrompt,
        attachments,
        temperature,
        maxTokens,
      }),
      signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new Error('NETWORK_ERROR: ' + e.message);
  }

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const errBody = await res.json();
      msg = errBody?.message || errBody?.error || msg;
      if (res.status === 429) msg = 'RATE_LIMIT';
      if (res.status === 403) msg = 'FORBIDDEN_OR_QUOTA';
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const data = await res.json();
  const full = data?.reply || '';
  if (!full) throw new Error('EMPTY_REPLY');

  // Chunked emit — simulate streaming so the typewriter UI stays alive.
  if (typeof onChunk === 'function') {
    const words = full.split(/(\s+)/);
    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      onChunk(words[i]);
      // Tiny yield so the browser repaints; bigger chunks = faster perceived stream.
      if (i % 3 === 0) await new Promise(r => setTimeout(r, 15));
    }
  }
  return full;
}

// ---- Image generation — unsupported via Worker for now --------------------
export async function generateImage() {
  throw new Error('IMAGE_GEN_UNSUPPORTED');
}

// ---- Helper: encode a File to a Gemini-compatible inlineData part ---------
export function fileToPart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const comma = result.indexOf(',');
      if (comma === -1) return reject(new Error('Invalid file'));
      resolve({
        mimeType: file.type || 'application/octet-stream',
        data: result.slice(comma + 1),
      });
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

// ---- Friendly error messages ---------------------------------------------
export function describeError(err, lang = 'vi') {
  const msg = err?.message || String(err);
  const dict = {
    vi: {
      RATE_LIMIT: 'Quá nhiều yêu cầu. Thử lại sau 1 phút.',
      FORBIDDEN_OR_QUOTA: 'Tạm thời hết quota AI hôm nay. Vui lòng quay lại sau.',
      EMPTY_REPLY: 'AI không trả lời. Thử câu hỏi khác.',
      IMAGE_GEN_UNSUPPORTED: 'Tính năng tạo ảnh tạm thời tắt.',
      NETWORK_ERROR: 'Mất kết nối. Kiểm tra mạng và thử lại.',
      DEFAULT: 'Lỗi: ' + msg,
    },
    en: {
      RATE_LIMIT: 'Too many requests. Try again in a minute.',
      FORBIDDEN_OR_QUOTA: 'Daily AI quota reached. Please come back later.',
      EMPTY_REPLY: 'AI returned empty. Try a different question.',
      IMAGE_GEN_UNSUPPORTED: 'Image generation is temporarily disabled.',
      NETWORK_ERROR: 'Connection lost. Check network and retry.',
      DEFAULT: 'Error: ' + msg,
    },
  };
  const d = dict[lang] || dict.vi;
  if (msg.startsWith('RATE_LIMIT')) return d.RATE_LIMIT;
  if (msg.startsWith('FORBIDDEN_OR_QUOTA')) return d.FORBIDDEN_OR_QUOTA;
  if (msg.startsWith('EMPTY_REPLY')) return d.EMPTY_REPLY;
  if (msg.startsWith('IMAGE_GEN_UNSUPPORTED')) return d.IMAGE_GEN_UNSUPPORTED;
  if (msg.startsWith('NETWORK_ERROR')) return d.NETWORK_ERROR;
  return d.DEFAULT;
}
