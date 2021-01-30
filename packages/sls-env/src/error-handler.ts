import { InvocationContext } from './invocation-context'

type ErrorParams = {
  error: Error
  context: InvocationContext
}

type ErrorHandler<O> = (error: ErrorParams) => O

function defaultErrorHandler<T>({ error, context }: ErrorParams): T {
  const { logger, invocationId } = context
  logger?.error?.(
    { invocationId, error: error.message },
    'logs with default error, configure your own error handler before going to production'
  )
  throw error
}

export { defaultErrorHandler }
export type { ErrorHandler }
