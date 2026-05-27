"use client";

import { useState } from "react";
import { useUser, SignUpButton } from "@clerk/nextjs";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ImageIcon,
  FileCheck,
  Coins,
  Users,
  Shield,
  Info,
  PenLine,
  ShoppingCart,
  UserCheck,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MedialaneLogo } from "@/components/brand/medialane-logo";
import { GenesisMint } from "./genesis-mint";

// ─── Imagem do NFT ────────────────────────────────────────────────────────────

function EventCard() {
  const [errored, setErrored] = useState(false);
  const src = "/br_launch.jpg";
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-xl shadow-black/10 aspect-square w-full">
      {errored ? (
        <div className="w-full h-full bg-muted/30 flex flex-col items-center justify-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-7 w-7 text-primary/40" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">Medialane Brasil 2026</p>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt="Medialane Airdrop de Prêmios"
          className="w-full h-full object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function BrMintContent() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Cabeçalho */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-border/30 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
        <MedialaneLogo />
      </header>

      <div className="flex-1 w-full">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">

          {/* ── Hero: 2 colunas no desktop ── */}
          <section className="py-12 lg:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

              {/* Esquerda: badge + título + participação */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/5 px-3 py-1">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
                  <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Medialane Brasil</span>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
                  Participe da{" "}
                  <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                    Campanha de Lançamento
                  </span>
                </h1>
                <GenesisMint />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Medialane é um app para criadores publicar, compartilhar e monetizar conteúdo. Participação grátis.
                </p>
                <div className="flex items-center gap-4">
                  {["Grátis", "Sem cartão", "Imediato"].map((t) => (
                    <div key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500/60" />
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Direita: imagem (sticky no desktop) */}
              <div className="lg:sticky lg:top-24">
                <EventCard />
              </div>

            </div>
          </section>


          <section className="py-10 border-t border-border/30 space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black">Fundo para Criadores</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: FileCheck, color: "text-blue-400",   bg: "bg-blue-500/10",   title: "Participação grátis", desc: "Faça login com sua conta Google" },
                { icon: Coins,     color: "text-yellow-500", bg: "bg-yellow-500/10", title: "Fundo de criadores", desc: "Distribuição de fundos para todos os participantes." },
                { icon: Users,     color: "text-purple-400", bg: "bg-purple-500/10", title: "Aumente suas chances", desc: "Crie, compartilhe e colecione!." },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="flex flex-col gap-4 p-5 rounded-2xl border border-border/40 bg-card/30 hover:bg-card/50 transition-colors">
                  <div className={`h-11 w-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="font-bold">{title}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Níveis de participação ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Como funciona</p>
              <h2 className="text-2xl sm:text-3xl font-black">Participe em poucos segundos.</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Acesse com sua conta Google é tudo o que você precisa para participar.
              </p>
            </div>

            {/* Nível base — destaque */}
            <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 p-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <UserCheck className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-lg">Acesso com Google</p>
                    <span className="text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full">Mínimo — você está dentro</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Faça login com sua conta Google e defina uma senha ou passkey para proteger sua conta.
                  </p>
                </div>
              </div>
            </div>

            {/* Níveis bônus */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <PenLine className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">Bônus</span>
                </div>
                <div>
                  <p className="font-bold">Crie conteúdo</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Publique fotos, músicas, arte ou textos. Criadores recebem uma fatia maior de cada distribuição.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/40 bg-card/30 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-orange-400" />
                  </div>
                  <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-full">Maior bônus</span>
                </div>
                <div>
                  <p className="font-bold">Compre e colecione</p>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Compre, venda e colabore com outros criadores. Participantes ativos recebem a maior fatia.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Fases de distribuição ── */}
          <section className="py-10 border-t border-border/30 space-y-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Distribuição</p>
              <h2 className="text-2xl sm:text-3xl font-black">Fases do fundo de criadores</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                O fundo distribui a receita da plataforma para os participantes. As distribuições são baseadas em metas da comunidade.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-lg">Fase 1</p>
                  <span className="text-xs font-semibold bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-full">5.000 membros</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Primeira distribuição. Todos os participantes elegíveis recebem uma parte proporcional com base em sua atividade.
                </p>
              </div>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-lg">Fase 2</p>
                  <span className="text-xs font-semibold bg-purple-500/10 text-purple-400 px-2.5 py-1 rounded-full">10.000 membros</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Segunda distribuição, incluindo toda a receita acumulada desde a Fase 1. As pontuações são recalculadas desde o lançamento.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-border/40 bg-muted/10 p-4 flex items-start gap-3">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                As Fases 1 e 2 são as distribuições do primeiro ano da plataforma. Essas metas são objetivos, não garantias.
              </p>
            </div>
          </section>

          {/* ── Elegibilidade + Aviso legal ── */}
          <section className="py-10 border-t border-border/30">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Elegibilidade</p>
                  <h2 className="text-2xl font-black">Quem é elegível</h2>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    { ok: true,  text: "Qualquer pessoa que criar uma conta gratuita e reivindicar seu registro." },
                    { ok: true,  text: "Contas que publicam conteúdo original recebem uma fatia maior." },
                    { ok: true,  text: "Participantes ativos que negociam ou colaboram recebem a maior fatia." },
                    { ok: false, text: "Contas que usam ferramentas automatizadas ou cadastros duplicados são desqualificadas." },
                    { ok: false, text: "Contas flagradas inflando artificialmente suas pontuações são desqualificadas." },
                  ].map(({ ok, text }) => (
                    <div key={text} className="flex items-start gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${ok ? "bg-emerald-500/10" : "bg-destructive/10"}`}>
                        {ok ? <CheckCircle2 className="h-3 w-3 text-emerald-500" /> : <XCircle className="h-3 w-3 text-destructive" />}
                      </div>
                      <span className="text-muted-foreground leading-relaxed">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-2xl font-black">Aviso legal</h2>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                  <p>A Medialane é uma plataforma para criação e monetização de conteúdo autoral e propriedade intelectual feita para criadores. Esta campanha não é um produto financeiro, esquema de investimento, loteria ou serviço de apostas.</p>
                  <p>A participação não garante nenhum retorno financeiro. As distribuições serão realizadas a critério da comunidade e podem tomar a forma de créditos, ativos digitais ou outros recursos.</p>
                  <p>O registro de participação é um comprovante digital de participação no lançamento Medialane. Não possui valor monetário intrínseco e não é um instrumento financeiro.</p>
                  <p>
                    Ao participar, você concorda com o{" "}
                    <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Regulamento da Campanha</a>
                    {" "}e os{" "}
                    <a href="https://docs.medialane.io/guidelines/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Termos de Uso</a>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Bottom CTA (apenas visitantes) ── */}
          {isLoaded && !isSignedIn && (
            <section className="py-10 border-t border-border/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">Participe grátis</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">Acesse com sua conta Google.</p>
                </div>
                <SignUpButton mode="modal" forceRedirectUrl="/br/mint">
                  <Button size="lg" className="gap-2 shrink-0 font-bold">
                    <Sparkles className="h-4 w-4" />
                    Garantir meu lugar!
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </SignUpButton>
              </div>
            </section>
          )}

          <div className="pb-12" />
        </div>
      </div>

      {/* Rodapé */}
      <footer className="border-t border-border/40">
        <p className="text-[11px] text-center text-muted-foreground/50 px-5 pt-4">
          Participação gratuita · Sem necessidade de compra ·{" "}
          <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-muted-foreground/80 transition-colors">
            Ver regulamento
          </a>
        </p>
        <div className="px-5 py-4 flex items-center justify-center gap-5 text-xs text-muted-foreground flex-wrap">
          <a href="https://docs.medialane.io/guidelines/terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Termos</a>
          <a href="https://docs.medialane.io/guidelines/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Privacidade</a>
          <a href="https://docs.medialane.io/guidelines/campaign-terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Campanha</a>
          <a href="https://docs.medialane.io/about" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Sobre</a>
          <span>© {new Date().getFullYear()} Medialane</span>
        </div>
      </footer>
    </div>
  );
}
