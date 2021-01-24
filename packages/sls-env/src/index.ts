import { PayloadDefinitionError } from './error/payload-definition-error'
import { Logger, defaultLogger } from './logger'
import { HandlerPayload, PayloadConstructor, remapFunctionArgumentsToObject } from './payload'
import type { Handler } from './handler'
import { ConfigConstructor, resolveConfig } from './config'
import { ErrorHandler } from './error-handler'
import { SuccessHandler } from './success-handler'
import { DependenciesConstructor } from './dependencies'
import { createDeferredValue, Deferred } from './utils/deferred'

//
// Application
/////////////////////////////////////////////////////////////////////////////////////////////
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
type AppConstructor<P, C, D, R> = ({
  payload,
  dependencies,
  config,
  logger
}: {
  payload: P
  config: C
  dependencies: D
  logger: Logger
}) => R | Promise<R>

/**
 * Describe type for creating an application that is bootstrap as part of sls start up.
 *
 * @template H - a handler definition of event handler
 * @template C - a config definition for application
 * @template D - a dependencies definition for application
 * @template P - a payload definition for application
 * @template R - a result that application will return
 *
 */
type SlsEnvironment<H extends Handler<any, any, any>, C, D, P = HandlerPayload<H>, R = ReturnType<H>> = {
  errorHandler: (handler: ErrorHandler<ReturnType<H>>) => SlsEnvironment<H, C, D, P, R>
  successHandler: (handler: SuccessHandler<R, ReturnType<H>>) => SlsEnvironment<H, C, D, P, R>
  global: (dependencies: DependenciesConstructor<C, D>) => SlsEnvironment<H, C, D, P, R>
  logger: (logger: Logger) => SlsEnvironment<H, C, D, P, R>
  config: (config: ConfigConstructor<C>) => SlsEnvironment<H, C, D, P, R>
  payload: (payloadConstructor: PayloadConstructor<H, P>) => SlsEnvironment<H, C, D, P, R>
  app: (app: AppConstructor<P, C, D, R>) => SlsEnvironment<H, C, D, P, R>
  start: (...params: Parameters<H>) => Promise<ReturnType<H>>
}

// eslint-disable-next-line @typescript-eslint/ban-types
type EnvConfig = {}

// if we just use env that does not have any typing which makes solution not type safe
// I think it make more sense to move just to config and copy any envs to config when required

// fixme: maybe we need to have App Config defined in the same way as we have Handler
// type Input = {D: dependencies, C: config, R: result, L: logger, P: Payload}
// App<Input, Output>

// feature: (templating) config can define how the template behavies for example you can say to append configuration
// you may have template and then an instance will add other develop configuration on top of that
const environment = <H extends Handler<any, any, any>, C, D, P = HandlerPayload<H>, R = ReturnType<H>>(
  _config?: EnvConfig
): SlsEnvironment<H, C, D, P, R> => {
  let appConstructor: AppConstructor<P, C, D, R>
  // todo: it would be probably better if that is typed as the rest of the framework
  // can we pick only the one that are there not go through x number of env variables
  // todo: add ability to add mapping environment variables to typed values like boolean and number etc...
  // at the moment we are cheating
  // promise of dependencies
  // how do we define that envs are always there in typescript for dependencies
  let dependencies: DependenciesConstructor<C, D> = ({} as unknown) as DependenciesConstructor<C, D>
  let payloadConstructor: PayloadConstructor<H, P> = remapFunctionArgumentsToObject
  let logger: Logger = defaultLogger
  let config: ConfigConstructor<C> | undefined | null
  let successHandler: SuccessHandler<R, ReturnType<H>> = i => (i as unknown) as ReturnType<H>
  let errorHandler: ErrorHandler<ReturnType<H>> = i => (i as unknown) as ReturnType<H>

  // ------------------------------------
  // cached values
  // ------------------------------------
  let applicationDependencies: D
  let applicationConfig: Deferred<C>
  return {
    /**
     * An instance of logger that is being used throughout the environment.
     *
     * If not defined it uses built in default logger which is simple wrapper around `console`
     *
     * It is recommended to always configure your own.
     *
     * @param log
     */
    logger(log) {
      // todo: where do we allow to inject request id, ideally we would do that part of the request
      // or maybe that becomes a constructor how to create a logger and then create a capture context
      // which is injected as part of each request?
      logger = log
      return this
    },
    /**
     *
     * @param handler
     */
    errorHandler(handler) {
      errorHandler = handler
      return this
    },
    /**
     *
     * @param handler
     */
    successHandler(handler) {
      successHandler = handler
      return this
    },
    /**
     * Allows to configure configuration definition which is resolved once on the bootstrap and then
     * used throughout the invocation execution.
     *
     * A simple function which returns configuration object. It can also return a Promise.
     * @example
     * global((logger) => ({timeout: parseInt(process.env.SERVICE_TIMEOUT, 10)}))
     *
     * A simple configuration object
     * @example
     * global({timeout: 1000})
     *
     * An object containing mix of values and functions building configuration.
     * @example
     * global({timeout: 1000, retryCount: async (logger) => ssmGetValue() })
     *
     * Each function has logger passed as a parameter.
     *
     * @param constructor
     */
    config(constructor) {
      config = constructor
      return this
    },
    /**
     * Creates or defines a list of dependencies which will be created and injected to the application.
     *
     * Global dependencies are created only once.
     *
     * @example
     * global({
     *  module1: module1,
     *  module2: module2
     * })
     *
     * @example
     * global(({config, logger}) => {
     *  logger.debug("creating global configuration")
     *  return {
     *    module1: createModule1(config)
     *    module2: createModule2(config, logger)
     *  }
     * })
     */
    global(constructor) {
      // should we be throwing error when already set
      // or
      // just collect all of them and process later
      // e.g.
      // .global(...somedependencies)
      // .global(...moredependencies)
      dependencies = constructor
      return this
    },
    /**
     * A mapping between event and payload goes here.
     *
     * You can use this as well to throw a payload validation.
     *
     * Ideally you shouldn't do business logic validation here and leave that to an application.
     *
     * @param constructor
     */
    payload(constructor) {
      if (payloadConstructor !== remapFunctionArgumentsToObject) {
        throw new PayloadDefinitionError(
          'you can configure payload constructor once, otherwise you unintentionally override configuration'
        )
      }
      payloadConstructor = constructor
      return this
    },
    /**
     * An application logic goes here. If not defined an error will be thrown as part of `start`.
     *
     * @param constructor
     *
     * @returns {SlsEnvironment}
     */
    app(constructor) {
      // maybe we wrap that with dependencies
      // ({}) => appFactory
      appConstructor = constructor
      // how can we remove usage of this
      return this
    },
    /**
     *
     */
    // eslint-disable-next-line arrow-body-style
    start: async (event, context) => {
      // now you can really chain that nicely
      // maybe we start currying
      // Promise.resolve().then(appConstructor(event, context))
      return (
        Promise.resolve()
          .then(() => {
            if (applicationConfig) {
              return applicationConfig.promise
            }
            applicationConfig = createDeferredValue()
            return resolveConfig(config, logger).then(resolvedConfig => {
              applicationConfig.resolve(resolvedConfig)
              return applicationConfig.promise
            })
          })
          .then(config => {
            // resolve only once
            if (!applicationDependencies) {
              // todo: add log to say that dependencies are initialising
              // todo: cloud be good for tracking cold starts
              if (typeof dependencies === 'function' && dependencies instanceof Function) {
                applicationDependencies = dependencies({ config, logger })
              } else {
                applicationDependencies = dependencies
              }
            }

            return { config, dependencies: applicationDependencies }
          })
          // here we need to add dependencies as well
          .then(({ config, dependencies }) => ({
            payload: payloadConstructor(event, context),
            dependencies,
            config,
            logger
          }))
          .then(appConstructor)
          .then(successHandler)
          .catch(errorHandler(logger))
      )
    }
  }
}

export type { Handler, SlsEnvironment, EnvConfig }
export { environment }
