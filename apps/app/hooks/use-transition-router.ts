"use client"

import { useCallback } from "react"
import { useRouter } from "next/navigation"
import { usePageProgress } from "@/components/shared/page-progress"

type RouterInstance = ReturnType<typeof useRouter>
type Href = Parameters<RouterInstance["push"]>[0]
type NavigateOptions = Parameters<RouterInstance["push"]>[1]

export function useTransitionRouter() {
  const router = useRouter()
  const { start } = usePageProgress()

  const getPrefetchTarget = useCallback((href: Href) => {
    if (typeof href !== "string") return null
    // Skip query/hash variants to avoid filling router cache with many transient URLs.
    if (!href.startsWith("/") || href.includes("?") || href.includes("#")) return null
    return href
  }, [])

  const prefetch = useCallback(
    (href: Href) => {
      const target = getPrefetchTarget(href)
      if (!target) return Promise.resolve()
      try {
        return router.prefetch(target)
      } catch {
        return Promise.resolve()
      }
    },
    [router, getPrefetchTarget]
  )

  const push = useCallback(
    (href: Href, options?: NavigateOptions) => {
      void prefetch(href)
      start()
      router.push(href, options)
    },
    [router, start, prefetch]
  )

  const replace = useCallback(
    (href: Href, options?: NavigateOptions) => {
      start()
      router.replace(href, options)
    },
    [router, start]
  )

  const back = useCallback(() => {
    start()
    router.back()
  }, [router, start])

  const forward = useCallback(() => {
    start()
    router.forward()
  }, [router, start])

  const refresh = useCallback(() => {
    start()
    router.refresh()
  }, [router, start])

  return {
    push,
    replace,
    back,
    forward,
    refresh,
    prefetch,
  }
}
