"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type ProgressPhase = "idle" | "loading" | "finishing"

type PageProgressContextValue = {
  phase: ProgressPhase
  progressKey: number
  start: () => void
  done: () => void
}

const PageProgressContext = React.createContext<PageProgressContextValue | null>(null)

export function PageProgressProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [phase, setPhase] = React.useState<ProgressPhase>("idle")
  const [progressKey, setProgressKey] = React.useState(0)
  const phaseRef = React.useRef<ProgressPhase>("idle")
  const prevPath = React.useRef(pathname)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const finishingRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimeoutRef = React.useCallback((ref: React.MutableRefObject<ReturnType<typeof setTimeout> | null>) => {
    if (ref.current) {
      clearTimeout(ref.current)
      ref.current = null
    }
  }, [])

  React.useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const start = React.useCallback(() => {
    if (phaseRef.current === "loading") return
    setProgressKey((value) => value + 1)
    setPhase("loading")
    clearTimeoutRef(timeoutRef)
    timeoutRef.current = setTimeout(() => {
      setPhase((current) => (current === "loading" ? "finishing" : current))
    }, 10000)
  }, [clearTimeoutRef])

  const done = React.useCallback(() => {
    setPhase((current) => (current === "idle" ? "idle" : "finishing"))
  }, [])

  React.useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      done()
    }
  }, [pathname, done])

  React.useEffect(() => {
    if (phase === "finishing") {
      clearTimeoutRef(timeoutRef)
      clearTimeoutRef(finishingRef)
      finishingRef.current = setTimeout(() => {
        setPhase("idle")
      }, 250)
    }
  }, [phase, clearTimeoutRef])

  React.useEffect(
    () => () => {
      clearTimeoutRef(timeoutRef)
      clearTimeoutRef(finishingRef)
    },
    [clearTimeoutRef]
  )

  React.useEffect(() => {
    const handlePopState = () => start()
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [start])

  React.useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest("a")
      if (!anchor) return
      if (anchor.target && anchor.target !== "_self") return
      if (anchor.hasAttribute("download")) return
      if (anchor.dataset.noProgress === "true") return

      const href = anchor.getAttribute("href")
      if (!href || href.startsWith("#")) return
      if (href.startsWith("mailto:") || href.startsWith("tel:")) return

      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }

      if (url.origin !== window.location.origin) return

      const currentPath = `${window.location.pathname}${window.location.search}`
      const nextPath = `${url.pathname}${url.search}`
      if (currentPath === nextPath && url.hash) return

      start()
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [start])

  const value = React.useMemo<PageProgressContextValue>(
    () => ({ phase, progressKey, start, done }),
    [phase, progressKey, start, done]
  )

  return (
    <PageProgressContext.Provider value={value}>
      {children}
    </PageProgressContext.Provider>
  )
}

export function usePageProgress() {
  const context = React.useContext(PageProgressContext)
  if (!context) {
    throw new Error("usePageProgress must be used within PageProgressProvider.")
  }
  return context
}

export function PageProgressBar({ className }: { className?: string }) {
  const { phase, progressKey } = usePageProgress()
  const [reduceMotion, setReduceMotion] = React.useState(false)
  const [style, setStyle] = React.useState<{ width: string; opacity: number }>({
    width: "0%",
    opacity: 0,
  })
  const isVisible = phase !== "idle"

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  React.useEffect(() => {
    if (!isVisible) return

    if (phase === "loading") {
      setStyle({ width: "0%", opacity: 1 })
      const raf = window.requestAnimationFrame(() => {
        setStyle({ width: "85%", opacity: 1 })
      })
      return () => window.cancelAnimationFrame(raf)
    }

    setStyle({ width: "100%", opacity: 0 })
  }, [phase, progressKey, isVisible])

  if (!isVisible) return null

  return (
    <div
      key={progressKey}
      className={cn("fixed left-0 top-0 z-[70] h-[3px] bg-primary", className)}
      style={{
        width: style.width,
        opacity: style.opacity,
        transition: reduceMotion
          ? "none"
          : phase === "loading"
            ? "width 1100ms ease-out, opacity 150ms ease-out"
            : "width 200ms ease-out, opacity 200ms ease-out",
      }}
      aria-hidden="true"
    />
  )
}
