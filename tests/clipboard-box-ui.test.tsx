import { render, screen, waitFor } from "@testing-library/preact"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"
import { useEffect } from "preact/hooks"

import { useClipboardBoxController } from "@/features/clipboard-box/controller"
import type { ClipboardWorkspacePorts } from "@/modules/clipboard-workspace"

const makePorts = (): ClipboardWorkspacePorts => {
  const storage = new Map<string, string>()

  return {
    load: async (password) => storage.get(password ?? "legacy") ?? "",
    save: async ({ password, text }) => {
      storage.set(password ?? "legacy", text)
    },
    ensurePassword: async (password) => {
      storage.set(password, storage.get(password) ?? "")
    },
    copyText: async () => true,
  }
}

const Harness = ({ ports }: { readonly ports: ClipboardWorkspacePorts }) => {
  const controller = useClipboardBoxController(ports)

  useEffect(() => {
    if (controller.showPasswordInput) {
      controller.passwordInputRef.current?.focus()
    }
  }, [controller.passwordInputRef, controller.showPasswordInput])

  useEffect(() => {
    if (controller.password && !controller.showPasswordInput) {
      controller.inputRef.current?.focus()
    }
  }, [controller.inputRef, controller.password, controller.showPasswordInput])

  return (
    <div>
      <button type="button" onClick={controller.togglePasswordInput}>
        Toggle Password
      </button>
      {controller.showPasswordInput && (
        <input
          ref={controller.passwordInputRef}
          aria-label="Password"
          value={controller.pendingPassword}
          onInput={(event) =>
            controller.setPendingPassword(
              (event.target as HTMLInputElement).value,
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              void controller.onSubmitPassword()
            }
          }}
        />
      )}
      <textarea
        ref={controller.inputRef}
        aria-label="Clipboard text"
        disabled={!controller.password}
        value={controller.text}
        onInput={(event) =>
          controller.setText((event.target as HTMLTextAreaElement).value)
        }
      />
    </div>
  )
}

describe("clipboard box controller ui", () => {
  it.effect("keeps password input focus and then restores editor focus after password activation", () =>
    Effect.gen(function* () {
      render(<Harness ports={makePorts()} />)

      const user = userEvent.setup()
      yield* Effect.promise(() =>
        user.click(screen.getByRole("button", { name: "Toggle Password" })),
      )

      const passwordInput = screen.getByLabelText("Password")
      expect(document.activeElement).toBe(passwordInput)

      yield* Effect.promise(() => user.keyboard("secret"))
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }))
      expect(document.activeElement).toBe(passwordInput)

      yield* Effect.promise(() => user.keyboard("{Enter}"))

      const editor = screen.getByLabelText("Clipboard text") as HTMLTextAreaElement
      yield* Effect.promise(() =>
        waitFor(() => {
          expect(editor.disabled).toBe(false)
          expect(document.activeElement).toBe(editor)
        }),
      )
    }),
  )
})
