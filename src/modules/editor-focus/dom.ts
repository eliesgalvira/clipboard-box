import type { EditorFocusAction, EditorFocusContext, KeyboardIntent } from "./domain"

export interface EditorAutofocusBindingOptions {
  readonly document: Document
  readonly decide: (
    context: EditorFocusContext,
    event: KeyboardIntent,
  ) => EditorFocusAction
  readonly getEditor: () => HTMLTextAreaElement | null
  readonly getPasswordInput: () => HTMLInputElement | null
  readonly isPasswordInputOpen: () => boolean
}

export const toKeyboardIntent = (event: KeyboardEvent): KeyboardIntent => ({
  key: event.key,
  ctrlKey: event.ctrlKey,
  metaKey: event.metaKey,
  altKey: event.altKey,
})

export const bindEditorAutofocus = (
  options: EditorAutofocusBindingOptions,
): (() => void) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    const editor = options.getEditor()

    if (!editor) {
      return
    }

    const passwordInput = options.getPasswordInput()
    const context: EditorFocusContext = {
      editorDisabled: editor.disabled,
      editorFocused: options.document.activeElement === editor,
      passwordInputFocused:
        passwordInput !== null && options.document.activeElement === passwordInput,
      passwordInputOpen: options.isPasswordInputOpen(),
    }

    const action = options.decide(context, toKeyboardIntent(event))

    if (action === "focus-editor") {
      editor.focus()
      return
    }

    if (action === "blur-editor") {
      editor.blur()
    }
  }

  options.document.addEventListener("keydown", handleKeyDown)
  return () => {
    options.document.removeEventListener("keydown", handleKeyDown)
  }
}
