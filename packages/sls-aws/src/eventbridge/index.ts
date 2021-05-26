import { EnvironmentConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
import type { Context, EventBridgeEvent } from 'aws-lambda'
import { response } from '../reponse/response-or-error'
import { jsonEventBridgeMessage } from './json-eventbridge-message'

export type EventBridgeHandler = Handler<EventBridgeEvent<string, string>, Context, Promise<void>>

export const eventBridgeMessage = <D, P, C = never>(
  config?: EnvironmentConfig<EventBridgeHandler>
): SlsEnvironment<EventBridgeHandler, C, D, P> =>
  environment<EventBridgeHandler, C, D, P>(config).payload(jsonEventBridgeMessage).successHandler(response)
