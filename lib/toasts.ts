import { toast } from 'react-hot-toast'

/**
 * Toast de AVISO (semântica fixada na resolução O2): mensagens que EXIGEM
 * ação do usuário — "selecione o lojista" (AC2), "adicione uma bike" (AC3),
 * "anote o número do pedido" (AC7). Visual amarelo ⚠️, distinto do vermelho
 * de `toast.error` (falha total, AC5) e do verde de `toast.success` (AC4).
 *
 * Por que um helper em vez de chamar toast() direto: o react-hot-toast NÃO
 * tem `toast.warning` nativo (conferido na doc oficial
 * https://react-hot-toast.com/docs/toast) — o ícone custom `{ icon: '⚠️' }` é
 * o jeito oficial de criar o nível "aviso". Centralizar aqui garante que TODA
 * a tela fala a mesma "língua de cor" e o id propagado permite dismiss futuro.
 */
export function toastAviso(mensagem: string): string {
  return toast(mensagem, { icon: '⚠️' })
}
