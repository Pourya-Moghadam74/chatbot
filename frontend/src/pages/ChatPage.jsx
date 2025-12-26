import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createConversation, getConversation, streamMessage } from '../api/chat.api';

const newSessionId = () => crypto.randomUUID();

export default function ChatPage() {
  const navigate = useNavigate();
  const { conversationId: convoParam } = useParams();
  const [searchParams] = useSearchParams();
  const [sessionId, setSessionId] = useState(() => searchParams.get('session_id') || newSessionId());
  const [conversationId, setConversationId] = useState(convoParam ? Number(convoParam) : null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const [pendingPrompt, setPendingPrompt] = useState(searchParams.get('prompt') || '');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Sync state when query params or convo param change (for navigation from sidebar / prompt ideas)
  useEffect(() => {
    const sid = searchParams.get('session_id');
    const prm = searchParams.get('prompt');
    setSessionId((prev) => sid || prev || newSessionId());
    setPendingPrompt(prm || '');
    if (convoParam) {
      setConversationId(Number(convoParam));
    }
    setMessages([]);
  }, [searchParams, convoParam]);

  const canSend = useMemo(
    () => input.trim().length > 0 && conversationId && !loading,
    [input, conversationId, loading]
  );

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (!toast.message) return;
    const t = setTimeout(() => setToast({ message: '', type: 'info' }), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const isExistingRoute = Boolean(convoParam);

    if (isExistingRoute) {
      if (!conversationId) return;
      const loadExisting = async () => {
        try {
          const res = await getConversation(conversationId, sessionId);
          setMessages(res.data.messages || []);
          if (res.data.session_id) {
            setSessionId(res.data.session_id);
          }
          setError('');
        } catch (err) {
          setError('Unable to load conversation');
          showToast('Unable to load conversation', 'error');
        }
      };
      loadExisting();
      return;
    }

    // New conversation flow: only create if we don't already have one
    if (conversationId) return;

    const bootstrap = async () => {
      try {
        const res = await createConversation(sessionId, null);
        const newSid = res.data?.session_id || sessionId;
        setSessionId(newSid);
        setConversationId(res.data.id);
        setError('');
      } catch (err) {
        setError('Unable to create conversation');
        showToast('Unable to create conversation', 'error');
      }
    };
    setMessages([]);
    setError('');
    bootstrap();
  }, [sessionId, conversationId, convoParam]);

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

  const handleSend = async (overrideContent) => {
    const contentToSend = overrideContent?.trim() || input.trim();
    if (!contentToSend || !conversationId || loading) return;
    setLoading(true);
    setError('');
    if (!overrideContent) {
      setInput('');
    }

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: contentToSend },
      { role: 'assistant', content: '' },
    ]);

    let assistantText = '';

    try {
      await streamMessage(
        conversationId,
        sessionId,
        contentToSend,
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
      showToast('Failed to stream response', 'error');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (pendingPrompt && conversationId && !loading) {
      // auto-send the pending prompt once we have a conversation
      handleSend(pendingPrompt);
      setPendingPrompt('');
    }
  }, [pendingPrompt, conversationId, loading]);

  const handleNewChat = () => {
    navigate('/chat');
  };

  const renderAssistantContent = (text) => {
    if (!text) return '…';

    const parts = [];
    const codeRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    const renderInline = (str, key) => {
      const nodes = [];
      let i = 0;
      const inlineRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
      let m;
      while ((m = inlineRegex.exec(str)) !== null) {
        if (m.index > i) {
          nodes.push(<span key={`${key}-t-${m.index}`}>{str.slice(i, m.index)}</span>);
        }
        const token = m[0];
        const content = token.replace(/^\*+\s?|\*+$/g, '').replace(/^\*|\*$/g, '');
        if (token.startsWith('**')) {
          nodes.push(<strong key={`${key}-b-${m.index}`}>{content}</strong>);
        } else {
          nodes.push(<em key={`${key}-i-${m.index}`}>{content}</em>);
        }
        i = m.index + token.length;
      }
      if (i < str.length) {
        nodes.push(<span key={`${key}-end`}>{str.slice(i)}</span>);
      }
      return nodes;
    };

    const pushFormattedBlock = (raw, keyPrefix) => {
      const lines = raw.split('\n').filter((l) => l.trim().length > 0);
      const listItems = [];
      const otherLines = [];
      lines.forEach((line) => {
        if (/^[-*]\s+/.test(line)) {
          listItems.push(line.replace(/^[-*]\s+/, ''));
        } else {
          otherLines.push(line);
        }
      });

      if (listItems.length) {
        parts.push(
          <ul key={`${keyPrefix}-ul`} className="list-disc space-y-1 pl-5">
            {listItems.map((item, idx) => (
              <li key={`${keyPrefix}-li-${idx}`} className="whitespace-pre-wrap break-words">
                {renderInline(item, `${keyPrefix}-li-${idx}`)}
              </li>
            ))}
          </ul>
        );
      }

      if (otherLines.length) {
        parts.push(
          <p key={`${keyPrefix}-p`} className="whitespace-pre-wrap break-words">
            {renderInline(otherLines.join('\n'), `${keyPrefix}-p`)}
          </p>
        );
      }
    };

    while ((match = codeRegex.exec(text)) !== null) {
      const [snippet, lang, code] = match;
      if (match.index > lastIndex) {
        pushFormattedBlock(text.slice(lastIndex, match.index), `t-${match.index}`);
      }
      parts.push(
        <pre
          key={`c-${match.index}`}
          className="mt-2 overflow-x-auto rounded-xl bg-black/70 px-3 py-2 text-xs text-emerald-100"
        >
          <code>
            {lang ? `${lang}\n` : ''}
            {code.trim()}
          </code>
        </pre>
      );
      lastIndex = match.index + snippet.length;
    }

    if (lastIndex < text.length) {
      pushFormattedBlock(text.slice(lastIndex), 't-end');
    }

    return parts;
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
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
              Session {sessionId.slice(0, 8)}
            </span>
            <button
              type="button"
              onClick={handleNewChat}
              className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-gray-100 transition hover:border-white/35"
            >
              New chat
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black transition hover:scale-[1.01]"
            >
              Home
            </button>
          </div>
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
                      : 'bg-white/10 text-gray-100 border border-white/10 space-y-2'
                  }`}
                >
                  {msg.role === 'assistant'
                    ? renderAssistantContent(msg.content)
                    : msg.content}
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

      {toast.message && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-xl border px-4 py-3 text-sm shadow-xl ${
            toast.type === 'error'
              ? 'border-red-500/40 bg-red-500/15 text-red-100'
              : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-50'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
