'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Loader2, PackageOpen, RefreshCw, ShoppingCart } from 'lucide-react'
import { obterSupabase } from '@/lib/supabase'
import type { PedidoComLojista } from '@/types'
import TabelaPedidos from '@/components/TabelaPedidos'

/**
 * Dashboard: cabeçalho com CTA de novo pedido + tabela dos últimos pedidos.
 *
 * Padrão da task: a PÁGINA orquestra busca e estados; a tabela e o badge são
 * componentes de exibição puros (recebem dados por props).
 */
export default function Home() {
  // null = busca em andamento (loading); depois, o array veio do banco
  const [pedidos, setPedidos] = useState<PedidoComLojista[] | null>(null)
  const [erro, setErro] = useState(false)

  /**
   * Monta a query dos últimos pedidos (thenable do supabase-js).
   *
   * Join por EMBED (plano A confirmado pelo usuário): a FK
   * `tb_pedidos.id_lojista → tb_lojistas` permite pedir as colunas da tabela
   * related direto no select — o Supabase devolve cada pedido com
   * `tb_lojistas: { razao_social }` embutido, sem segunda query.
   * `created_at DESC` + `.limit(10)` = os 10 mais recentes primeiro; o corte
   * das 10 linhas é feito PELO BANCO (o componente apenas exibe o que vier).
   */
  const consultarPedidos = useCallback(
    () =>
      obterSupabase()
        .from('tb_pedidos')
        .select('id_pedido, valor_total, status_corrente, created_at, tb_lojistas(razao_social)')
        .order('created_at', { ascending: false })
        .limit(10),
    [],
  )

  /**
   * Converte o resultado da consulta em estado da tela (dados ou erro).
   *
   * O parâmetro é propositalmente amplo (`unknown`): sem codegen dos tipos do
   * projeto, o supabase-js tipa o embed `tb_lojistas` como ARRAY — mas em
   * runtime a relação many-to-one (FK na própria tabela) devolve OBJETO único,
   * exatamente o formato de `PedidoComLojista`. O cast abaixo alinha o tipo
   * com o formato real que o banco entrega.
   */
  const aplicarResultado = useCallback((resultado: { data: unknown; error: unknown }) => {
    if (resultado.error) {
      // Regra de ouro: detalhe técnico SÓ no console — na tela, mensagem amigável
      console.error('Falha ao carregar pedidos:', resultado.error)
      setErro(true)
      return
    }
    setPedidos((resultado.data as PedidoComLojista[] | null) ?? [])
  }, [])

  // Busca inicial: setState acontece em callback assíncrono da promise — o
  // padrão de "subscribe" aceito pela regra react-hooks/set-state-in-effect.
  useEffect(() => {
    consultarPedidos().then(aplicarResultado)
  }, [consultarPedidos, aplicarResultado])

  /** Retry do botão de erro: limpa o erro (volta ao loading) e busca de novo. */
  const tentarNovamente = () => {
    setErro(false)
    consultarPedidos().then(aplicarResultado)
  }

  const carregando = pedidos === null && !erro

  return (
    <div>
      {/* Header da página: título + subtítulo à esquerda, CTA primário à direita
          (empilha no mobile — decisão de UI aprovada) */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Dashboard</h1>
          <p className="text-gray-500">Pedidos em lote para lojistas parceiros</p>
        </div>
        {/* CTA primário da marca — presente em TODOS os estados (fora da tabela) */}
        <Link
          href="/novo-pedido"
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-5 py-3 font-semibold text-black hover:bg-yellow-300 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 sm:w-auto"
        >
          <ShoppingCart size={20} aria-hidden="true" />
          Iniciar Novo Pedido em Lote
        </Link>
      </header>

      <h2 className="mt-8 text-lg font-semibold">Últimos 10 pedidos</h2>

      {/* Loading: spinner + texto com role="status" (leitor de tela anuncia) */}
      {carregando && (
        <div role="status" className="flex flex-col items-center gap-2 py-12">
          <Loader2 className="animate-spin text-gray-400" aria-hidden="true" />
          <span>Carregando pedidos...</span>
        </div>
      )}

      {/* Erro: microcopy fechada (diz O QUE falhou e COMO seguir) + retry que
          reexecuta a busca (não é reload da página). Nada técnico na tela. */}
      {erro && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" aria-hidden="true" />
          <p>Não foi possível carregar os pedidos. Verifique sua conexão e tente novamente.</p>
          <button
            type="button"
            onClick={tentarNovamente}
            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 font-medium hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2"
          >
            <RefreshCw size={18} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      )}

      {/* Vazio: orienta o 1º pedido (o CTA acima é a ação — não duplicamos) */}
      {!carregando && !erro && pedidos?.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <PackageOpen className="h-12 w-12 text-yellow-500" aria-hidden="true" />
          <p className="font-medium">Nenhum pedido registrado ainda.</p>
          <p className="text-sm text-gray-500">Os pedidos que você criar aparecerão aqui.</p>
        </div>
      )}

      {/* Dados: tabela pura de exibição (o corte em 10 já foi feito no banco) */}
      {!carregando && !erro && pedidos !== null && pedidos.length > 0 && <TabelaPedidos pedidos={pedidos} />}
    </div>
  )
}
