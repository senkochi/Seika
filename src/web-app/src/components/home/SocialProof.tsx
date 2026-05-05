import { Images } from "../../assets/images";

const logoTiles = [
  { id: 1, label: "UIT Logo", imageUrl: Images.UITLogo },
  { id: 2, label: "VKU Logo", imageUrl: Images.VKULogo },
  { id: 3, label: "BKU Logo", imageUrl: Images.BKULogo },
  { id: 4, label: "HUST Logo", imageUrl: Images.HUSTLogo },
  { id: 5, label: "FPT Logo", imageUrl: Images.FPTLogo },
  { id: 6, label: "ISO Certified", imageUrl: Images.ISOCertified },
];

export function SocialProof() {
  return (
    <div className="mb-16">
      <div className="flex flex-wrap items-center justify-center gap-5 md:gap-6">
        {logoTiles.map((tile, index) => (
          <div
            key={tile.id}
            className="h-24 w-36 md:h-28 md:w-40 hover:scale-[1.05] duration-[0.2s] transition-transform rounded-2xl bg-white/70 border border-amber-200/60 shadow-sm backdrop-blur-sm flex items-center justify-center"
            style={{
              transform: index % 2 === 0 ? "rotate(-2deg) translateY(-6px)" : "rotate(2deg) translateY(6px)",
            }}
          >
            <div className="z-10 flex flex-col items-center p-4">
              <img src={tile.imageUrl} alt={tile.label} className="h-16 w-auto object-contain filter transition-all" />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-lg md:text-xl text-purple-900">
        Trusted by educators at <span className="font-black text-purple-700">90%</span> of VN schools and in{" "}
        <span className="font-black text-purple-700">150+</span> countries.
      </p>
    </div>
  );
}
