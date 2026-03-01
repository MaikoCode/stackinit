import { WorkspaceBadge } from "@__PROJECT_SCOPE__/ui";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_35%),linear-gradient(180deg,#020617_0%,#111827_100%)] px-6 py-16 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <WorkspaceBadge />
        <section className="grid gap-8 md:grid-cols-[1.25fr_0.95fr]">
          <div className="space-y-6">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
              Monorepo foundations without the setup drag.
            </h1>
            <p className="max-w-2xl text-lg text-slate-300">
              Your web app and shared UI package are already wired together. Start
              building features, not plumbing.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>Open apps/web/src/app/page.tsx</Button>
              <Button variant="ghost">Edit packages/ui/src/index.tsx</Button>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-black/20 p-6 shadow-2xl shadow-emerald-950/20 backdrop-blur">
            <p className="text-sm text-slate-400">Workspace shape</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>apps/web contains the Next.js app.</li>
              <li>packages/ui contains shared presentational code.</li>
              <li>Turbo orchestrates the workspace tasks.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
