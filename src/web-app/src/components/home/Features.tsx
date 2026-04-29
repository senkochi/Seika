import { Trophy, Bell, Brain, Store, CreditCard } from "lucide-react";
import { Images } from "../../assets/images";
import AnimatedContent from "../reactbit/AnimatedContent";

export function Features() {
  return (
    <section id="features" className="relative pb-48 pt-34 bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-500">
      {/* Shape Divider */}
      <div className="pointer-events-none absolute left-0 top-0 w-full -translate-y-full overflow-hidden leading-none">
        <svg className="relative block h-16 w-full md:h-24" viewBox="0 0 1440 140" preserveAspectRatio="none">
          <path d="M0,120 C220,30 520,180 760,90 C980,10 1210,70 1440,30 L1440,140 L0,140 Z" fill="#ffba00" />
        </svg>
      </div>
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <AnimatedContent>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-900/80 border-2 border-purple-700 rounded-full mb-4">
              <span className="text-sm text-yellow-300">Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              <span className="bg-gradient-to-r from-purple-900 to-purple-700 bg-clip-text text-transparent">
                Designed for Everyone
              </span>
            </h2>
            <p className="text-xl text-purple-900 max-w-2xl mx-auto">
              Whether you're a student or teacher, Seika has powerful tools to make education fun and effective.
            </p>
          </div>
        </AnimatedContent>
        <AnimatedContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 bg-white/95 backdrop-blur-sm overflow-hidden rounded-3xl hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl group">
              <img src={Images.FeatureImage1} alt="Feature 1" className="w-full h-full object-cover" />
            </div>

            <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-3xl p-8 hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl text-white group">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-6 group-hover:rotate-12 transition-transform">
                <svg className="w-8 h-8 text-purple-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-black mb-3 text-yellow-300">Flashcard Decks</h3>
              <p className="text-lg text-yellow-400 mb-2">Study at Your Pace</p>
              <p className="text-purple-100 leading-relaxed">
                Build personal flashcard decks or explore public collections. Master concepts with spaced repetition.
              </p>
            </div>
            <div className="md:col-span-2 bg-white/95 backdrop-blur-sm rounded-3xl p-8 hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl group overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6 h-full">
                <div className="flex-1">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-6 group-hover:rotate-12 transition-transform">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-3xl font-black mb-3 text-purple-900">Smart Quizzes</h3>
                  <p className="text-lg text-purple-700 mb-2">Test What You Know</p>
                  <p className="text-gray-700 leading-relaxed">
                    Create and take quizzes with instant scoring, detailed results, and comprehensive progress tracking.
                  </p>
                </div>
                <div className="md:w-74 flex items-end -mr-8 -mb-8 mt-auto overflow-hidden">
                  <div className="w-full h-full overflow-hidden ml-auto">
                    <img
                      src={Images.Student1}
                      alt="Student 1"
                      className="w-full h-full object-cover object-center scale-123 transition-transform group-hover:scale-125 duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:row-span-2 bg-white/95 backdrop-blur-sm rounded-3xl p-8 hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl group flex flex-col overflow-hidden">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-6 group-hover:rotate-12 transition-transform">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-3 text-purple-900">Earn Coins</h3>
              <p className="text-lg text-purple-700 mb-2">Learning Pays Off</p>
              <p className="text-gray-700 leading-relaxed">
                Complete quizzes and challenges to earn coins — your in-app currency for unlocking premium content.
              </p>

              <div className="mt-auto -mx-8 -mb-8 flex justify-center">
                <img
                  src={Images.Student2}
                  alt="Student 2"
                  className="w-full h-auto object-contain object-bottom transition-transform group-hover:scale-105 duration-500"
                />
              </div>
            </div>

            <div className="md:col-span-2 bg-gradient-to-br from-purple-900 to-violet-900 rounded-3xl p-8 hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-6 group-hover:rotate-12 transition-transform">
                  <Store className="w-8 h-8 text-purple-900" />
                </div>
                <h3 className="text-3xl font-black mb-3 text-yellow-300">Content Marketplace</h3>
                <p className="text-lg text-yellow-400 mb-2">Unlock Premium Content</p>
                <p className="text-purple-100 leading-relaxed max-w-2xl">
                  Spend your earned coins to access exclusive quiz packs and flashcard decks from top educators
                  worldwide.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <div className="px-4 py-2 bg-purple-800/50 border border-purple-600 rounded-full text-sm text-purple-200">
                    Premium Quizzes
                  </div>
                  <div className="px-4 py-2 bg-purple-800/50 border border-purple-600 rounded-full text-sm text-purple-200">
                    Expert Flashcards
                  </div>
                  <div className="px-4 py-2 bg-purple-800/50 border border-purple-600 rounded-full text-sm text-purple-200">
                    Study Guides
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-6 group-hover:rotate-12 transition-transform">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-3 text-purple-900">Leaderboards</h3>
              <p className="text-lg text-purple-700 mb-2">Compete & Rise</p>
              <p className="text-gray-700 leading-relaxed">
                See how you rank against peers. Real-time leaderboards keep the competition alive and motivating.
              </p>
            </div>

            <div className="md:col-span-2 bg-white/95 backdrop-blur-sm rounded-3xl p-8 hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl group">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg rotate-6 group-hover:rotate-12 transition-transform flex-shrink-0">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-black mb-3 text-purple-900">Stay Notified</h3>
                  <p className="text-lg text-purple-700 mb-2">Never Miss a Beat</p>
                  <p className="text-gray-700 leading-relaxed">
                    Get instant notifications about new content drops, quiz results, reward milestones, and important
                    platform updates.
                  </p>
                </div>
              </div>
            </div>
            <div className="md:col-span-1 bg-white/95 backdrop-blur-sm overflow-hidden rounded-3xl hover:scale-[1.02] transition-all shadow-xl hover:shadow-2xl group">
              <img src={Images.FeatureImage2} alt="Feature 2" className="w-full h-60 object-cover" />
            </div>
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}
