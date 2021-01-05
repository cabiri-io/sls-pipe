import { EnvConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda'
import { createSuccessResponse } from './response'

type APIGatewayV2Handler<T = never> = Handler<APIGatewayProxyEventV2, Context, APIGatewayProxyResultV2<T>>

// fixme: or maybe we create a different versions of apiGatewayV2 for example
// apiGatewayV2<D, P, R>
// apiGatewayV2Config<D, P, R, C>
// apiGatewayV2CustomResponse<D, P, R, HR, C = never>
export const apiGatewayV2 = <D, P, R, C = never>(
  config?: EnvConfig
): SlsEnvironment<APIGatewayV2Handler<never>, C, D, P, R> =>
  environment<APIGatewayV2Handler<never>, C, D, P, R>(config).successHandler(createSuccessResponse())
