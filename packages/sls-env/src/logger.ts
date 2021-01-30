/**
 * Follows closely pino logger type definition
 */
interface LogFunction {
  (msg: string, ...args: Array<any>): void
  (obj: Record<string, unknown>, msg?: string, ...args: Array<any>): void
}

export interface Bindings {
  level?: string
  [key: string]: any
}

interface ChildFunction {
  (bindings: Bindings): Logger
}

type Logger = {
  error: LogFunction
  warn: LogFunction
  info: LogFunction
  debug: LogFunction
  trace: LogFunction
  child?: ChildFunction
} & { [k: string]: LogFunction }

const objectToJson = (a: unknown) => (typeof a === 'object' ? JSON.stringify(a) : a)

type CreateLoggerConfig = { level?: string }

type CreateLogger = (config?: CreateLoggerConfig) => Logger

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace'

const log = (level: LogLevel, logLevel: string, args: Array<unknown>): void => {
  // eslint-disable-next-line no-console
  if (level === logLevel) console[level](args.map(objectToJson).join(', '))
}

const defaultLoggerConstructor: CreateLogger = ({ level } = { level: 'info' }) => {
  const logLevel = level ?? 'info'
  const logger = {
    error: (...args: Array<unknown>) => log('error', logLevel, args),
    warn: (...args: Array<unknown>) => log('warn', logLevel, args),
    info: (...args: Array<unknown>) => log('info', logLevel, args),
    debug: (...args: Array<unknown>) => log('debug', logLevel, args),
    trace: (...args: Array<unknown>) => log('trace', logLevel, args),
    child: () => logger
  }

  return logger
}

const defaultLogger = defaultLoggerConstructor()

const isFunction = (v: CreateLogger | Logger): v is CreateLogger => typeof v === 'function' && v instanceof Function

const createLogger = (level: string) => (loggerConstrutor: CreateLogger | Logger): Logger => {
  if (isFunction(loggerConstrutor)) {
    return loggerConstrutor({ level })
  }
  return loggerConstrutor
}

const createMutableLogger = (logger: Logger): Logger => {
  let wrapperedLogger = logger

  const handler = {
    get(_: unknown, functionName: string) {
      return (...args: Array<unknown>) => {
        if (functionName === 'child' && wrapperedLogger?.[functionName]) {
          //@ts-expect-error
          wrapperedLogger = wrapperedLogger?.[functionName]?.(...args) ?? wrapperedLogger
        } else if (wrapperedLogger[functionName]) {
          //@ts-expect-error
          return wrapperedLogger[functionName](...args)
        } else {
          return
        }
      }
    }
  }

  return new Proxy<Logger>(({} as unknown) as Logger, handler)
}

export type { LogFunction, Logger }
export { defaultLogger, defaultLoggerConstructor, createLogger, createMutableLogger }
