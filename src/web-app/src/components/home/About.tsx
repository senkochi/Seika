import { LuFacebook } from "react-icons/lu";
import { LuTwitter } from "react-icons/lu";
import { LuInstagram } from "react-icons/lu";
import MemberCard from "./MemberCard";
import AnimatedContent from "../reactbit/AnimatedContent";
import { Images } from "../../assets/images";
import { cn } from "../ui/utils";

export function About() {
  const teamMembers = [
    {
      name: "Nguyễn Hùng Cường",
      role: "Software Engineer",
      bio: "Loves building things that make people laugh while they learn. Refuses to ship a boring onboarding flow.",
      image: Images.NijiKaMember,
    },
    {
      name: "Hồ Minh Đạt",
      role: "Software Engineer",
      bio: "Full-stack developer who treats every state transition like a small piece of choreography. Gamer by night.",
      image: Images.SenkoMember,
    },
  ];

  const socialButtonClass =
    "w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#d4a843] flex items-center justify-center hover:bg-white/[0.08] hover:border-[#d4a843]/30 transition-all duration-300 ease-soft";

  return (
    <section
      id="about"
      className="relative py-32 lg:py-40 overflow-hidden"
    >
      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-10">
        {/* Section header */}
        <AnimatedContent>
          <div className="max-w-3xl mb-24">
            <span className="eyebrow">
              <span className="inline-block w-1 h-1 rounded-full bg-[#d4a843]" />
              The team
            </span>
            <h2
              className="mt-6 font-display font-medium text-[#faf6ee] text-4xl md:text-5xl lg:text-6xl leading-[1.02] tracking-[-0.025em]"
              style={{ textWrap: "balance" as const }}
            >
              Built by students,{" "}
              <span className="italic font-display font-light text-[#d4a843]">
                for
              </span>{" "}
              students.
            </h2>
            <p className="mt-5 text-lg text-[#faf6ee]/65 max-w-xl">
              Two engineers who thought studying didn't have to feel like a
              chore, and decided to do something about it.
            </p>
          </div>
        </AnimatedContent>

        {/* Team grid */}
        <AnimatedContent>
          <div className="grid gap-16 md:gap-20 md:grid-cols-2 max-w-4xl mx-auto">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="flex flex-col items-center text-center"
              >
                <MemberCard member={member} />

                <p className="mt-8 text-[11px] uppercase tracking-[0.22em] text-[#d4a843]/80">
                  {member.role}
                </p>
                <h3 className="mt-3 font-display text-2xl lg:text-3xl text-[#faf6ee]">
                  {member.name}
                </h3>
                <p className="mt-3 text-sm text-[#faf6ee]/70 max-w-sm leading-relaxed">
                  {member.bio}
                </p>

                <div className="mt-6 flex items-center gap-2">
                  <button
                    type="button"
                    className={socialButtonClass}
                    aria-label={`${member.name} on Facebook`}
                  >
                    <LuFacebook className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className={socialButtonClass}
                    aria-label={`${member.name} on Twitter`}
                  >
                    <LuTwitter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className={socialButtonClass}
                    aria-label={`${member.name} on Instagram`}
                  >
                    <LuInstagram className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AnimatedContent>

        {/* Mission — cream double-bezel card */}
        <AnimatedContent>
          <div className="mt-32 lg:mt-40 max-w-4xl mx-auto">
            <div className="p-1 rounded-[2rem] bg-gradient-to-b from-[#d4a843]/30 to-[#d4a843]/[0.04] border border-[#d4a843]/[0.18]">
              <div
                className={cn(
                  "rounded-[calc(2rem-0.375rem)] bg-[#faf6ee]",
                  "p-10 lg:p-14 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]",
                  "relative overflow-hidden",
                )}
              >
                <span className="absolute top-8 left-8 text-[11px] uppercase tracking-[0.22em] text-[#d4a843] font-medium">
                  Our mission
                </span>
                <p
                  className="mt-12 font-display text-3xl md:text-4xl lg:text-5xl text-[#1c0f2e] leading-[1.1] tracking-[-0.02em]"
                  style={{ textWrap: "balance" as const }}
                >
                  Make education feel less like a{" "}
                  <span className="italic font-light">chore</span> and more like
                  a game worth coming back to.
                </p>
                <div className="mt-10 flex items-center gap-3 text-sm text-[#1c0f2e]/65">
                  <span className="inline-block w-8 h-px bg-[#1c0f2e]/30" />
                  <span>Nguyễn Hùng Cường & Hồ Minh Đạt</span>
                </div>
              </div>
            </div>
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}