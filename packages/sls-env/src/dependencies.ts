import { Logger } from './logger'
type DependenciesConstructorParams<C> = {
  config: C
  logger: Logger
}

type DependenciesFunctionConstructor<C, D> = (params: DependenciesConstructorParams<C>) => D
type DependenciesConstructor<C, D> = DependenciesFunctionConstructor<C, D> | D

export type { DependenciesConstructor }
