import type { ItemPedidoPayload, ModeloBike } from '@/types'

/**
 * Funções puras de negócio do pedido em lote (sanitização, cálculo e montagem
 * do payload de gravação). Puras = sem React/Supabase — todo o dinheiro do
 * sistema passa por aqui, por isso cada regra tem teste unitário próprio.
 */

/**
 * REGRA DE NEGÓCIO (F6): a quantidade por modelo é um INTEIRO entre 0 e 999.
 * - NaN → 0: input number vazio devolve NaN em `valueAsNumber`; o total nunca
 *   pode quebrar por causa de um campo limpo.
 * - Negativo → 0: digitar "-3" não pode virar pedido de "devolver 3 bikes".
 * - Decimal → TRUNCA (Math.trunc, nunca arredonda): 2.7 vira 2 — arredondar
 *   para 3 daria ao lojista uma bike a mais do que ele digitou.
 * - Acima de 999 → 999: teto de lote por modelo (sanitiza na DIGITAÇÃO,
 *   silenciosamente — a ajuda inline "0 a 999" previne o erro antes dele existir).
 */
export function sanitizarQuantidade(valor: number): number {
  if (Number.isNaN(valor)) return 0
  const inteiro = Math.trunc(valor)
  if (inteiro < 0) return 0
  return Math.min(inteiro, 999)
}

/**
 * REGRA DE NEGÓCIO (AC1): valor total do pedido = Σ `preco_base × quantidade`
 * de cada modelo. É a mesma conta do rodapé em tempo real e do `valor_total`
 * gravado em `tb_pedidos` — uma função só garante que tela e banco divergem
 * nunca.
 */
export function calcularTotalItens(itens: Array<{ preco_base: number; quantidade: number }>): number {
  return itens.reduce((total, item) => total + item.preco_base * item.quantidade, 0)
}

/**
 * REGRA DE NEGÓCIO (AC4): monta o payload do insert em `tb_itens_pedido`.
 * - Percorre os MODELOS (fonte da verdade do catálogo) na ordem em que o
 *   banco devolveu — por isso ids em `quantidades` sem modelo correspondente
 *   são simplesmente ignorados (nunca gravamos item de bike inexistente).
 * - Inclui apenas os modelos com quantidade > 0: linhas zeradas não viram
 *   itens — o insert dos filhos só leva o que o lojista realmente pediu.
 * - `subtotal = quantidade × preco_base` calculado AQUI (não no banco nem na
 *   tela): um único ponto de verdade para o dinheiro de cada linha.
 * - `id_pedido` NÃO faz parte: o tipo ItemPedidoPayload exclui de propósito —
 *   o id só existe depois do insert do pedido PAI e é acrescentado pela página
 *   no momento do insert (passo 4 da subtask 3.9).
 */
export function montarItensPedido(
  quantidades: Record<number, number>,
  modelos: ModeloBike[],
): ItemPedidoPayload[] {
  return modelos
    .map((modelo) => ({ modelo, quantidade: quantidades[modelo.id_bike] ?? 0 }))
    .filter(({ quantidade }) => quantidade > 0)
    .map(({ modelo, quantidade }) => ({
      id_bike: modelo.id_bike,
      quantidade,
      subtotal: quantidade * modelo.preco_base,
    }))
}
