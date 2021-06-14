import { Logger } from './logger'
type DependenciesConstructorParams<C, P> = {
  config: C
  payload: P
  logger: Logger
  invocationId: string
}

type DependenciesConfig = {
  cache?: boolean
}

type DependenciesFunctionConstructor<C, P, D> = (params: DependenciesConstructorParams<C, P>) => D
type DependenciesConstructor<C, P, D> = DependenciesFunctionConstructor<C, P, D> | D

export type { DependenciesConstructor, DependenciesConfig }
