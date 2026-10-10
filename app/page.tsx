import Link from "next/link";

/** Public entry point, kept separate from the internal demo workspace. */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f7f8f5] px-6 text-center text-[#285b43]">
      <span className="rounded-xl bg-[#285b43] px-5 py-3 font-serif text-5xl text-[#efecd1]">
        胡
      </span>
      <p className="text-xs tracking-[0.3em]">MAHJONGHU</p>
      <h1 className="text-4xl font-semibold tracking-tight">
        Your next great game starts here.
      </h1>
      <p className="max-w-md text-sm leading-7 text-[#77856f]">
        Halaman publik terpisah dari workspace operasional. Eksplorasi proof of
        concept dashboard dengan data demo.
      </p>
      <Link
        href="/dashboard"
        className="rounded-lg bg-[#285b43] px-6 py-3 text-sm text-white hover:bg-[#204b37]"
      >
        Buka dashboard demo →
      </Link>
      <p className="text-xs text-[#8e9887]">
        Mode demo tanpa autentikasi. Bukan untuk data operasional nyata.
      </p>
    </main>
  );
}
