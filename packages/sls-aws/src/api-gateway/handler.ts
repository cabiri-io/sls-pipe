import { EnvironmentConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda'
import { createSuccessResponse } from './response'

type APIGatewayV2Handler<T = never> = Handler<APIGatewayProxyEventV2, Context, APIGatewayProxyResultV2<T>>

export const apiGatewayV2 = <D, P = APIGatewayV2Handler<never>, R = void, C = never>(
  config?: EnvironmentConfig<APIGatewayV2Handler<never>>
): SlsEnvironment<APIGatewayV2Handler<never>, C, D, P, R> =>
  environment<APIGatewayV2Handler<never>, C, D, P, R>(config).successHandler(createSuccessResponse())
