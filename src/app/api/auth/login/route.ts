import * as oidc from "openid-client";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  appUrl,
  authConfigured,
  cookieOptions,
  currentUser,
  localDynamicEnabled,
  seal,
  unseal,
} from "@/server/auth";
import { oidcConfig, RESOURCE, SCOPES } from "@/server/oidc";
import {
  dataDir,
  db,
  findUser,
  getConnection,
  putTransaction,
} from "@/server/db";
import { route } from "@/server/http";

export const GET = route(async (request) => {
  if (!authConfigured())
    return NextResponse.redirect(new URL("/?auth=unavailable", appUrl()));
  const local = localDynamicEnabled(),
    incoming = new URL(request.url);
  // Dynamic registration is local-only; production uses an approved service client.
  if (local && request.headers.get("host") !== "127.0.0.1:3000")
    return NextResponse.redirect(
      new URL(
        `${incoming.pathname}${incoming.search}`,
        "http://127.0.0.1:3000",
      ),
    );
  const jar = await cookies();
  let selected = await currentUser();
  if (!selected && !incoming.searchParams.has("new")) {
    const remembered = jar.get("opic_last_profile")?.value;
    if (remembered) {
      try {
        const value = await unseal(remembered);
        if (typeof value.sub === "string") selected = findUser(value.sub);
      } catch {}
    }
  }
  const saved =
    !incoming.searchParams.has("new") && selected && !selected.demo
      ? getConnection(selected.id)
      : null;
  let pending: string | null = null;
  if (local && !saved && !incoming.searchParams.has("new")) {
    const retained = jar.get("opic_pending_registration")?.value;
    if (retained) {
      try {
        const p = await unseal(retained);
        if (typeof p.clientId === "string") pending = p.clientId;
      } catch {}
    }
  }
  const clientId = local
    ? saved?.client_id || pending || "dynamic_agent_client"
    : process.env.CHATGPT_CLIENT_ID!;
  const config = await oidcConfig(clientId),
    verifier = oidc.randomPKCECodeVerifier(),
    state = oidc.randomState(),
    nonce = oidc.randomNonce();
  const origin = local ? "http://127.0.0.1:3000" : appUrl(),
    redirectUri = `${origin}/api/auth/callback`;
  const transactionId = randomUUID();
  putTransaction(
    transactionId,
    await seal(
      {
        verifier,
        state,
        nonce,
        clientId,
        redirectUri,
        local,
        expectedIdentity: saved?.identity || null,
      },
      600,
    ),
  );
  jar.set("opic_oauth", transactionId, cookieOptions(600));
  const parameters: Record<string, string> = {
    redirect_uri: redirectUri,
    scope: SCOPES,
    resource: RESOURCE,
    code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
    code_challenge_method: "S256",
    state,
    nonce,
  };
  if (incoming.searchParams.get("consent") === "1")
    parameters.prompt = "consent";
  if (local) {
    db();
    const path = join(dataDir, "chatgpt-host-id");
    if (!existsSync(path)) {
      try {
        writeFileSync(path, `urn:uuid:${randomUUID()}`, {
          flag: "wx",
          mode: 0o600,
        });
      } catch (error) {
        if (!existsSync(path)) throw error;
      }
    }
    parameters.ext_agent_host_id = readFileSync(path, "utf8");
    if (clientId === "dynamic_agent_client")
      parameters.agent_name_hint = "opic studio";
  }
  return NextResponse.redirect(oidc.buildAuthorizationUrl(config, parameters));
});
