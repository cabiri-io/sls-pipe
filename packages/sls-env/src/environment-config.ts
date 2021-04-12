import crypto from 'crypto'
import { Logger } from './logger'
import { Handler } from './handler'

type InvocationIdConstructor<H extends Handler<any, any, any>> = (
  event: Parameters<H>[0],
  context: Parameters<H>[1],
  logger: Logger
) => Promise<string> | string

type InvocationContextConstructor<H extends Handler<any, any, any>> = (
  event: Parameters<H>[0],
  context: Parameters<H>[1],
  logger: Logger
) => Promise<InvocationContext> | InvocationContext

/**
 * Describe environment configuration
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
    invocationContext?: InvocationContextConstructor<H>
  }
  invocationIdGenerator?: InvocationIdConstructor<H>
}

const defaultInvocationId = (): string => crypto.randomBytes(16).toString('hex')

interface InvocationContext extends Record<string, any> {
  awsRequestId?: string
  sha?: string
}

const defaultInvocationContext = (): InvocationContext => ({})

export type { EnvironmentConfig, InvocationIdConstructor, InvocationContextConstructor, InvocationContext }
export { defaultInvocationId, defaultInvocationContext }
