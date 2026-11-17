import * as oidc from "openid-client";
export const RESOURCE = "https://api.openai.com/v1";
export const ISSUER = process.env.CHATGPT_ISSUER || "https://auth.openai.com";
export const SCOPES =
  "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct";
const configurations = new Map<string, Promise<oidc.Configuration>>();
export function oidcConfig(clientId = process.env.CHATGPT_CLIENT_ID!) {
  let config = configurations.get(clientId);
  if (!config) {
    const secret = process.env.CHATGPT_CLIENT_SECRET;
    config = oidc.discovery(
      new URL(ISSUER),
      clientId,
      undefined,
      secret ? oidc.ClientSecretBasic(secret) : oidc.None(),
      { execute: [oidc.enableNonRepudiationChecks] },
    );
    configurations.set(clientId, config);
    config.catch(() => configurations.delete(clientId));
  }
  return config;
}
