import { Images } from "../../assets/images";
import { cn } from "../ui/utils";

const logoTiles = [
  { id: 1, label: "UIT", imageUrl: Images.UITLogo },
  { id: 2, label: "VKU", imageUrl: Images.VKULogo },
  { id: 3, label: "BKU", imageUrl: Images.BKULogo },
  { id: 4, label: "HUST", imageUrl: Images.HUSTLogo },
  { id: 5, label: "FPT", imageUrl: Images.FPTLogo },
  { id: 6, label: "ISO Certified", imageUrl: Images.ISOCertified },
];

export function SocialProof() {
  return (
    <div className="space-y-8">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[#b8a9d9]">
        Trusted in classrooms across Vietnam
      </p>

      <div className="flex flex-wrap items-center gap-x-10 gap-y-6 md:gap-x-14">
        {logoTiles.map((tile) => (
          <div
            key={tile.id}
            className="h-7 md:h-8 flex items-center opacity-70 hover:opacity-100 transition-opacity duration-500 ease-soft grayscale hover:grayscale-0"
          >
            <img
              src={tile.imageUrl}
              alt={tile.label}
              className={cn(
                "h-full w-auto object-contain",
                "filter brightness-0 invert",
              )}
            />
          </div>
        ))}
      </div>

      <p className="text-base text-[#faf6ee]/65 max-w-2xl">
        <span className="text-[#faf6ee] font-display text-xl font-medium font-tabular mr-1">
          47.2%
        </span>
        of partner schools report measurable retention gains within a single
        semester.
      </p>
    </div>
  );
}