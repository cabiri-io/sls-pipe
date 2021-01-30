import { PayloadDefinitionError } from './error/payload-definition-error'
import { Logger, createLogger, createMutableLogger, defaultLogger } from './logger'
import { HandlerPayload, PayloadConstructor, remapFunctionArgumentsToObject } from './payload'
import type { Handler } from './handler'
import { EnvironmentConfig, InvocationIdConstructor, defaultInvocationId } from './environment-config'
import type { InvocationContext } from './invocation-context'
import { ConfigConstructor, resolveConfig } from './config'
import { ErrorHandler, defaultErrorHandler } from './error-handler'
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
  let isLoggerInitialised = false

  // ------------------------------------
  // init defaults
  // ------------------------------------
  let dependencies: DependenciesConstructor<C, D> = ({} as unknown) as DependenciesConstructor<C, D>
  let payloadConstructor: PayloadConstructor<H, P> = remapFunctionArgumentsToObject
  let applicationLogger: Logger = defaultLogger
  let config: ConfigConstructor<C> | undefined | null
  let successHandler: SuccessHandler<R, ReturnType<H>> = i => (i as unknown) as ReturnType<H>
  let errorHandler: ErrorHandler<ReturnType<H>> = defaultErrorHandler

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
        .then(() => {
          if (!isLoggerInitialised) {
            applicationLogger = createLogger(logLevel)(applicationLogger)
          }

          if (isLogMutable) {
            return { logger: createMutableLogger(applicationLogger) }
          }
          return { logger: applicationLogger }
        })
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
          logger.debug('about to create invocation id')
          return Promise.resolve(invocationIdGenerator(event, context, logger)).then(invocationId => {
            if (isLogMutable) {
              logger.child?.({ invocationId })
              invocationContext.set(event, { logger, invocationId })
              return { logger, invocationId }
            } else {
              const newLogger = logger.child?.({ invocationId }) ?? logger
              invocationContext.set(event, { logger: newLogger, invocationId })
              return { logger: newLogger, invocationId }
            }
          })
        })
        .then(({ logger, invocationId }) => {
          logger.debug({ invocationId }, 'created request id')
          return { logger, config, invocationId }
        })
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
        .then(({ logger, config, invocationId }) => {
          logger.trace('about to resolve dependencies')
          if (!applicationDependencies) {
            logger.info('creating dependencies')
            if (typeof dependencies === 'function' && dependencies instanceof Function) {
              applicationDependencies = dependencies({ config, logger, invocationId })
            } else {
              logger.trace('about to resolve dependencies')
              applicationDependencies = dependencies
            }
          }

          return { logger, config, dependencies: applicationDependencies, invocationId }
        })
        .then(({ logger, config, dependencies, invocationId }) => {
          // we use trace here because dependencies could have sensitive values
          logger.trace({ dependencies }, 'resolved dependencies')
          return { logger, config, dependencies, invocationId }
        })
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
        .then(({ logger, config, dependencies, payload, invocationId }) => {
          logger.info('about to invoke application')
          return Promise.resolve(
            appConstructor({ logger, config, dependencies, payload, context: { invocationId } })
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
          const { invocationId } = invocationContext.get(event) ?? {}
          return successHandler({ result, logger, invocationId })
        })
        .catch(error => {
          const { invocationId, logger } = invocationContext.get(event) ?? {}
          logger?.debug?.({ invocationId }, 'got an error')
          // we use trace here because dependencies could have sensitive values
          logger?.trace?.({ invocationId, error }, 'error trace')
          return errorHandler({ error, context: { invocationId, logger } })
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

export type { Handler, SlsEnvironment, EnvironmentConfig, Logger, InvocationIdConstructor }
export { environment }
