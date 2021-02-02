import type { Context, SNSEvent } from 'aws-lambda'

import { PayloadParseError } from '../error/parse'

const jsonSNSMessages = <T>(event: SNSEvent, _context: Context): Array<T> => {
  try {
    return event.Records.map(r => r.Sns.Message).map(m => JSON.parse(m))
  } catch (err) {
    throw new PayloadParseError('failed to process sns message to json', { originalError: err })
  }
}

export { jsonSNSMessages }
