type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace'

interface LogFn {
  <T extends Record<string, unknown>>(obj: T, msg?: string, ...args: Array<any>): void
  (obj: any, msg?: string, ...args: Array<any>): void
  (msg: string, ...args: Array<any>): void
}

interface Logger {
  /**
   * Contains the desired logging level
   */
  level?: string
  fatal: LogFn
  error: LogFn
  warn: LogFn
  info: LogFn
  debug: LogFn
  trace: LogFn
  /**
   * Support for certain loggers that create a child logger instance
   *
   * @returns a child logger instance.
   */
  child?: (...args: Array<any>) => Logger
}

const objectToJson = (a: unknown) => (typeof a === 'object' ? JSON.stringify(a) : a)

type CreateLogger = (config?: Record<string, unknown>) => Logger

const log = (level: Exclude<LogLevel, 'fatal'>, logLevel: string, args: Array<unknown>): void => {
  // eslint-disable-next-line no-console
  if (level === logLevel) console[level](args.map(objectToJson).join(', '))
}

const defaultLoggerConstructor: CreateLogger = ({ level } = { level: 'info' }) => {
  const logLevel = (level ?? 'info') as LogLevel
  const logger = {
    fatal: (...args: Array<unknown>) => log('error', logLevel, args),
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

type LoggerConstructor = Logger | CreateLogger
const isFunction = (v: LoggerConstructor): v is CreateLogger => typeof v === 'function' && v instanceof Function

const createLogger = (level: string) => (loggerConstrutor: LoggerConstructor): Logger => {
  if (isFunction(loggerConstrutor)) {
    return loggerConstrutor({ level })
  }
  return loggerConstrutor
}

const createMutableLogger = (logger: Logger): Logger => {
  let wrapperedLogger = logger

  const handler = {
    get(_: unknown, property: keyof Logger) {
      if (typeof wrapperedLogger[property] === 'function') {
        return (...args: Array<unknown>) => {
          if (property === 'child' && wrapperedLogger?.child) {
            wrapperedLogger = wrapperedLogger?.[property]?.(...args) ?? wrapperedLogger
          } else if (wrapperedLogger[property]) {
            //@ts-expect-error
            return wrapperedLogger[property](...args)
          } else {
            return
          }
        }
      }
      return wrapperedLogger[property]
    },
    set(_: unknown, property: keyof Logger, value: any) {
      wrapperedLogger[property] = value
      return true
    }
  }

  return new Proxy<Logger>(({} as unknown) as Logger, handler)
}

export type { Logger, LoggerConstructor }
export { defaultLogger, defaultLoggerConstructor, createLogger, createMutableLogger }
