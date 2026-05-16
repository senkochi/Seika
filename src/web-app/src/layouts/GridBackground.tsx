function GridBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Lớp nền chính (Linear Gradient của bạn) */}
      <div className="absolute inset-0 bg-[var(--background)]" />

      {/* Lớp Grid mờ từ mẫu */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] -z-10" />

      {/* Lớp ánh sáng Radial mờ từ mẫu (đã được tinh chỉnh để hợp với tone tím/tối) */}
      <div className="absolute left-1/2 top-[-10%] h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_400px_at_50%_300px,rgba(255,255,255,0.05),transparent)] -z-10" />
    </div>
  );
}

export default GridBackground;
