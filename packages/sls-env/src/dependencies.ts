import { Logger } from './logger'

type DependenciesConstructorParams<C> = {
  config: C
  logger: Logger
  invocationId: string
}

type EventBasedDependencyGetKeyParams<P, E, C> = {
  event: E
  payload: P
  context: C
}

type EventBasedDependencyGetKey<P, E, C, K> = (params: EventBasedDependencyGetKeyParams<P, E, C>) => K

/**
 * D - dependency
 * P - payload
 * E - event
 * C - context
 */
type EventBasedDependency<D, P = any, E = any, C = any, K extends string = string> = {
  type: 'EventBasedDependency'
  dependencies: Record<K, D>
  getKey: (p: P, e: E, c: C) => K
}

type AppDependencyConverter<T> = {
  [k in keyof T]: T[k] extends EventBasedDependency<infer D> ? D : T[k]
}

type DependenciesFunctionConstructor<C, D> = (params: DependenciesConstructorParams<C>) => D | Promise<D>
type DependenciesConstructor<C, D> = DependenciesFunctionConstructor<C, D> | D | Promise<D>

const isFunction = <C, D>(v: unknown): v is DependenciesFunctionConstructor<C, D> =>
  typeof v === 'function' && v instanceof Function

const resolveDependencies = async <D, C>(
  dependencies: DependenciesConstructor<C, D> | undefined | null,
  config: C,
  logger: Logger,
  invocationId: string
): Promise<D> => {
  if (!dependencies) {
    return {} as D
  }

  if (isFunction<C, D>(dependencies)) {
    return dependencies({ config, logger, invocationId })
  }
  return dependencies
}

const eventBasedDependency = <D, P = any, E = any, C = any, K extends string = string>(
  dependencies: Record<K, D>,
  getKey: EventBasedDependencyGetKey<P, E, C, K>
): EventBasedDependency<D, P, E, C> => ({
  type: 'EventBasedDependency',
  dependencies,
  getKey: (payload: P, event: E, context: C) => getKey({ payload, event, context })
})

export { resolveDependencies, eventBasedDependency }
export type { AppDependencyConverter, DependenciesConstructor, EventBasedDependency }
