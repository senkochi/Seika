import { Rocket, Star, Zap} from "lucide-react";
import GameJoystick from "../3d-objects/GameJoystick";
import YellowBlueSchoolBag from "../3d-objects/YellowBlueSchoolBag";
import AnimatedContent from "../reactbit/AnimatedContent";

export function Hero() {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 pt-16 pb-16"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <AnimatedContent>
            <div className="inline-flex items-center gap-2 my-2">
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

            <p className="text-xl my-4 text-violet-100 max-w-xl">
              Join Seika's magical world where education meets adventure! Complete quizzes, earn rewards, and explore a
              universe of knowledge.
            </p>

            <div className="flex flex-wrap gap-4 my-6">
              <button className="group px-8 py-4 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-purple-950 rounded-full shadow-xl hover:scale-102 transition-all flex items-center gap-2 font-black">
                <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Get Started
              </button>
              <button className="px-8 py-4 bg-violet-800/50 text-white border-2 border-violet-600 rounded-full hover:bg-violet-700/50 transition-all">
                Learn More
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
          </AnimatedContent>
        </div>

        <div className="relative">
          <AnimatedContent>
            <div className="relative z-10 flex items-center justify-center h-96">
              {/* GameJoystick - background layer */}
              <div
                className="animate-float-joystick absolute z-10 inset-0 rotate-30 flex items-center justify-center translate-y-40 translate-x-20 hover:scale-105 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                style={{ willChange: "transform" }}
              >
                <GameJoystick size={250} />
              </div>

              {/* YellowBlueSchoolBag - overlay layer with rotation */}
              <div className="absolute inset-0 flex items-center justify-center -translate-x-25">
                <div
                  className="animate-float-bag transform -rotate-22 hover:scale-105 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{ willChange: "transform" }}
                >
                  <YellowBlueSchoolBag size={500} />
                </div>
              </div>
            </div>

            <div className="absolute -top-6 -right-6 w-42 h-42 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-3xl rotate-12 opacity-10 blur-xl"></div>
            <div className="absolute -bottom-6 -left-6 w-52 h-52 bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl -rotate-12 opacity-20 blur-2xl"></div>

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
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
