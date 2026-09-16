import type { ReactNode } from 'react'
import { ShoppingCart } from 'lucide-react'
import { formatarMoeda } from '@/lib/formatadores'

/**
 * Contrato fechado em 3.7 + acréscimo de UI aprovado: prop OPCIONAL `acao`
 * (o botão "Enviar Pedido" da página mora AQUI — sticky checkout bar: total +
 * CTA sempre visíveis, padrão Justinmind/Onilab; thumb-friendly no mobile).
 */
interface PropsRodapeTotal {
  totalBikes: number
  valorTotal: number
  acao?: ReactNode
}

/**
 * Rodapé fixo com o resumo do pedido: contagem de bikes + valor total em R$,
 * recalculados pela página a cada mudança de quantidade (tempo real, AC1).
 * O `pb-40 sm:pb-28` do <main> no layout reserva o espaço para o rodapé não
 * cobrir o conteúdo.
 */
export default function RodapeTotal({ totalBikes, valorTotal, acao }: PropsRodapeTotal) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t-4 border-yellow-400 bg-black text-white">
      {/* Mobile: empilha (contagem+total em cima, ação w-full embaixo);
          ≥640px: linha única com total e ação à direita (AC6/AC9). */}
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <ShoppingCart size={20} aria-hidden="true" />
          {/* singular/plural: "1 bicicleta" x "2 bicicletas" — microcopy correta */}
          <span>
            {totalBikes} {totalBikes === 1 ? 'bicicleta' : 'bicicletas'}
          </span>
        </p>
        <div className="flex items-center gap-4">
          <p className="text-lg font-bold text-yellow-400">Total: {formatarMoeda(valorTotal)}</p>
          {acao}
        </div>
      </div>
    </footer>
  )
}
