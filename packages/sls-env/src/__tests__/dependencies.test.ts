import {
  DependencyFactory,
  DependencyFactoryResolver,
  EventDependency,
  Handler,
  dependencyFactory,
  environment,
  eventDependency
} from '..'
import { DependencyNotFoundError } from '../error'

describe('serverless environment', () => {
  type MessageEvent = { message: string }
  type NameContext = { name: string }
  type EventPayload = { event: MessageEvent; context: NameContext }

  describe('general dependencies', () => {
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

    describe('event dependencies', () => {
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
      })

      it('throws DependencyNotFoundError when the dependency could not be resolved', async () => {
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

        await expect(handler({ message: 'hello' }, { name: 'world' })).rejects.toThrow(
          new DependencyNotFoundError("EventDependency 'buildMessage' could not be resolved", 'buildMessage')
        )
      })
    })

    describe('dependency factory', () => {
      type BuildMessage = (message: string, name: string) => string
      type BuildMessageDependencies = {
        buildMessage: DependencyFactory<BuildMessage>
      }
      type BuildMessageFactory = (customParams: string) => DependencyFactoryResolver<BuildMessage, EventPayload>

      it('resolves dependency from dependency factory using event', async () => {
        type BuildMessage = (message: string, name: string) => string
        type BuildMessageDependencies = {
          buildMessage: DependencyFactory<BuildMessage>
        }

        type BuildMessageFactory = (customParams: string) => DependencyFactoryResolver<BuildMessage, EventPayload>
        const messageClientFactory: BuildMessageFactory = customParams => ({ event }) => {
          switch (event.message) {
            case 'client1':
              return (_m: string, _n: string) => `Using client1! with ${customParams}`
            case 'client2':
              return (_m: string, _n: string) => `Using client2! with ${customParams}`
            default:
              return undefined
          }
        }

        const handler = environment<
          Handler<MessageEvent, NameContext, string>,
          any,
          BuildMessageDependencies,
          EventPayload
        >()
          .global({
            buildMessage: dependencyFactory(messageClientFactory('customParams'))
          })
          .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
            buildMessage(event.message, context.name)
          )
          .successHandler(({ result }) => result as string).start

        const response1 = await handler({ message: 'client1' }, { name: 'hello' })
        expect(response1).toBe('Using client1! with customParams')

        const response2 = await handler({ message: 'client2' }, { name: 'hello' })
        expect(response2).toBe('Using client2! with customParams')
      })

      it('resolves dependency from dependency factory using context', async () => {
        const messageClientFactory: BuildMessageFactory = customParams => ({ context }: EventPayload) => {
          switch (context.name) {
            case 'client1':
              return (_m: string, _n: string) => `Using client1! with ${customParams}`
            case 'client2':
              return (_m: string, _n: string) => `Using client2! with ${customParams}`
            default:
              return undefined
          }
        }

        const handler = environment<
          Handler<MessageEvent, NameContext, string>,
          any,
          BuildMessageDependencies,
          EventPayload
        >()
          .global({
            buildMessage: dependencyFactory(messageClientFactory('customParams'))
          })
          .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
            buildMessage(event.message, context.name)
          )
          .successHandler(({ result }) => result as string).start

        const response1 = await handler({ message: 'hello' }, { name: 'client1' })
        expect(response1).toBe('Using client1! with customParams')

        const response2 = await handler({ message: 'hello' }, { name: 'client2' })
        expect(response2).toBe('Using client2! with customParams')
      })

      it('propagates the error to errorHandler when dependency factory resolver throws an error', async () => {
        type BuildMessage = (message: string, name: string) => string
        type BuildMessageDependencies = {
          buildMessage: DependencyFactory<BuildMessage>
        }

        const errorHandler = jest.fn()
        errorHandler.mockImplementation(({ error }: any) => {
          throw error
        })

        const errorMessage = 'unexpected error'
        const error = new Error(errorMessage)

        const handler = environment<
          Handler<MessageEvent, NameContext, string>,
          any,
          BuildMessageDependencies,
          EventPayload
        >()
          .global({
            buildMessage: dependencyFactory(_params => {
              throw new Error(errorMessage)
            })
          })
          .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
            buildMessage(event.message, context.name)
          )
          .errorHandler(errorHandler)
          .successHandler(({ result }) => result as string).start

        await expect(handler({ message: 'hello' }, { name: 'world' })).rejects.toThrow(error)

        expect(errorHandler).toHaveBeenCalledTimes(1)
        expect(errorHandler.mock.calls[0][0].error).toMatchObject(error)
      })

      it('throws DependencyNotFoundError when dependency factory return undefined', async () => {
        type BuildMessage = (message: string, name: string) => string
        type BuildMessageDependencies = {
          buildMessage: DependencyFactory<BuildMessage>
        }

        const messageClientFactory: DependencyFactoryResolver<BuildMessage, EventPayload> = (_params: EventPayload) =>
          undefined

        const handler = environment<
          Handler<MessageEvent, NameContext, string>,
          any,
          BuildMessageDependencies,
          EventPayload
        >()
          .global({
            buildMessage: dependencyFactory(messageClientFactory)
          })
          .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
            buildMessage(event.message, context.name)
          )
          .successHandler(({ result }) => result as string).start

        await expect(handler({ message: 'hello' }, { name: 'world' })).rejects.toThrow(
          new DependencyNotFoundError("Factory-based dependency 'buildMessage' could not be resolved", 'buildMessage')
        )
      })
      it('throws DependencyNotFoundError when dependency factory returns null', async () => {
        type BuildMessage = (message: string, name: string) => string
        type BuildMessageDependencies = {
          buildMessage: DependencyFactory<BuildMessage>
        }

        const messageClientFactory: DependencyFactoryResolver<BuildMessage, EventPayload> = (_params: EventPayload) =>
          null

        const handler = environment<
          Handler<MessageEvent, NameContext, string>,
          any,
          BuildMessageDependencies,
          EventPayload
        >()
          .global({
            buildMessage: dependencyFactory(messageClientFactory)
          })
          .app(({ payload: { event, context }, dependencies: { buildMessage } }) =>
            buildMessage(event.message, context.name)
          )
          .successHandler(({ result }) => result as string).start

        await expect(handler({ message: 'hello' }, { name: 'world' })).rejects.toThrow(
          new DependencyNotFoundError("Factory-based dependency 'buildMessage' could not be resolved", 'buildMessage')
        )
      })
    })
  })
})
