import { APIGatewayProxyEventV2 } from 'aws-lambda'
import { Handler, environment } from '@cabiri-io/sls-env'

import { APIGatewayEventDependency, apiGatewayEventDependency } from '../dependency'

describe('serverless environment', () => {
  type MessageEvent = { message: string }
  type NameContext = { name: string }
  type EventPayload = { event: MessageEvent; context: NameContext }

  describe('api gateway event dependencies', () => {
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
