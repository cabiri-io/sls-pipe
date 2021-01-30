import type { Handler } from './handler'
import { Logger } from './logger'

type PayloadConstructor<H extends Handler<any, any, any>, R> = (
  event: Parameters<H>[0],
  context: Parameters<H>[1],
  logger?: Logger
) => Promise<R> | R

/**
 * A helper type to create a payload from a handler
 */
type HandlerPayload<H> = H extends Handler<infer P, infer C, any> ? { event: P; context: C } : H

/**
 * Extracts event and context from the function and creates a object with event and context properties
 *
 * @param event an handler event
 * @param context a handler context
 */
const remapFunctionArgumentsToObject = <E, C, P>(event: E, context: C): P => (({ event, context } as unknown) as P)

export type { PayloadConstructor, HandlerPayload }
export { remapFunctionArgumentsToObject }
