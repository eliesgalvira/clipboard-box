import { ConvexProvider, ConvexReactClient, useConvex, useMutation } from "convex/react"
import { render } from "preact"
import { useRef } from "preact/hooks"

import { ClipboardBoxApp } from "@/features/clipboard-box"

import { api } from "../convex/_generated/api"
import "./tw.css"

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL)
const ConvexProviderAny: any = ConvexProvider

const App = () => {
  const convexClient = useConvex()
  const saveTextLegacy = useMutation(api.text.save)
  const saveByPassword = useMutation(api.text.saveByPassword)
  const ensureByPassword = useMutation(api.text.ensureByPassword)
  const portsRef = useRef({
    load: async (_password: string | null) => "",
    save: async (_input: { readonly password: string | null; readonly text: string }) => {},
    ensurePassword: async (_password: string) => {},
    copyText: async (_text: string) => false,
  })

  portsRef.current.load = (password) =>
    password
      ? convexClient.query(api.text.getByPassword, { password })
      : convexClient.query(api.text.get, {})

  portsRef.current.save = ({ password, text }) =>
    password
      ? saveByPassword({ password, value: text }).then(() => undefined)
      : saveTextLegacy({ value: text }).then(() => undefined)

  portsRef.current.ensurePassword = async (password) => {
    await ensureByPassword({ password })
  }

  portsRef.current.copyText = async (text) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported")
      return false
    }

    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.warn("Copy failed", error)
      return false
    }
  }

  return (
    <ClipboardBoxApp ports={portsRef.current} />
  )
}

render(
  <ConvexProviderAny client={convex}>
    <App />
  </ConvexProviderAny>,
  document.getElementById("app")!,
)
