import type { Context, EventBridgeEvent } from 'aws-lambda'

import { PayloadParseError } from '../error/parse'

const jsonEventBridgeMessage = <T>(event: EventBridgeEvent<string, string>, _context: Context): T => {
  try {
    return JSON.parse(event.detail) as unknown as T
  } catch (err) {
    throw new PayloadParseError('failed to process eventbridge message to json', { originalError: err })
  }
}

export { jsonEventBridgeMessage }
