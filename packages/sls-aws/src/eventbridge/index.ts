import { EnvironmentConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
import type { Context, EventBridgeEvent } from 'aws-lambda'
import { response } from '../reponse/response-or-error'
import { jsonEventBridgeEvent } from './json-eventbridge-event'
import { jsonEventBridgeMessage } from './json-eventbridge-message'

export type EventBridgeEventHandler = Handler<EventBridgeEvent<string, never>, Context, Promise<void>>
export type EventBridgeMessageHandler = Handler<EventBridgeEvent<string, string>, Context, Promise<void>>

export const eventBridgeEvent = <D, P extends EventBridgeEvent<string, any>, C = never>(
  config?: EnvironmentConfig<EventBridgeEventHandler>
): SlsEnvironment<EventBridgeEventHandler, C, D, P> =>
  environment<EventBridgeEventHandler, C, D, P>(config).payload(jsonEventBridgeEvent).successHandler(response)

export const eventBridgeMessage = <D, P, C = never>(
  config?: EnvironmentConfig<EventBridgeMessageHandler>
): SlsEnvironment<EventBridgeMessageHandler, C, D, P> =>
  environment<EventBridgeMessageHandler, C, D, P>(config).payload(jsonEventBridgeMessage).successHandler(response)
