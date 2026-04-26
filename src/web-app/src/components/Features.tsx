import { GraduationCap, Users, Settings, Trophy, Target, BookOpen } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: GraduationCap,
      title: "For Students",
      description:
        "Learn through fun quizzes, earn badges, and compete with friends in a gamified learning experience.",
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-300",
      items: ["Interactive Quizzes", "Earn Rewards", "Track Progress"],
    },
    {
      icon: Users,
      title: "For Teachers",
      description:
        "Create engaging quizzes, monitor student progress, and make learning exciting with gamification tools.",
      color: "yellow",
      gradient: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-300",
      items: ["Quiz Builder", "Analytics Dashboard", "Student Management"],
    },
    {
      icon: Settings,
      title: "For Admins",
      description:
        "Manage users, oversee platform activity, and ensure smooth operation across all educational levels.",
      color: "green",
      gradient: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-300",
      items: ["User Management", "Reports & Insights", "System Control"],
    },
  ];

  const benefits = [
    {
      icon: Trophy,
      title: "Achievements",
      description: "Unlock badges and trophies",
      color: "text-yellow-600",
    },
    {
      icon: Target,
      title: "Goal Tracking",
      description: "Set and reach learning goals",
      color: "text-blue-600",
    },
    {
      icon: BookOpen,
      title: "Rich Content",
      description: "Access diverse subjects",
      color: "text-green-600",
    },
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Whether you're a student, teacher, or admin, Seika has powerful tools to make education fun and effective.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white border-2 border-purple-200 rounded-3xl p-8 hover:scale-105 transition-transform shadow-xl hover:shadow-2xl"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-6`}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black mb-3 text-purple-900">{feature.title}</h3>
                <p className="text-gray-700 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className={`w-2 h-2 bg-gradient-to-br ${feature.gradient} rounded-full`}></div>
                      <span className="text-sm text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-purple-900/80 border-2 border-purple-700 rounded-2xl p-6 flex items-start gap-4 hover:shadow-lg transition-shadow backdrop-blur-sm"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 to-amber-400 rounded-xl flex items-center justify-center shadow-sm">
                  <Icon className="w-6 h-6 text-purple-900" />
                </div>
                <div>
                  <h4 className="font-black mb-1 text-yellow-300">{benefit.title}</h4>
                  <p className="text-sm text-yellow-100">{benefit.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
