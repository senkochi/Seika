import {
  Trophy,
  Bell,
  Brain,
  Store,
  CreditCard,
  Layers,
  Sparkles,
} from "lucide-react";
import { Images } from "../../assets/images";
import AnimatedContent from "../reactbit/AnimatedContent";
import { SocialProof } from "./SocialProof";
import { cn } from "../ui/utils";

/* ----------------------------------------------------------
   Double-bezel card primitives
   ---------------------------------------------------------- */

function BezelCard({
  children,
  className,
  tone = "dark",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "dark" | "light" | "gold";
}) {
  const shells = {
    dark: "bg-white/[0.04] border-white/[0.06]",
    light: "bg-[#faf6ee]/[0.04] border-[#faf6ee]/[0.08]",
    gold: "bg-gradient-to-b from-[#d4a843]/30 to-[#d4a843]/[0.04] border-[#d4a843]/[0.18]",
  } as const;
  const cores = {
    dark: "bg-gradient-to-br from-[#1c0f2e] to-[#15091e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]",
    light: "bg-[#faf6ee] text-[#1c0f2e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]",
    gold: "bg-gradient-to-br from-[#1c0f2e] via-[#15091e] to-[#15091e] shadow-[inset_0_1px_1px_rgba(212,168,67,0.18)]",
  } as const;

  return (
    <div
      className={cn(
        "group h-full p-1.5 rounded-[2rem] border",
        shells[tone],
        "transition-all duration-500 ease-soft hover:-translate-y-1",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-[calc(2rem-0.375rem)] overflow-hidden",
          cores[tone],
        )}
      >
        {children}
      </div>
    </div>
  );
}

function IconChip({
  children,
  tone = "gold",
}: {
  children: React.ReactNode;
  tone?: "gold" | "purple" | "blue" | "green";
}) {
  const tones = {
    gold: "bg-gradient-to-br from-[#e6c264] to-[#c89a36] text-[#1c0f2e]",
    purple: "bg-[#3a1c5c] text-[#faf6ee]",
    blue: "bg-[#1e3a5f] text-[#faf6ee]",
    green: "bg-[#1d3a2e] text-[#faf6ee]",
  } as const;
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center w-12 h-12 rounded-2xl rotate-[-4deg] group-hover:rotate-0 transition-transform duration-500 ease-spring",
        tones[tone],
      )}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------
   Features section
   ---------------------------------------------------------- */

export function Features() {
  return (
    <section
      id="features"
      className="relative py-32 lg:py-40 overflow-hidden"
    >
      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-10">
        {/* Section header — eyebrow + Fraunces headline + lede */}
        <AnimatedContent>
          <div className="mb-20 max-w-3xl">
            <span className="eyebrow">
              <span className="inline-block w-1 h-1 rounded-full bg-[#d4a843]" />
              Capabilities
            </span>
            <h2
              className="mt-6 font-display font-medium text-[#faf6ee] text-4xl md:text-5xl lg:text-6xl leading-[1.02] tracking-[-0.025em]"
              style={{ textWrap: "balance" as const }}
            >
              A platform built for{" "}
              <span className="italic font-display font-light text-[#d4a843]">
                two
              </span>{" "}
              roles.
            </h2>
            <p className="mt-5 text-lg text-[#faf6ee]/65 max-w-xl">
              Whether you're running a class of forty or studying alone at
              midnight, the same tools stay sharp.
            </p>
          </div>
        </AnimatedContent>

        {/* Social proof above bento */}
        <AnimatedContent>
          <SocialProof />
        </AnimatedContent>

        <div className="hairline mt-16" />

        {/* Asymmetric 12-col bento */}
        <AnimatedContent>
          <div className="grid grid-cols-12 gap-4 lg:gap-5 mt-16 auto-rows-[minmax(180px,auto)]">
            {/* Flashcard — large dark image-led card */}
            <BezelCard
              tone="dark"
              className="col-span-12 md:col-span-7 md:row-span-2"
            >
              <div className="relative h-full min-h-[360px] flex flex-col">
                <div className="p-8 lg:p-10 space-y-5">
                  <IconChip tone="gold">
                    <Layers className="w-5 h-5" strokeWidth={1.5} />
                  </IconChip>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#d4a843]/80">
                      Library
                    </p>
                    <h3 className="mt-2 font-display text-3xl lg:text-4xl text-[#faf6ee]">
                      Flashcard decks that stick.
                    </h3>
                  </div>
                  <p className="text-[#faf6ee]/65 leading-relaxed max-w-md">
                    Build personal decks or browse public collections. Spaced
                    repetition remembers what you forgot so you don't have to.
                  </p>
                </div>
                <div className="mt-auto -mx-px -mb-px overflow-hidden rounded-b-[calc(2rem-0.375rem)]">
                  <img
                    src={Images.FeatureImage1}
                    alt="A student reviewing flashcards at a desk"
                    className="w-full h-48 lg:h-56 object-cover opacity-90"
                  />
                </div>
              </div>
            </BezelCard>

            {/* Smart Quizzes — text card with circular badge */}
            <BezelCard
              tone="dark"
              className="col-span-12 md:col-span-5"
            >
              <div className="p-8 lg:p-10 h-full flex flex-col gap-5">
                <IconChip tone="purple">
                  <Brain className="w-5 h-5" strokeWidth={1.5} />
                </IconChip>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#d4a843]/80">
                    Assessment
                  </p>
                  <h3 className="mt-2 font-display text-3xl text-[#faf6ee]">
                    Smart quizzes, instantly graded.
                  </h3>
                </div>
                <p className="text-[#faf6ee]/65 leading-relaxed">
                  Instant scoring, detailed breakdowns, and a progress map that
                  actually shows you where to go next.
                </p>
                <div className="mt-auto flex items-center gap-3 text-sm text-[#d4a843]">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#d4a843]/15">
                    <Sparkles className="w-3.5 h-3.5" strokeWidth={1.8} />
                  </span>
                  <span className="font-medium">Auto-generated variants</span>
                </div>
              </div>
            </BezelCard>

            {/* Marketplace — gold-bezel feature spotlight */}
            <BezelCard
              tone="gold"
              className="col-span-12 md:col-span-5"
            >
              <div className="p-8 lg:p-10 h-full flex flex-col gap-5 relative">
                <IconChip tone="gold">
                  <Store className="w-5 h-5" strokeWidth={1.5} />
                </IconChip>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#d4a843]">
                    Marketplace
                  </p>
                  <h3 className="mt-2 font-display text-3xl text-[#faf6ee]">
                    Spend coins on real study material.
                  </h3>
                </div>
                <p className="text-[#faf6ee]/70 leading-relaxed">
                  Premium quiz packs and flashcard decks from educators
                  worldwide, priced in the coins you've already earned.
                </p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {["Premium packs", "Expert decks", "Study guides"].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-full text-xs font-medium text-[#faf6ee]/85 bg-white/[0.06] border border-white/[0.08]"
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </BezelCard>

            {/* Earn coins — cream-light, breaks the dark monotony */}
            <BezelCard
              tone="light"
              className="col-span-12 md:col-span-7"
            >
              <div className="h-full p-8 lg:p-10 grid md:grid-cols-[1fr_auto] gap-6 items-end">
                <div className="space-y-4">
                  <IconChip tone="green">
                    <CreditCard
                      className="w-5 h-5 text-[#1c0f2e]"
                      strokeWidth={1.5}
                    />
                  </IconChip>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#1c0f2e]/60">
                    Rewards
                  </p>
                  <h3 className="font-display text-3xl text-[#1c0f2e]">
                    Learning pays off. Literally.
                  </h3>
                  <p className="text-[#1c0f2e]/70 leading-relaxed max-w-md">
                    Every completed quiz drops coins into your wallet. Spend
                    them in the marketplace, or save them up for the premium
                    pack you've been eyeing.
                  </p>
                </div>
                <div className="font-display font-tabular text-6xl text-[#1c0f2e]/15 leading-none">
                  ✦
                </div>
              </div>
            </BezelCard>

            {/* Leaderboards — small dark */}
            <BezelCard
              tone="dark"
              className="col-span-12 md:col-span-5"
            >
              <div className="p-8 h-full flex flex-col gap-5">
                <IconChip tone="gold">
                  <Trophy className="w-5 h-5" strokeWidth={1.5} />
                </IconChip>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#d4a843]/80">
                    Compete
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-[#faf6ee]">
                    Leaderboards that actually update.
                  </h3>
                </div>
                <p className="text-[#faf6ee]/65 leading-relaxed text-sm">
                  Real-time rankings across your cohort, school, and the wider
                  community.
                </p>
              </div>
            </BezelCard>

            {/* Notifications — full-width slim band */}
            <BezelCard
              tone="dark"
              className="col-span-12"
            >
              <div className="p-8 lg:p-10 flex flex-col md:flex-row md:items-center gap-6">
                <IconChip tone="blue">
                  <Bell className="w-5 h-5" strokeWidth={1.5} />
                </IconChip>
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#d4a843]/80">
                    Stay in the loop
                  </p>
                  <h3 className="mt-2 font-display text-2xl lg:text-3xl text-[#faf6ee]">
                    Notifications tuned to what you care about.
                  </h3>
                </div>
                <p className="text-[#faf6ee]/65 leading-relaxed md:max-w-xs">
                  New content drops, quiz results, milestone unlocks — without
                  the noise.
                </p>
              </div>
            </BezelCard>
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}