import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Factory do cliente Supabase: valida as env vars ANTES de criar o cliente.
 * A supabase-js v2 lança exceção críptica se receber URL vazia — aqui o erro
 * vem primeiro, em português e citando a env var, para o dev resolver rápido.
 * Strings vazias são falsy e também caem na validação (nunca criamos um
 * cliente quebrado em silêncio).
 */
export function criarClienteSupabase(
  url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
): SupabaseClient {
  if (!url) {
    throw new Error('Configuração ausente: defina NEXT_PUBLIC_SUPABASE_URL no .env.local')
  }
  if (!chave) {
    throw new Error('Configuração ausente: defina NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local')
  }
  return createClient(url, chave)
}

// Instância única do app (o Supabase mantém estado de conexão/auth — reusar
// evita múltiplos clientes concorrentes no mesmo browser).
let cliente: SupabaseClient | undefined

/**
 * Singleton lazy memoizado: importar este módulo NUNCA lança (a criação só
 * acontece na 1ª chamada). Páginas chamam obterSupabase() DENTRO de
 * useEffect/handlers — sem env vars o erro aparece só no request, não no
 * build (AC3).
 */
export function obterSupabase(): SupabaseClient {
  cliente ??= criarClienteSupabase()
  return cliente
}
