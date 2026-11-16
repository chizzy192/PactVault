import { FileSignature, LockKeyhole, Send } from "lucide-react";

const STEPS = [
  {
    icon: FileSignature,
    title: "Sign the pact",
    body: "You and your client sign the same terms.",
  },
  {
    icon: LockKeyhole,
    title: "Lock the vault",
    body: "Your client locks the full payment before work starts.",
  },
  {
    icon: Send,
    title: "Get paid",
    body: "Submit the work and take up to 80% of the rest at once.",
  },
] as const;

/** Example figures follow the on-chain rules: 80% advance, 3% fee. */
const EXAMPLE = [
  { label: "Upfront, when the vault is locked", amount: "100.00" },
  { label: "Advance, when you submit", amount: "80.00" },
  { label: "Balance, when your client approves", amount: "17.00" },
] as const;

/**
 * The mechanism as one connected sequence, ending on money in hand.
 * Stacked with a vertical teal thread on small screens; a row with a
 * horizontal thread on large screens.
 */
export function PactSteps() {
  return (
    <ol className="grid gap-8 lg:grid-cols-3 lg:gap-8">
      {STEPS.map(({ icon: Icon, title, body }, index) => (
        <li
          key={title}
          className="relative grid grid-cols-[2.5rem_1fr] content-start gap-4 lg:grid-cols-1"
        >
          {index < STEPS.length - 1 && (
            // Teal thread from this stage to the next (spans the 2rem gap).
            <span
              aria-hidden
              className="absolute top-10 -bottom-8 left-5 w-px bg-teal/50 lg:top-5 lg:-right-8 lg:bottom-auto lg:left-12 lg:h-px lg:w-auto"
            />
          )}
          <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-teal/40 bg-card">
            <Icon className="size-5 text-teal" aria-hidden />
          </span>
          <div className="pt-1.5 lg:pt-0">
            <h2 className="text-lg font-semibold tracking-tight">
              <span className="sr-only">Step {index + 1}: </span>
              {title}
            </h2>
            <p className="mt-1 text-[0.95rem] leading-relaxed text-muted-foreground">
              {body}
            </p>
            {index === STEPS.length - 1 && <ExampleLedger />}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ExampleLedger() {
  return (
    <figure className="mt-5 max-w-sm rounded-xl border border-border bg-card p-4 shadow-[0_8px_24px_-16px_rgb(11_21_18/0.35)]">
      <figcaption className="text-sm text-muted-foreground">
        Example: a 200 USDC pact with 50% upfront
      </figcaption>
      <dl className="mt-3 divide-y divide-teal/25">
        {EXAMPLE.map(({ label, amount }) => (
          <div
            key={label}
            className="flex items-baseline justify-between gap-4 py-2 text-sm"
          >
            <dt>{label}</dt>
            <dd className="font-medium whitespace-nowrap text-primary tabular-nums">
              {amount} <span className="text-xs">USDC</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        If your client doesn&rsquo;t respond, the balance releases
        automatically after the review window. 3.00 USDC fee goes to the
        investor pool that funds advances.
      </p>
    </figure>
  );
}
