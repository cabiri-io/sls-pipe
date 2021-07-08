export class EventDependencyError extends Error {
  public type: 'EventDependencyError' = 'EventDependencyError'
  constructor(message: string) {
    super(message)
  }
}
