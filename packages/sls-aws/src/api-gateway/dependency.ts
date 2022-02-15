import { APIGatewayProxyEventV2, Context } from 'aws-lambda'

import { EventDependency, EventDependencyGetKey } from '@cabiri/sls-env'

type APIGatewayEventDependency<D, P = any, K extends string = string> = EventDependency<
  D,
  P,
  APIGatewayProxyEventV2,
  Context,
  K
>

const apiGatewayEventDependency = <D, P = any, K extends string = string>(
  dependencies: Record<K, D>,
  getKey: EventDependencyGetKey<P, APIGatewayProxyEventV2, Context, K>
): APIGatewayEventDependency<D, P, K> => ({
  type: 'EventDependency',
  dependencies,
  getKey: (payload: P, event: APIGatewayProxyEventV2, context: Context) => getKey({ payload, event, context })
})

export { apiGatewayEventDependency }
export type { APIGatewayEventDependency }
