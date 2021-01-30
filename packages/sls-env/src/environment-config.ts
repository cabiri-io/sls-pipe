import crypto from 'crypto'
import { Logger } from './logger'
import { Handler } from './handler'

type RequestIdConstructor<H extends Handler<any, any, any>> = (
  event: Parameters<H>[0],
  context: Parameters<H>[1],
  logger: Logger
) => Promise<string> | string

/**
 * Descibe environment configuration
 *
 * @param {logger}
 * @param {logger.mutable} if child will mutate logger
 * @param {logger.level} log level used by SLS
 * @param {requestId} a request id
 */
type EnvironmentConfig<H extends Handler<any, any, any>> = {
  logger?: {
    mutable?: false
    level?: string
  }
  // fixme: this needs to be able to
  requestIdGenerator?: RequestIdConstructor<H>
}

const defaultRequestId = (): string => crypto.randomBytes(16).toString('hex')

export type { EnvironmentConfig }
export { defaultRequestId }
