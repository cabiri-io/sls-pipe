import { EnvironmentConfig, Handler, SlsEnvironment, environment } from '@cabiri/sls-env'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda'
import { bodyToPayload } from './payload'
import { createSuccessResponse } from './response'

type APIGatewayV2Handler<T = never> = Handler<APIGatewayProxyEventV2, Context, APIGatewayProxyResultV2<T>>

const apiGatewayV2 = <D, P = APIGatewayV2Handler<never>, R = void, C = never>(
  config?: EnvironmentConfig<APIGatewayV2Handler<never>>
): SlsEnvironment<APIGatewayV2Handler<never>, C, D, P, R> =>
  environment<APIGatewayV2Handler<never>, C, D, P, R>(config)
    .payload(bodyToPayload)
    .successHandler(createSuccessResponse())

export type { APIGatewayV2Handler }
export { apiGatewayV2 }
