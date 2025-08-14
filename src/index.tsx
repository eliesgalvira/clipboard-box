import { render } from 'preact';
import { useRef, useEffect, useState } from 'preact/hooks';
import { ConvexProvider, ConvexReactClient, useConvex, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import KeyboardIcon from './icons/KeyboardIcon';
import './tw.css';

export function App() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [text, setText] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const convex = useConvex();
  const saveText = useMutation(api.text.save);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!inputRef.current) return;
      if ( document.activeElement == inputRef.current) {
        return;
      }

      const isTypingKey =
        event.key.length === 1 ||
        event.key === 'Backspace' ||
        event.key === 'Delete';

      const isCopyCombo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c';
      if (isCopyCombo) {
        return;
      }

      if (isTypingKey) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const onSave = async () => {
    await saveText({ value: text });
  };

  const onQuery = async () => {
    setIsQuerying(true);
    try {
      const latest = await convex.query(api.text.get, {});
      setText(latest);
    } finally {
      setIsQuerying(false);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <div class="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur shadow-xl p-8 mx-4" style="width: 50vw;">
        <div class="flex items-center justify-center gap-3">
          <KeyboardIcon class="h-8 w-8 text-zinc-700 dark:text-zinc-200 opacity-80" />
          <h1 class="text-3xl font-semibold tracking-tight">Clipboard Box</h1>
        </div>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400 text-center">
          Copy and paste text with ease.
        </p>
        <div class="mt-6">
          <label htmlFor="focus" class="sr-only">Type something</label>
          <textarea
            id="focus"
            ref={inputRef}
            placeholder={isQuerying ? 'Loading...' : 'Type something...'}
            rows={4}
            class="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-lg shadow-sm outline-none focus:ring-4 focus:ring-indigo-300/50 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            value={text}
            disabled={isQuerying}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          />
        </div>
        <div class="mt-4 flex items-center justify-between">
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-orange-400 text-orange-800 hover:bg-orange-500 font-medium shadow-sm"
            onMouseDown={onQuery}
          >
            Query
          </button>
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-green-800 font-medium shadow-sm"
            onMouseDown={onSave}
          >
            Save
          </button>
        </div>
        <div class="mt-6 grid grid-cols-2 gap-3 text-xs text-zinc-600 dark:text-zinc-400">
          <div class="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
            <div class="font-medium text-zinc-800 dark:text-zinc-200">Shortcuts</div>
            <div class="mt-1">Ctrl+V Paste</div>
            <div>Ctrl+A Select All</div>
            <div>Ctrl+Z Undo, Ctrl+Y Redo</div>
          </div>
          <div class="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
            <div class="font-medium text-zinc-800 dark:text-zinc-200">Typing</div>
            <div class="mt-1">Backspace/Delete</div>
            <div>Word delete with Ctrl+Backspace/Delete</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
const ConvexProviderAny: any = ConvexProvider;

render(
  <ConvexProviderAny client={convex}>
    <App />
  </ConvexProviderAny>,
  document.getElementById('app')!
);

