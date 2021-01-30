import { Logger } from './logger'

type InvocationContext = {
  logger?: Logger
  invocationId?: string
}

export type { InvocationContext }
