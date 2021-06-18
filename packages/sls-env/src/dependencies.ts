import { Handler } from './handler'
import { Logger } from './logger'

type DependenciesConstructorParams<C, E, P> = {
  config: C
  logger: Logger
  invocationId: string
  createEventBasedDependency: EventBasedDependencyConstructor<E, P>
}

type EventBasedDependencyConstructorParams<E, P> = {
  event: E
  payload: P
}

type DependenciesFunctionConstructor<C, D, E, P> = (params: DependenciesConstructorParams<C, E, P>) => D
type DependenciesConstructor<C, D, H extends Handler<any, any, any>, P> =
  | DependenciesFunctionConstructor<C, D, Parameters<H>[0], P>
  | D

type InferRecordType<R> = R extends Record<string, infer T> ? T : never
type EventBasedDependencyKeyConstructor<E, P> = (params: EventBasedDependencyConstructorParams<E, P>) => string
type EventBasedDependencyConstructor<E, P> = <T extends Record<string, any>>(
  dependencies: T,
  keyFunc: EventBasedDependencyKeyConstructor<E, P>
) => T extends { [k in string]: unknown } ? InferRecordType<T> : never

class EventBasedDependency<E, P, D> {
  public dependencies: Record<string, D>
  public keyFunc: EventBasedDependencyKeyConstructor<E, P>

  constructor(dependencies: Record<string, D>, keyFunc: EventBasedDependencyKeyConstructor<E, P>) {
    this.dependencies = dependencies
    this.keyFunc = keyFunc
  }
}

const createEventBasedDependency = <H extends Handler<any, any, any>, P, D>(
  dependencies: Record<string, D>,
  keyFunc: EventBasedDependencyKeyConstructor<Parameters<H>[0], P>
): D => {
  const dependency = new EventBasedDependency<Parameters<H>[0], P, D>(dependencies, keyFunc)
  return (dependency as unknown) as D
}

export type { DependenciesConstructor, EventBasedDependencyConstructor }
export { createEventBasedDependency, EventBasedDependency }
