import type { PedidoComLojista } from '@/types'
import { formatarData, formatarMoeda } from '@/lib/formatadores'
import BadgeStatus from './BadgeStatus'

/**
 * Tabela "Últimos 10 pedidos" (ID, Lojista, Data, Valor, Status).
 * Componente de EXIBIÇÃO: recebe os pedidos por props (a página orquestra a
 * busca) — por isso é testável sem Supabase.
 *
 * Defensiva de exibição (2.10/F3): lojista sem razão social (FK nula) ou data
 * corrompida renderizam "—" — o banco garante os campos; a UI nunca quebra.
 */
export default function TabelaPedidos({ pedidos }: { pedidos: PedidoComLojista[] }) {
  return (
    // Card com scroll horizontal controlado (AC4): em 375px a table mantém
    // min-w-[600px] (colunas legíveis) e SÓ a área da tabela rola.
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full min-w-[600px] text-sm text-left">
        <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          <tr>
            <th scope="col" className="px-4 py-3">
              ID
            </th>
            <th scope="col" className="px-4 py-3">
              Lojista
            </th>
            <th scope="col" className="px-4 py-3">
              Data
            </th>
            {/* Valor à direita: convenção contábil — comparação visual por unidade */}
            <th scope="col" className="px-4 py-3 text-right whitespace-nowrap">
              Valor
            </th>
            <th scope="col" className="px-4 py-3">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pedidos.map((pedido) => (
            // hover marca a linha inteira (complementar, nunca informativo sozinho)
            <tr key={pedido.id_pedido} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">#{pedido.id_pedido}</td>
              <td className="px-4 py-3">{pedido.tb_lojistas?.razao_social ?? '—'}</td>
              {/* moeda/data nunca quebram linha na coluna (nowrap) */}
              <td className="px-4 py-3 whitespace-nowrap">{formatarData(pedido.created_at)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap">{formatarMoeda(pedido.valor_total)}</td>
              <td className="px-4 py-3">
                <BadgeStatus status={pedido.status_corrente} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
