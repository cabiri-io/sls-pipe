import { Handler, environment } from '..'
import { EmptyContext, EmptyEvent } from './types'

describe('serverless environment', () => {
  describe('application', () => {
    it('uses application to return response', async () =>
      environment<Handler<EmptyEvent, EmptyContext, string>, never, void, void>()
        .app(() => 'hello world!')
        .successHandler(({ result }) => result as string)
        .start({}, {})
        .then(result => expect(result).toBe('hello world!')))

    it('uses application to return promise based response', async () =>
      environment<Handler<EmptyEvent, EmptyContext, string>, never, void, void>()
        .app(async () => 'hello world!')
        .successHandler(({ result }) => result as string)
        .start({}, {})
        .then(result => expect(result).toBe('hello world!')))

    it('throws an error when application is not register', () =>
      expect(environment<Handler<EmptyEvent, EmptyContext, void>, void, void, void>().start({}, {})).rejects.toThrow())

    // injects config
    // injects logger
    // injects dependencies
  })
})
