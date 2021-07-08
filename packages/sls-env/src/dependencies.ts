import { Logger } from './logger'
import { EventBasedDependencyError } from './error'

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

const resolveEventBasedDependencies = <D, P, E, C>(
  dependencies: D,
  logger: Logger,
  payload: P,
  event: E,
  context: C
): AppDependencyConverter<D> => {
  const updatedDependencies = Object.entries(dependencies).reduce((acc, [dependencyName, dependency]) => {
    if (dependency?.type === 'EventBasedDependency') {
      const key = dependency.getKey(payload, event, context)
      const eventDependency = dependency.dependencies[key]
      if (!eventDependency) {
        logger.warn(`could not extract event based dependency for ${dependencyName}`)
        throw new EventBasedDependencyError(`No event based dependency found for '${dependencyName}'`)
      } else {
        logger.debug(`replacing '${dependencyName}' with event based dependency`)
        return { ...acc, [dependencyName]: eventDependency }
      }
    }
    return acc
  }, dependencies as AppDependencyConverter<D>)

  return updatedDependencies
}

export { resolveDependencies, resolveEventBasedDependencies, eventBasedDependency }
export type { AppDependencyConverter, DependenciesConstructor, EventBasedDependency }
