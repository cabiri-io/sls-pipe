import type { Logger as PinoLogger } from 'pino'

type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace'

type Logger = {
  error: PinoLogger['error']
  warn: PinoLogger['warn']
  info: PinoLogger['info']
  debug: PinoLogger['debug']
  trace: PinoLogger['trace']
  child?: PinoLogger['child']
} & { [key in string]: any }

const objectToJson = (a: unknown) => (typeof a === 'object' ? JSON.stringify(a) : a)

type CreateLoggerConfig = { level?: string }

type CreateLogger = (config?: CreateLoggerConfig) => Logger

const log = (level: LogLevel, logLevel: string, args: Array<unknown>): void => {
  // eslint-disable-next-line no-console
  if (level === logLevel) console[level](args.map(objectToJson).join(', '))
}

//@ts-expect-error
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

type LoggerConstructor = Logger | CreateLogger

const createLogger = (level: string) => (loggerConstrutor: LoggerConstructor): Logger => {
  if (isFunction(loggerConstrutor)) {
    return loggerConstrutor({ level })
  }
  return loggerConstrutor
}

const createMutableLogger = (logger: Logger): Logger => {
  let wrapperedLogger = logger

  const handler = {
    get(_: unknown, property: string) {
      if (typeof wrapperedLogger[property] === 'function') {
        return (...args: Array<unknown>) => {
          if (property === 'child' && wrapperedLogger?.[property]) {
            //@ts-expect-error
            wrapperedLogger = wrapperedLogger?.[property]?.(...args) ?? wrapperedLogger
          } else if (wrapperedLogger[property]) {
            return wrapperedLogger[property](...args)
          } else {
            return
          }
        }
      }
      return wrapperedLogger[property]
    },
    set(_: unknown, property: string, value: unknown) {
      wrapperedLogger[property] = value
      return true
    }
  }

  return new Proxy<Logger>(({} as unknown) as Logger, handler)
}

export type { Logger, LoggerConstructor }
export { defaultLogger, defaultLoggerConstructor, createLogger, createMutableLogger }
