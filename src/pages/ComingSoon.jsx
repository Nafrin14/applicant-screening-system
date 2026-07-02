import { useNavigate } from "react-router-dom";

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#021b16] px-6">
      <div className="w-full max-w-xl rounded-3xl bg-emerald-950/70 border border-emerald-400/30 backdrop-blur-xl p-8 text-center shadow-2xl">

        <div className="text-7xl mb-5">🚧</div>

        <h1 className="text-4xl font-black text-white">
          Coming Soon
        </h1>

        <p className="mt-5 text-white/70 text-lg leading-8">
          This feature is currently under development.
          <br />
          It will be available in a future update.
        </p>

        <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-5">
          <h2 className="text-2xl font-bold text-emerald-300">
            Thank You! 💚
          </h2>

          <p className="mt-3 text-white/60">
            Thank you for your patience and support.
            We appreciate your understanding while we complete this feature.
          </p>
        </div>

        <button
          onClick={() => navigate("/login")}
          className="mt-8 w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
        >
          ← Back to Login
        </button>

      </div>
    </div>
  );
}