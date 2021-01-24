import type { Logger } from './logger'

type ConfigFunctionConstructor<C> = (logger?: Logger) => C | Promise<C>
type PropertyConfigFunctionConstructor<T> = (logger?: Logger) => T | Promise<T>

type ConfigConstructor<C> =
  | ConfigFunctionConstructor<C>
  | Promise<C>
  | C
  | { [k in keyof C]: PropertyConfigFunctionConstructor<C[k]> | C[k] | Promise<C[k]> }

const isFunction = (v: unknown): v is ConfigFunctionConstructor<unknown> =>
  typeof v === 'function' && v instanceof Function

const isPromise = (v: unknown): v is Promise<unknown> => v instanceof Promise

const resolveConfig = async <C>(config: ConfigConstructor<C> | undefined | null, logger: Logger): Promise<C> => {
  if (!config) {
    return {} as C
  }

  if (typeof config === 'function' && config instanceof Function) {
    return Promise.resolve(config(logger))
  }

  if (config instanceof Promise) {
    return config
  }

  return Object.entries(config).reduce((acc, entry) => {
    const [key, value] = entry
    return acc.then(resolvedConfig => {
      if (isFunction(value)) {
        return Promise.resolve(value(logger)).then(resolvedValue => ({ ...resolvedConfig, [key]: resolvedValue }))
      } else if (isPromise(value)) {
        return value.then(resolvedValue => ({ ...resolvedConfig, [key]: resolvedValue }))
      } else {
        return { ...resolvedConfig, [key]: value }
      }
    })
  }, Promise.resolve({} as C))
}

export { resolveConfig }
export type { ConfigFunctionConstructor, ConfigConstructor }
