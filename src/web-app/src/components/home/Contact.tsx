import { useState } from "react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import AnimatedContent from "../reactbit/AnimatedContent";
import SpeechBubble from "./SpeechBubble";
import BusinessPeople from "../3d-objects/BusinessPeople";

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
      {/* Shape Divider */}
      <div className="absolute top-0 left-0 right-0 h-32 overflow-hidden line-height-0">
        <svg
          viewBox="0 0 1440 320"
          className="w-full h-full preserve-3d"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="grad1" x1="100%" y1="100%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor:  '#2f0d68', stopOpacity: 1 }} /> {/* indigo-950 */}
              <stop offset="50%" style={{ stopColor: '#44127a', stopOpacity: 1 }} /> {/* purple-900 */}
              <stop offset="100%" style={{ stopColor: '#59168b', stopOpacity: 1 }} /> {/* violet-950 */}
            </linearGradient>
          </defs>
          <path
            fill="url(#grad1)"
            d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,192C1248,203,1344,181,1392,170.7L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          ></path>
        </svg>
      </div>


      {/* Organic blob shapes */}
      <div className="absolute top-40 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-600/20 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-2xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        {/* Chunky Header with Shadow */}
        <AnimatedContent>
          <div className="mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-purple-900 mb-2">
              Let's Talk!
            </h2>
            <p className="text-lg md:text-xl text-purple-800 max-w-2xl">
              Got questions? Ideas? Just want to say hi? We're all ears!
            </p>
          </div>
        </AnimatedContent>

        {/* Integrated Split Layout - NO BOXES */}
        <div className="grid lg:grid-cols-10 gap-20 items-center">
          {/* Left Side - Floating Form Fields */}
          <div className="relative z-20 lg:col-span-4 items-center">
            <AnimatedContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full px-0 py-2 bg-transparent border-0 border-b-2 border-purple-800/40 focus:border-purple-900 focus:outline-none transition-colors text-lg text-purple-900 placeholder:text-purple-700/50 font-semibold"
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
                    className="w-full px-0 py-2 bg-transparent border-0 border-b-2 border-purple-800/40 focus:border-purple-900 focus:outline-none transition-colors text-lg text-purple-900 placeholder:text-purple-700/50 font-semibold"
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
                    className="w-full px-0 py-2 bg-transparent border-0 border-b-2 border-purple-800/40 focus:border-purple-900 focus:outline-none transition-colors resize-none text-lg text-purple-900 placeholder:text-purple-700/50 font-semibold"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="my-16 group px-8 py-4 bg-purple-900 text-amber-400 hover:bg-purple-800 transition-all shadow-xl hover:scale-102 transition-all flex items-center gap-2 font-black rounded-full"
                >
                  <Send className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                  Send Message
                </button>
              </form>
            </AnimatedContent>
            <AnimatedContent>
            {/* Contact info - overlapping, no boxes */}
              <div className="mt-16 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-900 rounded-xl flex items-center justify-center transform -rotate-6 shadow-lg">
                    <Mail className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-purple-900 font-black text-md">hello@seika.edu</p>
                    <p className="text-purple-800 text-sm">support@seika.edu</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-900 rounded-xl flex items-center justify-center transform rotate-6 shadow-lg">
                    <Phone className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-purple-900 font-black text-md">+1 (555) 123-4567</p>
                    <p className="text-purple-800 text-sm">Mon-Fri, 9am-6pm EST</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-900 rounded-xl flex items-center justify-center transform -rotate-3 shadow-lg">
                    <MapPin className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-purple-900 font-black text-md">123 Education Street</p>
                    <p className="text-purple-800 text-sm">Learning City, LC 12345</p>
                  </div>
                </div>
              </div>
            </AnimatedContent>
          </div>


          {/* Right Side - Large Playful 3D Mascot */}
          <div className="relative lg:block hidden lg:col-span-6">
            <AnimatedContent>
              <SpeechBubble className="top-[-50px] left-[-70px]">Fill out the form!</SpeechBubble>
              <BusinessPeople size={800} />
            </AnimatedContent>
          </div>
        </div>
      </div>
    </section>
  );
}
