import type { Context, EventBridgeEvent } from 'aws-lambda'
import { jsonEventBridgeMessage } from '../json-eventbridge-message'

describe('jsonEventBridgeMessage', () => {
  it('returns the json parsed detail from the eventbridge event', () => {
    const event = ({ detail: { data: true } } as unknown) as EventBridgeEvent<string, never>
    expect(jsonEventBridgeMessage(event, {} as Context)).toEqual({ data: true })
  })
})
