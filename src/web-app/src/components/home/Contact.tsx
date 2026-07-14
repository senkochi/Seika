import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import AnimatedContent from "../reactbit/AnimatedContent";
import { Button } from "../ui/Button";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Submit handler — backend integration pending.
    console.log("Form submitted:", formData);
  };

  return (
    <section
      id="contact"
      className="relative py-32 lg:py-40 bg-[#faf6ee] text-[#1c0f2e] overflow-hidden"
    >
      <div className="relative max-w-[1200px] mx-auto px-6 lg:px-10">
        {/* Section header */}
        <AnimatedContent>
          <div className="mb-16 max-w-2xl">
            <span className="eyebrow !text-[#1c0f2e]/70 !border-[#1c0f2e]/15 !bg-[#1c0f2e]/[0.04]">
              <span className="inline-block w-1 h-1 rounded-full bg-[#d4a843]" />
              Get in touch
            </span>
            <h2
              className="mt-6 font-display font-medium text-[#1c0f2e] text-4xl md:text-5xl lg:text-6xl leading-[1.02] tracking-[-0.025em]"
              style={{ textWrap: "balance" as const }}
            >
              Tell us what's{" "}
              <span className="italic font-display font-light text-[#a37f2a]">
                on your mind.
              </span>
            </h2>
            <p className="mt-5 text-lg text-[#1c0f2e]/65">
              A bug, a feature request, or just a hello — we read every message.
            </p>
          </div>
        </AnimatedContent>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-16 lg:gap-24 items-start">
          {/* Form column */}
          <AnimatedContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <FieldRow label="Your name">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Nguyễn Văn A"
                    required
                    className="w-full h-14 px-5 rounded-2xl bg-white border border-[#1c0f2e]/10 text-[#1c0f2e] placeholder:text-[#1c0f2e]/35 text-base font-medium focus:outline-none focus:border-[#d4a843] focus:ring-2 focus:ring-[#d4a843]/25 transition-all duration-300 ease-soft"
                  />
                </FieldRow>

                <FieldRow label="Email">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="you@example.com"
                    required
                    className="w-full h-14 px-5 rounded-2xl bg-white border border-[#1c0f2e]/10 text-[#1c0f2e] placeholder:text-[#1c0f2e]/35 text-base font-medium focus:outline-none focus:border-[#d4a843] focus:ring-2 focus:ring-[#d4a843]/25 transition-all duration-300 ease-soft"
                  />
                </FieldRow>
              </div>

              <FieldRow label="Message">
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="What's on your mind?"
                  rows={5}
                  required
                  className="w-full px-5 py-4 rounded-2xl bg-white border border-[#1c0f2e]/10 text-[#1c0f2e] placeholder:text-[#1c0f2e]/35 text-base font-medium focus:outline-none focus:border-[#d4a843] focus:ring-2 focus:ring-[#d4a843]/25 resize-none transition-all duration-300 ease-soft"
                />
              </FieldRow>

              <div className="pt-2">
                <Button variant="primary" size="lg" trailing type="submit">
                  Send message
                </Button>
              </div>
            </form>
          </AnimatedContent>

          {/* Contact info + pull-quote */}
          <AnimatedContent>
            <div className="space-y-10">
              <p
                className="font-display text-2xl lg:text-3xl text-[#1c0f2e]/80 leading-snug tracking-[-0.015em]"
                style={{ textWrap: "balance" as const }}
              >
                We typically reply within a day. Sometimes faster — sometimes
                with a fix you didn't know you needed.
              </p>

              <div className="hairline-warm" />

              <ul className="space-y-5">
                <ContactRow
                  icon={<Mail className="w-4 h-4" strokeWidth={1.5} />}
                  primary="hello@seika.edu"
                  secondary="support@seika.edu"
                />
                <ContactRow
                  icon={<Phone className="w-4 h-4" strokeWidth={1.5} />}
                  primary="+84 28 3520 1234"
                  secondary="Mon–Fri, 9am–6pm ICT"
                />
                <ContactRow
                  icon={<MapPin className="w-4 h-4" strokeWidth={1.5} />}
                  primary="227 Nguyễn Văn Cừ"
                  secondary="Long Biên, Hà Nội"
                />
              </ul>

              <a
                href="mailto:hello@seika.edu"
                className="group inline-flex items-center gap-2 text-sm font-medium text-[#1c0f2e] hover:text-[#a37f2a] transition-colors duration-300 ease-soft"
              >
                <span className="underline-offset-4 group-hover:underline">
                  Write us directly
                </span>
                <ArrowUpRight
                  className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 ease-spring"
                  strokeWidth={1.8}
                />
              </a>
            </div>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------
   Sub-components
   ---------------------------------------------------------- */

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] uppercase tracking-[0.18em] font-medium text-[#1c0f2e]/55">
        {label}
      </label>
      {children}
    </div>
  );
}

function ContactRow({
  icon,
  primary,
  secondary,
}: {
  icon: React.ReactNode;
  primary: string;
  secondary: string;
}) {
  return (
    <li className="flex items-start gap-4">
      <span className="w-10 h-10 shrink-0 rounded-xl bg-[#1c0f2e] text-[#d4a843] flex items-center justify-center">
        {icon}
      </span>
      <div className="space-y-0.5">
        <p className="font-medium text-[#1c0f2e]">{primary}</p>
        <p className="text-sm text-[#1c0f2e]/55">{secondary}</p>
      </div>
    </li>
  );
}