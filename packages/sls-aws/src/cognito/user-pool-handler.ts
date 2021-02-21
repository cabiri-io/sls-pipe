import { EnvironmentConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
import type {
  Context,
  CustomMessageTriggerEvent,
  PreSignUpTriggerEvent,
  PreTokenGenerationTriggerEvent,
  UserMigrationTriggerEvent
} from 'aws-lambda'
import { responseOrError } from '../reponse/response-or-error'

type PreSignUpHandler = Handler<PreSignUpTriggerEvent, Context, Promise<PreSignUpTriggerEvent>>

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

type CustomMessageHandler = Handler<CustomMessageTriggerEvent, Context, Promise<CustomMessageTriggerEvent>>

const cognitoUserPoolCustomMessage = <D, C = never>(
  config?: EnvironmentConfig<CustomMessageHandler>
): SlsEnvironment<CustomMessageHandler, C, D> =>
  environment<CustomMessageHandler, C, D>(config).successHandler(responseOrError)

type UserMigrationHandler = Handler<UserMigrationTriggerEvent, Context, Promise<UserMigrationTriggerEvent>>

const cognitoUserPoolMigration = <D, C = never>(
  config?: EnvironmentConfig<UserMigrationHandler>
): SlsEnvironment<UserMigrationHandler, C, D> =>
  environment<UserMigrationHandler, C, D>(config).successHandler(responseOrError)

export type { PreSignUpHandler, PreTokenGenerationHandler, CustomMessageHandler, UserMigrationHandler }
export {
  cognitoUserPoolPreSignUp,
  cognitoUserPoolPreTokenGeneration,
  cognitoUserPoolCustomMessage,
  cognitoUserPoolMigration
}
