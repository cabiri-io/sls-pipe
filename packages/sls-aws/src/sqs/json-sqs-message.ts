import type { Context, SQSEvent } from 'aws-lambda'

import { PayloadError, PayloadParseError } from '../error/parse'

const jsonSQSMessage = <T>(event: SQSEvent, _context: Context): T => {
  if (event.Records.length === 1) {
    try {
      return (JSON.parse(event.Records[0].body) as unknown) as T
    } catch (err) {
      throw new PayloadParseError('failed to process sqs message to json', { originalError: err })
    }
  }
  throw new PayloadError('event contains more than 1 record')
}

export { jsonSQSMessage }
