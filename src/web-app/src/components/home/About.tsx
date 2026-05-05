import { LuFacebook } from "react-icons/lu";
import { LuTwitter } from "react-icons/lu";
import { LuInstagram } from "react-icons/lu";
import MemberCard from "./MemberCard";
import AnimatedContent from "../reactbit/AnimatedContent";
import { Images } from "../../assets/images";

export function About() {
  const teamMembers = [
    {
      name: "Nguyễn Hùng Cường",
      role: "Software Engineer",
      bio: "Random guy who loves coding and gaming. Passionate about creating fun, interactive learning experiences.",
      image: Images.NijiKaMember,
    },
    {
      name: "Hồ Minh Đạt",
      role: "Software Engineer",
      bio: "Full-stack developer with a knack for making complex systems feel intuitive. Gamer at heart, educator by passion.",
      image: Images.SenkoMember,
    },
  ];

  const socialButtonClass =
    "w-9 h-9 rounded-full bg-violet-900/70 border border-violet-700/60 text-amber-300 flex items-center justify-center shadow-lg hover:scale-105 transition-transform";

  return (
    <section
      id="about"
      className="relative py-32 bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 overflow-hidden"
    >
      {/* Shape divider*/}
      <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden line-height-0">
        <svg viewBox="0 0 1440 320" className="w-full h-full preserve-3d" preserveAspectRatio="none">
          <path
            fill="#fd9900" // Thay mã màu bạn muốn vào đây (ví dụ: #2f0d68)
            d="M0,160 C360,320 720,0 1080,160 C1260,240 1380,160 1440,160 L1440,0 L0,0 Z"
          ></path>
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:py-12">
        {/* Section Header */}
        <div className="mb-32 relative z-10">
          <AnimatedContent>
            <h2 className="text-4xl md:text-6xl font-black mb-4 text-center">
              <span className="inline-block bg-gradient-to-br from-amber-300 to-amber-400 bg-clip-text text-transparent">
                Meet our team
              </span>
            </h2>
            <p className="text-lg md:text-xl text-violet-100/90 max-w-3xl mx-auto text-center">
              Educators and builders who make learning feel like play.
            </p>
          </AnimatedContent>
        </div>

        {/* Team Layout */}
        <div className="relative max-w-8xl mx-auto">
          <AnimatedContent>
            <div className="grid gap-16 md:grid-cols-2">
              {teamMembers.map((member) => (
                <div key={member.name} className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="absolute -inset-3 bg-amber-400/20 rounded-full blur-xl"></div>
                    <MemberCard member={member} />
                  </div>

                  <p className="mt-6 text-xs uppercase tracking-[0.3em] text-violet-200/70">{member.role}</p>
                  <h3 className="mt-2 text-2xl font-black text-amber-300">{member.name}</h3>
                  <p className="mt-3 text-sm text-violet-100/80 max-w-sm leading-relaxed">{member.bio}</p>

                  <div className="mt-5 flex items-center gap-3">
                    <button type="button" className={socialButtonClass} aria-label="Facebook">
                      <LuFacebook className="w-4 h-4" />
                    </button>
                    <button type="button" className={socialButtonClass} aria-label="Twitter">
                      <LuTwitter className="w-4 h-4" />
                    </button>
                    <button type="button" className={socialButtonClass} aria-label="Instagram">
                      <LuInstagram className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedContent>
        </div>

        {/* Mission - floating text, no box */}
        <div className="mt-40 max-w-4xl mx-auto text-center relative z-10">
          <AnimatedContent>
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-amber-500/10 rounded-[40%_60%_60%_40%/60%_40%_40%_60%] blur-3xl -z-10"></div>
            <h3 className="text-4xl md:text-6xl font-black text-amber-400 mb-6">Our Mission</h3>
            <p className="text-xl md:text-2xl text-violet-100 leading-relaxed">
              To revolutionize education by combining the excitement of gaming with the power of learning. Every student
              deserves an engaging, rewarding experience that inspires curiosity.
            </p>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
