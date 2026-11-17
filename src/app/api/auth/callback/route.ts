import * as oidc from "openid-client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  appUrl,
  cookieOptions,
  localDynamicEnabled,
  loginSession,
  seal,
  unseal,
} from "@/server/auth";
import { takeTransaction, upsertUser, saveConnection } from "@/server/db";
import { ISSUER, oidcConfig, RESOURCE } from "@/server/oidc";

export async function GET(request: Request) {
  let origin = localDynamicEnabled() ? "http://127.0.0.1:3000" : appUrl();
  try {
    const jar = await cookies(),
      transactionId = jar.get("opic_oauth")?.value;
    jar.delete("opic_oauth");
    const stored = transactionId ? takeTransaction(transactionId) : null;
    if (!stored) throw new Error("Missing or reused transaction");
    const tx = await unseal(stored.payload),
      incoming = new URL(request.url);
    if (
      typeof tx.verifier !== "string" ||
      typeof tx.state !== "string" ||
      typeof tx.nonce !== "string" ||
      typeof tx.clientId !== "string" ||
      typeof tx.redirectUri !== "string"
    )
      throw new Error("Invalid transaction");
    if (
      incoming.searchParams.get("state") !== tx.state ||
      incoming.searchParams.has("error")
    )
      throw new Error("Sign-in declined or mismatched state");
    origin = new URL(tx.redirectUri).origin;
    const issued = incoming.searchParams.get("client_id"),
      clientId = tx.clientId === "dynamic_agent_client" ? issued : tx.clientId;
    if (
      !clientId ||
      clientId === "dynamic_agent_client" ||
      (tx.clientId !== "dynamic_agent_client" &&
        issued &&
        issued !== tx.clientId)
    )
      throw new Error("Invalid issued registration");
    jar.set(
      "opic_pending_registration",
      await seal({ clientId }, 30 * 86400),
      cookieOptions(30 * 86400),
    );
    const callback = new URL(tx.redirectUri);
    callback.search = incoming.search;
    const tokens = await oidc.authorizationCodeGrant(
      await oidcConfig(clientId),
      callback,
      {
        pkceCodeVerifier: tx.verifier,
        expectedState: tx.state,
        expectedNonce: tx.nonce,
        idTokenExpected: true,
      },
      { resource: RESOURCE },
    );
    const claims = tokens.claims();
    if (!claims?.sub || claims.iss !== ISSUER)
      throw new Error("Unverified identity");
    const identity = `${claims.iss}|${clientId}|${claims.sub}`;
    if (tx.expectedIdentity && identity !== tx.expectedIdentity)
      throw new Error("Account changed during reauthorization");
    const user = upsertUser(
      identity,
      typeof claims.name === "string" ? claims.name : "수험생",
      typeof claims.email === "string" ? claims.email : null,
    );
    saveConnection(
      user.id,
      clientId,
      identity,
      await seal(
        {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          idToken: tokens.id_token || null,
          scopes: (tokens.scope || "").split(" "),
          expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
        },
        30 * 86400,
      ),
    );
    jar.delete("opic_pending_registration");
    jar.set(
      "opic_last_profile",
      await seal({ sub: user.id }, 30 * 86400),
      cookieOptions(30 * 86400),
    );
    await loginSession(user);
    return NextResponse.redirect(new URL("/?connected=1", origin));
  } catch {
    return NextResponse.redirect(new URL("/?auth=failed", origin));
  }
}
