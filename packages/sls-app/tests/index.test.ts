import { application, ApplicationError } from '../src'

describe('application flow', () => {
  describe('action', () => {
    it('creates an application with an action only', () =>
      application<string, { appendString: string }, string>()
        .action((payload, { appendString }) => `${payload} ${appendString}`)
        .run('hello', { appendString: 'world' })
        .then(result => {
          expect(result).toBe('hello world')
        }))

    it('throws an error when multiple actions are created', () =>
      expect(() =>
        application<string, { appendString: string }, string>()
          .action((payload, { appendString }) => `${payload} ${appendString}`)
          .action((payload, { appendString }) => `${payload} ${appendString}`)
          .run('hello', { appendString: 'world' })
      ).toThrowError(new ApplicationError('you can only have a single action')))
  })

  describe('pre action', () => {
    it('execute pre action before main action', async () => {
      const preAction = jest.fn()
      const action = jest.fn()

      return application<string, { appendString: string }, void>()
        .pre(preAction)
        .action(action)
        .run('hello', { appendString: 'world' })
        .then(() => {
          expect(preAction).toHaveBeenCalledWith({ payload: 'hello', dependencies: { appendString: 'world' } })
          expect(action).toHaveBeenCalledWith('hello', { appendString: 'world' })
          //@ts-ignore
          expect(preAction).toHaveBeenCalledBefore(action)
        })
    })

    it('executes pre actions in order of definition', async () => {
      const preAction1 = jest.fn()
      const preAction2 = jest.fn()
      const action = jest.fn()

      return application<string, { appendString: string }, void>()
        .pre(preAction1)
        .pre(preAction2)
        .action(action)
        .run('hello', { appendString: 'world' })
        .then(() => {
          expect(preAction1).toHaveBeenCalledWith({ payload: 'hello', dependencies: { appendString: 'world' } })
          expect(preAction2).toHaveBeenCalledWith({ payload: 'hello', dependencies: { appendString: 'world' } })
          expect(action).toHaveBeenCalledWith('hello', { appendString: 'world' })
          //@ts-ignore
          expect(preAction1).toHaveBeenCalledBefore(preAction2)
          //@ts-ignore
          expect(preAction2).toHaveBeenCalledBefore(action)
        })
    })
  })
})
