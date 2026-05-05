interface Member {
  name: string;
  image: string;
}

function MemberCard({ member }: { member: Member }) {
  return (
    <div className="relative group w-64 h-64 flex items-center justify-center cursor-pointer">
      {/* Rouded square — rotates more on hover */}
      <div
        className="absolute inset-0 bg-amber-400 rounded-3xl rotate-6
                          group-hover:rotate-12 group-hover:scale-105 
                          transition-all duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]
                          shadow-[4px_6px_0_#d97706] group-hover:shadow-[8px_12px_0_#b45309]"
      />

      {/* Sparkle particles */}
      {[
        "top-0 left-0 group-hover:-translate-x-2 group-hover:-translate-y-3",
        "top-10 -right-4 group-hover:translate-x-2 group-hover:-translate-y-3",
        "bottom-6 -left-5 group-hover:-translate-x-3 group-hover:translate-y-2",
      ].map((pos, i) => (
        <span
          key={i}
          className={`absolute z-20 text-white text-base opacity-0 
                          group-hover:opacity-100 transition-all duration-300 
                          pointer-events-none ${pos}`}
        >
          ✦
        </span>
      ))}

      {/* Avatar — pops above the square, but stays clipped on sides/bottom */}
      <div
        className="absolute inset-0 z-20 rounded-3xl rotate-6 
        group-hover:rotate-12 duration-300 transition-all ease-[cubic-bezier(.34,1.56,.64,1)]"
        style={{ clipPath: "inset(-35% 0 0 0 round 24px)" }}
      >
        <img
          src={member.image}
          alt={member.name}
          className="absolute left-1/2 top-1/2 w-[360px] h-[360px] scale-110 -translate-x-1/2 -translate-y-[42%]
                    rounded-full object-cover group-hover:scale-130
                    transition-all duration-400 ease-[cubic-bezier(.34,1.56,.64,1)]
                    drop-shadow-[0_-4px_8px_rgba(0,0,0,0.25)]"
        />
      </div>
    </div>
  );
}

export default MemberCard;
