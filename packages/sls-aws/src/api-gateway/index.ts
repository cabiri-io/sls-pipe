import { EnvConfig, Handler, SlsEnvironment, environment } from '@cabiri-io/sls-env'
// eslint-disable-next-line import/no-unresolved
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Context } from 'aws-lambda'

type APIGatewayV2Handler<T = never> = Handler<APIGatewayProxyEventV2, Context, APIGatewayProxyResultV2<T>>

export const apiGatewayV2 = <D, P, R, HR = R, C = never>(
  config?: EnvConfig
): SlsEnvironment<APIGatewayV2Handler<HR>, C, D, P, R> =>
  environment<APIGatewayV2Handler<HR>, C, D, P, R>(config).successHandler(t => ({
    statusCode: 200,
    body: JSON.stringify(t)
  }))
