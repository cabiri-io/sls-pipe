import type { Logger } from './logger'
import { isPromise } from './utils/is-promise'

type ConfigFunctionConstructor<C> = (logger?: Logger, requestId?: string) => C | Promise<C>
type PropertyConfigFunctionConstructor<T> = (logger?: Logger, requestId?: string) => T | Promise<T>

type ConfigConstructor<C> =
  | ConfigFunctionConstructor<C>
  | Promise<C>
  | C
  | { [k in keyof C]: PropertyConfigFunctionConstructor<C[k]> | C[k] | Promise<C[k]> }

const isFunction = (v: unknown): v is ConfigFunctionConstructor<unknown> =>
  typeof v === 'function' && v instanceof Function

const configErrorHandler = (key: string, logger?: Logger) => (err: Error) => {
  const message = `failed to initialise config '${key}'`
  logger?.error({ err }, message)
  throw Error(message)
}

const resolveConfig = async <C>(
  config: ConfigConstructor<C> | undefined | null,
  logger: Logger,
  requestId?: string
): Promise<C> => {
  if (!config) {
    return {} as C
  }

  if (typeof config === 'function' && config instanceof Function) {
    return Promise.resolve(config(logger, requestId)).catch(configErrorHandler('config', logger))
  }

  if (config instanceof Promise) {
    return config
  }

  return Object.entries(config).reduce((acc, entry) => {
    const [key, value] = entry
    return acc.then(resolvedConfig => {
      if (isFunction(value)) {
        return Promise.resolve(value(logger, requestId))
          .then(resolvedValue => ({ ...resolvedConfig, [key]: resolvedValue }))
          .catch(configErrorHandler(key, logger))
      } else if (isPromise(value)) {
        return value
          .then(resolvedValue => ({ ...resolvedConfig, [key]: resolvedValue }))
          .catch(configErrorHandler(key, logger))
      } else {
        return { ...resolvedConfig, [key]: value }
      }
    })
  }, Promise.resolve({} as C))
}

export { resolveConfig }
export type { ConfigFunctionConstructor, ConfigConstructor }
