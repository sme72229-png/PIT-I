/**
 * Badge (pill) do status do pedido — cor + TEXTO, nunca cor sozinha
 * (padrão de acessibilidade: daltônico e leitor de tela leem o mesmo valor).
 *
 * O banco só tem 'pendente' com cor própria (amarelo, cor da marca); qualquer
 * outro status conhecido ou não cai no neutro cinza — o componente exibe o
 * valor que vier sem quebrar (defensiva de exibição).
 */

/** Classes Tailwind por status normalizado (minúsculas). */
const CORES_STATUS: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
}

/** Fallback neutro para status fora do mapa. */
const COR_NEUTRA = 'bg-gray-100 text-gray-700 border border-gray-300'

export default function BadgeStatus({ status }: { status: string }) {
  const normalizado = status.toLowerCase()
  const classes = CORES_STATUS[normalizado] ?? COR_NEUTRA

  // Primeira letra maiúscula para leitura ("Pendente", vindo do normalizado —
  // "PENDENTE" no banco renderiza "Pendente"); vazio vira "—"
  // (mesma convenção de ausência usada na tabela).
  const texto = normalizado === '' ? '—' : normalizado.charAt(0).toUpperCase() + normalizado.slice(1)

  return <span className={`${classes} rounded-full px-2.5 py-0.5 text-xs font-medium`}>{texto}</span>
}
