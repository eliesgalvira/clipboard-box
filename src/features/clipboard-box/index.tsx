import { useEffect, useRef } from "preact/hooks"

import {
  bindEditorAutofocus,
  makeEditorAutofocusRuntime,
  runEditorAutofocusDecision,
} from "@/modules/editor-focus"
import type { ClipboardWorkspacePorts } from "@/modules/clipboard-workspace"

import { useClipboardBoxController } from "./controller"
import { ClipboardBoxView } from "./view"

export const ClipboardBoxApp = ({
  ports,
}: {
  readonly ports: ClipboardWorkspacePorts
}) => {
  const controller = useClipboardBoxController(ports)
  const autofocusRuntimeRef = useRef(makeEditorAutofocusRuntime())

  useEffect(() => {
    const runtime = autofocusRuntimeRef.current

    return bindEditorAutofocus({
      document,
      getEditor: () => controller.inputRef.current ?? null,
      getPasswordInput: () => controller.passwordInputRef.current ?? null,
      isPasswordInputOpen: () => controller.showPasswordInput,
      decide: (context, event) =>
        runEditorAutofocusDecision(runtime, context, event),
    })
  }, [controller.inputRef, controller.passwordInputRef, controller.showPasswordInput])

  useEffect(() => {
    return () => {
      void autofocusRuntimeRef.current.dispose()
    }
  }, [])

  useEffect(() => {
    if (controller.password && !controller.showPasswordInput) {
      controller.inputRef.current?.focus()
    }
  }, [controller.password, controller.showPasswordInput, controller.inputRef])

  useEffect(() => {
    if (controller.showPasswordInput) {
      controller.passwordInputRef.current?.focus()
    }
  }, [controller.passwordInputRef, controller.showPasswordInput])

  return <ClipboardBoxView controller={controller} />
}
