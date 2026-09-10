export interface SupabaseJwtPayload {
  sub: string; // Supabase user UUID
  aud: string;
  role: string;
  email?: string;
  phone?: string;
  app_metadata?: {
    provider?: string;
    providers?: string[];
    roles?: string[];
    [key: string]: unknown;
  };
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
  exp: number;
  iat: number;
}

export interface AuthenticatedUser {
  id: string; // UUID (sub)
  email?: string;
  phone?: string;
  roles: string[];
  metadata?: Record<string, unknown>;
}
