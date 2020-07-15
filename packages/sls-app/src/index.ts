type ActionFunction<P, D, R> = (payload: P, dependencies: D) => R

// configuration I want to be able to debug invocation
type Application<P, D, R> = {
  pre(actionContextFunction: ActionContextFunction<P, D>): Application<P, D, R>
  action(actionFunction: ActionFunction<P, D, R>): Application<P, D, R> | never
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

export class ApplicationError extends Error {
  public type: string = 'ApplicationError'
}

// allow to configure the application e.g. log each entry
export function application<P, D, R>(): Application<P, D, R> {
  // maybe instead of using array we an explore using Task concept and
  // and instead we can just compose function

  const preActions: Array<PreAction<P, D>> = []
  let mainAction: ActionFunction<P, D, R>
  return {
    pre(actionFunction) {
      // allow to push logger
      preActions.push({ func: actionFunction })
      return this
    },

    action(actionFunction) {
      //@ts-expect-error
      if (mainAction) throw new ApplicationError('you can only have a single action')
      mainAction = actionFunction
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
          // do action now will work with pre
          .then(({ payload, dependencies }) => mainAction(payload, dependencies))
      )
    }
  }
}
