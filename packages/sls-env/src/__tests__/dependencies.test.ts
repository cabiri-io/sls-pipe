import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { EventDependencyError } from '../error/index'
import {
  APIGatewayEventDependency,
  EventDependency,
  Handler,
  apiGatewayEventDependency,
  environment,
  eventDependency
} from '..'

describe('serverless environment', () => {
  type MessageEvent = { message: string }
  type NameContext = { name: string }
  type EventPayload = { event: MessageEvent; context: NameContext }

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
        .successHandler(({ result }) => result as string)
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world!'))
    })

    it('supports adding promise object with named dependencies', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: BuildMessage
      }

      return environment<Handler<MessageEvent, NameContext, string>, never, BuildMessageDependencies, EventPayload>()
        .global(Promise.resolve({ buildMessage: (message: string, name: string) => `${message} ${name}!` }))
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .successHandler(({ result }) => result as string)
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
        .successHandler(({ result }) => result as string)
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
        .successHandler(({ result }) => result as string)
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world of config!'))
    })

    it('builds list of dependency in an async function constructor', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: BuildMessage
      }
      type Config = { hello: string }

      return environment<Handler<MessageEvent, NameContext, string>, Config, BuildMessageDependencies, EventPayload>()
        .config({ hello: 'config' })
        .global(async ({ config }) => ({
          buildMessage: (message: string, name: string) => `${message} ${name} of ${config.hello}!`
        }))
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .successHandler(({ result }) => result as string)
        .start({ message: 'hello' }, { name: 'world' })
        .then(result => expect(result).toBe('hello world of config!'))
    })

    it('uses dependency based on the event property', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: EventDependency<BuildMessage>
      }

      const buildMessages: Record<string, BuildMessage> = {
        client1: (_m, _n) => `Using client1!`,
        client2: (_m, _n) => `Using client2!`
      }

      const handler = environment<
        Handler<MessageEvent, NameContext, string>,
        any,
        BuildMessageDependencies,
        EventPayload
      >()
        .global({
          buildMessage: eventDependency<BuildMessage, EventPayload, MessageEvent>(
            buildMessages,
            ({ event }) => event.message
          )
        })
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .successHandler(({ result }) => result as string).start

      const response1 = await handler({ message: 'client1' }, { name: 'world' })
      expect(response1).toBe('Using client1!')

      const response2 = await handler({ message: 'client2' }, { name: 'world' })
      expect(response2).toBe('Using client2!')

      await expect(handler({ message: 'client3' }, { name: 'world' })).rejects.toThrow(
        new EventDependencyError("No event based dependency found for 'buildMessage'")
      )
    })

    it('changes event based dependencies based on the payload', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: EventDependency<BuildMessage>
      }

      const buildMessages: Record<string, BuildMessage> = {
        client1: (_m, _n) => `Using client1!`,
        client2: (_m, _n) => `Using client2!`
      }

      const handler = environment<
        Handler<MessageEvent, NameContext, string>,
        any,
        BuildMessageDependencies,
        EventPayload
      >()
        .global({
          buildMessage: eventDependency<BuildMessage, EventPayload>(
            buildMessages,
            ({ payload }) => payload.context.name
          )
        })
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .successHandler(({ result }) => result as string).start

      const response1 = await handler({ message: 'hello' }, { name: 'client1' })
      expect(response1).toBe('Using client1!')

      const response2 = await handler({ message: 'hello' }, { name: 'client2' })
      expect(response2).toBe('Using client2!')

      await expect(handler({ message: 'client3' }, { name: 'world' })).rejects.toThrow(
        new EventDependencyError("No event based dependency found for 'buildMessage'")
      )
    })

    it('changes event based dependencies based on the payload - APIGateway event', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: APIGatewayEventDependency<BuildMessage, EventPayload>
      }

      const buildMessages: Record<string, BuildMessage> = {
        'test.com': (_m, _n) => `Using client for test.com!`
      }

      const event = ({
        headers: {
          host: 'test.com'
        }
      } as unknown) as APIGatewayProxyEventV2

      const handler = environment<
        Handler<APIGatewayProxyEventV2, NameContext, string>,
        any,
        BuildMessageDependencies,
        EventPayload
      >()
        .global({
          buildMessage: apiGatewayEventDependency(buildMessages, ({ event }) => event.headers['host'] as string)
        })
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .successHandler(({ result }) => result as string).start

      const response1 = await handler(event, { name: 'world' })
      expect(response1).toBe('Using client for test.com!')
    })
  })
})
