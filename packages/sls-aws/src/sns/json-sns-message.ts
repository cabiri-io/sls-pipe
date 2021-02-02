import type { Context, SNSEvent } from 'aws-lambda'

import { PayloadError, PayloadParseError } from '../error/parse'

const jsonSNSMessage = <T>(event: SNSEvent, _context: Context): T => {
  if (event.Records.length === 1) {
    try {
      return (JSON.parse(event.Records[0].Sns.Message) as unknown) as T
    } catch (err) {
      throw new PayloadParseError('failed to process sns message to json', { originalError: err })
    }
  }
  throw new PayloadError('event contains more than 1 record')
}

export { jsonSNSMessage }
