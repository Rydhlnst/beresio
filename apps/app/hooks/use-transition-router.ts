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

  const push = useCallback(
    (href: Href, options?: NavigateOptions) => {
      start()
      router.push(href, options)
    },
    [router, start]
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

  return {
    push,
    replace,
    back,
    forward,
    refresh: router.refresh,
    prefetch: router.prefetch,
  }
}
