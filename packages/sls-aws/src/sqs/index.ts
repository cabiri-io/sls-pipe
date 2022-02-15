import { EnvironmentConfig, Handler, SlsEnvironment, environment } from '@cabiri/sls-env'
import type { Context, SQSEvent } from 'aws-lambda'
import { response } from '../reponse/response-or-error'
import { jsonSQSMessage } from './json-sqs-message'
import { jsonSQSMessages } from './json-sqs-messages'

export type SQSHandler = Handler<SQSEvent, Context, Promise<void>>

export const sqsMessage = <D, P, C = never>(
  config?: EnvironmentConfig<SQSHandler>
): SlsEnvironment<SQSHandler, C, D, P> =>
  environment<SQSHandler, C, D, P>(config).payload(jsonSQSMessage).successHandler(response)

export const sqsMessages = <D, P, C = never>(
  config?: EnvironmentConfig<SQSHandler>
): SlsEnvironment<SQSHandler, C, D, Array<P>> =>
  environment<SQSHandler, C, D, Array<P>>(config).payload(jsonSQSMessages).successHandler(response)
