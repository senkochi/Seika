import { Logo } from "../logo/Logo";
import AnimatedContent from "../reactbit/AnimatedContent";

export function Footer() {
  return (
    <footer className="relative bg-[#0e0617] border-t border-white/[0.06] text-[#faf6ee]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-20">
        <AnimatedContent>
          <div className="grid md:grid-cols-[1.5fr_1fr_1fr] gap-12 lg:gap-16 mb-16">
            {/* Brand column */}
            <div>
              <Logo
                imageClassName="w-9 h-9"
                textClassName="text-lg font-display font-medium tracking-tight text-[#faf6ee]"
              />
              <p className="mt-5 text-sm text-[#faf6ee]/55 leading-relaxed max-w-sm">
                Quizzes, flashcards, and a coin economy for learners who want
                education to feel less like a chore.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <SocialIcon label="Facebook">
                  <path d="M22 12.07C22 6.51 17.52 2 12 2S2 6.51 2 12.07c0 5 3.66 9.15 8.44 9.93v-7.02H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.78 8.44-4.93 8.44-9.93z" />
                </SocialIcon>
                <SocialIcon label="Twitter">
                  <path d="M22 5.92a8.42 8.42 0 0 1-2.36.64 4.13 4.13 0 0 0 1.81-2.27 8.27 8.27 0 0 1-2.61.99 4.12 4.12 0 0 0-7.02 3.75A11.69 11.69 0 0 1 3.4 4.85a4.11 4.11 0 0 0 1.27 5.49 4.1 4.1 0 0 1-1.86-.51v.05a4.11 4.11 0 0 0 3.3 4.03 4.13 4.13 0 0 1-1.86.07 4.11 4.11 0 0 0 3.84 2.85A8.27 8.27 0 0 1 2 18.4a11.66 11.66 0 0 0 6.31 1.85c7.57 0 11.71-6.27 11.71-11.71 0-.18 0-.36-.01-.53A8.36 8.36 0 0 0 22 5.92z" />
                </SocialIcon>
                <SocialIcon label="Instagram">
                  <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.81.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.81-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.81-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.81.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.31 4.14.61c-.79.31-1.46.72-2.13 1.38C1.34 2.67.93 3.34.62 4.13.32 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.25 2.15.55 2.92.31.79.72 1.46 1.38 2.13.67.67 1.34 1.07 2.13 1.38.76.3 1.65.49 2.92.55C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.25 2.92-.55.79-.31 1.46-.72 2.13-1.38.67-.67 1.07-1.34 1.38-2.13.3-.76.49-1.65.55-2.92.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.25-2.15-.55-2.92-.31-.79-.72-1.46-1.38-2.13C21.33 1.34 20.66.93 19.87.62 19.1.32 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
                </SocialIcon>
              </div>
            </div>

            {/* Contact column */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#d4a843]/60 mb-5">
                Contact
              </p>
              <ul className="space-y-3 text-sm text-[#faf6ee]/65">
                <li>hello@seika.edu</li>
                <li>+84 28 3520 1234</li>
                <li>227 Nguyễn Văn Cừ, Hà Nội</li>
              </ul>
            </div>

            {/* Legal column */}
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#d4a843]/60 mb-5">
                Legal
              </p>
              <ul className="space-y-3 text-sm text-[#faf6ee]/65">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#faf6ee] transition-colors duration-300 ease-soft"
                  >
                    Privacy policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#faf6ee] transition-colors duration-300 ease-soft"
                  >
                    Terms of service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#faf6ee] transition-colors duration-300 ease-soft"
                  >
                    Cookie policy
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="hairline" />

          <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <p className="text-xs text-[#faf6ee]/45">
              © 2026 Seika. Crafted with care in Hà Nội.
            </p>
            <p className="text-xs text-[#faf6ee]/45 font-tabular">
              v1.0 · build a8f8b20
            </p>
          </div>
        </AnimatedContent>
      </div>
    </footer>
  );
}

function SocialIcon({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] text-[#faf6ee]/75 hover:text-[#d4a843] hover:bg-white/[0.08] flex items-center justify-center transition-all duration-300 ease-soft"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </button>
  );
}