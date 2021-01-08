// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-types */

import { PayloadDefinitionError } from './error/payload-definition-error'

// but that makes it very specific to even and context
// so maybe we extract Request to be Request {event, context}
// or maybe request becomes something abstract
// what does Request mean in context of async event
//@ts-expect-error
type Event<I, C, O> = {
  input: I
  context?: C
  output?: O
}

// maybe application gets event, context under something different like `dependencies`
// event = <Event, Context, Response> where Event can be Request,
// event = {input, context?, output?}
// or maybe at this point we don't allow working with raw events as a good practice and abstraction
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

interface LogFn {
  (msg: string, ...args: Array<any>): void
  (obj: object, msg?: string, ...args: Array<any>): void
}

// it is quite restrictive how do we make that configurable
export type Logger = {
  error: LogFn
  warn: LogFn
  info: LogFn
  debug: LogFn
  trace: LogFn
}

export type Handler<E, C, R> = (event: E, context: C) => R

type PayloadConstructor<H extends Handler<any, any, any>, R> = (event: Parameters<H>[0], context: Parameters<H>[1]) => R

type SuccessHandler<I, O> = (i: I) => O

type FunctionConstructor<C> = () => C | Promise<C>

type ConfigConstructor<C> = FunctionConstructor<C> | Promise<C> | C

type DependenciesConstructorParams<C> = {
  config: C
  logger: Logger
}

type DependenciesFunctionConstructor<C, D> = (params: DependenciesConstructorParams<C>) => D
type DependenciesConstructor<C, D> = DependenciesFunctionConstructor<C, D> | D

// EventType & ContextType => LambdaResult - that needs to be just a handler
// D - dependencies
// C - config
// P - payload
// R - result (it can be the same sa the result of the application response or it could be different which can the remapped in the success hander to match
// expected type i the handler
// Handler<Event, Context>
export type SlsEnvironment<H extends Handler<any, any, any>, C, D, P, R = ReturnType<H>> = {
  // but that may not be true as result should be handled by response
  //   .errorResponseHandler(apiGatewayHandler, errorMapper)
  errorHandler: () => SlsEnvironment<H, C, D, P, R>
  //   .successResponseHandler(apiGatewayHandler, successResponseMapper)
  successHandler: (handler: SuccessHandler<R, ReturnType<H>>) => SlsEnvironment<H, C, D, P, R>
  global: (dependencies: DependenciesConstructor<C, D>) => SlsEnvironment<H, C, D, P, R>
  logger: (logger: Logger) => SlsEnvironment<H, C, D, P, R>
  config: (config: ConfigConstructor<C>) => SlsEnvironment<H, C, D, P, R>
  payload: (payloadConstructor: PayloadConstructor<H, P>) => SlsEnvironment<H, C, D, P, R>
  app: (app: AppConstructor<P, C, D, R>) => SlsEnvironment<H, C, D, P, R>
  start: (...params: Parameters<H>) => Promise<ReturnType<H>> // actually that is not true the return value will be different as that will be tight to Lambda Handler
  // for example in context of ApiGateway that will be {body: ..., statusCode: ...}
}

export type EnvConfig = {}

const passThroughPayloadMapping = <E, C, P>(event: E, context: C) => (({ event, context } as unknown) as P)
// maybe we have really generic environment and then we have wrappers for all different scenarios?
// with this level abstraction we would need to have awsEnv
// with this level abstraction we would need to have expressEnv
// with this level abstraction we would need to have googleFunctionEnv
//

// if we just use env that does not have any typing which makes solution not type safe
// I think it make more sense to move just to config and copy any envs to config when required

// each app has to have a config

// fixme: maybe we need to have App Config defined in the same way as we have Handler
// type Input = {D: dependencies, C: config, R: result, L: logger, P: Payload}
// App<Input, Output>
//
// config can define how the template behavies for example you can say to append configuration
// you may have template and then an instance will add other develop configuration on top of that
export const environment = <H extends Handler<any, any, any>, C, D, P = H, R = ReturnType<H>>(
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
  // todo: we need to have something like no payload
  let payloadFactory: PayloadConstructor<H, P> = passThroughPayloadMapping
  let logger: Logger = console
  let config: Promise<C> = Promise.resolve({} as unknown) as Promise<C>
  // this is just idenity function
  let successHandler: SuccessHandler<R, ReturnType<H>> = i => (i as unknown) as ReturnType<H>
  return {
    errorHandler() {
      return this
    },
    successHandler(handler) {
      successHandler = handler
      return this
    },
    config(constructor) {
      if (typeof constructor === 'function' && constructor instanceof Function) {
        config = Promise.resolve(constructor())
      } else {
        config = Promise.resolve(constructor)
      }
      return this
    },
    // maybe it will be just easier to configure that through
    // global({
    //   module1: module1,
    //   module2: module2,
    // }) why would you want to create multiple globals? I think that needs to be simpler
    // dependency
    // global(config => ({
    //   module1: module1(config),
    //   module2: module2,
    // })) why would you want to create multiple globals? I think that needs to be simpler
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
     *  logger.debug("createing global configuration")
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
    logger(log) {
      // todo: here we need to allow two options a log or a constructor with config, event and context
      // through config you can change the log level for example
      logger = log
      return this
    },
    /**
     *
     */
    payload(constructor) {
      if (payloadFactory !== passThroughPayloadMapping) {
        throw new PayloadDefinitionError(
          'you can configure payload constructor once, otherwise you unintentionally override configuration'
        )
      }
      payloadFactory = constructor
      return this
    },
    // should we be throwing error when app is not present
    app(appFactory) {
      // maybe we wrap that with dependencies
      // ({}) => appFactory
      appConstructor = appFactory
      // how can we remove usage of this
      return this
    },
    start: async (event, context) => {
      // now you can really chain that nicely
      // maybe we start currying
      // Promise.resolve().then(appConstructor(event, context))
      let resolvedDependencies: D

      return (
        Promise.resolve(config)
          .then(config => {
            // resolve only once
            if (!resolvedDependencies) {
              // todo: add log to say that dependencies are initialisating
              // todo: cloud be good for tracking cold starts
              if (typeof dependencies === 'function' && dependencies instanceof Function) {
                resolvedDependencies = dependencies({ config, logger })
              } else {
                resolvedDependencies = dependencies
              }
            }

            return { config, dependencies: resolvedDependencies }
          })
          // here we need to add dependencies as well
          .then(({ config, dependencies }) => ({
            payload: payloadFactory(event, context),
            dependencies,
            config,
            logger
          }))
          .then(appConstructor)
          .then(successHandler)
      )
    }
  }
}
