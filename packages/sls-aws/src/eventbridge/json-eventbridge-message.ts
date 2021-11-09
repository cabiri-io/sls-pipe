import type { Context, EventBridgeEvent } from 'aws-lambda'

const jsonEventBridgeMessage = <T>(event: EventBridgeEvent<string, T>, _context: Context): T => event.detail

export { jsonEventBridgeMessage }
