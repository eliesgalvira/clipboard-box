import { Effect, ManagedRuntime } from "effect"

import { bindEditorAutofocus, toKeyboardIntent } from "./dom"
import {
  decideEditorFocusAction,
  type EditorFocusAction,
  type EditorFocusContext,
  type KeyboardIntent,
} from "./domain"
import { EditorAutofocus } from "./service"

export {
  bindEditorAutofocus,
  decideEditorFocusAction,
  EditorAutofocus,
  toKeyboardIntent,
}
export type { EditorFocusAction, EditorFocusContext, KeyboardIntent }

export const makeEditorAutofocusRuntime = (): ManagedRuntime.ManagedRuntime<
  EditorAutofocus,
  never
> => ManagedRuntime.make(EditorAutofocus.layer)

export const runEditorAutofocusDecision = (
  runtime: ManagedRuntime.ManagedRuntime<EditorAutofocus, never>,
  context: EditorFocusContext,
  event: KeyboardIntent,
): EditorFocusAction =>
  runtime.runSync(
    Effect.flatMap(EditorAutofocus.asEffect(), (service) =>
      service.decide(context, event),
    ),
  )
