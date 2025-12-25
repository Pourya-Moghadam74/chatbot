import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { logout } from '../store/authSlice';
import { deleteConversation, listConversations } from '../api/chat.api';

const iconPaths = {
  spark: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-300">
      <path
        d="M12 3.5 13.6 9l4.9 2-4.9 2L12 18.5 10.4 13 5.5 11l4.9-2L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-cyan-200">
      <path
        d="M12 4 6 6.5v5.4c0 3.6 2.7 5.9 6 7.6 3.3-1.7 6-4 6-7.6V6.5L12 4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="m9.5 12 1.7 1.7 3.3-3.4"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-200">
      <path
        d="M12 4 3.5 19h17L12 4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M12 10.5V13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1.1" fill="currentColor" />
    </svg>
  ),
};

const columns = [
  {
    title: 'Examples',
    description: 'Jump in with a curated starting point.',
    tone: 'from-emerald-500/15 to-emerald-500/5',
    icon: iconPaths.spark,
    items: [
      'Explain serverless in plain language.',
      'Generate interview prep questions.',
      'Summarize this article into bullet points.',
    ],
  },
  {
    title: 'Capabilities',
    description: 'Made for conversational, context-aware replies.',
    tone: 'from-cyan-400/15 to-cyan-400/5',
    icon: iconPaths.shield,
    items: [
      'Remembers what you said earlier in the chat.',
      'Lets you steer responses with clear instructions.',
      'Composes emails, outlines, and specs quickly.',
    ],
  },
  {
    title: 'Limitations',
    description: 'What to keep in mind while you chat.',
    tone: 'from-amber-400/15 to-amber-400/5',
    icon: iconPaths.alert,
    items: [
      'May produce inaccurate or outdated details.',
      'Does not browse the live internet here.',
      'Best results come from specific prompts.',
    ],
  },
];

const promptIdeas = [
  'Draft a product update announcement about a new feature.',
  'Rewrite this paragraph to sound calmer and more confident.',
  'Outline a 5-day learning plan to get started with React.',
  'Turn bullet notes into a clear email for my team.',
  'Brainstorm interview questions for a frontend engineer.',
  'Summarize this meeting transcript into action items.',
];

const createSessionId = () => crypto.randomUUID();

export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(false);
  const [convDeletingId, setConvDeletingId] = useState(null);
  const [ideas, setIdeas] = useState(promptIdeas);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [headerModalOpen, setHeaderModalOpen] = useState(false);
  const [promptValue, setPromptValue] = useState('');
  const [promptWarning, setPromptWarning] = useState('');

  const handleSignOut = () => {
    dispatch(logout());
    navigate('/login');
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        setConvLoading(true);
        const res = await listConversations();
        setConversations(res.data || []);
      } catch (err) {
        // keep silent if not available
      } finally {
        setConvLoading(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    // Clear prompt warning when auth state changes (e.g., sign in/out)
    setPromptWarning('');
  }, [user]);

  const handleDelete = async (id, session_id, e) => {
    e.stopPropagation();
    if (!session_id) return;
    try {
      setConvDeletingId(id);
      await deleteConversation(id, session_id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      // ignore for now
    } finally {
      setConvDeletingId(null);
    }
  };

  const shuffleIdeas = () => {
    setIdeas((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const useIdea = (idea) => {
    const sid = createSessionId();
    navigate(`/chat?session_id=${encodeURIComponent(sid)}&prompt=${encodeURIComponent(idea)}`);
  };

  const handlePromptSend = () => {
    const trimmed = promptValue.trim();
    if (!trimmed) return;
    if (!user) {
      setPromptWarning('Please sign in or sign up to start chatting.');
      return;
    }
    const sid = createSessionId();
    navigate(`/chat?session_id=${encodeURIComponent(sid)}&prompt=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0b1021] text-gray-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-14 px-6 py-10 md:py-14">
        <header className="flex flex-wrap items-center justify-between gap-4 lg:flex-nowrap">
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-200">
              <svg viewBox="0 0 24 24" className="h-6 w-6">
                <path
                  d="M12 3.5c-1.4 0-3 .6-4.1 1.6L5 7.8 7.9 10c.7.6 1.3 1.7 1.3 2.6v3.2c0 1.1.8 2 1.8 2h2c1 0 1.8-.9 1.8-2v-3.2c0-.9.6-2 1.3-2.6l2.9-2.2-2.9-2.7C15 4.1 13.4 3.5 12 3.5Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-gray-400">GroqFlow</p>
              <p className="text-lg font-semibold text-white">GroqFlow Home</p>
            </div>

            {/* RIGHTMOST BURGER BUTTON */}
            <div className="ml-auto flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={() => setHeaderModalOpen(true)}
                className="rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-100 transition hover:border-white/35"
              >
                Account & model
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="rounded-full border border-white/20 bg-white/5 p-2 text-gray-100 transition hover:border-white/35 lg:hidden"
                aria-label="Open conversations"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                >
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="hidden items-center justify-end gap-3 lg:ml-auto lg:flex lg:flex-wrap">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-200">
              Model · Groq (Llama 3.1)
            </span>

            {user ? (
              <>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={() => navigate('/chat')}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01]"
                >
                  New chat
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:border-white/35"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:border-white/35"
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01]"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </header>

        {headerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm lg:hidden">
            <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f1427] p-5 shadow-2xl shadow-black/40">
              <button
                type="button"
                onClick={() => setHeaderModalOpen(false)}
                className="absolute right-3 top-3 rounded-full border border-white/20 bg-white/5 px-2 py-1 text-xs text-gray-200 transition hover:border-white/35"
              >
                Close
              </button>
              <div className="mb-3">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Quick access</p>
                <h2 className="text-lg font-semibold text-white">Account & model</h2>
              </div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-gray-200">
                  Model Aú Groq (Llama 3.1)
                </span>
                {user && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                    {user.email}
                  </span>
                )}
              </div>
              {user ? (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderModalOpen(false);
                      navigate('/chat');
                    }}
                    className="w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:scale-[1.01]"
                  >
                    New chat
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderModalOpen(false);
                      handleSignOut();
                    }}
                    className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:border-white/35"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setHeaderModalOpen(false)}
                    className="w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-center text-sm font-semibold text-gray-100 transition hover:border-white/35"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setHeaderModalOpen(false)}
                    className="w-full rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-black transition hover:scale-[1.01]"
                  >
                    Sign up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="hidden w-full max-h-[75vh] overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur lg:block lg:w-72">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Your conversations</p>
              {convLoading && <span className="text-xs text-gray-400">Loading…</span>}
            </div>
            {(!conversations || conversations.length === 0) && !convLoading && (
              <p className="text-sm text-gray-400">No conversations yet.</p>
            )}
            <div className="space-y-2">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className="w-full text-left rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gray-100 transition hover:border-white/25 hover:bg-white/[0.07]"
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() =>
                        navigate(`/chat/${c.id}?session_id=${encodeURIComponent(c.session_id || '')}`)
                      }
                    >
                      <p className="font-semibold text-white truncate">
                        {c.title || 'Untitled conversation'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Session {c.session_id?.slice(0, 8) || '—'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(c.id, c.session_id, e)}
                        className="rounded-full border border-white/20 px-2 py-1 text-xs text-gray-200 transition hover:border-red-400 hover:text-red-300"
                        disabled={convDeletingId === c.id}
                      >
                        {convDeletingId === c.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {sidebarOpen && (
            <div className="fixed inset-0 z-40 flex lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
              <div className="relative z-50 flex h-full w-4/5 max-w-xs flex-col rounded-r-2xl border-r border-white/10 bg-[#0b1021] p-4 backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Your conversations</p>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="text-xs text-gray-300"
                  >
                    Close
                  </button>
                </div>
                {convLoading && <span className="text-xs text-gray-400 mb-2">Loading…</span>}
                {(!conversations || conversations.length === 0) && !convLoading && (
                  <p className="text-sm text-gray-400">No conversations yet.</p>
                )}
                <div className="space-y-2 overflow-y-auto">
                  {conversations.map((c) => (
                    <div
                      key={c.id}
                      className="w-full text-left rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-gray-100 transition hover:border-white/25 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => {
                            setSidebarOpen(false);
                            navigate(`/chat/${c.id}?session_id=${encodeURIComponent(c.session_id || '')}`);
                          }}
                        >
                          <p className="font-semibold text-white truncate">
                            {c.title || 'Untitled conversation'}
                          </p>
                          <p className="text-xs text-gray-400">
                            Session {c.session_id?.slice(0, 8) || '—'}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              handleDelete(c.id, c.session_id, e);
                            }}
                            className="rounded-full border border-white/20 px-2 py-1 text-xs text-gray-200 transition hover:border-red-400 hover:text-red-300"
                            disabled={convDeletingId === c.id}
                          >
                            {convDeletingId === c.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col gap-14">
            <section className="flex flex-col items-center gap-5 text-center">
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
                Powered by Groq acceleration
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Meet GroqFlow! Fast answers, Clean chats.
              </h1>
              <p className="max-w-2xl text-lg text-gray-300">
                Start a conversation or pick a suggestion to see what this assistant can do. GroqFlow runs on Groq-hosted Llama 3.1 for low-latency replies.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(user ? '/chat' : '/login')}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/10 transition hover:-translate-y-0.5"
                >
                  Start a new chat
                </button>
                <button
                  type="button"
                  onClick={() => navigate(user ? '/chat' : '/login')}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-gray-100 transition hover:border-white/25"
                >
                  Browse suggestions
                </button>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {columns.map((col) => (
                <div
                  key={col.title}
                  className={`flex flex-col gap-3 rounded-2xl border border-white/10 bg-gradient-to-b ${col.tone} p-5 backdrop-blur`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
                      {col.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{col.title}</p>
                      <p className="text-xs text-gray-400">{col.description}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2.5 pt-1">
                    {col.items.map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-gray-200"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-400">Prompt ideas</p>
                  <h2 className="text-2xl font-semibold text-white">Pick a starting point</h2>
                </div>
                <button
                  type="button"
                  onClick={shuffleIdeas}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-gray-100 transition hover:border-white/35"
                >
                  Shuffle ideas
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {ideas.map((prompt) => (
                  <div
                    key={prompt}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4 text-sm text-gray-100"
                    onClick={() => useIdea(prompt)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-transparent opacity-0 transition group-hover:opacity-100" />
                    <p className="relative pr-8 leading-relaxed">{prompt}</p>
                    <div className="relative mt-4 flex items-center justify-between text-xs text-emerald-200">
                      <span>Use prompt</span>
                      <svg viewBox="0 0 24 24" className="h-4 w-4">
                        <path
                          d="M10 7l5 5-5 5"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-gray-200">Prompt</label>
                <div className="group relative rounded-2xl border border-white/10 bg-[#0f1427] shadow-inner shadow-black/40 transition focus-within:border-emerald-400/40 focus-within:shadow-emerald-500/10">
                  <textarea
                    rows="3"
                    placeholder="Message GroqFlow..."
                    value={promptValue}
                    onChange={(e) => {
                      setPromptValue(e.target.value);
                      if (promptWarning) setPromptWarning('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePromptSend();
                      }
                    }}
                    className="w-full resize-none rounded-2xl bg-transparent px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handlePromptSend}
                    className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-emerald-500 text-black opacity-90 shadow-lg shadow-emerald-500/20 transition hover:opacity-100"
                    aria-label="Send prompt"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4">
                      <path
                        d="M5 12h14M12 5l7 7-7 7"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
                {promptWarning ? (
                  <p className="mt-2 text-xs text-amber-300">{promptWarning}</p>
                ) : (
                  <p className="mt-2 text-xs text-gray-400">
                    Tip: give clear instructions or paste context to steer the conversation—GroqFlow loves specifics.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
