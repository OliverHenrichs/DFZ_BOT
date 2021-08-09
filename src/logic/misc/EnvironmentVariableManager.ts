export class EnvironmentVariableManager {
  public static ensureString(environmentVariable: string | undefined) {
    return environmentVariable ? environmentVariable : "";
  }
}
