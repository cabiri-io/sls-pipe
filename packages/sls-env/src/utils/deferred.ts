type ResolveHandler<T> = (value: T | PromiseLike<T>) => void
type RejectHandler = (reason: unknown) => void

class Deferred<T> {
  #promise: Promise<T>
  #resolve!: ResolveHandler<T>
  #reject!: RejectHandler
  constructor() {
    this.#promise = new Promise((resolve, reject) => {
      this.#resolve = resolve
      this.#reject = reject
    })
  }
  get promise(): Promise<T> {
    return this.#promise
  }
  get resolve(): ResolveHandler<T> {
    return this.#resolve
  }
  get reject(): RejectHandler {
    return this.#reject
  }
}

const createDeferredValue = <T>(): Deferred<T> => new Deferred()

export type { ResolveHandler, RejectHandler, Deferred }

export { createDeferredValue }
