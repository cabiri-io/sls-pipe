import pino from 'pino'
import { Handler, environment } from '..'
import { Logger, createMutableLogger } from '../logger'
import { EmptyContext, EmptyEvent } from './types'

describe('serverless environment', () => {
  let logMessageStore: Array<string>
  let logger: Logger

  beforeEach(() => {
    logMessageStore = []

    class TestLogger implements Logger {
      prefix = ''
      constructor(prefix: string) {
        if (typeof prefix === 'string') {
          this.prefix = prefix
        }
      }

      trace(message: any) {
        logMessageStore.push(`${this.prefix}${message}`)
      }
      error(message: any) {
        logMessageStore.push(`${this.prefix}${message}`)
      }
      info(message: any) {
        logMessageStore.push(`${this.prefix}${message}`)
      }
      debug(message: any) {
        logMessageStore.push(`${this.prefix}${message}`)
      }
      //@ts-expect-error
      child(context: any) {
        return new TestLogger(context)
      }
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

      expect(logMessageStore).toContain('testmessage')
    })
  })

  describe('in context of environment', () => {
    it('has default built in', () =>
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

    it('checks compatibilit with pino logger', done => {
      type Config = { message: string }
      type Dependencies = { message: string }
      return environment<Handler<EmptyEvent, EmptyContext, void>, Config, Dependencies, string>({
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
