// observable-polyfill.ts
// A tiny Observable compatible with the TC39 proposal shape.
// If a native Observable ever appears, we won't override it.
declare global {
  interface Window { Observable?: typeof ObservablePolyfill }
}

type Teardown = () => void;

export interface Observer<T> {
  next(value: T): void;
  error?(err: unknown): void;
  complete?(): void;
}

export class Subscription {
  private _closed = false;
  constructor(private teardown?: Teardown) {}
  get closed() { return this._closed; }
  unsubscribe() {
    if (!this._closed) {
      this._closed = true;
      try { this.teardown?.(); } catch {}
    }
  }
}

export class ObservablePolyfill<T> {
  constructor(
    private _subscribe: (observer: Observer<T>) => void | Teardown | Subscription
  ) {}

  subscribe(observer: Observer<T> | ((value: T) => void)): Subscription {
    const safeObserver: Observer<T> =
      typeof observer === "function" ? { next: observer } : observer;

    let ended = false;

    const wrap = (fn?: (...args: any[]) => void) => (value?: any) => {
      if (!ended) {
        try { fn?.(value); } catch (err) { console.error(err); }
      }
    };

    const sink: Observer<T> = {
      next: wrap(safeObserver.next?.bind(safeObserver)),
      error: (err) => {
        if (!ended) {
          ended = true;
          wrap(safeObserver.error?.bind(safeObserver))(err);
        }
      },
      complete: () => {
        if (!ended) {
          ended = true;
          wrap(safeObserver.complete?.bind(safeObserver))();
        }
      }
    };

    const result = this._subscribe(sink) ?? undefined;

    if (result instanceof Subscription) return result;

    return new Subscription(
      typeof result === "function" ? result : undefined
    );
  }

  // Minimal operator support via pipe
  pipe<R>(op: (src: ObservablePolyfill<T>) => ObservablePolyfill<R>): ObservablePolyfill<R> {
    return op(this);
  }

  // Static helper similar to RxJS fromEvent, but tiny:
  static fromEvent<E extends Event>(target: EventTarget, type: string, options?: AddEventListenerOptions): ObservablePolyfill<E> {
    return new ObservablePolyfill<E>((observer) => {
      const handler = (ev: Event) => observer.next(ev as E);
      target.addEventListener(type, handler, options);
      return () => target.removeEventListener(type, handler, options);
    });
  }
}

// A tiny map operator for convenience
export const map =
  <T, R>(project: (v: T) => R) =>
  (src: ObservablePolyfill<T>) =>
    new ObservablePolyfill<R>((observer) =>
      src.subscribe({
        next: (v) => observer.next(project(v)),
        error: (e) => observer.error?.(e),
        complete: () => observer.complete?.(),
      })
    );

// Install as a global polyfill only if absent:
if (typeof window !== "undefined" && (window as any).Observable == null) {
  (window as any).Observable = ObservablePolyfill;
}

// (Optional) AsyncIterator interop so `for await...of` works.
(ObservablePolyfill.prototype as any)[Symbol.asyncIterator] = async function* <T>(this: ObservablePolyfill<T>) {
  const q: T[] = [];
  let resolveNext: ((v: IteratorResult<T>) => void) | null = null;
  let done = false;

  const sub = this.subscribe({
    next: (v) => {
      if (resolveNext) {
        resolveNext({ value: v, done: false });
        resolveNext = null;
      } else {
        q.push(v);
      }
    },
    error: () => { done = true; if (resolveNext) resolveNext({ value: undefined as any, done: true }); },
    complete: () => { done = true; if (resolveNext) resolveNext({ value: undefined as any, done: true }); },
  });

  try {
    while (!done || q.length) {
      if (q.length) {
        yield q.shift() as T;
      } else {
        const item = await new Promise<IteratorResult<T>>((res) => (resolveNext = res));
        if (item.done) break;
        yield item.value;
      }
    }
  } finally {
    sub.unsubscribe();
  }
};
