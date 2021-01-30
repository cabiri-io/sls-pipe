import crypto from 'crypto'
import { Logger } from './logger'
import { Handler } from './handler'

type InvocationIdConstructor<H extends Handler<any, any, any>> = (
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
 * @param {invocationId} a request id
 */
type EnvironmentConfig<H extends Handler<any, any, any>> = {
  logger?: {
    mutable?: boolean
    level?: string
  }
  // fixme: this needs to be able to
  invocationIdGenerator?: InvocationIdConstructor<H>
}

const defaultInvocationId = (): string => crypto.randomBytes(16).toString('hex')

export type { EnvironmentConfig, InvocationIdConstructor }
export { defaultInvocationId }
