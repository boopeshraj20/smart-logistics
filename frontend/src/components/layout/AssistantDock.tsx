import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, CornerDownLeft, Send, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { askGuide, GUIDE_SCOPE_NOTE, suggestedQuestions, type GuideResult, type GuideTopic } from '@/services/guide';
import { cn } from '@/lib/utils';

interface ChatItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  guide?: GuideResult;
}

let chatSeq = 0;
function nextId() {
  chatSeq += 1;
  return `msg-${chatSeq}`;
}

function GuideAnswer({ result, onNavigate }: { result: GuideResult; onNavigate: (to: string) => void }) {
  const { topic } = result;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        <Sparkles className="size-3" />
        {topic.section} · Guide
      </div>
      <p className="text-xs leading-relaxed text-ink-mid">{topic.answer}</p>
      {topic.link && (
        <button
          type="button"
          onClick={() => onNavigate(topic.link!.to)}
          className="mt-1 flex items-center gap-1.5 self-start rounded-full bg-accent-soft px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
        >
          <CornerDownLeft className="size-3" />
          {topic.link.label}
        </button>
      )}
    </div>
  );
}

export default function AssistantDock() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const navigate = useNavigate();

  function go(to: string) {
    setOpen(false);
    navigate(to);
  }

  function submit(raw: string) {
    const question = raw.trim();
    if (!question) return;
    setInput('');
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', content: question }]);
    const result = askGuide(question);
    if (result) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          content: result.topic.question,
          guide: result,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId(),
          role: 'assistant',
          content:
            "That's outside what I help with. I'm the in-app guide — try asking how to add a vehicle, create a shipment, optimize a route, read the AI forecasts, or use Demo and Presentation mode.",
        },
      ]);
    }
  }

  const chips = suggestedQuestions();

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.175, 0.885, 0.32, 1.02] }}
            className="glass-strong flex h-[440px] w-80 flex-col overflow-hidden shadow-[var(--shadow-xl)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Bot className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Lumina Guide</p>
                  <p className="text-[10px] text-ink-faint">How-to assistant</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close guide"
                className="focus-ring flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-h hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <div className="glass rounded-[var(--r-md)] bg-surface-h/50 px-3 py-2.5 text-xs leading-relaxed text-ink-mid">
                <p className="mb-1 font-medium text-ink">{GUIDE_SCOPE_NOTE}</p>
                <p>Quick picks:</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {chips.map((chip: GuideTopic) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => submit(chip.question)}
                      className="rounded-full border border-[var(--border)] bg-surface px-2.5 py-1 text-[11px] text-ink-mid transition-colors hover:border-accent/40 hover:text-accent"
                    >
                      {chip.question}
                    </button>
                  ))}
                </div>
              </div>

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    'rounded-[var(--r-md)] px-3 py-2.5 text-xs leading-relaxed',
                    m.role === 'user'
                      ? 'ml-6 bg-accent-soft text-ink'
                      : 'glass mr-4 bg-surface-h/50 text-ink-mid',
                  )}
                >
                  {m.guide ? <GuideAnswer result={m.guide} onNavigate={go} /> : m.content}
                </div>
              ))}

              {messages.length === 0 && (
                <p className="pt-1 text-center text-[10px] uppercase tracking-widest text-ink-faint">
                  Chat with the product guide
                </p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(input);
              }}
              className="flex items-center gap-2 border-t border-[var(--border)] p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask how to use the app…"
                aria-label="Ask the guide"
                className="focus-ring h-9 flex-1 rounded-[var(--r-md)] border border-[var(--border)] bg-surface-h/40 px-3 text-sm text-ink placeholder:text-ink-faint"
              />
              <button
                type="submit"
                aria-label="Send"
                className="focus-ring flex size-9 items-center justify-center rounded-[var(--r-md)] bg-accent text-white transition-colors hover:bg-accent-h disabled:opacity-40"
                disabled={!input.trim()}
              >
                <Send className="size-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open the in-app guide"
        className="glass-strong focus-ring flex size-[52px] items-center justify-center rounded-full text-accent shadow-[var(--shadow-lg)]"
      >
        <Bot className="size-6" />
      </motion.button>
    </div>
  );
}