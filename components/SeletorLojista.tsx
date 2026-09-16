import type { Lojista } from '@/types'
import { formatarCNPJ } from '@/lib/formatadores'

/** Contrato fechado em 3.5 — o select nativo é o contratado (sem busca). */
interface PropsSeletorLojista {
  lojistas: Lojista[]
  /** Id do lojista como string (select nativo trabalha com string; a página converte para number no payload). */
  valor: string
  aoAlterar: (id: string) => void
  desabilitado?: boolean
}

/**
 * Select de lojistas do pedido: placeholder instrutivo + opções com razão
 * social e CNPJ sempre formatado `00.000.000/0000-00` (decisão do usuário:
 * CNPJ jamais "cru" na tela). Componente de EXIBIÇÃO puro — estado vive na
 * página (`valor`/`aoAlterar`), por isso é testável sem Supabase.
 */
export default function SeletorLojista({ lojistas, valor, aoAlterar, desabilitado }: PropsSeletorLojista) {
  return (
    <div>
      {/* label acessível: htmlFor casa com o id fixo do select (1 por tela) */}
      <label htmlFor="seletor-lojista" className="text-sm font-medium">
        Lojista
      </label>
      <select
        id="seletor-lojista"
        value={valor}
        onChange={(evento) => {
          // Guard de estado desabilitado: o browser já impede a interação,
          // mas eventos disparados programaticamente (tests/automação) ainda
          // chegam aqui — o contrato é que NADA muda enquanto desabilitado.
          if (!desabilitado) aoAlterar(evento.target.value)
        }}
        disabled={desabilitado}
        className="mt-1 w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2"
      >
        {/* SEM disabled no placeholder: o reset pós-pedido volta para ''
            programaticamente — o usuário precisa poder reabrir a escolha */}
        <option value="">Selecione o lojista</option>
        {lojistas.map((lojista) => (
          <option key={lojista.id_lojista} value={String(lojista.id_lojista)}>
            {lojista.razao_social} — CNPJ {formatarCNPJ(lojista.cnpj)}
          </option>
        ))}
      </select>
    </div>
  )
}
