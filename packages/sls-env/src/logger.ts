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
  [k: string]: LogFunction
}

const objectToJson = (a: unknown) => (typeof a === 'object' ? JSON.stringify(a) : a)

const defaultLogger: Logger = {
  // eslint-disable-next-line no-console
  error: (...args: Array<unknown>) => console.error(args.map(objectToJson).join(', ')),
  // eslint-disable-next-line no-console
  warn: (...args: Array<unknown>) => console.warn(args.map(objectToJson).join(', ')),
  // eslint-disable-next-line no-console
  info: (...args: Array<unknown>) => console.info(args.map(objectToJson).join(', ')),
  // eslint-disable-next-line no-console
  debug: (...args: Array<unknown>) => console.debug(args.map(objectToJson).join(', ')),
  // eslint-disable-next-line no-console
  trace: (...args: Array<unknown>) => console.trace(args.map(objectToJson).join(', '))
}

export type { LogFunction, Logger }
export { defaultLogger }
