-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.email_verifications (
  id uuid NOT NULL,
  email text NOT NULL,
  username text NOT NULL,
  password_hash text NOT NULL,
  token text NOT NULL UNIQUE,
  expires date NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT email_verifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.purchased_credits (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  paid_credits integer NOT NULL,
  plan_type text,
  start_date timestamp without time zone NOT NULL,
  end_date timestamp without time zone NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT purchased_credits_pkey PRIMARY KEY (id),
  CONSTRAINT purchased_credits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.shared_credits (
  id uuid NOT NULL,
  owner_user_id uuid NOT NULL,
  shared_user_id uuid NOT NULL,
  start_date timestamp without time zone NOT NULL,
  end_date timestamp without time zone NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT shared_credits_pkey PRIMARY KEY (id),
  CONSTRAINT shared_credits_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.users(id),
  CONSTRAINT shared_credits_shared_user_id_fkey FOREIGN KEY (shared_user_id) REFERENCES public.users(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['usage'::text, 'purchase'::text, 'share_out'::text, 'share_in'::text, 'topup'::text])),
  amount integer NOT NULL,
  credit_source text NOT NULL CHECK (credit_source = ANY (ARRAY['free'::text, 'paid'::text, 'shared'::text])),
  meta jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_auth_providers (
  id uuid NOT NULL,
  user_id uuid NOT NULL,
  provider text NOT NULL CHECK (provider = ANY (ARRAY['local'::text, 'google'::text, 'github'::text])),
  provider_user_id text NOT NULL,
  password_hash text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT user_auth_providers_pkey PRIMARY KEY (id),
  CONSTRAINT user_auth_providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  credits integer NOT NULL DEFAULT 25,
  is_paid boolean DEFAULT false,
  is_email_verified boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);