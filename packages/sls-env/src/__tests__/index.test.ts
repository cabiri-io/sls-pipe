// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-types */
import { Handler, Logger, environment } from '..'

type EmptyEvent = {}
type EmptyContext = {}

describe('serverless environment', () => {
  it('supports application', async () =>
    environment<Handler<EmptyEvent, EmptyContext, string>, never, void, void>()
      .app(() => 'hello world!')
      .start({}, {})
      .then(result => expect(result).toBe('hello world!')))

  type MessageEvent = { message: string }
  type NameContext = { name: string }
  type EventPayload = { event: MessageEvent; context: NameContext }

  it('supports passing an event and context to application', async () =>
    environment<Handler<MessageEvent, NameContext, string>, never, void, EventPayload>()
      .app(({ payload: { event, context } }) => `${event.message} ${context.name}!`)
      .start({ message: 'hello' }, { name: 'world' })
      .then(result => expect(result).toBe('hello world!')))

  describe('dependencies', () => {
    it('supports adding object with named dependencies', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: BuildMessage
      }

      return environment<Handler<MessageEvent, NameContext, string>, never, BuildMessageDependencies, EventPayload>()
        .global({ buildMessage: (message: string, name: string) => `${message} ${name}!` })
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world!'))
    })

    it('supports adding function which returns named dependencies', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: BuildMessage
      }

      return environment<Handler<MessageEvent, NameContext, string>, never, BuildMessageDependencies, EventPayload>()
        .global(() => ({
          buildMessage: (message: string, name: string) => `${message} ${name}!`
        }))
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world!'))
    })

    it('passes config and log as part of dependency factory function', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: BuildMessage
      }
      type Config = { hello: string }

      return environment<Handler<MessageEvent, NameContext, string>, Config, BuildMessageDependencies, EventPayload>()
        .config({ hello: 'config' })
        .global(({ config }) => ({
          buildMessage: (message: string, name: string) => `${message} ${name} of ${config.hello}!`
        }))
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world of config!'))
    })
  })

  describe('payload', () => {
    it('supports mapping payload to custom type', async () => {
      type HelloWorldMessage = {
        hello: string
        world: string
      }

      type BuildHelloWorldMessage = (message: HelloWorldMessage) => string

      const buildMessage: BuildHelloWorldMessage = message => `${message.hello} ${message.world}!`

      type BuildHelloWorldMessageDependencies = {
        buildMessage: BuildHelloWorldMessage
      }

      return environment<
        Handler<MessageEvent, NameContext, string>,
        never,
        BuildHelloWorldMessageDependencies,
        HelloWorldMessage
      >()
        .global({ buildMessage })
        .payload((event, context) => ({
          hello: event.message,
          world: context.name
        }))
        .app(({ payload, dependencies: { buildMessage } }) => buildMessage(payload))
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world!'))
    })

    it('fails when added multiple times', () =>
      expect(() =>
        environment<Handler<EmptyEvent, EmptyContext, string>, never, void, void>()
          .app(() => 'hello world!')
          .payload(() => {})
          .payload(() => {})
      ).toThrow())
  })

  describe('logger', () => {
    it('has default built in', () =>
      environment<Handler<EmptyEvent, EmptyContext, void>, never, void, void>()
        .app(({ logger }) => expect(logger).toBeDefined())
        .start({}, {}))

    it('allows to override default', async () => {
      let logMessage: string
      const logger = ({
        debug(message: string) {
          logMessage = message
        }
      } as unknown) as Logger

      return environment<Handler<EmptyEvent, EmptyContext, void>, never, void, void>()
        .logger(logger)
        .app(({ logger }) => logger.debug('log message'))
        .start({}, {})
        .then(() => {
          expect(logMessage).toBe('log message')
        })
    })
  })

  describe('application configuration', () => {
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

    it('creates config from value', () => {
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

    it('creates config from Promise', () => {
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

    it.todo('create config from object factory')
  })

  describe('success handler configuration', () => {
    it('allows to remap application result to handler result', async () => {
      type AppResult = string
      type HandlerResult = { message: string }
      const result = await environment<Handler<EmptyEvent, EmptyContext, HandlerResult>, void, never, void, AppResult>()
        .successHandler(message => ({ message }))
        .app(() => 'app result')
        .start({}, {})

      expect(result).toEqual({ message: 'app result' })
    })
  })

  // where and how are we going to add correllaction id
})
