// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-types */
import snakeCase from 'lodash.snakecase'
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
    it('supports adding named function as dependencies', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: BuildMessage
      }

      const buildMessage: BuildMessage = (message, name) => `${message} ${name}!`

      return environment<Handler<MessageEvent, NameContext, string>, never, BuildMessageDependencies, EventPayload>()
        .global(buildMessage)
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world!'))
    })

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

    it('supports adding through function arguments', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: BuildMessage
      }

      return environment<Handler<MessageEvent, NameContext, string>, never, BuildMessageDependencies, EventPayload>()
        .global('buildMessage', (message: string, name: string) => `${message} ${name}!`)
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world!'))
    })
  })

  // type A<AA, AB> = (a: AA) => AB
  // type C<AC, AD extends A<unknown, unknown>> = (a: AC) => AD

  // const a: C<string, A<number, string>> = a => b => a + b

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
        .global(buildMessage)
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

  // maybe we should have environment variables and all should be consider app configuration?
  describe('environment variables mapper', () => {
    // how do we define environment variables
    it('default to camel case', () => {
      process.env.WORKSPACE = 'workspaceValue'
      process.env.WORKSPACE_NAME = 'workspaceNameValue'
      type EnvDependency = { env: { workspace: string; workspaceName: string } }

      return environment<Handler<EmptyEvent, EmptyContext, void>, never, EnvDependency, void>()
        .app(({ dependencies: { env } }) => {
          expect(env.workspace).toBe('workspaceValue')
          expect(env.workspaceName).toBe('workspaceNameValue')
        })
        .start({}, {})
    })

    it('allows to override default variable name', () => {
      // fixme: all the env needs to be pushed to configuration and be described as types
      process.env.WORKSPACE1 = 'workspace1Value'
      process.env.WORKSPACE1_NAME = 'workspaceName1Value'
      type EnvDependency = { env: { workspace_1: string; workspace_1_name: string } }

      return environment<Handler<EmptyEvent, EmptyContext, void>, never, EnvDependency, void>({
        envNameMapper: snakeCase
      })
        .app(({ dependencies: { env } }) => {
          expect(env.workspace_1).toBe('workspace1Value')
          expect(env.workspace_1_name).toBe('workspaceName1Value')
        })
        .start({}, {})
    })
  })

  describe('application configuration', () => {
    // should app configuration be passed to dependecies
    // that could be good as then we can use to to configure all the clients and their timeouts
    //
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

    it.todo('create config from object factory')
  })

  // where and how are we going to add correllaction id
})
