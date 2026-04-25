import { Rocket, Star, Zap } from "lucide-react";

export function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 pt-16"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-20 left-10 w-20 h-20 bg-yellow-400 rounded-full opacity-10 animate-bounce"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-purple-600 rounded-full opacity-10 animate-bounce"
          style={{ animationDuration: "2s", animationDelay: "0.5s" }}
        ></div>
        <div
          className="absolute bottom-40 left-1/4 w-12 h-12 bg-green-400 rounded-full opacity-10 animate-bounce"
          style={{ animationDuration: "2.5s", animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-20 right-1/3 w-14 h-14 bg-blue-400 rounded-full opacity-10 animate-bounce"
          style={{ animationDuration: "3.5s" }}
        ></div>

        <Star className="absolute top-32 right-1/4 w-8 h-8 text-yellow-400 opacity-20 animate-pulse" />
        <Star
          className="absolute bottom-32 left-1/3 w-6 h-6 text-purple-400 opacity-20 animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
        <Zap
          className="absolute top-1/2 right-12 w-10 h-10 text-yellow-400 opacity-15 animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-800/50 border-2 border-purple-600 rounded-full">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-purple-200">Learning Made Fun!</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black">
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
              Level Up
            </span>
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
              Your Learning!
            </span>
          </h1>

          <p className="text-xl text-purple-100 max-w-xl">
            Join Seika's magical world where education meets adventure! Complete quizzes, earn rewards, and explore a
            universe of knowledge.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="group px-8 py-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-purple-900 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 font-black">
              <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Get Started
            </button>
            <button className="px-8 py-4 bg-purple-800/50 text-white border-2 border-purple-600 rounded-full hover:bg-purple-700/50 transition-all">
              Watch Demo
            </button>
          </div>

          <div className="flex items-center gap-8 pt-4">
            <div>
              <div className="text-3xl font-black text-yellow-400">10K+</div>
              <div className="text-sm text-purple-300">Active Students</div>
            </div>
            <div className="w-px h-12 bg-purple-600"></div>
            <div>
              <div className="text-3xl font-black text-yellow-400">500+</div>
              <div className="text-sm text-purple-300">Teachers</div>
            </div>
            <div className="w-px h-12 bg-purple-600"></div>
            <div>
              <div className="text-3xl font-black text-yellow-400">98%</div>
              <div className="text-sm text-purple-300">Success Rate</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative z-10">
            <img
              src="https://images.unsplash.com/photo-1760009230176-be362b5eaecc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxlZHVjYXRpb24lMjBnYW1pZmljYXRpb24lMjBjb2xvcmZ1bCUyMGlsbHVzdHJhdGlvbnxlbnwxfHx8fDE3NzcwMDQzMTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Gamified Learning"
              className="rounded-3xl shadow-2xl"
            />
          </div>

          <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-3xl rotate-12 opacity-30 blur-xl"></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl -rotate-12 opacity-50 blur-xl"></div>

          <div
            className="absolute top-8 -right-4 bg-purple-800 p-4 rounded-2xl shadow-xl border-2 border-yellow-400 animate-bounce"
            style={{ animationDuration: "2s" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-900" />
              </div>
              <div>
                <div className="text-xs text-purple-300">You earned</div>
                <div className="text-sm font-black text-yellow-400">+50 XP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
