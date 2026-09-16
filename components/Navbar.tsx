'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bike, LayoutDashboard, ShoppingCart, type LucideIcon } from 'lucide-react'

/**
 * Link da navbar: ativo (pathname === href) fica amarelo com aria-current="page"
 * (cor + semântica — cor nunca é o único diferenciador); inativo fica cinza com
 * hover amarelo. Ícone some em <640px (hidden sm:inline) — no mobile só o texto
 * cabe, mas o DOM mantém o ícone (teste não é afetado).
 * whitespace-nowrap: em 375px o rótulo "Novo Pedido" não pode quebrar em 2
 * linhas (achado do browser-tester no gate da task 1 — o nav tem ~155px).
 */
function LinkNav({
  href,
  rotulo,
  Icone,
}: {
  href: '/' | '/novo-pedido'
  rotulo: string
  Icone: LucideIcon
}) {
  const pathname = usePathname()
  const ativo = pathname === href

  return (
    <Link
      href={href}
      aria-current={ativo ? 'page' : undefined}
      className={`flex items-center gap-1.5 whitespace-nowrap rounded-sm text-sm focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
        ativo ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
      }`}
    >
      <Icone className="hidden sm:inline" size={18} aria-hidden="true" />
      {rotulo}
    </Link>
  )
}

/**
 * Navbar global preto + amarela (identidade da marca), fixa no topo (sticky) com
 * faixa amarela na base (assinatura "industrial" aprovada pelo usuário).
 * Sem hambúrguer: são só 2 links curtos que cabem lado a lado até em 375px.
 */
export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-yellow-400 bg-black text-white">
      {/* mesmo container do <main> para o conteúdo alinhar com a página */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        {/* Logo: ícone Bike amarelo + nome com "B2B" em destaque amarelo */}
        <div className="flex items-center gap-2">
          <Bike className="text-yellow-400" size={22} aria-hidden="true" />
          <span className="text-sm font-bold sm:text-base">
            Fontes Mobilidade <span className="text-yellow-400">B2B</span>
          </span>
        </div>

        {/* 2 links lado a lado — decisões do usuário (sem menu hambúrguer) */}
        <nav className="flex items-center gap-4 sm:gap-6" aria-label="Navegação principal">
          <LinkNav href="/" rotulo="Dashboard" Icone={LayoutDashboard} />
          <LinkNav href="/novo-pedido" rotulo="Novo Pedido" Icone={ShoppingCart} />
        </nav>
      </div>
    </header>
  )
}
