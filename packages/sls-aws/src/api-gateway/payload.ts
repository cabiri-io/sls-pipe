import type { APIGatewayProxyEventV2 } from 'aws-lambda'

const bodyToPayload = <T>(event: APIGatewayProxyEventV2): T => JSON.parse(event.body || '{}') as T

const queryParamsToPayload = <T>(event: APIGatewayProxyEventV2): T => event.queryStringParameters as unknown as T

const pathParamsToPayload = <T>(event: APIGatewayProxyEventV2): T => event.pathParameters as unknown as T

export { bodyToPayload, queryParamsToPayload, pathParamsToPayload }
