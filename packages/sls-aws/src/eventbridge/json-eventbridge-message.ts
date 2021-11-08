import type { Context, EventBridgeEvent } from 'aws-lambda'

const jsonEventBridgeMessage = <T>(event: EventBridgeEvent<string, any>, _context: Context): T =>
  (event.detail as unknown) as T

export { jsonEventBridgeMessage }
