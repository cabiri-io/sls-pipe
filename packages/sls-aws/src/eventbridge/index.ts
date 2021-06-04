import { EnvironmentConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
import type { Context, EventBridgeEvent } from 'aws-lambda'
import { response } from '../reponse/response-or-error'

export type EventBridgeHandler<T extends string, D> = Handler<EventBridgeEvent<T, D>, Context, Promise<void>>

const eventBridgeEvent = <T extends string, D>(
  event: EventBridgeEvent<T, D>,
  _context: Context
): EventBridgeEvent<T, D> => event

export const eventBridge = <D, DetailType extends string, Detail, C = never>(
  config?: EnvironmentConfig<EventBridgeHandler<DetailType, Detail>>
): SlsEnvironment<EventBridgeHandler<DetailType, Detail>, C, D, EventBridgeEvent<DetailType, Detail>> =>
  environment<EventBridgeHandler<DetailType, Detail>, C, D, EventBridgeEvent<DetailType, Detail>>(config)
    .payload(eventBridgeEvent)
    .successHandler(response)
