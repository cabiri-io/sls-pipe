import { PayloadDefinitionError } from './error/payload-definition-error'
import { Logger, defaultLogger } from './logger'
import { HandlerPayload, PayloadConstructor, remapFunctionArgumentsToObject } from './payload'
import type { Handler } from './handler'
import { EnvironmentConfig, defaultRequestId } from './environment-config'
import type { InvocationContext } from './invocation-context'
import { ConfigConstructor, resolveConfig } from './config'
import { ErrorHandler } from './error-handler'
import { SuccessHandler } from './success-handler'
import { DependenciesConstructor } from './dependencies'
import type { AppConstructor } from './application'

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

// if we just use env that does not have any typing which makes solution not type safe
// I think it make more sense to move just to config and copy any envs to config when required

/**
 * Caution: sensitive data will be logged when log level is configured to `trace`
 */
const environment = <H extends Handler<any, any, any>, C, D, P = HandlerPayload<H>, R = ReturnType<H>>(
  _config?: EnvironmentConfig<H>
): SlsEnvironment<H, C, D, P, R> => {
  let appConstructor: AppConstructor<P, C, D, R>
  // todo: it would be probably better if that is typed as the rest of the framework
  // can we pick only the one that are there not go through x number of env variables
  // todo: add ability to add mapping environment variables to typed values like boolean and number etc...
  // at the moment we are cheating
  // promise of dependencies
  // how do we define that envs are always there in typescript for dependencies

  // ------------------------------------
  // default config
  // ------------------------------------
  const { requestIdGenerator = defaultRequestId, logger = {} } = _config ?? {}
  const logMutable = logger?.mutable ?? true
  const logLevel = logger.level ?? 'info'

  // ------------------------------------
  // init defaults
  // ------------------------------------
  let dependencies: DependenciesConstructor<C, D> = ({} as unknown) as DependenciesConstructor<C, D>
  let payloadConstructor: PayloadConstructor<H, P> = remapFunctionArgumentsToObject
  let applicationLogger: Logger = defaultLogger
  let config: ConfigConstructor<C> | undefined | null
  let successHandler: SuccessHandler<R, ReturnType<H>> = i => (i as unknown) as ReturnType<H>
  let errorHandler: ErrorHandler<ReturnType<H>> = i => (i as unknown) as ReturnType<H>

  // ------------------------------------
  // cached values
  // ------------------------------------
  let applicationDependencies: D
  let applicationConfig: C
  let invocationContext: WeakMap<Parameters<H>[0], InvocationContext> = new WeakMap()
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
      applicationLogger = log
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
      appConstructor = constructor
      return this
    },
    // eslint-disable-next-line arrow-body-style
    start: async (event, context) => {
      // create a new instance of logger
      return Promise.resolve()
        .then(() => ({ logger: applicationLogger }))
        .then(({ logger }) => {
          logger.debug('about to create logger')
          invocationContext.set(event, { logger })
          return { logger }
        })
        .then(({ logger }) => {
          logger.debug('created logger')
          return { logger }
        })
        .then(({ logger }) => {
          logger.debug('about to create request id')
          return Promise.resolve(requestIdGenerator(event, context, logger)).then(requestId => {
            if (logMutable) {
              logger.child?.({ requestId })
              invocationContext.set(event, { logger, requestId })
              return { logger }
            } else {
              const newLogger = logger.child?.({ requestId }) ?? logger
              invocationContext.set(event, { logger: newLogger, requestId })
              return { logger: newLogger, requestId }
            }
          })
        })
        .then(({ logger, requestId }) => {
          logger.debug({ requestId }, 'created request id')
          return { logger, config, requestId }
        })
        .then(({ logger, requestId }) => {
          logger.debug('about to resolve configuration')
          if (applicationConfig) {
            return { config: applicationConfig, logger, requestId }
          }
          return resolveConfig(config, logger, requestId).then(resolvedConfig => {
            applicationConfig = resolvedConfig
            return { config: applicationConfig, logger, requestId }
          })
        })
        .then(({ logger, config, requestId }) => {
          // we use trace here because config cloud have sensitive values
          logger.trace({ config }, 'resolved configuration')
          return { logger, config, requestId }
        })
        .then(({ logger, config, requestId }) => {
          logger.trace('about to resolve dependencies')
          if (!applicationDependencies) {
            logger.info('creating dependencies')
            if (typeof dependencies === 'function' && dependencies instanceof Function) {
              applicationDependencies = dependencies({ config, logger, requestId })
            } else {
              logger.trace('about to resolve dependencies')
              applicationDependencies = dependencies
            }
          }

          return { logger, config, dependencies: applicationDependencies, requestId }
        })
        .then(({ logger, config, dependencies, requestId }) => {
          // we use trace here because dependencies could have sensitive values
          logger.trace({ dependencies }, 'resolved dependencies')
          return { logger, config, dependencies, requestId }
        })
        .then(({ logger, config, dependencies, requestId }) => {
          logger.debug('about to create payload')
          return Promise.resolve(payloadConstructor(event, context, logger)).then(payload => ({
            payload,
            dependencies,
            config,
            logger,
            requestId
          }))
        })
        .then(({ logger, config, dependencies, payload, requestId }) => {
          // we use trace here because dependencies could have sensitive values
          logger.trace({ payload }, 'created payload')
          return { logger, config, dependencies, payload, requestId }
        })
        .then(({ logger, config, dependencies, payload, requestId }) => {
          logger.info('about to invoke application')
          return Promise.resolve(
            appConstructor({ logger, config, dependencies, payload, context: { requestId } })
          ).then(result => ({
            result,
            logger
          }))
        })
        .then(({ result, logger }) => {
          // we use trace here because dependencies could have sensitive values
          logger.trace({ result }, 'invoked application with result')
          return { result, logger }
        })
        .then(({ result, logger }) => {
          const { requestId } = invocationContext.get(event) ?? {}
          return successHandler({ result, logger, requestId })
        })
        .catch(error => {
          const { requestId, logger } = invocationContext.get(event) ?? {}
          logger?.debug?.({ requestId }, 'got an error')
          // we use trace here because dependencies could have sensitive values
          logger?.trace?.({ requestId, error }, 'error trace')
          return errorHandler({ error, context: { requestId, logger } })
        })
        .finally(() => {
          const { logger } = invocationContext.get(event) ?? {}
          logger?.debug?.('about to clean current invocation')
          invocationContext.delete(event)
          logger?.trace?.('cleaned current invocation')
        })
    }
  }
}

export type { Handler, SlsEnvironment, EnvironmentConfig, Logger }
export { environment }
