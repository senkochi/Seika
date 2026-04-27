import { Logo as LogoAssets } from "../../assets/logo";

interface LogoProps {
  textClassName?: string;
  imageClassName?: string;
  className?: string;
  showText?: boolean;
}

export function Logo({
  textClassName = "text-2xl font-black text-white",
  imageClassName = "w-10 h-10",
  className = "flex items-center gap-2",
  showText = true,
}: LogoProps) {
  return (
    <div className={className}>
      <img src={LogoAssets.PNGLogo} alt="Seika logo" className={imageClassName} />
      {showText && <span className={textClassName}>Seika</span>}
    </div>
  );
}
