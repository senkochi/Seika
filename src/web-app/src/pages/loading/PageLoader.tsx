function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-950 via-purple-900 to-indigo-950">
      <div
        className="h-32 w-32 rounded-full border-10 border-amber-400 border-t-transparent animate-spin"
        aria-label="Loading page"
        role="status"
      />
    </div>
  );
}

export default PageLoader;
