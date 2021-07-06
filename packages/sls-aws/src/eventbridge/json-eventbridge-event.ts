import type { Context, EventBridgeEvent } from 'aws-lambda'

const jsonEventBridgeEvent = <T>(event: EventBridgeEvent<string, never>, _context: Context): T => event as unknown as T

export { jsonEventBridgeEvent }
