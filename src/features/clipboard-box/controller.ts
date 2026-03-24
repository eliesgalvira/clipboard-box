import type { MutableRef } from "preact/hooks"
import { useEffect, useRef, useState } from "preact/hooks"

import {
  activatePassword,
  copyClipboardText,
  hasPassword,
  loadClipboard,
  normalizeClipboardText,
  normalizeOptionalPassword,
  PASSWORD_STORAGE_KEY,
  runClipboardWorkspace,
  saveClipboard,
  type ClipboardWorkspacePorts,
} from "@/modules/clipboard-workspace"

type FeedbackState = "idle" | "running" | "done"
type FeedbackKey = "copy" | "query" | "save"

const SUCCESS_FEEDBACK_MS: Record<FeedbackKey, number> = {
  copy: 1600,
  query: 900,
  save: 900,
}

const readStoredPassword = (): string | null => {
  const stored =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem(PASSWORD_STORAGE_KEY)

  return normalizeOptionalPassword(stored)
}

const storePassword = (password: string | null): void => {
  if (typeof window === "undefined") {
    return
  }

  if (password === null) {
    window.localStorage.removeItem(PASSWORD_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(PASSWORD_STORAGE_KEY, password)
}

export interface ClipboardBoxController {
  readonly inputRef: MutableRef<HTMLTextAreaElement | null>
  readonly passwordInputRef: MutableRef<HTMLInputElement | null>
  readonly text: string
  readonly isQuerying: boolean
  readonly isSavingPassword: boolean
  readonly showPasswordInput: boolean
  readonly pendingPassword: string
  readonly password: string | null
  readonly copyFeedback: FeedbackState
  readonly queryFeedback: FeedbackState
  readonly saveFeedback: FeedbackState
  readonly setText: (value: string) => void
  readonly setPendingPassword: (value: string) => void
  readonly togglePasswordInput: () => void
  readonly queryLabel: string
  readonly copyLabel: string
  readonly saveLabel: string
  readonly queryLoading: boolean
  readonly saveLoading: boolean
  readonly onSave: () => Promise<void>
  readonly onQuery: () => Promise<void>
  readonly onCopy: () => Promise<void>
  readonly onSubmitPassword: () => Promise<void>
}

export const useClipboardBoxController = (
  ports: ClipboardWorkspacePorts,
): ClipboardBoxController => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const feedbackTimeouts = useRef<Partial<Record<FeedbackKey, number>>>({})
  const [text, setTextState] = useState<string>("")
  const [isQuerying, setIsQuerying] = useState<boolean>(false)
  const [isSavingPassword, setIsSavingPassword] = useState<boolean>(false)
  const [showPasswordInput, setShowPasswordInput] = useState<boolean>(false)
  const [pendingPassword, setPendingPassword] = useState<string>("")
  const [password, setPassword] = useState<string | null>(() => readStoredPassword())
  const [copyFeedback, setCopyFeedback] = useState<FeedbackState>("idle")
  const [queryFeedback, setQueryFeedback] = useState<FeedbackState>("idle")
  const [saveFeedback, setSaveFeedback] = useState<FeedbackState>("idle")

  const clearFeedbackTimer = (key: FeedbackKey) => {
    const timeout = feedbackTimeouts.current[key]

    if (timeout !== undefined) {
      window.clearTimeout(timeout)
      delete feedbackTimeouts.current[key]
    }
  }

  const settleFeedback = (
    key: FeedbackKey,
    setState: (value: FeedbackState) => void,
  ) => {
    clearFeedbackTimer(key)
    setState("done")
    feedbackTimeouts.current[key] = window.setTimeout(() => {
      setState("idle")
      delete feedbackTimeouts.current[key]
    }, SUCCESS_FEEDBACK_MS[key])
  }

  const resetFeedback = (
    key: FeedbackKey,
    setState: (value: FeedbackState) => void,
  ) => {
    clearFeedbackTimer(key)
    setState("idle")
  }

  const focusEditor = () => {
    if (hasPassword(password) && !showPasswordInput) {
      inputRef.current?.focus()
    }
  }

  const setText = (value: string) => {
    setTextState(normalizeClipboardText(value))
  }

  useEffect(() => {
    storePassword(password)
  }, [password])

  useEffect(() => {
    return () => {
      clearFeedbackTimer("copy")
      clearFeedbackTimer("query")
      clearFeedbackTimer("save")
    }
  }, [])

  useEffect(() => {
    if (!hasPassword(password)) {
      return
    }

    let cancelled = false

    setIsQuerying(true)
    void runClipboardWorkspace(ports, loadClipboard(password))
      .then((latest) => {
        if (!cancelled) {
          setText(latest)
        }
      })
      .catch((error) => {
        console.error(error)
      })
      .finally(() => {
        if (!cancelled) {
          setIsQuerying(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [password, ports])

  const onSave = async () => {
    clearFeedbackTimer("save")
    setSaveFeedback("running")

    try {
      await runClipboardWorkspace(
        ports,
        saveClipboard({
          password,
          text,
        }),
      )
      settleFeedback("save", setSaveFeedback)
    } catch (error) {
      resetFeedback("save", setSaveFeedback)
      console.error(error)
    }
  }

  const onQuery = async () => {
    clearFeedbackTimer("query")
    setQueryFeedback("running")
    setIsQuerying(true)

    try {
      const latest = await runClipboardWorkspace(ports, loadClipboard(password))
      setText(latest)
      resetFeedback("query", setQueryFeedback)
    } catch (error) {
      resetFeedback("query", setQueryFeedback)
      console.error(error)
    } finally {
      setIsQuerying(false)
      focusEditor()
    }
  }

  const onCopy = async () => {
    clearFeedbackTimer("copy")
    setCopyFeedback("running")

    try {
      const didCopy = await runClipboardWorkspace(ports, copyClipboardText(text))

      if (didCopy) {
        settleFeedback("copy", setCopyFeedback)
      } else {
        resetFeedback("copy", setCopyFeedback)
      }
    } catch (error) {
      resetFeedback("copy", setCopyFeedback)
      console.error(error)
    } finally {
      focusEditor()
    }
  }

  const onSubmitPassword = async () => {
    setIsSavingPassword(true)

    try {
      const nextPassword = await runClipboardWorkspace(
        ports,
        activatePassword(pendingPassword),
      )

      setPassword(nextPassword)
      setShowPasswordInput(false)
      setPendingPassword("")
      focusEditor()
    } catch (error) {
      console.error(error)
    } finally {
      setIsSavingPassword(false)
    }
  }

  return {
    inputRef,
    passwordInputRef,
    text,
    isQuerying,
    isSavingPassword,
    showPasswordInput,
    pendingPassword,
    password,
    copyFeedback,
    queryFeedback,
    saveFeedback,
    setText,
    setPendingPassword,
    togglePasswordInput: () => setShowPasswordInput((value) => !value),
    queryLabel:
      queryFeedback === "running" ? "Loading" : "Query",
    copyLabel:
      copyFeedback === "running"
        ? "Copying"
        : copyFeedback === "done"
          ? "Copied"
          : "Copy",
    saveLabel:
      saveFeedback === "running"
        ? "Saving"
        : saveFeedback === "done"
          ? "Saved"
          : "Save",
    queryLoading: queryFeedback === "running",
    saveLoading: saveFeedback === "running",
    onSave,
    onQuery,
    onCopy,
    onSubmitPassword,
  }
}
