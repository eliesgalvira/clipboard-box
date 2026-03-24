import { Data, Effect } from "effect"

import {
  normalizeClipboardText,
  normalizeOptionalPassword,
  normalizePassword,
} from "./model"
import { ClipboardPersistence, SystemClipboard } from "./services"

export class EmptyPasswordError extends Data.TaggedError(
  "EmptyPasswordError",
)<{}> {}

export const activatePassword = Effect.fn(
  "ClipboardWorkspace.activatePassword",
)(function* (rawPassword: string) {
  const password = normalizePassword(rawPassword)

  if (password.length === 0) {
    return yield* new EmptyPasswordError()
  }

  const persistence = yield* ClipboardPersistence.asEffect()
  yield* persistence.ensurePassword(password)
  return password
})

export const loadClipboard = Effect.fn("ClipboardWorkspace.loadClipboard")(
  function* (password: string | null) {
    const persistence = yield* ClipboardPersistence.asEffect()
    return yield* persistence.load(normalizeOptionalPassword(password))
  },
)

export const saveClipboard = Effect.fn("ClipboardWorkspace.saveClipboard")(
  function* (input: { readonly password: string | null; readonly text: string }) {
    const persistence = yield* ClipboardPersistence.asEffect()
    yield* persistence.save({
      password: normalizeOptionalPassword(input.password),
      text: normalizeClipboardText(input.text),
    })
  },
)

export const copyClipboardText = Effect.fn(
  "ClipboardWorkspace.copyClipboardText",
)(function* (text: string) {
  const clipboard = yield* SystemClipboard.asEffect()
  return yield* clipboard.copyText(normalizeClipboardText(text))
})
