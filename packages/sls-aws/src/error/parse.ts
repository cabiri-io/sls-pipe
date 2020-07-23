type ErrorArgument = {
  codes?: Array<string>
  originalError: Error
}

export class PayloadParseError extends Error {
  public type: 'PayloadParseError' = 'PayloadParseError'
  public codes: Array<string> = []
  public originalError: Error
  constructor(message: string, args: ErrorArgument) {
    super(message)
    this.codes = args?.codes ?? []
    this.originalError = args?.originalError
  }
}

export class PayloadError extends Error {
  public type: 'PayloadError' = 'PayloadError'
  public codes: Array<string>
  public originalError?: Error
  constructor(message: string, args?: Partial<ErrorArgument>) {
    super(message)
    this.codes = args?.codes ?? []
    this.originalError = args?.originalError
  }
}
