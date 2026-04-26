import { Rocket, Star, Zap, SwatchBook, Award, PencilRuler } from "lucide-react";
import GameJoystick from "./3d-objects/GameJoystick";
import YellowBlueSchoolBag from "./3d-objects/YellowBlueSchoolBag";

export function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 pt-16"
    >
      <div className="absolute inset-0 overflow-hidden">
        <SwatchBook
          className="absolute top-20 left-10 w-20 h-20 text-amber-400 opacity-20 animate-pulse"
          style={{ animationDuration: "3s" }}
        />
        <PencilRuler
          className="absolute top-40 right-20 w-16 h-16 text-violet-500 rounded-full opacity-15 animate-bounce"
          style={{ animationDuration: "2s", animationDelay: "0.5s" }}
        />
        <div
          className="absolute bottom-40 left-1/4 w-12 h-12 bg-emerald-400 rounded-full opacity-15 animate-bounce"
          style={{ animationDuration: "2.5s", animationDelay: "1s" }}
        ></div>
        <Award
          className="absolute bottom-20 right-1/3 w-14 h-14 text-cyan-400 rounded-full opacity-15 animate-pulse"
          style={{ animationDuration: "3.5s" }}
        />

        <Star className="absolute top-32 right-1/4 w-8 h-8 text-amber-300 opacity-25 animate-pulse" />
        <Star
          className="absolute bottom-32 left-1/3 w-6 h-6 text-violet-400 opacity-25 animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
        <Zap
          className="absolute top-1/2 right-12 w-10 h-10 text-amber-300 opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-800/50 border-2 border-violet-600 rounded-full">
            <Zap className="w-4 h-4 text-amber-300" />
            <span className="text-sm text-violet-200">Learning Made Fun!</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-400 bg-clip-text text-transparent">
              Level Up
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Your Learning!
            </span>
          </h1>

          <p className="text-xl text-violet-100 max-w-xl">
            Join Seika's magical world where education meets adventure! Complete quizzes, earn rewards, and explore a
            universe of knowledge.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="group px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-purple-950 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-2 font-black">
              <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              Get Started
            </button>
            <button className="px-8 py-4 bg-violet-800/50 text-white border-2 border-violet-600 rounded-full hover:bg-violet-700/50 transition-all">
              Watch Demo
            </button>
          </div>

          <div className="flex items-center gap-8 pt-4">
            <div>
              <div className="text-3xl font-black text-amber-400">10K+</div>
              <div className="text-sm text-violet-300">Active Students</div>
            </div>
            <div className="w-px h-12 bg-violet-600"></div>
            <div>
              <div className="text-3xl font-black text-amber-400">500+</div>
              <div className="text-sm text-violet-300">Teachers</div>
            </div>
            <div className="w-px h-12 bg-violet-600"></div>
            <div>
              <div className="text-3xl font-black text-amber-400">98%</div>
              <div className="text-sm text-violet-300">Success Rate</div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative z-10 flex items-center justify-center h-96">
            {/* GameJoystick - background layer */}
            <div className="absolute z-10 inset-0 rotate-30 flex items-center justify-center translate-y-40 translate-x-20">
              <GameJoystick size={250} />
            </div>

            {/* YellowBlueSchoolBag - overlay layer with rotation */}
            <div className="absolute inset-0 flex items-center justify-center -translate-x-25">
              <div className="transform -rotate-22">
                <YellowBlueSchoolBag size={500} />
              </div>
            </div>
          </div>

          <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl rotate-12 opacity-30 blur-xl"></div>
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl -rotate-12 opacity-50 blur-xl"></div>

          <div
            className="absolute top-8 -right-4 bg-violet-900 p-4 rounded-2xl shadow-xl border-2 border-amber-400 animate-bounce"
            style={{ animationDuration: "3s" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-950" />
              </div>
              <div>
                <div className="text-xs text-violet-300">You earned</div>
                <div className="text-sm font-black text-amber-400">+50 XP</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
