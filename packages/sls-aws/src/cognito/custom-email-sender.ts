import { Handler } from 'aws-lambda'
import { BaseTriggerEvent, StringMap } from 'aws-lambda/trigger/cognito-user-pool-trigger/_common'

interface BaseCustomEmailSenderTriggerEvent<T extends string> extends BaseTriggerEvent<T> {
  request: {
    code: string
    userAttributes: StringMap
    clientMetadata?: StringMap
  }
}

type CustomEmailSenderTriggerEvent =
  | BaseCustomEmailSenderTriggerEvent<'CustomEmailSender_SignUp'>
  | BaseCustomEmailSenderTriggerEvent<'CustomEmailSender_ResendCode'>
  | BaseCustomEmailSenderTriggerEvent<'CustomEmailSender_ForgotPassword'>
  | BaseCustomEmailSenderTriggerEvent<'CustomEmailSender_UpdateUserAttribute'>
  | BaseCustomEmailSenderTriggerEvent<'CustomEmailSender_VerifyUserAttribute'>
  | BaseCustomEmailSenderTriggerEvent<'CustomEmailSender_AdminCreateUser'>
  | BaseCustomEmailSenderTriggerEvent<'CustomEmailSender_AccountTakeOverNotification'>

type CustomEmailSenderTriggerHandler = Handler<CustomEmailSenderTriggerEvent>

export type { CustomEmailSenderTriggerHandler, BaseCustomEmailSenderTriggerEvent }
