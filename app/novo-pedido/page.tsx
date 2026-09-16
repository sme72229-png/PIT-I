'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, Loader2, PackageOpen, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { obterSupabase } from '@/lib/supabase'
import { calcularTotalItens, montarItensPedido } from '@/lib/pedido'
import { toastAviso } from '@/lib/toasts'
import type { Lojista, ModeloBike } from '@/types'
import SeletorLojista from '@/components/SeletorLojista'
import CardModeloBike from '@/components/CardModeloBike'
import RodapeTotal from '@/components/RodapeTotal'

/**
 * Tela CORE: pedido em lote. A página orquestra dados e estados; a exibição é
 * delegada a componentes puros (SeletorLojista, CardModeloBike, RodapeTotal —
 * criados nas subtasks 3.5–3.7 e integrados aqui na sequência).
 *
 * Estado fechado pela arquitetura da task: o total NÃO é armazenado — é
 * DERIVADO de `quantidades` + `modelos` a cada render (uma fonte de verdade;
 * impossível o rodapé divergir do valor gravado).
 */
export default function NovoPedidoPage() {
  const [lojistas, setLojistas] = useState<Lojista[]>([])
  const [modelos, setModelos] = useState<ModeloBike[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState(false)
  const [idLojistaSelecionado, setIdLojistaSelecionado] = useState('')
  const [quantidades, setQuantidades] = useState<Record<number, number>>({})
  const [enviando, setEnviando] = useState(false)

  /**
   * Monta as 2 queries da tela (thenable do supabase-js): lojistas para o
   * select e modelos para a grade de cards. `tb_modelos_bike` é SINGULAR —
   * nome oficial do schema, confirmado pelo usuário.
   */
  const consultarDados = useCallback(
    () =>
      Promise.all([
        obterSupabase().from('tb_lojistas').select('*'),
        obterSupabase().from('tb_modelos_bike').select('*'),
      ]),
    [],
  )

  /**
   * Converte o resultado das 2 queries em estado. Decisão da arquitetura:
   * `Promise.all`, NÃO `allSettled` — sem lojista OU sem modelo a tela não
   * faz sentido (envio parcial liberado seria bug), então UMA falha derruba
   * as duas. `data: unknown` + cast: sem codegen o supabase-js não tipa o
   * retorno; o formato real é o das interfaces de `types/`.
   */
  const aplicarResultado = useCallback((resultados: Array<{ data: unknown; error: unknown }>) => {
    const [respostaLojistas, respostaModelos] = resultados
    setCarregando(false)
    if (respostaLojistas.error || respostaModelos.error) {
      // Regra de ouro: detalhe técnico SÓ no console — na tela, amigável
      console.error('Falha ao carregar dados do pedido:', respostaLojistas.error ?? respostaModelos.error)
      setErroCarregamento(true)
      return
    }
    setLojistas((respostaLojistas.data as Lojista[] | null) ?? [])
    setModelos((respostaModelos.data as ModeloBike[] | null) ?? [])
  }, [])

  // Busca inicial: o setState vive no callback assíncrono da promise — padrão
  // aceito pela regra react-hooks/set-state-in-effect (mesmo do dashboard).
  useEffect(() => {
    consultarDados().then(aplicarResultado)
  }, [consultarDados, aplicarResultado])

  /** Retry do botão de erro: volta ao loading e refaz as 2 queries. */
  const tentarNovamente = () => {
    setErroCarregamento(false)
    setCarregando(true)
    consultarDados().then(aplicarResultado)
  }

  // Totais DERIVADOS (não armazenados) — recalculados a cada mudança de
  // quantidade: é o que faz o rodapé atualizar em tempo real (AC1).
  const itens = montarItensPedido(quantidades, modelos)
  const totalBikes = itens.reduce((soma, item) => soma + item.quantidade, 0)
  const valorTotal = calcularTotalItens(
    modelos.map((modelo) => ({
      preco_base: modelo.preco_base,
      quantidade: quantidades[modelo.id_bike] ?? 0,
    })),
  )

  /** Pós-gravação: select volta ao placeholder e quantidades zeram (objeto NOVO
   *  vazio — os inputs exibem `quantidades[id] ?? 0`). Lojistas/modelos NÃO são
   *  recarregados: catálogo não muda com o pedido. */
  const resetarFormulario = () => {
    setIdLojistaSelecionado('')
    setQuantidades({})
  }

  /**
   * REGRA DE NEGÓCIO (AC2): pedido só existe com um lojista — sem seleção,
   * aviso amarelo (toastAviso ⚠️ EXIGE ação do usuário) e NADA é gravado.
   */
  /**
   * REGRA DE NEGÓCIO (AC3): total de bikes = 0 não é pedido — mesmo aviso
   * amigável e NADA gravado. As duas validações rodam ANTES de qualquer
   * insert (a matriz AC2/AC3 asserta que tb_pedidos nunca é chamado).
   */
  /**
   * GRAVAÇÃO — "transação simulada" (3.9/3.10), na ordem fechada:
   * 1. insert do PAI em tb_pedidos (id_lojista, valor_total, 'pendente') com
   *    `.select().single()` — na supabase-js v2 o insert NÃO retorna a linha
   *    por padrão; só assim capturamos o id_pedido gerado pelo banco.
   * 2. se o PAI falha → toast de erro amigável + formulário PRESERVADO para
   *    reenvio + nada tocado em tb_itens_pedido (AC5).
   * 3. insert dos FILHOS em UM ÚNICO call com array (apenas quantidade > 0,
   *    cada item carrega o id_pedido do pai — FK da relação).
   * 4. falha PARCIAL (pai criado, itens falham) → toast específico com o nº
   *    do pedido + formulário LIMPO: evita duplicar o pedido pai no reenvio
   *    (decisão do usuário 2026-09-15). Erro técnico só no console.
   * 5. sucesso → toast verde + reset. `finally` reabilita o botão SEMPRE.
   */
  const enviarPedido = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (!idLojistaSelecionado) {
      toastAviso('Selecione um lojista para continuar')
      return
    }
    if (totalBikes === 0) {
      toastAviso('Adicione pelo menos uma bicicleta ao pedido')
      return
    }

    try {
      setEnviando(true) // desabilita o botão ("Enviando...") e trava duplo clique (AC8)

      // (1) PAI: status 'pendente' é o ponto de partida do fluxo do pedido;
      // valor_total vem do cálculo derivado — a mesma conta do rodapé.
      // Number(): o select trabalha com string, o banco espera int/serial.
      const { data, error } = await obterSupabase()
        .from('tb_pedidos')
        .insert({
          id_lojista: Number(idLojistaSelecionado),
          valor_total: valorTotal,
          status_corrente: 'pendente',
        })
        .select()
        .single()

      const idPedido = (data as { id_pedido?: number } | null)?.id_pedido

      // (2) PAI falhou (rede/Supabase): nada foi gravado — o usuário pode
      // simplesmente tentar de novo com o formulário intacto (AC5).
      if (error || idPedido == null) {
        console.error('Falha ao gravar o pedido (tb_pedidos):', error)
        toast.error('Não foi possível registrar o pedido. Tente novamente.')
        return // sem reset, sem tocar em tb_itens_pedido
      }

      // (3) FILHOS: um único insert com o array (apenas qtd > 0, montados por
      // montarItensPedido; aqui cada item ganha o id_pedido capturado do pai)
      const { error: erroItens } = await obterSupabase()
        .from('tb_itens_pedido')
        .insert(itens.map((item) => ({ ...item, id_pedido: idPedido })))

      // (4) FALHA PARCIAL: o pai JÁ EXISTE no banco — reenviar duplicaria o
      // pedido. Limpamos o formulário e mandamos anotar o nº para o suporte
      // conciliar manualmente (microcopy fechada, decisão do usuário).
      if (erroItens) {
        console.error(`Falha parcial: pedido #${idPedido} gravado, itens rejeitados:`, erroItens)
        toastAviso(
          `Pedido #${idPedido} criado, mas nem todos os itens foram salvos. Anote o número e contate o suporte.`,
        )
        resetarFormulario()
        return
      }

      // (5) sucesso total: toast verde + formulário limpo para o próximo pedido
      toast.success('Pedido registrado com sucesso!')
      resetarFormulario()
    } finally {
      setEnviando(false) // o botão reabilita SEMPRE — mesmo em falha
    }
  }

  return (
    <form onSubmit={enviarPedido}>
      {/* Header da página (UI aprovada): título + subtítulo orientando o passo a passo */}
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Novo Pedido em Lote</h1>
        <p className="text-gray-500">Selecione o lojista e defina as quantidades por modelo.</p>
      </header>

      {/* Loading: spinner + texto com role="status" (leitor de tela anuncia) */}
      {carregando && (
        <div role="status" className="flex flex-col items-center gap-2 py-12">
          <Loader2 className="animate-spin text-gray-400" aria-hidden="true" />
          <span>Carregando lojistas e modelos...</span>
        </div>
      )}

      {/* Erro de carga: microcopy fechada (o que falhou + como seguir) + retry;
          select e grade NÃO renderizam; nada técnico na tela. */}
      {erroCarregamento && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" aria-hidden="true" />
          <p>Não foi possível carregar os dados. Verifique sua conexão e tente novamente.</p>
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

      {/* Corpo do pedido (apenas pós-carga sem erro): select de lojista (com
          estado vazio próprio) + grade responsiva de cards — grid-cols-1 no
          mobile, 2 colunas ≥640px (AC6) */}
      {!carregando && !erroCarregamento && (
        <>
          {lojistas.length === 0 ? (
            // BANCO VAZIO — 0 lojistas (resolução O1): select desabilitado com
            // ÚNICA option + aviso amarelo dizendo COMO resolver (cadastro no
            // banco — o app não cadastra lojista, cadastro é externo).
            <div className="mt-6">
              <label htmlFor="seletor-lojista" className="text-sm font-medium">
                Lojista
              </label>
              <select
                id="seletor-lojista"
                disabled
                className="mt-1 w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2"
              >
                <option>Nenhum lojista cadastrado</option>
              </select>
              <p className="mt-2 flex max-w-md items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
                <AlertCircle size={18} className="shrink-0 text-yellow-500" aria-hidden="true" />
                Nenhum lojista cadastrado. Cadastre um lojista no banco para criar pedidos.
              </p>
            </div>
          ) : (
            <div className="mt-6">
              <SeletorLojista
                lojistas={lojistas}
                valor={idLojistaSelecionado}
                aoAlterar={setIdLojistaSelecionado}
              />
            </div>
          )}

          <h2 className="mt-8 text-lg font-semibold">Modelos</h2>
          {modelos.length === 0 ? (
            // BANCO VAZIO — 0 modelos (resolução O1): no lugar da grade, aviso
            // orientando o cadastro. Envio já está bloqueado pelo disabled.
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <PackageOpen className="h-12 w-12 text-yellow-500" aria-hidden="true" />
              <p className="font-medium">Nenhum modelo de bicicleta cadastrado. Cadastre modelos no banco para criar pedidos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {modelos.map((modelo) => (
                <CardModeloBike
                  key={modelo.id_bike}
                  modelo={modelo}
                  quantidade={quantidades[modelo.id_bike] ?? 0}
                  aoAlterarQuantidade={(quantidade) =>
                    // Record NOVO por atualização (imutabilidade): a chave é o
                    // id_bike — o mapa inteiro é a fonte do rodapé e do payload
                    setQuantidades((anteriores) => ({ ...anteriores, [modelo.id_bike]: quantidade }))
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      <RodapeTotal
        totalBikes={totalBikes}
        valorTotal={valorTotal}
        acao={
          /* Botão de submit DENTRO do rodapé fixo (decisão de UI do usuário):
             disabled durante envio (AC8 — trava duplo clique), durante a carga
             e quando o banco está vazio (title explica o porquê). */
          <button
            type="submit"
            disabled={enviando || carregando || lojistas.length === 0 || modelos.length === 0}
            title={
              lojistas.length === 0 || modelos.length === 0
                ? 'Disponível quando houver lojistas e modelos cadastrados'
                : undefined
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-400 px-5 py-2.5 font-semibold text-black hover:bg-yellow-300 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {/* Microcopy de status durante a gravação: spinner + "Enviando..."
                (auto-explica por que o botão está travado — padrão 1–3s) */}
            {enviando && <Loader2 className="animate-spin" size={18} aria-hidden="true" />}
            <span>{enviando ? 'Enviando...' : 'Enviar Pedido'}</span>
          </button>
        }
      />
    </form>
  )
}
