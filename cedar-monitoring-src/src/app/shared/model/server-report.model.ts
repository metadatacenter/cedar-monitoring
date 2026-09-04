/**
 * What a single CEDAR service reports about itself, from cedar-monitor-server /server-report/{server}/*.
 *
 * Every one of these is read per server and assembled into a matrix in the browser, the same way the
 * health-check page has always worked: fifteen small parallel requests finish in the time of the
 * slowest server, and a server that is down leaves one row blank instead of failing the page.
 */

/** Where one environment variable stands for one service. Mirrors CedarEnvironmentReport.VariableState. */
export type VariableState = 'SET' | 'DECLARED_BUT_UNSET' | 'USING_DEFAULT' | 'NOT_DECLARED';

export type VariableType = 'STRING' | 'NUMERIC' | 'BOOLEAN';

export interface EnvironmentVariableEntry {
  name: string;
  state: VariableState;
  /** Whether the variable is flagged secret, and so whether `value` arrived masked. */
  secure: boolean;
  type: VariableType;
  /** Masked when secure; null unless the state is SET. */
  value: string | null;
  /**
   * Whether the host sets this variable at all, regardless of whether this service declares it.
   * This is the field that answers "I set it and nothing changed": set on the host but not declared
   * by the service means the service is built without it by design.
   */
  presentInHostEnvironment: boolean;
}

export interface EnvironmentReport {
  application: string;
  server: string;
  component: string | null;
  variables: EnvironmentVariableEntry[];
}

export interface ConfigurationReport {
  application: string;
  server: string;
  /** cedar-main.yml as the service resolved it, secrets masked, unresolved placeholders left literal. */
  configuration: unknown;
}

export interface BuildReport {
  application: string;
  server: string;
  version: string | null;
  versionModifier: string | null;
  host: string | null;
  pid: number | null;
  'java.version': string | null;
  'java.vendor': string | null;
  'jvm.name': string | null;
  startedAt: string | null;
  uptimeMs: number | null;
  artifactPath: string | null;
  artifactType: string | null;
  /** When the jar or class directory the JVM loaded was last written. */
  artifactBuiltAt: string | null;
  artifactSizeBytes: number | null;
  implementationVersion: string | null;
  artifactError?: string | null;
}

/** The flat map served by each service's /insight/full. Keys are dotted, so it is read as a record. */
export interface JvmInsight {
  [key: string]: number | string | null;
}

/**
 * One server's answer, whether or not it answered.
 *
 * A matrix page must distinguish "this service says the variable is missing" from "this service did
 * not answer", and a plain `T | null` cannot: both render as an empty cell while meaning opposite
 * things. The error is carried alongside the data so a cell can say which it is.
 */
export interface ServerResult<T> {
  server: string;
  data: T | null;
  error: string | null;
  status: number | null;
}

/**
 * A variable one non-server component declares.
 *
 * There is no value: the frontends read theirs during a gulp build that has long since finished,
 * Keycloak reads its own from standalone.xml, and the tools are processes that exist only while a
 * command runs. Whether the host could supply it is the one thing that can honestly be said.
 */
export interface DeclaredVariable {
  name: string;
  secure: boolean;
  presentInHostEnvironment: boolean;
}

export interface ComponentDeclarations {
  component: string;
  variables: DeclaredVariable[];
}

export interface DeclarationsReport {
  note: string;
  components: ComponentDeclarations[];
}

/**
 * CEDAR_* variables the host sets that CedarEnvironmentVariable does not define.
 *
 * Invisible to every other view — the boot sandbox report, each service's environment report, and
 * the matrix are all driven by that enum — while still being read, because a consumer calling
 * System.getenv directly never consults it. Values are withheld: nothing has declared whether an
 * unmodelled variable is secret.
 */
export interface UnmodelledReport {
  scope: string;
  note: string;
  count: number;
  variables: { [name: string]: { hasValue: boolean } };
}
