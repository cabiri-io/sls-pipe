import { EnvironmentConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
import type { Context, EventBridgeEvent } from 'aws-lambda'
import { response } from '../reponse/response-or-error'
import { jsonEventBridgeEvent } from './json-eventbridge-event'
import { jsonEventBridgeMessage } from './json-eventbridge-message'

export type EventBridgeEventHandler<T = never> = Handler<EventBridgeEvent<string, T>, Context, Promise<void>>
export type EventBridgeMessageHandler<T = never> = Handler<EventBridgeEvent<string, T>, Context, Promise<void>>

export const eventBridgeEvent = <D, P extends EventBridgeEvent<string, any>, C = never>(
  config?: EnvironmentConfig<EventBridgeEventHandler<never>>
): SlsEnvironment<EventBridgeEventHandler<never>, C, D, P> =>
  environment<EventBridgeEventHandler<never>, C, D, P>(config).payload(jsonEventBridgeEvent).successHandler(response)

export const eventBridgeMessage = <D, P, C = never>(
  config?: EnvironmentConfig<EventBridgeMessageHandler<never>>
): SlsEnvironment<EventBridgeMessageHandler<never>, C, D, P> =>
  environment<EventBridgeMessageHandler<never>, C, D, P>(config)
    .payload(jsonEventBridgeMessage)
    .successHandler(response)
