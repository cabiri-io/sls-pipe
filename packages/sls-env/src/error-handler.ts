import { Logger } from './logger'

type ErrorHandler<O> = (logger: Logger) => (e: Error) => O

export type { ErrorHandler }
