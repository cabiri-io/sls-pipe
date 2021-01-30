import { Logger } from './logger'

type SuccessParams<R> = {
  result: R
  logger: Logger
  invocationId: string
}
type SuccessHandler<R, O> = (params: SuccessParams<R>) => O

export type { SuccessHandler, SuccessParams }
