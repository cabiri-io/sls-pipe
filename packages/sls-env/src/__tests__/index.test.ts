// eslint-disable-next-line eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/ban-types */
import snakeCase from 'lodash.snakecase'
import { Logger, environment } from '..'

type EmptyEvent = {}
type EmptyContext = {}

describe('serverless environment', () => {
  it('supports application', async () =>
    environment<EmptyEvent, EmptyContext, void, void, string>()
      .app(() => 'hello world!')
      .start({}, {})
      .then(result => expect(result).toBe('hello world!')))

  type MessageEvent = { message: string }
  type NameContext = { name: string }
  type EventPayload = { event: MessageEvent; context: NameContext }

  it('supports passing an event and context to application', async () =>
    environment<MessageEvent, NameContext, void, EventPayload, string>()
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

      return environment<MessageEvent, NameContext, BuildMessageDependencies, EventPayload, string>()
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

      return environment<MessageEvent, NameContext, BuildMessageDependencies, EventPayload, string>()
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

      return environment<MessageEvent, NameContext, BuildMessageDependencies, EventPayload, string>()
        .global('buildMessage', (message: string, name: string) => `${message} ${name}!`)
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world!'))
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

      return environment<MessageEvent, NameContext, BuildHelloWorldMessageDependencies, HelloWorldMessage, string>()
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
        environment<EmptyEvent, EmptyContext, void, void, string>()
          .app(() => 'hello world!')
          .payload(() => {})
          .payload(() => {})
      ).toThrow())
  })

  describe('logger', () => {
    it('has default built in', () =>
      environment<EmptyEvent, EmptyContext, void, void, void>()
        .app(({ logger }) => expect(logger).toBeDefined())
        .start({}, {}))

    it('allows to override default', async () => {
      let logMessage: string
      const logger = ({
        debug(message: string) {
          logMessage = message
        }
      } as unknown) as Logger

      return environment<EmptyEvent, EmptyContext, void, void, void>()
        .logger(logger)
        .app(({ logger }) => logger.debug('log message'))
        .start({}, {})
        .then(() => {
          expect(logMessage).toBe('log message')
        })
    })
  })

  describe('environment variables mapper', () => {
    // how do we define environment variables
    it('default to camel case', () => {
      process.env.WORKSPACE = 'workspaceValue'
      process.env.WORKSPACE_NAME = 'workspaceNameValue'
      type EnvDependency = { env: { workspace: string; workspaceName: string } }

      return environment<EmptyEvent, EmptyContext, EnvDependency, void, void>()
        .app(({ dependencies: { env } }) => {
          expect(env.workspace).toBe('workspaceValue')
          expect(env.workspaceName).toBe('workspaceNameValue')
        })
        .start({}, {})
    })

    it('allows to override default variable name', () => {
      process.env.WORKSPACE1 = 'workspace1Value'
      process.env.WORKSPACE1_NAME = 'workspaceName1Value'
      type EnvDependency = { env: { workspace_1: string; workspace_1_name: string } }

      return environment<EmptyEvent, EmptyContext, EnvDependency, void, void>({
        envNameMapper: snakeCase
      })
        .app(({ dependencies: { env } }) => {
          expect(env.workspace_1).toBe('workspace1Value')
          expect(env.workspace_1_name).toBe('workspaceName1Value')
        })
        .start({}, {})
    })
  })
  // google run against express
  // it('runs request / response environment', () => environment().run(request, response))
  // it('runs google function environment', () => environment().run(event, context))
  /*
  const ecbMapping = {
  environment: 'ENVIRONMENT',
  serviceName: 'SERVICE_NAME',
  workspace: 'WORKSPACE',
}
  */
})
