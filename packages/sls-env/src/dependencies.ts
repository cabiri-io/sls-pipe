import { Logger } from './logger'
import { EventDependencyError } from './error'

type DependenciesConstructorParams<C> = {
  config: C
  logger: Logger
  invocationId: string
}

type EventDependencyResolverParams<P, E, C> = {
  event: E
  payload: P
  context: C
}

enum DependencyType {
  EventDependency = 'EventDependency',
  DependencyFactory = 'DependencyFactory'
}

type EventDependencyGetKey<P, E, C, K> = (params: EventDependencyResolverParams<P, E, C>) => K

/**
 * D - dependency
 * P - payload
 * E - event
 * C - context
 */
type EventDependency<D, P = any, E = any, C = any, K extends string = string> = {
  type: 'EventDependency'
  dependencies: Record<K, D>
  getKey: (p: P, e: E, c: C) => K
}

type AppDependencyConverter<T> = {
  [k in keyof T]: T[k] extends EventDependency<infer D> | DependencyFactory<infer D> ? D : T[k]
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

const eventDependency = <D, P = any, E = any, C = any, K extends string = string>(
  dependencies: Record<K, D>,
  getKey: EventDependencyGetKey<P, E, C, K>
): EventDependency<D, P, E, C> => ({
  type: DependencyType.EventDependency,
  dependencies,
  getKey: (payload: P, event: E, context: C) => getKey({ payload, event, context })
})

/**
 * D - dependency
 * P - payload
 * E - event
 * C - context
 */
type DependencyFactoryResolver<D, P = any, E = any, C = any> = (params: EventDependencyResolverParams<P, E, C>) => D

type DependencyFactory<D, P = any, E = any, C = any> = {
  type: DependencyType.DependencyFactory
  dependencyFactory: DependencyFactoryResolver<D, P, E, C>
}

const setDependencyFactory = <D, P = any, E = any, C = any>(
  dependencyFactory: DependencyFactoryResolver<D, P, E, C>
): DependencyFactory<D, P, E, C> => ({
  type: DependencyType.DependencyFactory,
  dependencyFactory
})

const resolveEventDependencies = <D, P, E, C>(
  dependencies: D,
  logger: Logger,
  payload: P,
  event: E,
  context: C
): AppDependencyConverter<D> => {
  const updatedDependencies = Object.entries(dependencies).reduce((acc, [dependencyName, dependency]) => {
    switch (dependency.type) {
      case DependencyType.EventDependency:
        const key = dependency.getKey(payload, event, context)
        const eventDependency = dependency.dependencies[key]
        if (!eventDependency) {
          logger.warn(`could not extract event based dependency for ${dependencyName}`)
          throw new EventDependencyError(`No event based dependency found for '${dependencyName}'`)
        } else {
          logger.debug(`replacing '${dependencyName}' with event based dependency`)
          return { ...acc, [dependencyName]: eventDependency }
        }
      case DependencyType.DependencyFactory:
        logger.debug(`replacing '${dependencyName}' with factory based dependency`)
        return { ...acc, [dependencyName]: dependency.dependencyFactory({ payload, event, context }) }
    }
    return acc
  }, dependencies as AppDependencyConverter<D>)

  return updatedDependencies
}

export { resolveDependencies, resolveEventDependencies, eventDependency, setDependencyFactory }
export type {
  AppDependencyConverter,
  DependenciesConstructor,
  EventDependency,
  EventDependencyGetKey,
  DependencyFactory,
  DependencyFactoryResolver
}
