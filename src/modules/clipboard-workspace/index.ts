import { Effect, Layer } from "effect"

import {
  ClipboardPersistence,
  SystemClipboard,
  makeClipboardPersistenceLayer,
  makeSystemClipboardLayer,
  type ClipboardWorkspacePorts,
  type ClipboardPersistencePorts,
  type SystemClipboardPorts,
} from "./services"

export {
  MAX_CLIPBOARD_LENGTH,
  PASSWORD_STORAGE_KEY,
  hasPassword,
  normalizeClipboardText,
  normalizeOptionalPassword,
  normalizePassword,
} from "./model"
export {
  activatePassword,
  copyClipboardText,
  EmptyPasswordError,
  loadClipboard,
  saveClipboard,
} from "./program"
export {
  ClipboardPersistence,
  SystemClipboard,
  makeClipboardPersistenceLayer,
  makeSystemClipboardLayer,
}
export type {
  ClipboardPersistencePorts,
  ClipboardWorkspacePorts,
  SystemClipboardPorts,
}

export const runClipboardWorkspace = <A, E>(
  ports: ClipboardWorkspacePorts,
  effect: Effect.Effect<A, E, ClipboardPersistence | SystemClipboard>,
): Promise<A> =>
  Effect.runPromise(
    effect.pipe(Effect.provide(Layer.mergeAll(
      makeClipboardPersistenceLayer(ports),
      makeSystemClipboardLayer(ports),
    ))),
  )
