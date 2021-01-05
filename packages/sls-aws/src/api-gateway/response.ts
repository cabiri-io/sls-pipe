import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda'

type StructuredResult<T, R> = APIGatewayProxyStructuredResultV2 & { mapper?: (t: T) => R }

export const createSuccessResponse = <T, R = never>(config?: StructuredResult<T, R extends never ? T : R>) => (
  t: T
): APIGatewayProxyStructuredResultV2 => {
  const { mapper, statusCode, ...defaultValues } = config ?? {}
  return {
    statusCode: statusCode ?? 200,
    ...defaultValues,
    body: JSON.stringify(mapper?.(t) ?? t)
  }
}
