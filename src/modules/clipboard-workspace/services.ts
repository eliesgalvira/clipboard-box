import { Effect, Layer, ServiceMap } from "effect"

import {
  normalizeClipboardText,
  normalizeOptionalPassword,
  normalizePassword,
} from "./model"

export interface ClipboardPersistencePorts {
  readonly load: (password: string | null) => Promise<string>
  readonly save: (input: {
    readonly password: string | null
    readonly text: string
  }) => Promise<void>
  readonly ensurePassword: (password: string) => Promise<void>
}

export interface SystemClipboardPorts {
  readonly copyText: (text: string) => Promise<boolean>
}

export interface ClipboardWorkspacePorts
  extends ClipboardPersistencePorts,
    SystemClipboardPorts {}

export class ClipboardPersistence extends ServiceMap.Service<
  ClipboardPersistence,
  {
    readonly load: (password: string | null) => Effect.Effect<string>
    readonly save: (input: {
      readonly password: string | null
      readonly text: string
    }) => Effect.Effect<void>
    readonly ensurePassword: (password: string) => Effect.Effect<void>
  }
>()("@clipboard-box/clipboard-workspace/ClipboardPersistence") {}

export class SystemClipboard extends ServiceMap.Service<
  SystemClipboard,
  {
    readonly copyText: (text: string) => Effect.Effect<boolean>
  }
>()("@clipboard-box/clipboard-workspace/SystemClipboard") {}

export const makeClipboardPersistenceLayer = (
  ports: ClipboardPersistencePorts,
): Layer.Layer<ClipboardPersistence> =>
  Layer.succeed(ClipboardPersistence, {
    load: Effect.fn("ClipboardPersistence.load")(function* (
      password: string | null,
    ) {
      return normalizeClipboardText(
        yield* Effect.promise(() => ports.load(normalizeOptionalPassword(password))),
      )
    }),
    save: Effect.fn("ClipboardPersistence.save")(function* (input) {
      yield* Effect.promise(() =>
        ports.save({
          password: normalizeOptionalPassword(input.password),
          text: normalizeClipboardText(input.text),
        }),
      )
    }),
    ensurePassword: Effect.fn("ClipboardPersistence.ensurePassword")(function* (
      password: string,
    ) {
      yield* Effect.promise(() => ports.ensurePassword(normalizePassword(password)))
    }),
  })

export const makeSystemClipboardLayer = (
  ports: SystemClipboardPorts,
): Layer.Layer<SystemClipboard> =>
  Layer.succeed(SystemClipboard, {
    copyText: Effect.fn("SystemClipboard.copyText")(function* (text: string) {
      return yield* Effect.promise(() =>
        ports.copyText(normalizeClipboardText(text)),
      )
    }),
  })
