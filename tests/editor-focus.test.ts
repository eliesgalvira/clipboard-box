import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"

import {
  bindEditorAutofocus,
  makeEditorAutofocusRuntime,
  runEditorAutofocusDecision,
} from "@/modules/editor-focus"

describe("editor autofocus", () => {
  it.effect("focuses the editor for typing and text-editing shortcuts", () =>
    Effect.gen(function* () {
      const runtime = makeEditorAutofocusRuntime()

      expect(
        runEditorAutofocusDecision(
          runtime,
          {
            editorDisabled: false,
            editorFocused: false,
            passwordInputFocused: false,
            passwordInputOpen: false,
          },
          { key: "a", ctrlKey: false, metaKey: false, altKey: false },
        ),
      ).toBe("focus-editor")

      expect(
        runEditorAutofocusDecision(
          runtime,
          {
            editorDisabled: false,
            editorFocused: false,
            passwordInputFocused: false,
            passwordInputOpen: false,
          },
          { key: "v", ctrlKey: true, metaKey: false, altKey: false },
        ),
      ).toBe("focus-editor")

      yield* Effect.promise(() => runtime.dispose())
    }),
  )

  it.effect("does not steal focus for unrelated shortcuts or blocked states", () =>
    Effect.gen(function* () {
      const runtime = makeEditorAutofocusRuntime()

      expect(
        runEditorAutofocusDecision(
          runtime,
          {
            editorDisabled: false,
            editorFocused: false,
            passwordInputFocused: false,
            passwordInputOpen: false,
          },
          { key: "l", ctrlKey: true, metaKey: false, altKey: false },
        ),
      ).toBe("ignore")

      expect(
        runEditorAutofocusDecision(
          runtime,
          {
            editorDisabled: false,
            editorFocused: false,
            passwordInputFocused: true,
            passwordInputOpen: false,
          },
          { key: "a", ctrlKey: false, metaKey: false, altKey: false },
        ),
      ).toBe("ignore")

      expect(
        runEditorAutofocusDecision(
          runtime,
          {
            editorDisabled: false,
            editorFocused: false,
            passwordInputFocused: false,
            passwordInputOpen: true,
          },
          { key: "Backspace", ctrlKey: false, metaKey: false, altKey: false },
        ),
      ).toBe("ignore")

      expect(
        runEditorAutofocusDecision(
          runtime,
          {
            editorDisabled: false,
            editorFocused: false,
            passwordInputFocused: false,
            passwordInputOpen: false,
          },
          { key: " ", ctrlKey: false, metaKey: false, altKey: false },
        ),
      ).toBe("ignore")

      yield* Effect.promise(() => runtime.dispose())
    }),
  )

  it.effect("blurs on escape and binds correctly to the document", () =>
    Effect.gen(function* () {
      const runtime = makeEditorAutofocusRuntime()
      const editor = document.createElement("textarea")
      const passwordInput = document.createElement("input")
      let blurred = false

      document.body.append(editor, passwordInput)
      const originalBlur = editor.blur.bind(editor)
      editor.blur = () => {
        blurred = true
        originalBlur()
      }
      editor.focus()

      const unbind = bindEditorAutofocus({
        document,
        getEditor: () => editor,
        getPasswordInput: () => passwordInput,
        isPasswordInputOpen: () => false,
        decide: (context, event) =>
          runEditorAutofocusDecision(runtime, context, event),
      })

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
      expect(blurred).toBe(true)

      passwordInput.focus()
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }))
      expect(document.activeElement).toBe(passwordInput)

      passwordInput.blur()
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace" }))
      expect(document.activeElement).toBe(editor)

      unbind()
      editor.remove()
      passwordInput.remove()
      yield* Effect.promise(() => runtime.dispose())
    }),
  )
})
