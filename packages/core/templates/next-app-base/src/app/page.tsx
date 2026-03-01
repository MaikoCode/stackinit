import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(180deg,#09090b_0%,#111827_100%)] px-6 py-16 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">
        <div className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-slate-300">
          Generated with stackinit
        </div>
        <section className="grid gap-8 md:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              __PROJECT_TITLE__
            </p>
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Ship the app, not the setup.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              This starter includes Next.js, Tailwind CSS, and shadcn-style primitives so
              you can move straight into product work.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>Open the app</Button>
              <Button variant="ghost">Edit src/app/page.tsx</Button>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur">
            <p className="text-sm text-slate-400">Next steps</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>Update your environment variables.</li>
              <li>Wire in your domain logic.</li>
              <li>Run pnpm dev and start shipping.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
