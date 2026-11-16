import { HomeActions } from "@/components/home-actions";
import { PactSteps } from "@/components/pact-steps";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-5 pt-14 pb-20 sm:px-8 lg:flex-row lg:items-start lg:gap-20 lg:pt-24">
      <section className="grid gap-8 lg:sticky lg:top-24 lg:flex-[1.05]">
        <div className="grid gap-5">
          <h1 className="text-[clamp(2.4rem,5vw,3.75rem)] leading-[1.04] font-semibold tracking-[-0.03em]">
            <span className="block">Sign the pact.</span>{" "}
            <span className="block">Lock the vault.</span>{" "}
            <span className="block">Get paid.</span>
          </h1>
          <p className="max-w-[44ch] text-lg leading-relaxed text-muted-foreground">
            PactVault locks your client&rsquo;s payment on Solana before you
            start, and pays you when you submit the work.
          </p>
        </div>
        <HomeActions />
      </section>

      <section aria-label="How a pact works" className="lg:flex-1 lg:pt-3">
        <PactSteps />
      </section>
    </main>
  );
}
