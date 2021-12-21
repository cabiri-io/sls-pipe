import { EventDependencyError } from '../error/index'
import { EventDependency, DependencyFactory, Handler, environment, eventDependency, setDependencyFactory } from '..'

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

    it('correctly resolves dependency factories dependent on event', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: DependencyFactory<BuildMessage>
      }

      const buildMessagesFactory = () => ({ event }: EventPayload) => {
        switch (event.message) {
          case 'client1':
            return (_m: string, _n: string) => `Using client1!`
          case 'client2':
            return (_m: string, _n: string) => `Using client2!`
          default:
            throw new Error(`Cannot resolve dependency based on event message: ${event.message}`)
        }
      }

      const handler = environment<
        Handler<MessageEvent, NameContext, string>,
        any,
        BuildMessageDependencies,
        EventPayload
      >()
        .global({
          buildMessage: setDependencyFactory<BuildMessage, EventPayload>(buildMessagesFactory())
        })
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .successHandler(({ result }) => result as string).start

      const response1 = await handler({ message: 'client1' }, { name: 'hello' })
      expect(response1).toBe('Using client1!')

      const response2 = await handler({ message: 'client2' }, { name: 'hello' })
      expect(response2).toBe('Using client2!')

      await expect(handler({ message: 'client3' }, { name: 'world' })).rejects.toThrow(
        new Error(`Cannot resolve dependency based on event message: client3`)
      )
    })

    it('correctly resolves dependency factories dependent on context', async () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: DependencyFactory<BuildMessage>
      }

      const buildMessagesFactory = () => ({ context }: EventPayload) => {
        switch (context.name) {
          case 'client1':
            return (_m: string, _n: string) => `Using client1!`
          case 'client2':
            return (_m: string, _n: string) => `Using client2!`
          default:
            throw new Error(`Cannot resolve dependency based on event message: ${context.name}`)
        }
      }

      const handler = environment<
        Handler<MessageEvent, NameContext, string>,
        any,
        BuildMessageDependencies,
        EventPayload
      >()
        .global({
          buildMessage: setDependencyFactory<BuildMessage, EventPayload>(buildMessagesFactory())
        })
        .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
          buildMessage(event.message, context.name)
        )
        .successHandler(({ result }) => result as string).start

      const response1 = await handler({ message: 'hello' }, { name: 'client1' })
      expect(response1).toBe('Using client1!')

      const response2 = await handler({ message: 'hello' }, { name: 'client2' })
      expect(response2).toBe('Using client2!')

      await expect(handler({ message: 'hello' }, { name: 'client3' })).rejects.toThrow(
        new Error(`Cannot resolve dependency based on event message: client3`)
      )
    })
  })
})
