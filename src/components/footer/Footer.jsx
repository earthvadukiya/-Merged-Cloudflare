import logoTitle from "@/src/config/logoTitle.js";
import website_name from "@/src/config/website.js";
import { Link } from "react-router-dom";
import { FaDiscord, FaTelegram } from "react-icons/fa";
import { useEffect, useRef } from "react";

function PremiumBannerAd() {
  const adRef = useRef(null);

  useEffect(() => {
    if (!adRef.current) return;

    adRef.current.innerHTML = "";

    const options = {
      key: "fa18fe18755cc0b110e4155f955a4c3e",
      format: "iframe",
      height: 50,
      width: 320,
      params: {},
    };

    window.atOptions = options;

    const script = document.createElement("script");
    script.src =
      "https://www.highperformanceformat.com/fa18fe18755cc0b110e4155f955a4c3e/invoke.js";
    script.async = true;
    script.referrerPolicy = "no-referrer-when-downgrade";

    adRef.current.appendChild(script);

    return () => {
      if (adRef.current) {
        adRef.current.innerHTML = "";
      }

      try {
        delete window.atOptions;
      } catch (error) {
        window.atOptions = undefined;
      }
    };
  }, []);

  return (
    <div className="w-fit">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#111111] via-[#161616] to-[#0b0b0b] shadow-[0_0_25px_rgba(255,255,255,0.04)] backdrop-blur-xl p-4">
        <div className="absolute inset-0 bg-white/[0.02] pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
            <span className="text-[11px] uppercase tracking-[0.25em] text-zinc-400 font-semibold">
              Support OFFANIME
            </span>
          </div>

          <span className="text-[10px] text-zinc-500">
            Advertisement
          </span>
        </div>

        <div
          ref={adRef}
          className="w-[320px] h-[50px] overflow-hidden rounded-xl border border-white/5 bg-black/40 flex items-center justify-center"
        />
      </div>
    </div>
  );
}
function Footer() {
  return (
    <footer className="w-full mt-auto">
      {/* Logo Section */}
      <div className="max-w-[1920px] mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <img
              src="/footer.png"
              alt={logoTitle}
              className="h-[100px] w-[150px] object-contain"
            />

            <div className="flex items-center gap-4 border-l border-white/10 pl-6 h-10">
              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[#5865F2] transition-all duration-300 hover:scale-110"
              >
                <FaDiscord size={28} />
              </a>

              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-[#26A5E4] transition-all duration-300 hover:scale-110"
              >
                <FaTelegram size={28} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="bg-[#0a0a0a] border-t border-white/5 mt-6">
        <div className="max-w-[1920px] mx-auto px-4 py-6">

          {/* TOP SECTION */}
          <div className="flex flex-col xl:flex-row justify-between gap-8">

            {/* LEFT SIDE */}
            <div className="flex-1">

              {/* A-Z List */}
              <div className="mb-6 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 items-center sm:items-start">
                  <h2 className="text-sm font-medium text-white">
                    A-Z LIST
                  </h2>

                  <span className="text-sm text-white/60">
                    Browse anime alphabetically
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                  {[
                    "All",
                    "#",
                    "0-9",
                    ...Array.from(
                      { length: 26 },
                      (_, i) => String.fromCharCode(65 + i)
                    ),
                  ].map((item, index) => (
                    <Link
                      to={`az-list/${item === "All" ? "" : item}`}
                      key={index}
                      className="px-2.5 py-1 text-sm bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded transition-colors duration-300"
                    >
                      {item}
                    </Link>
                  ))}
                </div>

                {/* Footer Links */}
                <div className="flex gap-4 flex-wrap justify-center sm:justify-start mt-6">
                  <Link
                    to="/terms-of-service"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300"
                  >
                    Terms of Service
                  </Link>

                  <Link
                    to="/dmca"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300"
                  >
                    DMCA
                  </Link>

                  <Link
                    to="/contact"
                    className="text-sm text-white/60 hover:text-white transition-colors duration-300"
                  >
                    Contact
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE AD */}
            <div className="flex justify-center xl:justify-end xl:min-w-[360px]">
              <PremiumBannerAd />
            </div>
          </div>

          {/* Legal + Credit */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 text-sm text-white/40 border-t border-white/5 pt-5">

            {/* Left Side */}
            <div className="space-y-2 text-center lg:text-left">
              <p className="max-w-4xl">
                {website_name} does not host any files, it merely pulls
                streams from 3rd party services. Legal issues should be
                taken up with the file hosts and providers.{" "}
                {website_name} is not responsible for any media files shown
                by the video providers.
              </p>

              <p>
                © 2026{" "}
                <a
                  href="https://offanime.site"
                  className="hover:text-white/70 underline transition-colors duration-300"
                >
                  {website_name}
                </a>
                . All rights reserved.
              </p>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 text-white/50 tracking-wide">
              <span className="hover:text-white/80 transition-colors duration-300">
                Made for Educational Purpose by Earth
              </span>

              <span className="text-purple-400 animate-pulse text-lg drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">
                ★
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
