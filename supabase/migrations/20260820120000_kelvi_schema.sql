-- Kelvi / Aarla Play on the Aarla OS Supabase project.
-- Isolated schema so Aarla OS `public` tables are never touched.
-- Prisma `db push` also creates this; this file is the idempotent first step in `npm run db:setup`.

create schema if not exists kelvi;
