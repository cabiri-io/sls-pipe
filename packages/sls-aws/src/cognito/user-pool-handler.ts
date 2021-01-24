import { EnvConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
import type { Context, PreSignUpTriggerEvent } from 'aws-lambda'

type CognitoUserPoolHandler = Handler<PreSignUpTriggerEvent, Context, Promise<PreSignUpTriggerEvent>>

export const cognitoUserPoolPreSignUp = <D, C = never>(
  config?: EnvConfig
): SlsEnvironment<CognitoUserPoolHandler, C, D> => environment<CognitoUserPoolHandler, C, D>(config)
