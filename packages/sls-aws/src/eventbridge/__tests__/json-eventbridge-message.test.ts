import type { Context, EventBridgeEvent } from 'aws-lambda'
import { jsonEventBridgeMessage } from '../json-eventbridge-message'
import { PayloadParseError } from '../../error/parse'

describe('jsonEventBridgeMessage', () => {
  it('throws a PayloadParseError if parsing ', () => {
    const event = {} as unknown as EventBridgeEvent<string, never>
    expect(() => jsonEventBridgeMessage(event, {} as Context)).toThrow(
      new PayloadParseError('failed to process eventbridge message to json', { originalError: expect.any(Error) })
    )
  })

  it('returns the json parsed detail from the eventbridge event', () => {
    const event = { detail: '{"data":true}' } as unknown as EventBridgeEvent<string, never>
    expect(jsonEventBridgeMessage(event, {} as Context)).toEqual({ data: true })
  })
})
