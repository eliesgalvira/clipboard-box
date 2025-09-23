import { render } from 'preact';
import { useRef, useEffect, useState } from 'preact/hooks';
import { ConvexProvider, ConvexReactClient, useConvex, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import KeyboardIcon from './icons/KeyboardIcon';
import './tw.css';
import { useLocalStorage } from '@uidotdev/usehooks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function App() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const [text, setText] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);
  const [pendingPassword, setPendingPassword] = useState<string>('');
  const [password, setPassword] = useLocalStorage<string | null>('password', null);
  const convex = useConvex();
  const saveTextLegacy = useMutation(api.text.save);
  const saveByPassword = useMutation(api.text.saveByPassword);

  useEffect(() => {
    if (inputRef.current && password && !showPasswordInput) inputRef.current.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!inputRef.current) return;
      // Do not steal focus from the password input when it's open
      if (showPasswordInput) return;
      if (passwordInputRef.current && document.activeElement === passwordInputRef.current) {
        return;
      }
      if ( document.activeElement === inputRef.current) {
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
  }, [showPasswordInput, password]);

  const onSave = async () => {
    const toSave = text.slice(0, 10000);
    if (password) {
      await saveByPassword({ password, value: toSave });
    } else {
      await saveTextLegacy({ value: toSave });
    }
  };

  const onQuery = async () => {
    setIsQuerying(true);
    try {
      let latest = '';
      if (password) {
        latest = await convex.query(api.text.getByPassword, { password });
      } else {
        latest = await convex.query(api.text.get, {});
      }
      setText(latest);
    } finally {
      setIsQuerying(false);
      if (inputRef.current && password) inputRef.current.focus();
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!password) return;
      setIsQuerying(true);
      try {
        const latest = await convex.query(api.text.getByPassword, { password });
        setText(latest);
      } finally {
        setIsQuerying(false);
      }
    };
    void load();
  }, [password, convex]);

  useEffect(() => {
    if (showPasswordInput) passwordInputRef.current?.focus();
  }, [showPasswordInput]);

  const submitPassword = async () => {
    const pw = pendingPassword.trim();
    if (!pw) return;
    setIsSavingPassword(true);
    try {
      // Ensure a row exists; if not, create with empty value.
      await convex.mutation(api.text.ensureByPassword, { password: pw });
      setPassword(pw);
      setShowPasswordInput(false);
      setPendingPassword('');
      // Do not alter current textarea content when switching password
      if (inputRef.current) inputRef.current.focus();
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 text-zinc-900 dark:text-zinc-100">
      <div class="w-full max-w-md md:max-w-2xl lg:max-w-3xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/70 backdrop-blur shadow-xl p-8 mx-4">
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
            placeholder={
              isQuerying
                ? 'Loading...'
                : password
                ? 'Type something...'
                : 'ENTER A PASSWORD TO ENABLE TYPING'
            }
            rows={4}
            class="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-lg shadow-sm outline-none focus:ring-4 focus:ring-indigo-300/50 focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            value={text}
            disabled={isQuerying || !password}
            onInput={(e) => setText((e.target as HTMLTextAreaElement).value.slice(0, 10000))}
          />
        </div>
        <div class="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            class="px-4 py-2 rounded-lg bg-orange-400 text-orange-800 hover:bg-orange-500 font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            onMouseDown={onQuery}
            disabled={!password || isQuerying}
          >
            Query
          </button>
          <div class="flex items-center gap-3">
            <Button
              type="button"
              variant="destructive"
              className="bg-red-700 hover:bg-red-800 text-red-100"
              onMouseDown={() => setShowPasswordInput((v) => !v)}
              disabled={isSavingPassword}
            >
              {password ? 'Reset password' : 'Password'}
            </Button>
            <button
              type="button"
              class="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-green-800 font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              onMouseDown={onSave}
              disabled={!password || isQuerying}
            >
              Save
            </button>
          </div>
        </div>

        {showPasswordInput && (
          <div class="mt-4 flex items-center gap-3">
            <Input
              ref={passwordInputRef as any}
              type="password"
              placeholder="Enter password"
              value={pendingPassword}
              onChange={(e) => setPendingPassword((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => {
                if ((e as any).key === 'Enter') {
                  e.preventDefault();
                  void submitPassword();
                }
              }}
              disabled={isSavingPassword}
            />
            <Button type="button" onMouseDown={submitPassword} disabled={isSavingPassword}>
              {isSavingPassword ? 'Saving...' : 'Enter'}
            </Button>
          </div>
        )}
        <div class="mt-6 grid grid-cols-2 gap-3 text-xs text-zinc-600 dark:text-zinc-400">
          <div class="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
            <div class="font-medium text-zinc-800 dark:text-zinc-200">Shortcuts</div>
            <div class="mt-1">Ctrl+V Paste</div>
            <div>Ctrl+A Select All</div>
            <div>Ctrl+Z Undo, Ctrl+Y Redo</div>
          </div>
          <div class="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2">
            <div class="font-medium text-zinc-800 dark:text-zinc-200">Typing</div>
            <div class="mt-1">Backspace/<wbr />Delete</div>
            <div>Word delete with Ctrl+Backspace/<wbr />Delete</div>
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

