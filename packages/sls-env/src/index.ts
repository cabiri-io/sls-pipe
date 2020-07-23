// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-types */

import camelCase from 'lodash.camelcase'
import { PayloadDefinitionError } from './error/payload-definition-error'

type PayloadConstructor<E, C, R> = (event: E, context: C) => R
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
type AppConstructor<P, D, R> = ({
  payload,
  dependencies,
  logger
}: {
  payload: P
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

// E - event
// C - context
// D - dependencies
// R - result
export type SlsEnvironment<E, C, D, P, R> = {
  // but that may not be true as result should be handled by response
  //   .errorResponseHandler(apiGatewayHandler, errorMapper)
  errorHandler: () => SlsEnvironment<E, C, D, P, R>
  //   .successResponseHandler(apiGatewayHandler, successResponseMapper)
  successHandler: () => SlsEnvironment<E, C, D, P, R>
  global: (
    ...func: [Function] | [ObjectUnionDependencies<D>] | TupleUnionDependencies<D>
  ) => SlsEnvironment<E, C, D, P, R>
  logger: (logger: Logger) => SlsEnvironment<E, C, D, P, R>
  payload: (payloadConstructor: PayloadConstructor<E, C, P>) => SlsEnvironment<E, C, D, P, R>
  app: (app: AppConstructor<P, D, R>) => SlsEnvironment<E, C, D, P, R>
  start: (event: E, context: C) => Promise<R>
}

export type EnvConfig = {
  envNameMapper: (n: string) => string
}

const passThroughPayloadMapping = <E, C, P>(event: E, context: C) => (({ event, context } as unknown) as P)
// maybe we have really generic environment and then we have wrappers for all different scenarios?
// with this level abstraction we would need to have awsEnv
// with this level abstraction we would need to have expressEnv
// with this level abstraction we would need to have googleFunctionEnv
export const environment = <E, C, D, P, R>(_config?: EnvConfig): SlsEnvironment<E, C, D, P, R> => {
  let appConstructor: AppConstructor<P, D, R>
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
  let dependencies: D = ({ env } as unknown) as D
  // todo: we need to have something like no payload
  let payloadFactory: PayloadConstructor<E, C, P> = passThroughPayloadMapping
  let logger: Logger = console
  return {
    errorHandler() {
      return this
    },
    successHandler() {
      return this
    },
    // dependency
    // or maybe we have something similar to app and we have a function that
    // creates dependencies
    // dependencies(deps().global().global().prototype().create)
    // dependencies(deps().global().global().prototype())
    // maybe simpler approach would be just supporting 2 options
    // dependency name string, and function
    // function with name
    // pass a promise and say that will resolve finally to your dependency
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
      Promise.resolve()
        .then(() => ({
          payload: payloadFactory(event, context),
          dependencies,
          logger
        }))
        .then(appConstructor)
  }
}
