import { Handler } from './handler'
import { Logger } from './logger'

type DependenciesConstructorParams<C, E, P> = {
  config: C
  logger: Logger
  invocationId: string
  createEventBasedDependency: CreateEventBasedDependency<E, P>
}

type CreateEventBasedDependencyParams<E, P, D> = {
  event: E
  payload: P
  dependencies: D
}

type DependenciesFunctionConstructor<C, D, E, P> = (params: DependenciesConstructorParams<C, E, P>) => D
type DependenciesConstructor<C, D, H extends Handler<any, any, any>, P> =
  | DependenciesFunctionConstructor<C, D, Parameters<H>[0], P>
  | D

type InferRecordType<R> = R extends Record<string, infer T> ? T : never
type EventBasedDependencyGetter<E, P, D> = (params: CreateEventBasedDependencyParams<E, P, Record<string, D>>) => D
type CreateEventBasedDependency<E, P> = <T extends Record<string, any>>(
  dependencies: T,
  get: EventBasedDependencyGetter<E, P, T>
) => T extends { [k in string]: unknown } ? InferRecordType<T> : never

class EventBasedDependency<E, P, D> {
  public dependencies: Record<string, D>
  public get: EventBasedDependencyGetter<E, P, D>

  constructor(dependencies: Record<string, D>, get: EventBasedDependencyGetter<E, P, D>) {
    this.dependencies = dependencies
    this.get = get
  }
}

const createEventBasedDependency = <H extends Handler<any, any, any>, P, D>(
  dependencies: Record<string, D>,
  get: EventBasedDependencyGetter<Parameters<H>[0], P, D>
): D => {
  const dependency = new EventBasedDependency<Parameters<H>[0], P, D>(dependencies, get)
  return (dependency as unknown) as D
}

export type { DependenciesConstructor, CreateEventBasedDependency }
export { createEventBasedDependency, EventBasedDependency }
