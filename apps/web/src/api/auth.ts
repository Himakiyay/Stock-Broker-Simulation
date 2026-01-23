import { api } from "./client";

export type TokenResponse = {
  access_token: string;
  token_type?: string;
};

// NOTE: Your backend may use email or username.
// This sends both to be resilient (if your schema forbids extras, see note below).
export async function login(usernameOrEmail: string, password: string) {
  const payload: Record<string, unknown> = {
    email: usernameOrEmail,
    username: usernameOrEmail,
    password,
  };

  const { data } = await api.post<TokenResponse>("/auth/login", payload);
  return data;
}

export async function register(usernameOrEmail: string, password: string) {
  const payload: Record<string, unknown> = {
    email: usernameOrEmail,
    username: usernameOrEmail,
    password,
  };

  // if your register needs more fields, add them here
  const { data } = await api.post("/auth/register", payload);
  return data;
}
