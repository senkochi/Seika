function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 1. Lớp background dot */}
      <div className="absolute inset-0 bg-[radial-gradient(#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* 2. Glow màu Tím (Bên trái) - Sử dụng mix-blend-mode để hòa trộn màu cực đỉnh */}
      <div
        className="absolute left-[-10%] top-[-10%] h-[800px] w-[800px] rounded-full 
      bg-[radial-gradient(circle,rgba(166,0,255,0.15)_0%,transparent_50%)] blur-[120px]"
      ></div>

      {/* 3. Glow màu Hồng (Bên phải) */}
      <div
        className="absolute right-[-20%] top-[-10%] h-[600px] w-[600px] rounded-full 
      bg-[radial-gradient(circle,rgba(166,0,255,0.15)_0%,transparent_50%)] blur-[80px]"
      ></div>
    </div>
  );
}

export default GridBackground;
