import { render } from 'preact';
import { useRef, useEffect, useState } from 'preact/hooks';
import { ConvexProvider, ConvexReactClient, useConvex, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Clipboard, Database, Save as SaveIcon } from 'lucide-react';
import KeyboardIcon from './icons/KeyboardIcon';
import './tw.css';
import { useLocalStorage } from '@uidotdev/usehooks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { cn } from '@/lib/utils';

type FeedbackState = 'idle' | 'running' | 'done';
const SUCCESS_FEEDBACK_MS = 200;

export function App() {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const feedbackTimeouts = useRef<Partial<Record<'copy' | 'query' | 'save', number>>>({});
  const [text, setText] = useState<string>('');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false);
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false);
  const [pendingPassword, setPendingPassword] = useState<string>('');
  const [password, setPassword] = useLocalStorage<string | null>('password', null);
  const [, copyToClipboard] = useCopyToClipboard();
  const [copyFeedback, setCopyFeedback] = useState<FeedbackState>('idle');
  const [queryFeedback, setQueryFeedback] = useState<FeedbackState>('idle');
  const [saveFeedback, setSaveFeedback] = useState<FeedbackState>('idle');
  const convex = useConvex();
  const saveTextLegacy = useMutation(api.text.save);
  const saveByPassword = useMutation(api.text.saveByPassword);

  const clearFeedbackTimer = (key: 'copy' | 'query' | 'save') => {
    const timeout = feedbackTimeouts.current[key];
    if (timeout) {
      window.clearTimeout(timeout);
      delete feedbackTimeouts.current[key];
    }
  };

  const settleFeedback = (
    key: 'copy' | 'query' | 'save',
    setState: (value: FeedbackState) => void,
  ) => {
    clearFeedbackTimer(key);
    setState('done');
    feedbackTimeouts.current[key] = window.setTimeout(() => {
      setState('idle');
      delete feedbackTimeouts.current[key];
    }, SUCCESS_FEEDBACK_MS);
  };

  const resetFeedback = (
    key: 'copy' | 'query' | 'save',
    setState: (value: FeedbackState) => void,
  ) => {
    clearFeedbackTimer(key);
    setState('idle');
  };

  useEffect(() => {
    if (inputRef.current && password && !showPasswordInput) inputRef.current.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!inputRef.current) return;

      // Escape unfocuses the textarea
      if (event.key === 'Escape' && document.activeElement === inputRef.current) {
        inputRef.current.blur();
        return;
      }

      // Do not steal focus from the password input when it's open
      if (showPasswordInput) return;
      if (passwordInputRef.current && document.activeElement === passwordInputRef.current) {
        return;
      }
      if ( document.activeElement === inputRef.current) {
        return;
      }

      // Skip Space to preserve native page scrolling behavior
      if (event.key === ' ') {
        return;
      }

      // Allow text-editing shortcuts to auto-focus (Ctrl/Cmd + V, A, Z, Y)
      const isTextEditingShortcut =
        (event.ctrlKey || event.metaKey) &&
        ['v', 'a', 'z', 'y'].includes(event.key.toLowerCase());

      // Skip other modifier combos (let browser handle Ctrl+L, Ctrl+T, etc.)
      if ((event.ctrlKey || event.metaKey || event.altKey) && !isTextEditingShortcut) {
        return;
      }

      const isTypingKey =
        event.key.length === 1 ||
        event.key === 'Backspace' ||
        event.key === 'Delete';

      if (isTypingKey || isTextEditingShortcut) {
        inputRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPasswordInput, password]);

  useEffect(() => {
    return () => {
      clearFeedbackTimer('copy');
      clearFeedbackTimer('query');
      clearFeedbackTimer('save');
    };
  }, []);

  const onSave = async () => {
    clearFeedbackTimer('save');
    setSaveFeedback('running');
    try {
      const toSave = text.slice(0, 10000);
      if (password) {
        await saveByPassword({ password, value: toSave });
      } else {
        await saveTextLegacy({ value: toSave });
      }
      resetFeedback('save', setSaveFeedback);
    } catch (error) {
      resetFeedback('save', setSaveFeedback);
      throw error;
    }
  };

  const onQuery = async () => {
    clearFeedbackTimer('query');
    setQueryFeedback('running');
    setIsQuerying(true);
    let didLoad = false;
    try {
      let latest = '';
      if (password) {
        latest = await convex.query(api.text.getByPassword, { password });
      } else {
        latest = await convex.query(api.text.get, {});
      }
      setText(latest);
      didLoad = true;
    } finally {
      setIsQuerying(false);
      if (didLoad) {
        resetFeedback('query', setQueryFeedback);
      } else {
        resetFeedback('query', setQueryFeedback);
      }
      if (inputRef.current && password) inputRef.current.focus();
    }
  };

  const onCopy = async () => {
    clearFeedbackTimer('copy');
    setCopyFeedback('running');
    const didCopy = await copyToClipboard(text);
    if (didCopy) {
      settleFeedback('copy', setCopyFeedback);
    } else {
      setCopyFeedback('idle');
    }
    if (inputRef.current && password) inputRef.current.focus();
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

  const getIconButtonClass = (
    feedback: FeedbackState,
    options?: { loadingStyle?: 'default' | 'skeleton' },
  ) =>
    cn(
      'relative h-10 w-10 overflow-hidden rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-none transition-colors duration-150 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800',
      feedback === 'running' &&
        (options?.loadingStyle === 'skeleton'
          ? 'border-zinc-950 bg-zinc-950 text-zinc-100 disabled:opacity-100 hover:bg-zinc-950 dark:border-zinc-950 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-950'
          : 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-100'),
      feedback === 'done' &&
        'border-zinc-700 bg-zinc-700 text-white hover:bg-zinc-700 dark:border-zinc-300 dark:bg-zinc-300 dark:text-zinc-950 dark:hover:bg-zinc-300',
    );

  const queryLabel =
    queryFeedback === 'running' ? 'Loading' : queryFeedback === 'done' ? 'Loaded' : 'Query';
  const copyLabel =
    copyFeedback === 'running' ? 'Copying' : copyFeedback === 'done' ? 'Copied' : 'Copy';
  const saveLabel =
    saveFeedback === 'running' ? 'Saving' : saveFeedback === 'done' ? 'Saved' : 'Save';
  const queryLoading = queryFeedback === 'running';
  const saveLoading = saveFeedback === 'running';

  return (
    <div class="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div class="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div class="flex flex-col gap-4 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div class="min-w-0">
              <div class="flex items-center gap-3">
                <KeyboardIcon class="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
                <div class="text-base font-medium text-zinc-950 dark:text-zinc-100">Clipboard Box</div>
              </div>
              <div class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {password ? 'Protected clipboard active.' : 'Enter a password to enable editing.'}
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'h-10 rounded-md border-zinc-300 bg-white px-3 text-sm text-zinc-700 shadow-none transition-colors duration-150 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800',
                  showPasswordInput &&
                    'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-100',
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPasswordInput((v) => !v)}
                disabled={isSavingPassword}
              >
                {password ? 'Reset password' : 'Password'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={getIconButtonClass(queryFeedback, { loadingStyle: 'skeleton' })}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void onQuery()}
                disabled={!password || isQuerying}
                aria-label={queryLabel}
                title={queryLabel}
              >
                {queryLoading && (
                  <span
                    aria-hidden="true"
                    class="button-loading-overlay pointer-events-none absolute inset-0 rounded-[inherit] bg-zinc-500"
                  />
                )}
                <Database className="relative z-10" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={getIconButtonClass(copyFeedback)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void onCopy()}
                disabled={isQuerying}
                aria-label={copyLabel}
                title={copyLabel}
              >
                <Clipboard className="relative z-10" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={getIconButtonClass(saveFeedback, { loadingStyle: 'skeleton' })}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void onSave()}
                disabled={!password || isQuerying}
                aria-label={saveLabel}
                title={saveLabel}
              >
                {saveLoading && (
                  <span
                    aria-hidden="true"
                    class="button-loading-overlay pointer-events-none absolute inset-0 rounded-[inherit] bg-zinc-500"
                  />
                )}
                <SaveIcon className="relative z-10" />
              </Button>
            </div>
          </div>

          {showPasswordInput && (
            <div class="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:flex-row sm:items-center lg:px-6">
              <Input
                ref={passwordInputRef as any}
                type="password"
                placeholder="Enter password"
                value={pendingPassword}
                className="h-10 rounded-md border-zinc-300 bg-white text-sm shadow-none focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
                onChange={(e) => setPendingPassword((e.target as HTMLInputElement).value)}
                onKeyDown={(e) => {
                  if ((e as any).key === 'Enter') {
                    e.preventDefault();
                    void submitPassword();
                  }
                }}
                disabled={isSavingPassword}
              />
              <Button
                type="button"
                className="h-10 rounded-md bg-zinc-900 px-4 text-sm text-white shadow-none hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => void submitPassword()}
                disabled={isSavingPassword}
              >
                {isSavingPassword ? 'Saving...' : 'Enter'}
              </Button>
            </div>
          )}

          <div class="flex min-h-0 flex-1 flex-col p-4 lg:p-6">
            <label htmlFor="focus" class="sr-only">Clipboard text</label>
            <textarea
              id="focus"
              ref={inputRef}
              placeholder={
                password
                  ? 'Type or paste text.'
                  : 'Enter a password to start typing.'
              }
              rows={4}
              class="min-h-[360px] flex-1 resize-none rounded-md border border-zinc-300 bg-white px-4 py-3 text-[15px] leading-6 text-zinc-900 outline-none transition-colors duration-150 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-800 dark:disabled:bg-zinc-950 dark:disabled:text-zinc-500 lg:min-h-0"
              value={text}
              disabled={!password}
              readOnly={isQuerying}
              aria-busy={isQuerying}
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value.slice(0, 10000))}
            />
          </div>

          <div class="grid gap-2 border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 lg:grid-cols-[1.4fr_1.2fr_auto] lg:px-6">
            <div>Ctrl+V pastes. Ctrl+A selects all. Ctrl+Z and Ctrl+Y work from anywhere.</div>
            <div>Backspace and Delete refocus the editor. Escape blurs it.</div>
            <div class="text-zinc-500 dark:text-zinc-400">{text.length} / 10000</div>
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
