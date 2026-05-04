import { useState } from "react";
import { Mail, Phone, MapPin, Send, Rocket } from "lucide-react";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <section
      id="contact"
      className="relative py-32 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-500 overflow-hidden"
    >
      {/* Wave/Paper Rip Transition from purple */}
      <div
        className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950"
        style={{
          clipPath:
            "polygon(0 0, 100% 0, 100% 60%, 90% 70%, 80% 60%, 70% 80%, 60% 70%, 50% 90%, 40% 70%, 30% 80%, 20% 60%, 10% 70%, 0 60%)",
        }}
      ></div>

      {/* Organic blob shapes */}
      <div className="absolute top-40 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/20 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-2xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        {/* Chunky Header with Shadow */}
        <div className="mb-20">
          <h2 className="text-6xl md:text-8xl font-black text-purple-900 mb-6 drop-shadow-[4px_4px_0px_rgba(109,40,217,0.3)]">
            Let's Talk!
          </h2>
          <p className="text-2xl md:text-3xl text-purple-800 drop-shadow-lg max-w-2xl">
            Got questions? Ideas? Just want to say hi? We're all ears! 👂
          </p>
        </div>

        {/* Integrated Split Layout - NO BOXES */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Side - Floating Form Fields */}
          <div className="relative z-20">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Floating input - glassmorphism style */}
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  placeholder="Your Name"
                  className="w-full px-0 py-4 bg-transparent border-0 border-b-4 border-purple-800/40 focus:border-purple-900 focus:outline-none transition-colors text-xl text-purple-900 placeholder:text-purple-700/50 font-bold"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  placeholder="your.email@example.com"
                  className="w-full px-0 py-4 bg-transparent border-0 border-b-4 border-purple-800/40 focus:border-purple-900 focus:outline-none transition-colors text-xl text-purple-900 placeholder:text-purple-700/50 font-bold"
                  required
                />
              </div>

              <div className="relative">
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      message: e.target.value,
                    })
                  }
                  placeholder="What's on your mind?"
                  rows={5}
                  className="w-full px-0 py-4 bg-transparent border-0 border-b-4 border-purple-800/40 focus:border-purple-900 focus:outline-none transition-colors resize-none text-xl text-purple-900 placeholder:text-purple-700/50 font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="group px-10 py-5 bg-purple-900 text-amber-400 font-black text-xl hover:bg-purple-800 transition-all flex items-center gap-3 shadow-[6px_6px_0px_rgba(109,40,217,0.3)] hover:shadow-[8px_8px_0px_rgba(109,40,217,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                style={{
                  borderRadius: "12% 12% 12% 12% / 12% 12% 12% 12%",
                }}
              >
                <Send className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                Send Message
              </button>
            </form>

            {/* Contact info - overlapping, no boxes */}
            <div className="mt-16 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-900 flex items-center justify-center transform -rotate-6 shadow-lg">
                  <Mail className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <p className="text-purple-900 font-black text-lg">hello@seika.edu</p>
                  <p className="text-purple-800">support@seika.edu</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-900 flex items-center justify-center transform rotate-6 shadow-lg">
                  <Phone className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <p className="text-purple-900 font-black text-lg">+1 (555) 123-4567</p>
                  <p className="text-purple-800">Mon-Fri, 9am-6pm EST</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-900 flex items-center justify-center transform -rotate-3 shadow-lg">
                  <MapPin className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <p className="text-purple-900 font-black text-lg">123 Education Street</p>
                  <p className="text-purple-800">Learning City, LC 12345</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Large Playful 3D Mascot */}
          <div className="relative lg:block hidden">
            {/* Rocket pointing to form */}
            <div className="relative transform -rotate-12 hover:rotate-[-8deg] transition-transform duration-500">
              {/* Rocket body */}
              <div className="relative w-64 h-96 mx-auto">
                {/* Main rocket */}
                <div
                  className="absolute inset-0 bg-gradient-to-b from-purple-600 to-purple-800 shadow-2xl"
                  style={{
                    borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                    clipPath: "polygon(50% 0%, 100% 40%, 90% 100%, 10% 100%, 0% 40%)",
                  }}
                ></div>

                {/* Window */}
                <div className="absolute top-16 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-br from-cyan-300 to-blue-400 rounded-full border-8 border-purple-900 shadow-inner flex items-center justify-center">
                  <div className="text-4xl animate-bounce">👋</div>
                </div>

                {/* Rocket details */}
                <div
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 w-16 h-20 bg-amber-400 shadow-lg"
                  style={{
                    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                  }}
                ></div>

                {/* Fins */}
                <div
                  className="absolute bottom-4 -left-8 w-20 h-32 bg-purple-700 shadow-xl"
                  style={{
                    clipPath: "polygon(100% 0%, 100% 100%, 0% 100%)",
                  }}
                ></div>
                <div
                  className="absolute bottom-4 -right-8 w-20 h-32 bg-purple-700 shadow-xl"
                  style={{
                    clipPath: "polygon(0% 0%, 100% 100%, 0% 100%)",
                  }}
                ></div>

                {/* Flame */}
                <div
                  className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-20 h-24 bg-gradient-to-b from-amber-400 via-orange-500 to-red-600 animate-pulse"
                  style={{
                    borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
                    clipPath: "polygon(50% 100%, 0% 0%, 100% 0%)",
                  }}
                ></div>
              </div>

              {/* Stars around rocket */}
              <div className="absolute -top-8 -right-8 text-4xl animate-spin" style={{ animationDuration: "4s" }}>
                ⭐
              </div>
              <div className="absolute top-20 -left-12 text-3xl animate-pulse">✨</div>
              <div className="absolute bottom-32 -right-16 text-2xl animate-bounce" style={{ animationDuration: "2s" }}>
                💫
              </div>
            </div>

            {/* Arrow pointing to form */}
            <div className="absolute -left-24 top-1/2 transform -rotate-12">
              <div className="text-6xl animate-bounce">👈</div>
            </div>

            {/* Speech bubble */}
            <div
              className="absolute top-8 -left-32 bg-white p-6 shadow-2xl transform -rotate-6"
              style={{
                borderRadius: "20% 20% 20% 20% / 25% 25% 25% 25%",
              }}
            >
              <p className="text-purple-900 font-black text-lg whitespace-nowrap">Fill out the form!</p>
              <div className="absolute bottom-0 left-12 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-white transform translate-y-full -rotate-12"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
