-- Drop all existing tables to start fresh for the gaming marketplace
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.bot_logs CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.server_configs CASCADE;