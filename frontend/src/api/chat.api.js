import api from './axiosClient';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const createConversation = (sessionId, title) =>
  api.post('/conversations', { session_id: sessionId, title });

export const getConversation = (conversationId, sessionId) =>
  api.get(`/conversations/${conversationId}`, {
    params: { session_id: sessionId },
  });

export const listConversations = (sessionId) =>
  api.get('/conversations', {
    params: sessionId ? { session_id: sessionId } : {},
  });

export const deleteConversation = (conversationId, sessionId) =>
  api.delete(`/conversations/${conversationId}`, {
    params: { session_id: sessionId },
  });

export const sendMessage = (conversationId, sessionId, content) =>
  api.post(
    `/conversations/${conversationId}/messages`,
    { content },
    { params: { session_id: sessionId } }
  );

export const streamMessage = async (
  conversationId,
  sessionId,
  content,
  onChunk,
  onDone,
) => {
  const token = localStorage.getItem('access_token');
  const url = `${BASE_URL}/conversations/${conversationId}/messages/stream?session_id=${encodeURIComponent(sessionId)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(text || 'Stream request failed');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Normalize CRLF and split on SSE frame boundary
    const normalized = buffer.replace(/\r\n/g, '\n');
    const parts = normalized.split('\n\n');
    buffer = parts.pop() || '';

    for (const part of parts) {
      const lines = part.split('\n').filter(Boolean);
      let event = 'message';
      let dataLines = [];

      for (const line of lines) {
        if (line.startsWith('event:')) {
          event = line.replace('event:', '').trim();
        } else if (line.startsWith('data:')) {
          // Preserve whitespace inside data; do not trim to keep spaces from streamed tokens
          dataLines.push(line.slice(5));
        }
      }

      const data = dataLines.join('\n');

      if (event === 'message') {
        onChunk?.(data);
      } else if (event === 'done') {
        onDone?.();
      }
    }
  }

  // Safety: ensure onDone fires when stream closes without an explicit done event
  onDone?.();
};
