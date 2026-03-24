import { Effect, Layer, ServiceMap } from "effect"

import {
  decideEditorFocusAction,
  type EditorFocusAction,
  type EditorFocusContext,
  type KeyboardIntent,
} from "./domain"

export class EditorAutofocus extends ServiceMap.Service<
  EditorAutofocus,
  {
    readonly decide: (
      context: EditorFocusContext,
      event: KeyboardIntent,
    ) => Effect.Effect<EditorFocusAction>
  }
>()("@clipboard-box/editor-focus/EditorAutofocus") {
  static readonly layer = Layer.succeed(this, {
    decide: Effect.fn("EditorAutofocus.decide")(function* (
      context: EditorFocusContext,
      event: KeyboardIntent,
    ) {
      return decideEditorFocusAction(context, event)
    }),
  })
}
