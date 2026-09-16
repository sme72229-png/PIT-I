// Tipos das entidades do banco Supabase (schema SOMENTE LEITURA — não alterar).
// IDs são number (inteiros/serial) e datas chegam como string ISO (created_at em UTC).
// Um comentário por interface mapeando à tabela real — para a apresentação em vídeo.

/** Lojista parceiro que monta pedidos em lote → tabela `tb_lojistas`. */
export interface Lojista {
  id_lojista: number
  razao_social: string
  cnpj: string
}

/** Modelo de bicicleta elétrica disponível para pedido → tabela `tb_modelos_bike` (SINGULAR — nome oficial do schema). */
export interface ModeloBike {
  id_bike: number
  modelo: string
  preco_base: number
  potencia_w: number
  autonomia_km: number
}

/** Pedido em lote gravado pelo lojista → tabela `tb_pedidos`. */
export interface Pedido {
  id_pedido: number
  id_lojista: number
  valor_total: number
  status_corrente: string
  /** Data de criação em UTC (ISO 8601) — campo OBRIGATÓRIO, existe no banco real. */
  created_at: string
}

/** Linha de um pedido (um modelo de bike com quantidade) → tabela `tb_itens_pedido`. */
export interface ItemPedido {
  id_item: number
  id_pedido: number
  id_bike: number
  quantidade: number
  subtotal: number
}

/**
 * Pedido com a razão social do lojista embutida — formato do join do dashboard
 * (`tb_pedidos` → `tb_lojistas`). O embed pode voltar null se a FK for nula
 * (defensiva apenas na EXIBIÇÃO, decisão F3) — o dashboard exibe "—".
 */
export interface PedidoComLojista {
  id_pedido: number
  valor_total: number
  status_corrente: string
  created_at: string
  tb_lojistas: { razao_social: string } | null
}

/**
 * Payload do insert em `tb_itens_pedido`: apenas os campos que o app envia.
 * `id_item` é gerado pelo banco e `id_pedido` vem do pedido pai recém-criado,
 * por isso ficam de fora deste tipo.
 */
export interface ItemPedidoPayload {
  id_bike: number
  quantidade: number
  subtotal: number
}
