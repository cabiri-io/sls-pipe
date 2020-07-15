// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-types,@typescript-eslint/no-unused-vars */

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
type AppConstructor<P, D, R> = ({ payload, dependencies }: { payload: P; dependencies: D }) => R | Promise<R>

// E - event
// C - context
// D - dependencies
// R - result
type SlsEnvironment<E, C, D, P, R> = {
  // but that may not be true as result should be handled by response
  global: (func: Function) => SlsEnvironment<E, C, D, P, R>
  payload: (payloadConstructor: PayloadConstructor<E, C, P>) => SlsEnvironment<E, C, D, P, R>
  app: (app: AppConstructor<P, D, R>) => SlsEnvironment<E, C, D, P, R>
  start: (event: E, context: C) => Promise<R>
}

type SlsEnvironmentConfig = {}

// maybe we have really generic environment and then we have wrappers for all different scenarios?
// with this level abstraction we would need to have awsEnv
// with this level abstraction we would need to have expressEnv
// with this level abstraction we would need to have googleFunctionEnv
//@ts-expect-error
export const environment = <E, C, D, P, R>(config?: SlsEnvironmentConfig): SlsEnvironment<E, C, D, P, R> => {
  let appConstructor: AppConstructor<P, D, R>
  // at the moment we are cheating
  let dependencies: D = ({} as unknown) as D
  // todo: we need to have something like no payload
  let payloadFactory: PayloadConstructor<E, C, P> = (event, context) => (({ event, context } as unknown) as P)
  return {
    // dependency
    // or maybe we have something similar to app and we have a function that
    // creates dependencies
    // dependencies(deps().global().global().prototype().create)
    // dependencies(deps().global().global().prototype())
    global(func: Function) {
      dependencies = { ...dependencies, [func.name]: func }
      return this
    },
    payload(payloadConstructor) {
      payloadFactory = payloadConstructor
      return this
    },
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
      //
      // Promise.resolve().then(appConstructor(event, context))
      const invocation = { event, context, dependencies }
      return Promise.resolve(invocation)
        .then(({ event, context }) => ({
          payload: payloadFactory(event, context),
          dependencies
        }))
        .then(appConstructor)
    }
  }
}
