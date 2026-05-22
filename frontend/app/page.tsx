import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center flex-1 px-4 py-24 text-center">
      <div className="mb-4 rounded-full border border-violet-800 bg-violet-950 px-3 py-1 text-xs font-medium text-violet-400 tracking-widest uppercase">
        Powered by Vara Network
      </div>

      <h1 className="mb-4 max-w-2xl text-5xl font-bold leading-tight tracking-tight text-neutral-100">
        AI x Crypto Intelligence,
        <br />
        <span className="text-violet-400">gated on-chain</span>
      </h1>

      <p className="mb-8 max-w-xl text-lg text-neutral-400">
        Daily AI-generated digests and deep-dives on the intersection of artificial intelligence
        and crypto. Buy a VARA access pass once. Yours on-chain forever.
      </p>

      <div className="flex gap-4">
        <Link
          href="/browse"
          className="rounded-lg bg-violet-600 px-6 py-3 font-semibold text-white hover:bg-violet-500"
        >
          Browse Content
        </Link>
        <Link
          href="/creator"
          className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold text-neutral-300 hover:border-neutral-500 hover:text-white"
        >
          Publish Content
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-3 gap-8 text-center">
        {[
          { label: 'AI-generated', desc: 'Daily digests by the AI x Crypto analyst agent' },
          { label: 'IPFS-stored', desc: 'Content encrypted and pinned to IPFS permanently' },
          { label: 'VARA-gated', desc: 'One-time on-chain access pass per article' },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="mb-2 font-semibold text-violet-400">{item.label}</p>
            <p className="text-sm text-neutral-500">{item.desc}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
