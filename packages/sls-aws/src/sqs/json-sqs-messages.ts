import type { Context, SQSEvent } from 'aws-lambda'

import { PayloadParseError } from '../error/parse'

const jsonSQSMessages = <T>(event: SQSEvent, _context: Context): Array<T> => {
  try {
    return event.Records.map(r => r.body).map(m => JSON.parse(m))
  } catch (err) {
    throw new PayloadParseError('failed to process sqs message to json', { originalError: err })
  }
}

export { jsonSQSMessages }
