import { Logger } from './logger'
import { AppDependencyConverter } from './dependencies'

type ContextAppParams = {
  logger: Logger
  context: {
    invocationId: string
  }
}

type AppPayloadParams<P> = {
  payload: P
} & ContextAppParams

type AppPayloadDependenciesParams<P, D> = {
  payload: P
  dependencies: AppDependencyConverter<D>
} & ContextAppParams

type AppParams<P, C, D> = {
  payload: P
  config: C
  dependencies: AppDependencyConverter<D>
} & ContextAppParams

/**
 * Describe type for creating an application that is bootstrap as part of sls start up.
 *
 * @template P - a payload definition for application
 * @template C - a config definition for application
 * @template D - a dependencies definition for application
 * @template R - a result that application will return
 *
 * @param {Object} options -
 * @param {P} options.payload -
 * @param {D} options.dependencies -
 * @param {C} options.config -
 * @param {Logger} options.logger -
 *
 * @returns {Promise<R> | R} -
 */
type AppConstructor<P, C, D, R> = (params: AppParams<P, C, D>) => R | Promise<R>

export type { AppConstructor, AppParams, ContextAppParams, AppPayloadDependenciesParams, AppPayloadParams }
