import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'
import type { SuccessParams } from '@cabiri-io/sls-env'

type StructuredResult<T, R> = APIGatewayProxyStructuredResultV2 & { mapper?: (t: T) => R }

export const createSuccessResponse =
  <T = any, R = never>(config?: StructuredResult<T, R extends never ? T : R>) =>
  (params: SuccessParams<T>): APIGatewayProxyStructuredResultV2 => {
    const { mapper, statusCode, ...defaultValues } = config ?? {}
    const { headers } = defaultValues ?? {}
    const { result } = params

    const response = result === undefined ? {} : { body: JSON.stringify(mapper?.(result) ?? result) }
    return {
      statusCode: statusCode ?? 200,
      headers: {
        'content-type': 'application/json',
        ...headers
      },
      ...defaultValues,
      ...response
    }
  }
