import { Logger } from './logger'

type InvocationContext = {
  logger?: Logger
  requestId?: string
}

export type { InvocationContext }
