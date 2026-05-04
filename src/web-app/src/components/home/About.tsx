import { Sparkles, Star, Gamepad2, Trophy, Zap } from "lucide-react";

export function About() {
  const teamMembers = [
    {
      name: "Sarah Chen",
      role: "Co-Founder & CEO",
      bio: "Former educator with 10+ years of experience. Passionate about making learning accessible and fun.",
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      stickerColor: "bg-amber-400",
      position: "top",
    },
    {
      name: "Alex Rivera",
      role: "Head of Product",
      bio: "Game designer turned EdTech innovator. Believes gamification is the key to engaging modern learners.",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400",
      stickerColor: "bg-violet-500",
      position: "bottom",
    },
  ];

  return (
    <section
      id="about"
      className="relative py-32 bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 overflow-hidden"
    >
      {/* Organic blob shapes */}
      <div className="absolute top-20 -right-40 w-96 h-96 bg-amber-400/10 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-20 -left-40 w-80 h-80 bg-violet-500/10 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-purple-600/5 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] blur-2xl"></div>

      {/* Floating game icons */}
      <Star
        className="absolute top-24 left-[15%] w-10 h-10 text-amber-300 opacity-30 animate-bounce"
        style={{ animationDuration: "3s" }}
      />
      <Gamepad2
        className="absolute top-40 right-[20%] w-12 h-12 text-violet-400 opacity-20 animate-bounce"
        style={{ animationDuration: "4s", animationDelay: "0.5s" }}
      />
      <Trophy
        className="absolute bottom-32 left-[25%] w-8 h-8 text-yellow-400 opacity-25 animate-bounce"
        style={{ animationDuration: "3.5s", animationDelay: "1s" }}
      />
      <Zap
        className="absolute bottom-40 right-[15%] w-10 h-10 text-amber-400 opacity-20 animate-bounce"
        style={{ animationDuration: "3s", animationDelay: "1.5s" }}
      />
      <Sparkles className="absolute top-1/3 right-[30%] w-8 h-8 text-violet-300 opacity-25 animate-pulse" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - floating freely */}
        <div className="mb-32 relative z-10">
          <h2 className="text-5xl md:text-7xl font-black mb-6 text-center">
            <span className="inline-block bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_4px_8px_rgba(251,191,36,0.3)]">
              The Seika Team
            </span>
          </h2>
          <p className="text-2xl text-violet-100 max-w-3xl mx-auto text-center drop-shadow-lg">
            We're educators and innovators on a mission to transform learning into an epic adventure
          </p>
        </div>

        {/* Asymmetric Team Layout - NO BOXES */}
        <div className="relative max-w-6xl mx-auto">
          {/* First Member - Positioned Higher */}
          <div className="relative mb-20 md:ml-0 md:mr-auto md:w-3/5" style={{ transform: "translateY(-40px)" }}>
            {/* Organic blob background */}
            <div className="absolute -inset-12 bg-amber-400/5 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-2xl"></div>

            {/* Polaroid/Sticker style photo */}
            <div className="relative group">
              <div
                className={`${teamMembers[0].stickerColor} p-4 shadow-2xl transform rotate-[-4deg] hover:rotate-[-2deg] transition-all duration-300 relative z-20`}
                style={{ borderRadius: "8% 8% 8% 8% / 8% 8% 8% 8%" }}
              >
                <img
                  src={teamMembers[0].image}
                  alt={teamMembers[0].name}
                  className="w-full aspect-[3/4] object-cover"
                  style={{ borderRadius: "4% 4% 4% 4% / 4% 4% 4% 4%" }}
                />
                <div className="bg-white pt-4 pb-2 text-center">
                  <p className="text-purple-900 font-black text-lg">{teamMembers[0].name}</p>
                </div>
              </div>

              {/* Text overlapping the photo */}
              <div className="absolute -right-8 md:-right-20 top-1/2 -translate-y-1/2 z-30 max-w-xs">
                <div
                  className="bg-violet-900/80 backdrop-blur-md p-6 transform rotate-2 shadow-xl"
                  style={{ borderRadius: "12% 12% 12% 12% / 12% 12% 12% 12%" }}
                >
                  <h3 className="text-2xl font-black text-amber-400 mb-2 drop-shadow-lg">{teamMembers[0].role}</h3>
                  <p className="text-violet-100 text-sm leading-relaxed">{teamMembers[0].bio}</p>
                </div>
              </div>

              {/* Sparkle decoration */}
              <Sparkles
                className="absolute -top-4 -right-4 w-12 h-12 text-yellow-400 animate-spin"
                style={{ animationDuration: "4s" }}
              />
            </div>
          </div>

          {/* Second Member - Positioned Lower, offset to right */}
          <div className="relative md:ml-auto md:mr-0 md:w-3/5" style={{ transform: "translateY(60px)" }}>
            {/* Organic blob background */}
            <div className="absolute -inset-12 bg-violet-500/5 rounded-[40%_60%_70%_30%/50%_60%_40%_60%] blur-2xl"></div>

            {/* Polaroid/Sticker style photo */}
            <div className="relative group">
              <div
                className={`${teamMembers[1].stickerColor} p-4 shadow-2xl transform rotate-[3deg] hover:rotate-[1deg] transition-all duration-300 relative z-20`}
                style={{ borderRadius: "8% 8% 8% 8% / 8% 8% 8% 8%" }}
              >
                <img
                  src={teamMembers[1].image}
                  alt={teamMembers[1].name}
                  className="w-full aspect-[3/4] object-cover"
                  style={{ borderRadius: "4% 4% 4% 4% / 4% 4% 4% 4%" }}
                />
                <div className="bg-white pt-4 pb-2 text-center">
                  <p className="text-purple-900 font-black text-lg">{teamMembers[1].name}</p>
                </div>
              </div>

              {/* Text overlapping the photo */}
              <div className="absolute -left-8 md:-left-20 top-1/2 -translate-y-1/2 z-30 max-w-xs">
                <div
                  className="bg-amber-400/90 backdrop-blur-md p-6 transform -rotate-2 shadow-xl"
                  style={{ borderRadius: "12% 12% 12% 12% / 12% 12% 12% 12%" }}
                >
                  <h3 className="text-2xl font-black text-purple-900 mb-2 drop-shadow-lg">{teamMembers[1].role}</h3>
                  <p className="text-purple-900 text-sm leading-relaxed">{teamMembers[1].bio}</p>
                </div>
              </div>

              {/* Trophy decoration */}
              <Trophy
                className="absolute -bottom-4 -left-4 w-12 h-12 text-amber-400 animate-bounce"
                style={{ animationDuration: "2s" }}
              />
            </div>
          </div>
        </div>

        {/* Mission - floating text, no box */}
        <div className="mt-40 max-w-4xl mx-auto text-center relative z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-amber-500/10 rounded-[40%_60%_60%_40%/60%_40%_40%_60%] blur-3xl -z-10"></div>
          <h3 className="text-4xl md:text-5xl font-black text-amber-400 mb-6 drop-shadow-[0_4px_12px_rgba(251,191,36,0.4)]">
            Our Mission
          </h3>
          <p className="text-xl md:text-2xl text-violet-100 leading-relaxed drop-shadow-lg">
            To revolutionize education by combining the excitement of gaming with the power of learning. Every student
            deserves an engaging, rewarding experience that inspires curiosity.
          </p>
        </div>
      </div>
    </section>
  );
}
