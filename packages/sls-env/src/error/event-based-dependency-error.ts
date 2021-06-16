export class EventBasedDependencyError extends Error {
  public type: 'EventBasedDependencyError' = 'EventBasedDependencyError'
  constructor(message: string) {
    super(message)
  }
}
