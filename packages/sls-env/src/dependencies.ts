import { Logger } from './logger'
type DependenciesConstructorParams<C> = {
  config: C
  logger: Logger
  invocationId: string
}

type EventBasedDependencyGetterParams<D, P, E> = {
  event: E
  payload: P
  dependencies: Record<string, D>
}

type EventBasedDependencyConfig = {
  ignoreMissing?: boolean
}

type EventBasedDependencyGetter<D, P, E> = (params: EventBasedDependencyGetterParams<D, P, E>) => D
type EventBasedDependencyConstruct<P, E> = {
  type: 'EventBasedDependency'
  config: EventBasedDependencyConfig
  get: (payload: P, event: E) => any
}

type DependenciesFunctionConstructor<C, D> = (params: DependenciesConstructorParams<C>) => D
type DependenciesConstructor<C, D> = DependenciesFunctionConstructor<C, D> | D

const eventBasedDependency = <D, P = any, E = any>(
  dependencies: Record<string, D>,
  getter: EventBasedDependencyGetter<D, P, E>,
  config: EventBasedDependencyConfig = {}
): D =>
  ((({
    type: 'EventBasedDependency',
    config,
    get: (payload: P, event: E) => getter({ payload, event, dependencies })
  } as EventBasedDependencyConstruct<P, E>) as unknown) as D)

export { eventBasedDependency }
export type { DependenciesConstructor, EventBasedDependencyConstruct }
