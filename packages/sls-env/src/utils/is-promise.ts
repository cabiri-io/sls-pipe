const isPromise = (v: unknown): v is Promise<unknown> => v instanceof Promise

export { isPromise }
