export class PayloadDefinitionError extends Error {
  public type: 'PayloadDefinitionError' = 'PayloadDefinitionError'
  constructor(message: string) {
    super(message)
  }
}
