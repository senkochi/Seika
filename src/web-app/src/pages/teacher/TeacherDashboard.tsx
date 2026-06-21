/**
 * Teacher Dashboard - placeholder component.
 * Sẽ được phát triển đầy đủ trong các sprint tiếp theo.
 */
function TeacherDashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950">
      <div className="text-center space-y-4">
        <div className="text-6xl">🎓</div>
        <h1 className="text-4xl font-black text-yellow-400">
          Teacher Dashboard
        </h1>
        <p className="text-purple-200 text-lg">
          Coming soon – this section is under construction.
        </p>
        <div className="mt-6 px-6 py-3 bg-purple-800/50 rounded-2xl border border-purple-600 inline-block">
          <p className="text-purple-300 text-sm">
            Role: <span className="font-bold text-yellow-300">TEACHER</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;
