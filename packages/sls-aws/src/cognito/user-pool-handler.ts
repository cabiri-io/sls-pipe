import { EnvConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
import type { CognitoUserPoolTriggerEvent } from 'aws-lambda'

type CognitoUserPoolHandler = Handler<CognitoUserPoolTriggerEvent, any, Promise<CognitoUserPoolTriggerEvent>>

export const cognitoUserPool = <D, P = CognitoUserPoolTriggerEvent, R = CognitoUserPoolTriggerEvent, C = never>(
  config?: EnvConfig
): SlsEnvironment<CognitoUserPoolHandler, C, D, P, R> => environment<CognitoUserPoolHandler, C, D, P, R>(config)
