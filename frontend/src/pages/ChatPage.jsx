import { useEffect, useMemo, useRef, useState } from 'react';
import { createConversation, getConversation, streamMessage } from '../api/chat.api';

const ensureSessionId = () => {
  const existing = localStorage.getItem('chat_session_id');
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  localStorage.setItem('chat_session_id', fresh);
  return fresh;
};

export default function ChatPage() {
  const [sessionId] = useState(ensureSessionId);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && conversationId && !loading,
    [input, conversationId, loading]
  );

  // Create a conversation on first load
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const res = await createConversation(sessionId, null);
        setConversationId(res.data.id);
      } catch (err) {
        setError('Unable to create conversation');
      }
    };
    bootstrap();
  }, [sessionId]);

  // Fetch existing messages if conversation already exists (fresh page reload)
  useEffect(() => {
    if (!conversationId) return;
    const load = async () => {
      try {
        const res = await getConversation(conversationId, sessionId);
        setMessages(res.data.messages || []);
      } catch {
        // ignore
      }
    };
    load();
  }, [conversationId, sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!canSend) return;
    setLoading(true);
    setError('');
    const content = input.trim();
    setInput('');

    setMessages((prev) => [
      ...prev,
      { role: 'user', content },
      { role: 'assistant', content: '' },
    ]);

    let assistantText = '';

    try {
      await streamMessage(
        conversationId,
        sessionId,
        content,
        (chunk) => {
          assistantText += chunk;
          setMessages((prev) => {
            const copy = [...prev];
            const lastIndex = copy.length - 1;
            copy[lastIndex] = { ...copy[lastIndex], content: assistantText };
            return copy;
          });
        },
        () => setLoading(false),
      );
    } catch (err) {
      setError('Failed to stream response');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0b1021] text-gray-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-10 top-20 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-0 top-40 h-56 w-56 rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Chat</p>
            <h1 className="text-lg font-semibold text-white">New conversation</h1>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
            Session {sessionId.slice(0, 8)}
          </span>
        </header>

        <main className="mt-6 flex flex-1 flex-col gap-4">
          <div className="flex-1 space-y-4 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            {messages.length === 0 && (
              <div className="text-center text-gray-400">
                Ask anything to start the conversation.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-emerald-500 text-black'
                      : 'bg-white/10 text-gray-100 border border-white/10'
                  }`}
                >
                  {msg.content || (msg.role === 'assistant' ? '…' : '')}
                </div>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-[#0f1427] p-4 shadow-inner shadow-black/40">
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              Prompt
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows="3"
              placeholder="Ask anything..."
              className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-emerald-400/60 focus:outline-none"
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Streaming powered by your configured model.
              </p>
              <button
                type="button"
                onClick={handleSend}
                disabled={!canSend}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition disabled:opacity-50"
              >
                {loading ? 'Streaming…' : 'Send'}
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
