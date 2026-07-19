import { ToolcraftApp } from "@/toolcraft/runtime/react";
import { appSchema } from "../app/app-schema";
import { Hero3D } from "../components/Hero3D";

export function AppHome(): React.JSX.Element {
  return (
    <div className="flex min-h-dvh flex-col">
      <ToolcraftApp className="flex-1" schema={appSchema} />
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-[var(--foreground)]">
          Interactive 3D Experience
        </h2>
        <Hero3D />
      </section>
    </div>
  );
}
