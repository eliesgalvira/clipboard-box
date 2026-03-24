export interface EditorFocusContext {
  readonly editorDisabled: boolean
  readonly editorFocused: boolean
  readonly passwordInputFocused: boolean
  readonly passwordInputOpen: boolean
}

export interface KeyboardIntent {
  readonly key: string
  readonly ctrlKey: boolean
  readonly metaKey: boolean
  readonly altKey: boolean
}

export type EditorFocusAction = "blur-editor" | "focus-editor" | "ignore"

const TEXT_EDITING_SHORTCUTS = new Set(["a", "v", "y", "z"])

export const decideEditorFocusAction = (
  context: EditorFocusContext,
  event: KeyboardIntent,
): EditorFocusAction => {
  if (context.editorDisabled) {
    return "ignore"
  }

  if (event.key === "Escape" && context.editorFocused) {
    return "blur-editor"
  }

  if (
    context.passwordInputOpen ||
    context.passwordInputFocused ||
    context.editorFocused
  ) {
    return "ignore"
  }

  if (event.key === " ") {
    return "ignore"
  }

  const isTextEditingShortcut =
    (event.ctrlKey || event.metaKey) &&
    TEXT_EDITING_SHORTCUTS.has(event.key.toLowerCase())

  if ((event.ctrlKey || event.metaKey || event.altKey) && !isTextEditingShortcut) {
    return "ignore"
  }

  const isTypingKey =
    event.key.length === 1 ||
    event.key === "Backspace" ||
    event.key === "Delete"

  return isTypingKey || isTextEditingShortcut ? "focus-editor" : "ignore"
}
