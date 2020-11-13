import { EnvConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
// eslint-disable-next-line import/no-unresolved
import type { Context, SNSEvent } from 'aws-lambda'
import { jsonSNSMessage } from './json-sns-message'
import { jsonSNSMessages } from './json-sns-messages'

type SNSHandler = Handler<SNSEvent, Context, void>

export const snsMessage = <D, P, C = never>(config?: EnvConfig): SlsEnvironment<SNSHandler, C, D, P> =>
  environment<SNSHandler, C, D, P>(config).payload(jsonSNSMessage)

export const snsMessages = <D, P, C = never>(config?: EnvConfig): SlsEnvironment<SNSHandler, C, D, Array<P>> =>
  environment<SNSHandler, C, D, Array<P>>(config).payload(jsonSNSMessages)
