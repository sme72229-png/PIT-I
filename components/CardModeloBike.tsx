import { BatteryCharging, Zap } from 'lucide-react'
import type { ModeloBike } from '@/types'
import { sanitizarQuantidade } from '@/lib/pedido'
import { formatarMoeda } from '@/lib/formatadores'

/** Contrato fechado em 3.6 — a quantidade vive na página (Record id_bike → qtd). */
interface PropsCardModeloBike {
  modelo: ModeloBike
  quantidade: number
  aoAlterarQuantidade: (quantidade: number) => void
}

/**
 * Card de um modelo na grade do pedido: dados do catálogo + input de
 * quantidade controlado. Componente de EXIBIÇÃO puro — sem Supabase.
 *
 * REGRA DE NEGÓCIO (F6): quantidade é inteiro 0–999; a sanitização acontece
 * NA DIGITAÇÃO (onChange) consumindo a função pura `sanitizarQuantidade` de
 * lib/pedido — o card NÃO reimplementa a regra (uma fonte de verdade).
 */
export default function CardModeloBike({ modelo, quantidade, aoAlterarQuantidade }: PropsCardModeloBike) {
  // Destaque do card SELECIONADO (decisão de UI do usuário): borda amarela +
  // fundo amarelo-claro quando quantidade > 0. A cor apenas REFORÇA — quem
  // informa é o número no input e o subtotal (cor nunca é o único diferenciador).
  const selecionado = quantidade > 0

  return (
    <article
      className={`rounded-xl border p-5 text-gray-900 transition-colors sm:p-6 ${
        selecionado
          ? 'border-yellow-400 bg-yellow-50 hover:border-yellow-500 hover:bg-yellow-100'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      <h3 className="font-semibold">{modelo.modelo}</h3>
      <p className="mt-1 text-lg font-semibold">{formatarMoeda(modelo.preco_base)}</p>

      {/* Especificações técnicas com ícones informativos (potência/autonomia) */}
      <p className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1">
          <Zap size={16} aria-hidden="true" /> {modelo.potencia_w} W
        </span>
        <span className="flex items-center gap-1">
          <BatteryCharging size={16} aria-hidden="true" /> {modelo.autonomia_km} km
        </span>
      </p>

      <div className="mt-5">
        {/* Label visível + ajuda inline: a regra "0 a 999" aparece ANTES do
            erro existir (validação auto-corretiva e silenciosa — padrão
            self-explanatory: constraint visível previne o erro) */}
        <label htmlFor={`qtd-${modelo.id_bike}`} className="block text-sm font-medium">
          Quantidade <span className="text-xs font-normal text-gray-500">(0 a 999)</span>
        </label>
        <input
          id={`qtd-${modelo.id_bike}`}
          type="number"
          aria-label={`Quantidade de ${modelo.modelo}`}
          min={0}
          max={999}
          step={1}
          value={quantidade}
          onChange={(evento) => {
            // Campo vazio devolve NaN em valueAsNumber → 0 (nunca quebra o
            // total); qualquer outro valor passa pela sanitização da regra F6
            const bruto = evento.target.valueAsNumber
            aoAlterarQuantidade(sanitizarQuantidade(Number.isNaN(bruto) ? 0 : bruto))
          }}
          className="mt-2 block h-10 w-24 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus-visible:border-yellow-400 focus-visible:ring-2 focus-visible:ring-yellow-400"
        />
      </div>

      {/* Subtotal por linha (decisão de UI do usuário): só existe quando há
          pedido — 0 não renderiza linha (sem ruído). yellow-700 para contraste
          4.5:1 sobre yellow-50/branco. */}
      {selecionado && (
        <p className="mt-4 text-sm font-semibold text-yellow-700">
          Subtotal: {formatarMoeda(modelo.preco_base * quantidade)}
        </p>
      )}
    </article>
  )
}
