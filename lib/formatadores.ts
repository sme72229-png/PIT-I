/**
 * Funções puras de formatação de exibição (dashboard e novo-pedido).
 * Puras = sem estado/efeitos — triviais de testar e reusar em qualquer tela.
 */

/**
 * Formata valor em Real (BRL) no padrão pt-BR.
 *
 * PEGADINHA do U+00A0: o Intl em pt-BR (V8/ICU) devolve "R$\u00A017.200,00"
 * com um ESPAÇO INSEPARÁVEL depois do "R$". Espaço comum em teste/comparação
 * não bate e o caractere invisível ainda vaza para telas/JSON. O replace
 * normaliza para espaço simples: "R$ 17.200,00".
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(valor)
    .replace(/\u00A0/g, ' ')
}

/**
 * Formata a data de criação do pedido (string ISO em UTC, vinda do Supabase)
 * como "dd/MM/aaaa HH:mm" no fuso de São Paulo.
 *
 * - `timeZone: 'America/Sao_Paulo'`: o banco grava em UTC; o lojista brasileiro
 *   precisa ver a hora LOCAL. Sem isto, um pedido criado às 02:30Z apareceria
 *   como 02:30 (e com o dia errado — SP é UTC−3 fixo desde o fim do horário de verão).
 * - Componentes individuais (NÃO dateStyle/timeStyle): o estilo geraria mês
 *   longo e vírgula ("15 de setembro de 2026, 09:00") — queremos o curto tabular.
 *   (Mesmo com componentes, o ICU desta plataforma emite vírgula entre data e
 *   hora; o replace abaixo normaliza para o formato fechado "dd/MM/aaaa HH:mm".)
 * - Data inválida devolve "—": defensiva de EXIBIÇÃO (a UI nunca quebra, F3);
 *   o tipo garante que created_at existe, mas qualquer lixo eventual renderiza "—".
 */
export function formatarData(dataIso: string): string {
  const data = new Date(dataIso)
  if (Number.isNaN(data.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
    .format(data)
    .replace(', ', ' ') // alguns ICUs inserem vírgula entre data e hora — saída sempre "dd/MM/aaaa HH:mm"
}

/**
 * Aplica a máscara oficial de CNPJ (00.000.000/0000-00) APENAS em strings com
 * exatamente 14 dígitos. Qualquer outra entrada (curta, longa, pontuada, vazia)
 * volta inalterada — retorno seguro: o caller decide o que fazer, sem exceções.
 */
export function formatarCNPJ(valor: string): string {
  if (!/^[0-9]{14}$/.test(valor)) return valor
  return `${valor.slice(0, 2)}.${valor.slice(2, 5)}.${valor.slice(5, 8)}/${valor.slice(8, 12)}-${valor.slice(12)}`
}
