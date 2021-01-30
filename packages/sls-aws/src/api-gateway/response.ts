import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

type StructuredResult<T, R> = APIGatewayProxyStructuredResultV2 & { mapper?: (t: T) => R }

export const createSuccessResponse = <T, R = never>(config?: StructuredResult<T, R extends never ? T : R>) => (
  t?: T
): APIGatewayProxyStructuredResultV2 => {
  const { mapper, statusCode, ...defaultValues } = config ?? {}
  const { headers } = defaultValues ?? {}

  const response = t === undefined ? {} : { body: JSON.stringify(mapper?.(t) ?? t) }
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
