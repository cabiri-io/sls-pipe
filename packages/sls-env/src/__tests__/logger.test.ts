import pino from 'pino'
import { Handler, environment } from '..'
import { Logger, createMutableLogger } from '../logger'
import { EmptyContext, EmptyEvent } from './types'

describe('serverless environment', () => {
  let logMessageStore: Array<string>
  let logContextStore: Array<Record<string, any>>
  let logger: Logger
  let clearStores: () => void

  beforeEach(() => {
    logMessageStore = []
    logContextStore = []

    clearStores = () => {
      while (logMessageStore.length > 0) logMessageStore.shift()
      while (logContextStore.length > 0) logContextStore.shift()
    }

    class TestLogger implements Logger {
      context: Record<string, any>
      constructor(context: any) {
        this.context = context
      }

      trace(message: any) {
        logMessageStore.push(`${message}`)
        logContextStore[logMessageStore.length - 1] = this.context
      }
      error(message: any) {
        logMessageStore.push(`${message}`)
        logContextStore[logMessageStore.length - 1] = this.context
      }
      info(message: any) {
        logMessageStore.push(`${message}`)
        logContextStore[logMessageStore.length - 1] = this.context
      }
      debug(message: any) {
        logMessageStore.push(`${message}`)
        logContextStore[logMessageStore.length - 1] = this.context
      }
      //@ts-expect-error
      child(context: any) {
        return new TestLogger(context)
      }

      level = 'info'
    }

    //@ts-expect-error
    logger = new TestLogger()
  })

  describe('create mutable logger', () => {
    it('creates a mutable logger', () => {
      const mutableLogger = createMutableLogger(logger)

      //@ts-expect-error
      mutableLogger.child?.('test')
      mutableLogger.debug('message')

      expect(logMessageStore).toContain('message')
      const contextIndex = logMessageStore.findIndex(m => m === 'message')
      expect(logContextStore[contextIndex]).toBe('test')
    })
  })

  describe('in context of environment', () => {
    it('has defaults built in', () =>
      environment<Handler<EmptyEvent, EmptyContext, void>, never, void, void>({ logger: { mutable: false } })
        .app(({ logger }) => expect(logger).toBeDefined())
        .start({}, {}))

    it('allows to override default logger', async () =>
      environment<Handler<EmptyEvent, EmptyContext, void>, never, void, void>({ logger: { mutable: false } })
        .logger(logger)
        .app(({ logger }) => logger.debug('log message'))
        .start({}, {})
        .then(() => {
          expect(logMessageStore).toContain('log message')
        }))

    it('allows to read log level from mutable logger', async () =>
      environment<Handler<EmptyEvent, EmptyContext, void>, never, void, void>({ logger: { mutable: true } })
        .logger(logger)
        .app(({ logger }) => {
          expect(logger.level).toBe('info')
        })
        .start({}, {}))

    it('allows to read/write log level from mutable logger', async () =>
      environment<Handler<EmptyEvent, EmptyContext, void>, never, void, void>({ logger: { mutable: true } })
        .logger(logger)
        .app(({ logger }) => {
          logger.level = 'debug'
          expect(logger.level).toBe('debug')
        })
        .start({}, {}))

    it('allows to inject custom context to logger during invocation', async () => {
      type CustomEvent = { id: string }
      type CustomContext = { version: number }
      const env = environment<Handler<CustomEvent, CustomContext, void>, never, void, void>({
        logger: {
          mutable: true,
          invocationContext: (event, context) => ({
            ...event,
            ...context
          })
        }
      })
        .logger(logger)
        .app(({ logger }) => logger.debug('log message')).start

      await env({ id: '1234' }, { version: 1 })

      expect(logMessageStore).toContain('log message')
      let contextIndex = logMessageStore.findIndex(m => m === 'log message')
      expect(logContextStore[contextIndex]).toEqual(
        expect.objectContaining({
          id: '1234',
          version: 1,
          invocationId: expect.any(String)
        })
      )

      clearStores()

      await env({ id: '1235' }, { version: 2 })

      expect(logMessageStore).toContain('log message')
      contextIndex = logMessageStore.findIndex(m => m === 'log message')
      expect(logContextStore[contextIndex]).toEqual(
        expect.objectContaining({
          id: '1235',
          version: 2,
          invocationId: expect.any(String)
        })
      )
    })

    it('injects log at each step of invocations', async () => {
      type Config = { message: string }
      type Dependencies = { message: string }
      return environment<Handler<EmptyEvent, EmptyContext, void>, Config, Dependencies, string>({
        logger: { mutable: false }
      })
        .logger(logger)
        .config(({ logger }) => {
          logger.debug('config log')
          return {
            message: 'hello'
          }
        })
        .global(({ logger }) => {
          logger.debug('dependencies log')
          return {
            message: 'hello'
          }
        })
        .payload((_event, _context, { logger }) => {
          logger.debug('payload log')
          return 'hello'
        })
        .app(({ logger }) => logger.debug('app log'))
        .start({}, {})
        .then(() => {
          expect(logMessageStore).toContain('config log')
          expect(logMessageStore).toContain('dependencies log')
          expect(logMessageStore).toContain('payload log')
          expect(logMessageStore).toContain('app log')
        })
    })

    it('checks compatibility with pino logger', done => {
      type Config = { message: string }
      type Dependencies = { message: string }
      environment<Handler<EmptyEvent, EmptyContext, void>, Config, Dependencies, string>({
        logger: { mutable: true }
      })
        .logger(pino)
        .config(({ logger }) => {
          logger.debug('config log')
          return {
            message: 'hello'
          }
        })
        .global(({ logger }) => {
          logger.debug('dependencies log')
          return {
            message: 'hello'
          }
        })
        .payload((_event, _context, { logger }) => {
          logger.debug('payload log')
          return 'hello'
        })
        .app(({ logger }) => logger.debug('app log'))
        .start({}, {})
        .then(() => {
          done()
        })
    })
  })
})
