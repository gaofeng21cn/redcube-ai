export type JsonMap = Record<string, any>;
export type CliOptionsMap = Record<string, any>;
export type DomainActionMap = Record<string, any>;

export type CliDependenciesMap = {
  domainActions?: DomainActionMap;
  loadPrivateProfileModule?: () => Promise<JsonMap>;
  cwd?: () => string;
  printJson?: (data: JsonMap) => void;
};
