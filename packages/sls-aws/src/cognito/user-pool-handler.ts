import { EnvironmentConfig, Handler, SlsEnvironment, SuccessParams, environment } from '@cabiri-io/sls-env'
import type { Context, PreSignUpTriggerEvent, PreTokenGenerationTriggerEvent } from 'aws-lambda'

type PreSignUpHandler = Handler<PreSignUpTriggerEvent, Context, Promise<PreSignUpTriggerEvent>>

const responseOrError = <T>({ result }: SuccessParams<T>): T | never => {
  if (result) {
    return result
  }
  throw Error("expected event result to be present but it wasn't")
}

const cognitoUserPoolPreSignUp = <D, C = never>(
  config?: EnvironmentConfig<PreSignUpHandler>
): SlsEnvironment<PreSignUpHandler, C, D> => environment<PreSignUpHandler, C, D>(config).successHandler(responseOrError)

type PreTokenGenerationHandler = Handler<
  PreTokenGenerationTriggerEvent,
  Context,
  Promise<PreTokenGenerationTriggerEvent>
>

const cognitoUserPoolPreTokenGeneration = <D, C = never>(
  config?: EnvironmentConfig<PreTokenGenerationHandler>
): SlsEnvironment<PreTokenGenerationHandler, C, D> =>
  environment<PreTokenGenerationHandler, C, D>(config).successHandler(responseOrError)

export type { PreSignUpHandler, PreTokenGenerationHandler }
export { cognitoUserPoolPreSignUp, cognitoUserPoolPreTokenGeneration }
