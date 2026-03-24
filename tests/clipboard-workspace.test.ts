import { describe, expect, it } from "@effect/vitest"
import { Effect } from "effect"

import {
  activatePassword,
  copyClipboardText,
  EmptyPasswordError,
  loadClipboard,
  MAX_CLIPBOARD_LENGTH,
  runClipboardWorkspace,
  saveClipboard,
  type ClipboardWorkspacePorts,
} from "@/modules/clipboard-workspace"

const makePorts = (): {
  readonly ports: ClipboardWorkspacePorts
  readonly storage: Map<string, string>
  readonly copies: Array<string>
  readonly ensured: Array<string>
} => {
  const storage = new Map<string, string>()
  const copies: Array<string> = []
  const ensured: Array<string> = []

  return {
    ports: {
      load: async (password) => storage.get(password ?? "legacy") ?? "",
      save: async ({ password, text }) => {
        storage.set(password ?? "legacy", text)
      },
      ensurePassword: async (password) => {
        ensured.push(password)
        storage.set(password, storage.get(password) ?? "")
      },
      copyText: async (text) => {
        copies.push(text)
        return true
      },
    },
    storage,
    copies,
    ensured,
  }
}

describe("clipboard workspace", () => {
  it.effect("activates and loads password-backed clipboards", () =>
    Effect.gen(function* () {
      const { ports, storage, ensured } = makePorts()

      storage.set("secret", "saved text")

      const password = yield* Effect.promise(() =>
        runClipboardWorkspace(ports, activatePassword(" secret ")),
      )
      const latest = yield* Effect.promise(() =>
        runClipboardWorkspace(ports, loadClipboard(password)),
      )

      expect(password).toBe("secret")
      expect(ensured).toEqual(["secret"])
      expect(latest).toBe("saved text")
    }),
  )

  it.effect("rejects empty passwords", () =>
    Effect.gen(function* () {
      const { ports } = makePorts()

      const didReject = yield* Effect.promise(async () => {
        try {
          await runClipboardWorkspace(ports, activatePassword("   "))
          return false
        } catch (error) {
          expect(error).toBeInstanceOf(EmptyPasswordError)
          return true
        }
      })

      expect(didReject).toBe(true)
    }),
  )

  it.effect("truncates saved and copied text to the maximum length", () =>
    Effect.gen(function* () {
      const { ports, copies, storage } = makePorts()
      const oversized = "x".repeat(MAX_CLIPBOARD_LENGTH + 50)

      yield* Effect.promise(() =>
        runClipboardWorkspace(
          ports,
          saveClipboard({
            password: "secret",
            text: oversized,
          }),
        ),
      )
      const copied = yield* Effect.promise(() =>
        runClipboardWorkspace(ports, copyClipboardText(oversized)),
      )

      expect(copied).toBe(true)
      expect(storage.get("secret")).toHaveLength(MAX_CLIPBOARD_LENGTH)
      expect(copies[0]).toHaveLength(MAX_CLIPBOARD_LENGTH)
    }),
  )
})
