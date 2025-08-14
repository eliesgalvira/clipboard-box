import { render } from 'preact';
import { useRef, useEffect } from 'preact/hooks';
import KeyboardIcon from './icons/KeyboardIcon';
import './tw.css';

export function App() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      const isTypingKey =
        event.key.length === 1 ||
        event.key === 'Backspace' ||
        event.key === 'Delete';

      if (
        isTypingKey &&
        document.activeElement !== inputRef.current &&
        inputRef.current
      ) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <div class="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur shadow-xl p-8 mx-4">
        <div class="flex items-center justify-center gap-3">
          <KeyboardIcon class="h-8 w-8 text-zinc-700 dark:text-zinc-200 opacity-80" />
          <h1 class="text-3xl font-semibold tracking-tight">Autofocus Input</h1>
        </div>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-400 text-center">
          Type anywhere — the input grabs focus automatically so your shortcuts just work.
        </p>
        <div class="mt-6">
          <label htmlFor="focus" class="sr-only">Type something</label>
          <input
            id="focus"
            ref={inputRef}
            placeholder="Type something..."
            class="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-lg shadow-sm outline-none focus:ring-4 focus:ring-indigo-300/50 focus:border-indigo-500"
          />
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

render(<App />, document.getElementById('app')!);

