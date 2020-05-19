// configuration I want to be able to debug invocation
type Application<P, D, R> = {
  pre(actionContextFunction: ActionContextFunction<P, D>): Application<P, D, R>
  action(): Application<P, D, R>
  post(): Application<P, D, R>
  run(payload: P, dependencies: D): Promise<R>
}

type PreActionContext<P, D> = {
  payload: P
  dependencies: D
}

type ActionContextFunction<P, D> = (actionContext: PreActionContext<P, D>) => void

type PreAction<P, D> = {
  func: ActionContextFunction<P, D>
  // maybe we have type
}

// allow to configure the application e.g. log each entry
export function Application<P, D, R>(): Application<P, D, R> {
  // maybe instead of using array we an explore using Task concept and
  // and instead we can just compose function

  const preActions: Array<PreAction<P, D>> = []
  return {
    pre(actionFunction) {
      // allow to push logger
      preActions.push({ func: actionFunction })
      return this
    },
    action() {
      return this
    },
    post() {
      return this
    },
    run(payload, dependencies) {
      return (
        preActions
          // we work with promises because this allows us easy capture all the async stuff
          .reduce((acc, v) => acc.then(r => (v.func(r), r)), Promise.resolve({ payload, dependencies }))
          .then
          // do action now will work with pre
          ()
          .then
          // do post actions
          ()
      )
    }
  }
}
