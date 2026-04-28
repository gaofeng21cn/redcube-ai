export type JsonMap = Record<string, any>;
export type CliOptionsMap = Record<string, any>;
export type GatewayActionMap = Record<string, any>;

export type CliDependenciesMap = {
  gateway?: GatewayActionMap;
  loadPrivateProfileModule?: () => Promise<JsonMap>;
  cwd?: () => string;
  printJson?: (data: JsonMap) => void;
};
