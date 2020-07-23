import { EnvConfig, SlsEnvironment, environment } from '@cabiri-io/sls-env'
import type { Context, SNSEvent } from 'aws-lambda'
import { jsonSNSMessage } from './sns/json-sns-message'
import { jsonSNSMessages } from './sns/json-sns-messages'

export const snsMessage = <D, P>(config?: EnvConfig): SlsEnvironment<SNSEvent, Context, D, P, void> =>
  environment<SNSEvent, Context, D, P, void>(config).payload(jsonSNSMessage)

export const snsMessages = <D, P>(config?: EnvConfig): SlsEnvironment<SNSEvent, Context, D, Array<P>, void> =>
  environment<SNSEvent, Context, D, Array<P>, void>(config).payload(jsonSNSMessages)
