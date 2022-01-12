export class DependencyNotFoundError extends Error {
  public type: 'DependencyNotFoundError' = 'DependencyNotFoundError'
  constructor(message: string, public dependencyName: string) {
    super(message)
    this.dependencyName = dependencyName
  }
}
