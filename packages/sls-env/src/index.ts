// but that makes it very specific to even and context
// so maybe we extract Request to be Request {event, context}
// or maybe request becomes something abstract
// what does Request mean in context of async event
type Request<E, C> = {
  event: E
  context: C
}

type AppConstructor<E, C, R> = ({ event, context }: { event: E; context: C }) => R | Promise<R>

// E - event
// C - context
// D - dependencies
// R - result
type SlsEnvironment<E, C, R> = {
  // but that may not be true as result should be handled by response
  global: (func: Function) => SlsEnvironment<E, C, R>
  app: (app: AppConstructor<E, C, R>) => SlsEnvironment<E, C, R>
  start: (event: E, context: C) => Promise<R>
}

type SlsEnvironmentConfig = {}

export const environment = <E, C, R>(config?: SlsEnvironmentConfig): SlsEnvironment<E, C, R> => {
  let appConstructor: AppConstructor<E, C, R>
  return {
    // dependency
    global(func: Function) {
      console.log('function name', func.name)

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
      const invocation = { event, context }
      return Promise.resolve(invocation).then(appConstructor)
    }
  }
}
