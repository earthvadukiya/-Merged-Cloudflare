export default function Loader({ fadeOut = false }) {
  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#030305] flex items-center justify-center overflow-hidden transition-opacity duration-700 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <style>
        {`
          @keyframes driftOne {
            0% { transform: translate(-20px, -10px) scale(1); opacity: .45; }
            50% { transform: translate(35px, 20px) scale(1.12); opacity: .75; }
            100% { transform: translate(-20px, -10px) scale(1); opacity: .45; }
          }

          @keyframes driftTwo {
            0% { transform: translate(25px, 15px) scale(1.1); opacity: .28; }
            50% { transform: translate(-30px, -25px) scale(.95); opacity: .55; }
            100% { transform: translate(25px, 15px) scale(1.1); opacity: .28; }
          }

          @keyframes logoReveal {
            0% { opacity: 0; transform: translateY(12px) scale(.96); filter: blur(8px); }
            100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
          }

          @keyframes taglineReveal {
            0% { opacity: 0; transform: translateY(8px); letter-spacing: 16px; }
            100% { opacity: 1; transform: translateY(0); letter-spacing: 9px; }
          }

          @keyframes glowingLine {
            0% { transform: translateX(-120%); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateX(220%); opacity: 0; }
          }
        `}
      </style>

      <div className="absolute inset-0 opacity-[0.035]">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div
        className="absolute w-[520px] h-[520px] rounded-full bg-purple-700/20 blur-[150px]"
        style={{ animation: "driftOne 5.5s ease-in-out infinite" }}
      />
      <div
        className="absolute w-[420px] h-[420px] rounded-full bg-fuchsia-500/10 blur-[130px]"
        style={{ animation: "driftTwo 6.8s ease-in-out infinite" }}
      />

      <div className="relative flex flex-col items-center -translate-y-4">
        <h1
          className="text-[96px] md:text-[128px] font-black text-white leading-none tracking-[-6px]"
          style={{
            animation: "logoReveal 900ms ease-out both",
            textShadow:
              "0 0 18px rgba(168,85,247,0.35), 0 0 70px rgba(126,34,206,0.18)",
          }}
        >
          OF
        </h1>

        <div
          className="mt-5 text-[9px] md:text-[11px] uppercase text-zinc-500 font-medium whitespace-nowrap"
          style={{ animation: "taglineReveal 1s ease-out 250ms both" }}
        >
          THE UNFORGETTABLE EXPERIENCE
        </div>

        <div className="relative mt-9 w-[230px] h-[1px] bg-white/10 overflow-hidden">
          <div
            className="absolute top-0 h-full w-[70px] bg-gradient-to-r from-transparent via-fuchsia-400 to-transparent"
            style={{
              animation: "glowingLine 1.45s ease-in-out infinite",
              boxShadow: "0 0 18px rgba(217,70,239,0.95)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
