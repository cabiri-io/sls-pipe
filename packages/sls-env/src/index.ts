// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-types */

import camelCase from 'lodash.camelcase'
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

type Union<T> = T extends Array<infer U> ? U | never : T

type GetTupleType<T, K> = K extends keyof T ? [K, T[K]] : never
type TupleDependenciesFromType<T, K extends Array<keyof T>> = { [I in keyof K]: GetTupleType<T, K[I]> }
type TupleUnionDependencies<T> = Union<TupleDependenciesFromType<T, Array<keyof T>>>

type GetObjectType<T, K> = K extends keyof T ? { [p in K]: T[K] } : never
type ObjectDependenciesFromType<T, K extends Array<keyof T>> = { [I in keyof K]: GetObjectType<T, K[I]> }
// type TupleFromType<T, K extends Array<keyof T>> = { [I in keyof K]: GetTupleType<T, K[I]> }
// type Union<T extends Array<any>, U = never> = T[number] | U
type ObjectUnionDependencies<T> = Union<ObjectDependenciesFromType<T, Array<keyof T>>>

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
// EventType & ContextType => LambdaResult - that needs to be just a handler
// D - dependencies
// C - config
// P - payload
// R - result
// Handler<Event, Context>
export type SlsEnvironment<
  H extends Handler<any, any, any>,
  ConfigType,
  DependentyType,
  PayloadType,
  R = ReturnType<H>
> = {
  // but that may not be true as result should be handled by response
  //   .errorResponseHandler(apiGatewayHandler, errorMapper)
  errorHandler: () => SlsEnvironment<H, ConfigType, DependentyType, PayloadType, R>
  //   .successResponseHandler(apiGatewayHandler, successResponseMapper)
  successHandler: (
    handler: SuccessHandler<R, ReturnType<H>>
  ) => SlsEnvironment<H, ConfigType, DependentyType, PayloadType, R>
  global: (
    ...func: [Function] | [ObjectUnionDependencies<DependentyType>] | TupleUnionDependencies<DependentyType>
  ) => SlsEnvironment<H, ConfigType, DependentyType, PayloadType, R>
  logger: (logger: Logger) => SlsEnvironment<H, ConfigType, DependentyType, PayloadType, R>
  config: (config: ConfigConstructor<ConfigType>) => SlsEnvironment<H, ConfigType, DependentyType, PayloadType, R>
  payload: (
    payloadConstructor: PayloadConstructor<H, PayloadType>
  ) => SlsEnvironment<H, ConfigType, DependentyType, PayloadType, R>
  app: (
    app: AppConstructor<PayloadType, ConfigType, DependentyType, R>
  ) => SlsEnvironment<H, ConfigType, DependentyType, PayloadType, R>
  start: (...params: Parameters<H>) => Promise<ReturnType<H>> // actually that is not true the return value will be different as that will be tight to Lambda Handler
  // for example in context of ApiGateway that will be {body: ..., statusCode: ...}
}

export type EnvConfig = {
  envNameMapper: (n: string) => string
}

const passThroughPayloadMapping = <E, C, P>(event: E, context: C) => (({ event, context } as unknown) as P)
// maybe we have really generic environment and then we have wrappers for all different scenarios?
// with this level abstraction we would need to have awsEnv
// with this level abstraction we would need to have expressEnv
// with this level abstraction we would need to have googleFunctionEnv
//

// if we just use env that does not have any typing which makes solution not type safe
// I think it make more sense to move just to config and copy any envs to config when required

// each app has to have a config
export const environment = <
  H extends Handler<any, any, any>,
  ConfigType,
  DependencyType,
  PayloadType,
  R = ReturnType<H>
>(
  _config?: EnvConfig
): SlsEnvironment<H, ConfigType, DependencyType, PayloadType, R> => {
  let appConstructor: AppConstructor<PayloadType, ConfigType, DependencyType, R>
  // todo: it would be probably better if that is typed as the rest of the framework
  // can we pick only the one that are there not go through x number of env variables
  const envNameMapper = _config?.envNameMapper ?? camelCase
  const env = Object.entries(process.env)
    .map(entry => [envNameMapper(entry[0]), entry[1]])
    .reduce((p, c) => ({ ...p, [c[0] as string]: c[1] }), {})
  // todo: add ability to add mapping environment variables to typed values like boolean and number etc...
  // at the moment we are cheating
  // promise of dependencies
  // how do we define that envs are always there in typescript for dependencies
  let dependencies: DependencyType = ({ env } as unknown) as DependencyType
  // todo: we need to have something like no payload
  let payloadFactory: PayloadConstructor<H, PayloadType> = passThroughPayloadMapping
  let logger: Logger = console
  let config: Promise<ConfigType> = Promise.resolve({} as unknown) as Promise<ConfigType>
  let successHandler: SuccessHandler<R, ReturnType<H>> = i => (i as unknown) as ReturnType<H>
  return {
    errorHandler() {
      return this
    },
    successHandler() {
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
    // module1: module1,
    // module2: module2,
    // }) why would you want to create multiple globals? I think that needs to be simpler
    // dependency
    // or maybe we have something similar to app and we have a function that
    // creates dependencies
    // dependencies(deps().global().global().prototype().create)
    // dependencies(deps().global().global().prototype())
    // maybe simpler approach would be just supporting 2 options
    // dependency name string, and function
    // function with name
    // pass a promise and say that will resolve finally to your dependency
    // maybe this is just an object with all the values instead of having all this global config
    global(...dependency) {
      // todo: how about dependencies being wrapped in promises we would need to unwrap them so we can store things like SSM result in there
      // todo: disable adding env to dependencies
      // test for errors
      const [namedDependency, func] = dependency
      if (typeof namedDependency === 'object') {
        dependencies = { ...dependencies, ...namedDependency }
      } else if (typeof namedDependency === 'function') {
        dependencies = { ...dependencies, [namedDependency.name]: namedDependency }
      } else {
        dependencies = { ...dependencies, [namedDependency]: func }
      }
      return this
    },
    logger(log) {
      logger = log
      return this
    },
    payload(payloadConstructor) {
      if (payloadFactory !== passThroughPayloadMapping) {
        throw new PayloadDefinitionError(
          'you can configure payload constructor once, otherwise you unintentionally override configuration'
        )
      }
      payloadFactory = payloadConstructor
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
    start: async (event, context) =>
      // now you can really chain that nicely
      // maybe we start currying
      // Promise.resolve().then(appConstructor(event, context))
      Promise.resolve(config)
        // here we need to add dependencies as well
        .then(config => ({
          payload: payloadFactory(event, context),
          dependencies,
          config,
          logger
        }))
        .then(appConstructor)
        .then(successHandler)
  }
}
