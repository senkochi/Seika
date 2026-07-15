function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-6 font-sans-ui">
        <div className="relative h-14 w-14" role="status" aria-label="Loading page">
          {/* outer hairline ring */}
          <div className="absolute inset-0 rounded-full border border-white/[0.08]" />
          {/* gold spinner */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#d4a843] border-r-[#d4a843] animate-spin" />
        </div>
        <p className="text-sm tracking-[0.16em] uppercase text-white/45">
          Loading
        </p>
      </div>
    </div>
  );
}

export default PageLoader;