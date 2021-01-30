import { InvocationContext } from './invocation-context'

type ErrorParams = {
  error: Error
  context: InvocationContext
}

type ErrorHandler<O> = (error: ErrorParams) => O

export type { ErrorHandler }
