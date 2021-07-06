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

// Application has dependencies which are {key: value}

const resolveEventBasedDependencies = <D>(dependencies: D): D => {
  return Object.entries(dependencies).reduce(
    (acc, [dependencyName, dependency]) => {
      if (dependency?.type === 'EventBasedDependency') {
        const eventDependency = (dependency as EventBasedDependencyConstruct<P, Parameters<H>[0]>).get(payload, event)
        // we need invocations and more details why it failed
        if (!eventDependency) {
          logger.warn(`could not extract event based dependency for ${dependencyName}`)
          // I'm not sure if that make sense, that would make things unpredictible?
          // and also we would need to mark as optional
          // I think I would prefer this to throw an error
          if (dependency.config.ignoreMissing) {
            logger.debug(`ignoring dependency '${dependencyName}' as it is being marked as ignore missing`)
            return { ...acc, [dependencyName]: null }
          } else {
            throw new EventBasedDependencyError(`No event based dependency found for '${dependencyName}'`)
          }
        } else {
          logger.debug(`replacing '${dependencyName}' with event based dependency`)
          return { ...acc, [dependencyName]: eventDependency }
        }
      }
      return acc
    },
    dependencies // we use copy them in the reduce no need to copy here
  )
}

//
// Dependencies constructors
//
const eventBasedDependency = <D, P = any, E = any>(
  dependencies: Record<string, D>,
  getter: EventBasedDependencyGetter<D, P, E>,
  config: EventBasedDependencyConfig = {}
): D =>
  ((({
    type: 'EventBasedDependency',
    config,
    get: (payload: P, event: E) => getter({ payload, event, dependencies })
  } as EventBasedDependencyConstruct<P, E>) as unknown) as D) // why do we have to convert to `unknown

export { resolveDependencies, resolveEventBasedDependencies, eventBasedDependency }
export type { DependenciesConstructor, EventBasedDependencyConstruct }
