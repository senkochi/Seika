import React from "react";

export function SpeechBubble({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <div
      className={`absolute top-8 -left-32 bg-white p-6 shadow-md transform rotate-6 ${className}`}
      style={{
        borderRadius: "20% 20% 20% 20% / 25% 25% 25% 25%",
      }}
    >
      <div className="text-purple-900 font-black text-lg whitespace-nowrap">{children}</div>
      <div className="absolute bottom-0.8 left-12 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[20px] border-t-white transform translate-y-full -rotate-225"></div>
    </div>
  );
}

export default SpeechBubble;
