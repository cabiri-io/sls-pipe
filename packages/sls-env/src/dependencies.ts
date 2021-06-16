import { Logger } from './logger'

type DependenciesConstructorParams<C> = {
  config: C
  logger: Logger
  invocationId: string
}

type DependenciesFunctionConstructor<C, D> = (params: DependenciesConstructorParams<C>) => D
type DependenciesConstructor<C, D> = DependenciesFunctionConstructor<C, D> | D

class EventBasedDependency<D> {
  public dependencies: Record<string, D>
  public key: string

  constructor(dependencies: Record<string, D>, key: string) {
    this.dependencies = dependencies
    this.key = key
  }
}

const eventBasedDependency = <D>(dependencies: Record<string, D>, key: string): D => {
  const dependency = new EventBasedDependency<D>(dependencies, key)
  return (dependency as unknown) as D
}

export type { DependenciesConstructor }
export { eventBasedDependency, EventBasedDependency }
