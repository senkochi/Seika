import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";

const NotFound = () => {
  const { t } = useTranslation("common");
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden px-6 py-16">
      <div className="absolute inset-0 bg-glow-aubergine pointer-events-none" />

      <div className="relative w-full max-w-2xl">
        {/* Double-bezel card */}
        <div className="p-1 rounded-[2rem] bg-gradient-to-b from-[#d4a843]/30 to-[#d4a843]/[0.04] border border-[#d4a843]/[0.18]">
          <div className="rounded-[calc(2rem-0.375rem)] bg-[#15091e]/85 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_32px_80px_-24px_rgba(0,0,0,0.6)] p-10 sm:p-14 lg:p-16 text-center">
            {/* Gold accent bar */}
            <div className="mx-auto w-20 h-1 rounded-full bg-gradient-to-r from-[#e6c264] to-[#c89a36] mb-12" />

            <span className="eyebrow">
              <span className="inline-block w-1 h-1 rounded-full bg-[#d4a843]" />
              {t("notFound.eyebrow")}
            </span>

            <h1
              className="mt-6 font-display font-medium text-[#faf6ee] text-[10rem] sm:text-[12rem] leading-[0.85] tracking-[-0.04em]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              404
            </h1>

            <h2 className="mt-2 font-display text-2xl sm:text-3xl text-[#faf6ee] tracking-[-0.02em]">
              {t("notFound.title")}
            </h2>

            <p className="mt-4 text-[#faf6ee]/65 max-w-md mx-auto leading-relaxed">
              {t("notFound.description", { path: location.pathname })}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/">
                <Button variant="primary" size="lg" trailing>
                  {t("notFound.backHome")}
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="ghost" size="lg">
                  {t("notFound.contactSupport")}
                </Button>
              </Link>
            </div>

            <div className="hairline mt-12" />

            <p className="mt-8 text-xs text-[#faf6ee]/40">
              {t("notFound.lostPrefix")}{" "}
              <Link
                to="/"
                className="text-[#d4a843] hover:text-[#f1e4c0] underline-offset-4 hover:underline transition-colors"
              >
                {t("notFound.lostHome")}
              </Link>{" "}
              {t("notFound.lostOr")}{" "}
              <Link
                to="/auth/login"
                className="text-[#d4a843] hover:text-[#f1e4c0] underline-offset-4 hover:underline transition-colors"
              >
                {t("notFound.lostSignIn")}
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
