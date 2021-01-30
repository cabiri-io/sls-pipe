/**
 * Follows pino logger type definition
 */
interface LogFunction {
  (msg: string, ...args: Array<any>): void
  (obj: Record<string, unknown>, msg?: string, ...args: Array<any>): void
}

type Logger = {
  error: LogFunction
  warn: LogFunction
  info: LogFunction
  debug: LogFunction
  trace: LogFunction
  child?: (obj?: Record<string, unknown>) => Logger
  [k: string]: LogFunction
}

const objectToJson = (a: unknown) => (typeof a === 'object' ? JSON.stringify(a) : a)

type CreateLoggerConfig = { logLevel?: string }

type CreateLogger = (config?: CreateLoggerConfig) => Logger

const defaultLoggerConstructor: CreateLogger = () => {
  const logger = {
    // eslint-disable-next-line no-console
    error: (...args: Array<unknown>) => console.error(args.map(objectToJson).join(', ')),
    // eslint-disable-next-line no-console
    warn: (...args: Array<unknown>) => console.warn(args.map(objectToJson).join(', ')),
    // eslint-disable-next-line no-console
    info: (...args: Array<unknown>) => console.info(args.map(objectToJson).join(', ')),
    // eslint-disable-next-line no-console
    debug: (...args: Array<unknown>) => console.debug(args.map(objectToJson).join(', ')),
    // eslint-disable-next-line no-console
    trace: (...args: Array<unknown>) => console.trace(args.map(objectToJson).join(', ')),
    child: () => logger
  }

  return logger
}

const defaultLogger = defaultLoggerConstructor()

export type { LogFunction, Logger }
export { defaultLogger, defaultLoggerConstructor }
