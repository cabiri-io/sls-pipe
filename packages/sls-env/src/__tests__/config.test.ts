import { Handler, environment } from '..'
import { resolveConfig } from '../config'
import { defaultLogger } from '../logger'
import { EmptyContext, EmptyEvent } from './types'

const invocationId = 'invocationId'

describe('config', () => {
  describe('resolver', () => {
    it('resolves config from function', async () => {
      type Message = { content: string }
      const result = await resolveConfig<Message>(
        () => ({
          content: 'message'
        }),
        defaultLogger,
        invocationId
      )

      expect(result.content).toBe('message')
    })

    it('resolves config from function passes logger', async () => {
      type Message = { content: string }
      const result = await resolveConfig<Message>(
        ({ logger }) => {
          expect(logger).toBe(defaultLogger)
          return {
            content: 'message'
          }
        },
        defaultLogger,
        invocationId
      )

      expect(result.content).toBe('message')
    })

    it('resolves config from async function', async () => {
      type Message = { content: string }
      const result = await resolveConfig<Message>(
        async () => ({
          content: 'message'
        }),
        defaultLogger,
        invocationId
      )

      expect(result.content).toBe('message')
    })

    it('resolve config from an object', async () => {
      type Message = { content: string }
      const result = await resolveConfig<Message>(
        {
          content: 'message'
        },
        defaultLogger,
        invocationId
      )

      expect(result.content).toBe('message')
    })

    it('resolve config from a promise', async () => {
      type Message = { content: string }
      const result = await resolveConfig<Message>(
        Promise.resolve({
          content: 'message'
        }),
        defaultLogger,
        invocationId
      )

      expect(result.content).toBe('message')
    })

    it('resolve config from a function property on object', async () => {
      type Message = { content: string }
      const result = await resolveConfig<Message>(
        {
          content: () => 'message'
        },
        defaultLogger,
        invocationId
      )

      expect(result.content).toBe('message')
    })

    it('resolve config from a function property on object passes a logger', async () => {
      type Message = { content: string }
      const result = await resolveConfig<Message>(
        {
          content: ({ logger }) => {
            expect(logger).toBe(defaultLogger)
            return 'message'
          }
        },
        defaultLogger,
        invocationId
      )

      expect(result.content).toBe('message')
    })

    it('resolve config from a function property returning Promise on object', async () => {
      type Message = { content: string }
      const result = await resolveConfig<Message>(
        {
          content: async () => 'message'
        },
        defaultLogger,
        invocationId
      )

      expect(result.content).toBe('message')
    })

    it('resolve config from a function property returning Promise on object passes a logger', async () => {
      type Message = { content: string }
      const result = await resolveConfig<Message>(
        {
          content: async ({ logger }) => {
            expect(logger).toBe(defaultLogger)
            return 'message'
          }
        },
        defaultLogger,
        invocationId
      )

      expect(result.content).toBe('message')
    })

    it('resolve config from an object of mix basic property, promise property, function and function return promise', async () => {
      type Message = { content: string; title: string; description: string; short: string }
      const result = await resolveConfig<Message>(
        {
          content: () => 'message',
          title: async () => 'hello',
          description: 'desc',
          short: Promise.resolve('short')
        },
        defaultLogger,
        invocationId
      )

      expect(result).toEqual({
        content: 'message',
        title: 'hello',
        description: 'desc',
        short: 'short'
      })
    })

    it('rejects with an error when it fails to resolve configuration', async () => {
      type Message = { content: string }
      const resolve = () =>
        resolveConfig<Message>(
          {
            content: Promise.reject('error')
          },
          defaultLogger,
          invocationId
        )

      await expect(resolve()).rejects.toThrowErrorMatchingInlineSnapshot(`"failed to initialise config 'content'"`)
    })
  })

  describe('in context of environment', () => {
    it('creates config from pure function', () => {
      type AppConfig = {
        message: string
      }

      return environment<Handler<EmptyEvent, EmptyContext, void>, AppConfig, never, void>()
        .config(() => ({ message: 'hello' }))
        .app(({ config }) => {
          expect(config.message).toBe('hello')
        })
        .start({}, {})
    })

    it('creates config from function returning promise', () => {
      type AppConfig = {
        message: string
      }

      return environment<Handler<EmptyEvent, EmptyContext, void>, AppConfig, never, void>()
        .config(async () => ({ message: 'hello' }))
        .app(({ config }) => {
          expect(config.message).toBe('hello')
        })
        .start({}, {})
    })

    it('creates config from object with properties', () => {
      type AppConfig = {
        message: string
      }

      return environment<Handler<EmptyEvent, EmptyContext, void>, AppConfig, never, void>()
        .config({ message: 'hello' })
        .app(({ config }) => {
          expect(config.message).toBe('hello')
        })
        .start({}, {})
    })

    it('creates config from object with Promise properties', () => {
      type AppConfig = {
        message: string
      }

      return environment<Handler<EmptyEvent, EmptyContext, void>, AppConfig, never, void>()
        .config(Promise.resolve({ message: 'hello' }))
        .app(({ config }) => {
          expect(config.message).toBe('hello')
        })
        .start({}, {})
    })

    it('create config from object factory function', () => {
      type AppConfig = {
        message: string
      }

      return environment<Handler<EmptyEvent, EmptyContext, void>, AppConfig, never, void>()
        .config({
          message: ({ logger }) => {
            expect(logger).toBeDefined()
            return 'hello'
          }
        })
        .app(({ config }) => {
          expect(config.message).toBe('hello')
        })
        .start({}, {})
    })

    it('initialises config only once running sequentially', async () => {
      type AppConfig = {
        message: string
      }

      const env = environment<Handler<EmptyEvent, EmptyContext, void>, AppConfig, never, void>()
        .config(async () => new Promise(resolve => setTimeout(() => resolve({ message: 'hello' }), 1000)))
        .app(({ config }) => {
          expect(config.message).toBe('hello')
        }).start

      let start = Date.now()
      await env({}, {})

      expect(Date.now() - start).toBeGreaterThanOrEqual(1000)

      start = Date.now()
      await env({}, {})
      expect(Date.now() - start).toBeLessThan(1000)
    })

    /**
     * We need to define what it means when a promise rejects when
     * other promises are deferred.
     * - should we retry other waiting request
     * - should we reject them and create a new promise
     */
    it.skip('initialises config only once running concurrently', async () => {
      type AppConfig = {
        message: string
      }

      let invocationCounter = 1
      const env = environment<Handler<EmptyEvent, EmptyContext, void>, AppConfig, never, void>()
        .config(
          async () =>
            new Promise(resolve => setTimeout(() => resolve({ message: 'hello' }), 1000 * invocationCounter++))
        )
        .app(({ config }) => {
          expect(config.message).toBe('hello')
        }).start

      const start = Date.now()
      await Promise.all([env({}, {}), env({}, {})])
      expect(Date.now() - start).toBeGreaterThanOrEqual(1000)
      expect(Date.now() - start).toBeLessThan(1200)
    })

    /**
     * We need to define what it means when a promise rejects when
     * other promises are deferred.
     * - should we retry other waiting request
     * - should we reject them and create a new promise
     */
    it.skip('initialises config only once running concurrently', async () => {
      type AppConfig = {
        message: string
      }

      let invocationCounter = 1
      const env = environment<Handler<EmptyEvent, EmptyContext, void>, AppConfig, never, void>()
        .config(
          async () =>
            new Promise(resolve => setTimeout(() => resolve({ message: 'hello' }), 1000 * invocationCounter++))
        )
        .app(({ config }) => {
          expect(config.message).toBe('hello')
        }).start

      const start = Date.now()
      await Promise.all([env({}, {}), env({}, {})])
      expect(Date.now() - start).toBeGreaterThanOrEqual(1000)
      expect(Date.now() - start).toBeLessThan(1200)
    })

    it('retries loading configuration when it fails to load', async () => {
      type AppConfig = {
        message: string
      }

      let invocationCounter = 1
      const env = environment<Handler<EmptyEvent, EmptyContext, void>, AppConfig, void, void, string>()
        .config(async () => {
          if (invocationCounter === 1) {
            invocationCounter++
            return Promise.reject('error')
          }

          return Promise.resolve({ message: 'hello' })
        })
        .successHandler(({ result }) => result)
        .app(() => 'hello').start

      await expect(env({}, {})).rejects.toThrow()
      await expect(env({}, {})).resolves.toEqual('hello')
    })
  })
})
