// observable-extras.ts
import { ObservablePolyfill, Subscription } from "./observable-poly"

// Keep it tiny:
export const filter =
  <T>(pred: (v: T) => boolean) =>
  (src: ObservablePolyfill<T>) =>
    new ObservablePolyfill<T>((observer) => {
      const sub = src.subscribe({
        next: (v) => {
          if (pred(v)) observer.next(v)
        },
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      })
      return () => sub.unsubscribe()
    })

// Cancels prior inner Observable when a new value arrives
export const switchMap =
  <T, R>(project: (v: T) => ObservablePolyfill<R>) =>
  (src: ObservablePolyfill<T>) =>
    new ObservablePolyfill<R>((observer) => {
      let inner: Subscription | null = null
      const outer = src.subscribe({
        next: (v) => {
          inner?.unsubscribe() // cancel previous
          const inner$ = project(v)
          inner = inner$.subscribe({
            next: (x) => observer.next(x),
            error: (e) => observer.error?.(e),
            complete: () => {
              /* wait for outer to finish */
            },
          })
        },
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      })
      return () => {
        inner?.unsubscribe()
        outer.unsubscribe()
      }
    })

// Wrap fetch → JSON with AbortController so unsubscribe() cancels the HTTP request
export const fromFetchJSON = <T = unknown>(url: string, init?: RequestInit) =>
  new ObservablePolyfill<T>((observer) => {
    const ctrl = new AbortController()
    fetch(url, { ...init, signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        const data = (await res.json()) as T
        observer.next(data)
        observer.complete?.()
      })
      .catch((err) => {
        // If aborted, treat as completion (optional)
        if ((err as any).name === "AbortError") observer.complete?.()
        else observer.error?.(err)
      })
    return () => ctrl.abort()
  })
