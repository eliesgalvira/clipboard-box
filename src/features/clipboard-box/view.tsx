import { Clipboard, Database, Save as SaveIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { MAX_CLIPBOARD_LENGTH } from "@/modules/clipboard-workspace"
import KeyboardIcon from "@/icons/KeyboardIcon"

import type { ClipboardBoxController } from "./controller"

const getIconButtonClass = (
  feedback: ClipboardBoxController["copyFeedback"],
  options?: { readonly loadingStyle?: "default" | "skeleton" },
) =>
  cn(
    "relative h-10 w-10 overflow-hidden rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-none transition-colors duration-150 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
    feedback === "running" &&
      (options?.loadingStyle === "skeleton"
        ? "border-zinc-950 bg-zinc-950 text-zinc-100 disabled:opacity-100 hover:bg-zinc-950 dark:border-zinc-950 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-950"
        : "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-100"),
    feedback === "done" &&
      "border-zinc-700 bg-zinc-700 text-white hover:bg-zinc-700 dark:border-zinc-300 dark:bg-zinc-300 dark:text-zinc-950 dark:hover:bg-zinc-300",
  )

export const ClipboardBoxView = ({
  controller,
}: {
  readonly controller: ClipboardBoxController
}) => (
  <div class="min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <div class="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-4 py-4 sm:px-6 sm:py-6">
      <div class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div class="flex flex-col gap-4 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div class="min-w-0">
            <div class="flex items-center gap-3">
              <KeyboardIcon class="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              <div class="text-base font-medium text-zinc-950 dark:text-zinc-100">
                Clipboard Box
              </div>
            </div>
            <div class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {controller.password
                ? "Protected clipboard active."
                : "Enter a password to enable editing."}
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-10 rounded-md border-zinc-300 bg-white px-3 text-sm text-zinc-700 shadow-none transition-colors duration-150 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
                controller.showPasswordInput &&
                  "border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-900 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-100",
              )}
              onMouseDown={(event) => event.preventDefault()}
              onClick={controller.togglePasswordInput}
              disabled={controller.isSavingPassword}
            >
              {controller.password ? "Reset password" : "Password"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={getIconButtonClass(controller.queryFeedback, {
                loadingStyle: "skeleton",
              })}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void controller.onQuery()}
              disabled={!controller.password || controller.isQuerying}
              aria-label={controller.queryLabel}
              title={controller.queryLabel}
            >
              {controller.queryLoading && (
                <span
                  aria-hidden="true"
                  class="button-loading-overlay pointer-events-none absolute inset-0 rounded-[inherit] bg-zinc-500"
                />
              )}
              <Database className="relative z-10" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={getIconButtonClass(controller.copyFeedback)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void controller.onCopy()}
              disabled={controller.isQuerying}
              aria-label={controller.copyLabel}
              title={controller.copyLabel}
            >
              <Clipboard className="relative z-10" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={getIconButtonClass(controller.saveFeedback, {
                loadingStyle: "skeleton",
              })}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void controller.onSave()}
              disabled={!controller.password || controller.isQuerying}
              aria-label={controller.saveLabel}
              title={controller.saveLabel}
            >
              {controller.saveLoading && (
                <span
                  aria-hidden="true"
                  class="button-loading-overlay pointer-events-none absolute inset-0 rounded-[inherit] bg-zinc-500"
                />
              )}
              <SaveIcon className="relative z-10" />
            </Button>
          </div>
        </div>

        {controller.showPasswordInput && (
          <div class="flex flex-col gap-3 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800 sm:flex-row sm:items-center lg:px-6">
            <Input
              ref={controller.passwordInputRef}
              type="password"
              placeholder="Enter password"
              value={controller.pendingPassword}
              className="h-10 rounded-md border-zinc-300 bg-white text-sm shadow-none focus-visible:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
              onChange={(event) =>
                controller.setPendingPassword(
                  (event.target as HTMLInputElement).value,
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  void controller.onSubmitPassword()
                }
              }}
              disabled={controller.isSavingPassword}
            />
            <Button
              type="button"
              className="h-10 rounded-md bg-zinc-900 px-4 text-sm text-white shadow-none hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => void controller.onSubmitPassword()}
              disabled={controller.isSavingPassword}
            >
              {controller.isSavingPassword ? "Saving..." : "Enter"}
            </Button>
          </div>
        )}

        <div class="flex min-h-0 flex-1 flex-col p-4 lg:p-6">
          <label htmlFor="focus" class="sr-only">
            Clipboard text
          </label>
          <textarea
            id="focus"
            ref={controller.inputRef}
            placeholder={
              controller.password
                ? "Type or paste text."
                : "Enter a password to start typing."
            }
            rows={4}
            class="min-h-[360px] flex-1 resize-none rounded-md border border-zinc-300 bg-white px-4 py-3 text-[15px] leading-6 text-zinc-900 outline-none transition-colors duration-150 focus:border-zinc-500 focus:ring-4 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-800 dark:disabled:bg-zinc-950 dark:disabled:text-zinc-500 lg:min-h-0"
            value={controller.text}
            disabled={!controller.password}
            readOnly={controller.isQuerying}
            aria-busy={controller.isQuerying}
            onInput={(event) =>
              controller.setText((event.target as HTMLTextAreaElement).value)
            }
          />
        </div>

        <div class="grid gap-2 border-t border-zinc-200 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400 lg:grid-cols-[1.4fr_1.2fr_auto] lg:px-6">
          <div>
            Ctrl+V pastes. Ctrl+A selects all. Ctrl+Z and Ctrl+Y work from
            anywhere.
          </div>
          <div>
            Backspace and Delete refocus the editor. Escape blurs it.
          </div>
          <div class="text-zinc-500 dark:text-zinc-400">
            {controller.text.length} / {MAX_CLIPBOARD_LENGTH}
          </div>
        </div>
      </div>
    </div>
  </div>
)
