import { Logger, LoggerConstructor, createLogger, createMutableLogger, defaultLogger } from './logger'
import { HandlerPayload, PayloadConstructor, remapFunctionArgumentsToObject } from './payload'
import type { Handler } from './handler'
import {
  EnvironmentConfig,
  InvocationContextConstructor,
  InvocationIdConstructor,
  defaultInvocationId,
  defaultInvodationContext
} from './environment-config'
import type { InvocationContext } from './invocation-context'
import { ConfigConstructor, resolveConfig } from './config'
import { ErrorHandler, ErrorParams, defaultErrorHandler } from './error-handler'
import { SuccessHandler, SuccessParams } from './success-handler'
import {
  APIGatewayEventDependency,
  AppDependencyConverter,
  DependenciesConstructor,
  EventDependency,
  apiGatewayEventDependency,
  eventDependency,
  resolveDependencies,
  resolveEventDependencies
} from './dependencies'
import type {
  AppConstructor,
  AppParams,
  AppPayloadDependenciesParams,
  AppPayloadParams,
  ContextAppParams
} from './application'

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
  logger: (logger: LoggerConstructor) => SlsEnvironment<H, C, D, P, R>
  config: (config: ConfigConstructor<C>) => SlsEnvironment<H, C, D, P, R>
  payload: (payloadConstructor: PayloadConstructor<H, P>) => SlsEnvironment<H, C, D, P, R>
  app: (app: AppConstructor<P, C, D, R>) => SlsEnvironment<H, C, D, P, R>
  start: (...params: Parameters<H>) => Promise<ReturnType<H>>
}

/**
 * Caution: sensitive data will be logged when log level is configured to `trace`
 */
const environment = <H extends Handler<any, any, any>, C, D, P = HandlerPayload<H>, R = ReturnType<H>>(
  _config?: EnvironmentConfig<H>
): SlsEnvironment<H, C, D, P, R> => {
  let appConstructor: AppConstructor<P, C, D, R>
  // ------------------------------------
  // default config
  // ------------------------------------
  const { invocationIdGenerator = defaultInvocationId, logger = {} } = _config ?? {}
  const logLevel = logger.level ?? 'info'
  const isLogMutable = logger?.mutable ?? true
  const logInvocationContext = logger?.invocationContext ?? defaultInvodationContext
  let isLoggerInitialised = false

  // ------------------------------------
  // init defaults
  // ------------------------------------
  let dependencies: DependenciesConstructor<C, D> = ({} as unknown) as DependenciesConstructor<C, D>
  let payloadConstructor: PayloadConstructor<H, P> = remapFunctionArgumentsToObject
  let applicationLoggerConstructor: LoggerConstructor = defaultLogger
  let config: ConfigConstructor<C> | undefined | null
  let successHandler: SuccessHandler<R, ReturnType<H>> = i => (i as unknown) as ReturnType<H>
  let errorHandler: ErrorHandler<ReturnType<H>> = defaultErrorHandler

  // ------------------------------------
  // cached values
  // ------------------------------------
  let applicationDependencies: D
  let applicationConfig: C
  let applicationLogger: Logger
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
      applicationLoggerConstructor = log
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
     * config((logger) => ({timeout: parseInt(process.env.SERVICE_TIMEOUT, 10)}))
     *
     * A simple configuration object
     * @example
     * config({timeout: 1000})
     *
     * An object containing mix of values and functions building configuration.
     * @example
     * config({timeout: 1000, retryCount: async (logger) => ssmGetValue() })
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
     *
     * @example
     * global({
     *  module: eventDependency({
     *    'key1': createModule1(config.moduleConfig1),
     *    'key2': createModule2(config.moduleConfig2)
     *  },
     *  ({ dependencies, payload }) => dependencies[payload.key],
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
      // start execution
      return (
        Promise.resolve()
          // initialise logger
          .then(() => {
            if (!isLoggerInitialised) {
              applicationLogger = createLogger(logLevel)(applicationLoggerConstructor)
            }

            if (isLogMutable) {
              const mutableLogger = createMutableLogger(applicationLogger)

              return { logger: mutableLogger }
            }

            return { logger: applicationLogger }
          })
          // register invocation context
          .then(({ logger }) => {
            logger.debug('about to create logger')
            invocationContext.set(event, { logger })
            return { logger }
          })
          .then(({ logger }) => {
            logger.debug('created logger')
            return { logger }
          })
          // create a child logger with additional context and invocation id
          .then(({ logger }) => {
            logger.debug('about to create invocation id')
            return Promise.all([
              Promise.resolve(invocationIdGenerator(event, context, logger)),
              Promise.resolve(logInvocationContext(event, context, logger))
            ]).then(([invocationId, additionalContext]) => {
              if (isLogMutable) {
                logger.child?.({ invocationId, ...additionalContext })
                invocationContext.set(event, { logger, invocationId })
                return { logger, invocationId }
              } else {
                const newLogger = logger.child?.({ invocationId, ...additionalContext }) ?? logger
                invocationContext.set(event, { logger: newLogger, invocationId })
                return { logger: newLogger, invocationId }
              }
            })
          })
          .then(({ logger, invocationId }) => {
            logger.debug({ invocationId }, 'created request id')
            return { logger, config, invocationId }
          })
          // resolve configuration
          .then(({ logger, invocationId }) => {
            logger.debug('about to resolve configuration')
            if (applicationConfig) {
              return { config: applicationConfig, logger, invocationId }
            }
            return resolveConfig(config, logger, invocationId).then(resolvedConfig => {
              applicationConfig = resolvedConfig
              return { config: applicationConfig, logger, invocationId }
            })
          })
          .then(({ logger, config, invocationId }) => {
            // we use trace here because config cloud have sensitive values
            logger.trace({ config }, 'resolved configuration')
            return { logger, config, invocationId }
          })
          // resolve dependencies
          .then(({ logger, config, invocationId }) => {
            logger.trace('about to resolve dependencies')
            if (applicationDependencies) {
              return { logger, config, dependencies: applicationDependencies, invocationId }
            }
            logger.debug('creating dependencies')
            return resolveDependencies(dependencies, config, logger, invocationId).then(resolvedDependencies => {
              applicationDependencies = resolvedDependencies
              return { logger, config, dependencies: applicationDependencies, invocationId }
            })
          })
          .then(({ logger, config, dependencies, invocationId }) => {
            // we use trace here because dependencies could have sensitive values
            logger.trace({ dependencies }, 'resolved dependencies')
            return { logger, config, dependencies, invocationId }
          })
          // create payload
          .then(({ logger, config, dependencies, invocationId }) => {
            logger.debug('about to create payload')
            return Promise.resolve(payloadConstructor(event, context, { logger, invocationId })).then(payload => ({
              payload,
              dependencies,
              config,
              logger,
              invocationId
            }))
          })
          .then(({ logger, config, dependencies, payload, invocationId }) => {
            // we use trace here because dependencies could have sensitive values
            logger.trace({ payload }, 'created payload')
            return { logger, config, dependencies, payload, invocationId }
          })
          // override event based dependencies
          .then(({ logger, config, dependencies, payload, invocationId }) => {
            logger.trace('about to resolve event based dependencies')
            const updatedDependencies = resolveEventDependencies<D, P, Parameters<H>[0], Parameters<H>[1]>(
              dependencies,
              logger,
              payload,
              event,
              context
            )
            return { logger, config, dependencies: updatedDependencies, payload, invocationId }
          })
          .then(({ logger, config, dependencies, payload, invocationId }) => {
            logger.trace('resolved event based dependencies')
            return { logger, config, dependencies, payload, invocationId }
          })
          // invoke application
          .then(({ logger, config, dependencies, payload, invocationId }) => {
            logger.debug('about to invoke application')
            return Promise.resolve(
              appConstructor({ logger, config, dependencies, payload, context: { invocationId } })
            ).then(result => ({
              result,
              logger,
              invocationId
            }))
          })
          .then(({ result, logger, invocationId }) => {
            // we use trace here because dependencies could have sensitive values
            logger.trace({ result }, 'invoked application with result')
            return { result, logger, invocationId }
          })
          // process success response
          .then(({ result, logger, invocationId }) => successHandler({ result, logger, invocationId }))
          // process error response
          .catch(error => {
            const { invocationId, logger } = invocationContext.get(event) ?? {}
            logger?.debug?.({ invocationId }, 'got an error')
            // we use trace here because dependencies could have sensitive values
            logger?.trace?.({ invocationId, error }, 'error trace')
            return errorHandler({ error, context: { invocationId, logger } })
          })
          // clean up invocation context
          .finally(() => {
            const { logger } = invocationContext.get(event) ?? {}
            logger?.debug?.('about to clean current invocation')
            invocationContext.delete(event)
            logger?.trace?.('cleaned current invocation')
          })
      )
    }
  }
}

export type {
  Handler,
  SlsEnvironment,
  EnvironmentConfig,
  EventDependency,
  Logger,
  InvocationIdConstructor,
  InvocationContextConstructor,
  InvocationContext,
  ErrorParams,
  SuccessParams,
  AppParams,
  ContextAppParams,
  APIGatewayEventDependency,
  AppDependencyConverter,
  AppPayloadDependenciesParams,
  AppPayloadParams,
  AppConstructor as Application
}
export { environment, eventDependency, apiGatewayEventDependency, defaultLogger }
