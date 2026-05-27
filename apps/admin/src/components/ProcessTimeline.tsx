"use client";

import { useEffect, useState } from 'react';
import {
  MessageSquare,
  Wrench,
  Rocket,
  ArrowRight,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Tunable timing — change here to retune the auto-advance cadence.
// ---------------------------------------------------------------------------
const FILL_DURATION = 4500; // ms — how long each bar takes to fill
const STEP_DELAY = 700;      // ms — pause after a fill completes before the next bar starts
const LOOP_DELAY = 1600;     // ms — pause after the final bar before restarting the cycle

type CardState = 'pending' | 'active' | 'completed';

interface Step {
  /** Phase name, displayed below the number (small caps). */
  name: string;
  /** Three punchy verbs. Each renders as its own bold typographic block. */
  essence: [string, string, string];
  /** Tiny meta caption — e.g. "Day 1 · 30 minutes". */
  meta: string;
  icon: React.ReactNode;
  bullets: string[];
  /** Per-step right-side illustration. Each step has its own. */
  Graphic: React.FC<{ active: boolean }>;
}

// ---------------------------------------------------------------------------
// Right-column graphics — one per step. Designed around the 200x200 viewBox
// so all three feel like siblings.
// ---------------------------------------------------------------------------

function DiscoverGraphic({ active }: { active: boolean }) {
  return (
    <div
      className={`relative aspect-square w-full max-w-[300px] transition-opacity duration-500 ${
        active ? 'opacity-100' : 'opacity-55'
      }`}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden>
        <defs>
          <radialGradient id="dg-fog" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#CEF84E" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#CEF84E" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="dg-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#CEF84E" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#CEF84E" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Hazy backdrop */}
        <circle cx="100" cy="100" r="95" fill="url(#dg-fog)" />

        {/* Crosshair lines */}
        <line x1="10" y1="100" x2="190" y2="100" stroke="#CEF84E" strokeOpacity="0.08" />
        <line x1="100" y1="10" x2="100" y2="190" stroke="#CEF84E" strokeOpacity="0.08" />

        {/* Static concentric rings — the radar scope */}
        <circle cx="100" cy="100" r="32" fill="none" stroke="#CEF84E" strokeOpacity="0.22" />
        <circle cx="100" cy="100" r="56" fill="none" stroke="#CEF84E" strokeOpacity="0.18" />
        <circle cx="100" cy="100" r="82" fill="none" stroke="#CEF84E" strokeOpacity="0.13" />

        {/* Pulsing rings — two phased copies so the cadence feels alive */}
        <circle
          cx="100"
          cy="100"
          r="20"
          fill="none"
          stroke="#CEF84E"
          strokeWidth="1.4"
          className="radar-pulse"
        />
        <circle
          cx="100"
          cy="100"
          r="20"
          fill="none"
          stroke="#CEF84E"
          strokeWidth="1.4"
          className="radar-pulse"
          style={{ animationDelay: '1.5s' }}
        />

        {/* Rotating sweep wedge */}
        <g className="radar-sweep" style={{ transformOrigin: '100px 100px' }}>
          <path d="M100,100 L100,15 A85,85 0 0 1 175,80 Z" fill="url(#dg-sweep)" opacity="0.55" />
        </g>

        {/* Anchor dot at the center */}
        <circle cx="100" cy="100" r="3" fill="#CEF84E" />

        {/* Discovered blips — staggered so they read as findings being picked up */}
        {(
          [
            [60, 55],
            [150, 42],
            [160, 138],
            [50, 150],
            [122, 170],
            [34, 90],
          ] as const
        ).map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2.5"
            fill="#CEF84E"
            className="radar-blip"
            style={{ animationDelay: `${i * 0.45}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

function BuildGraphic({ active }: { active: boolean }) {
  return (
    <div
      className={`relative w-full max-w-[300px] aspect-square transition-opacity duration-500 ${
        active ? 'opacity-100' : 'opacity-55'
      }`}
    >
      {/* Soft lime fog behind the assembly */}
      <div className="absolute inset-4 rounded-2xl bg-primary/10 blur-xl" />

      <div className="relative h-full grid grid-cols-3 grid-rows-3 gap-2 p-3">
        {/* Tile 1: top bar, spans 2 cols — looks like a header */}
        <div
          className="col-span-2 rounded-lg border border-border/70 bg-card/70 build-tile p-2.5"
          style={{ animationDelay: '0s' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1 h-1 rounded-full bg-red-400/70" />
            <span className="w-1 h-1 rounded-full bg-amber-400/70" />
            <span className="w-1 h-1 rounded-full bg-emerald-400/70" />
          </div>
          <div className="h-1 w-2/3 rounded-full bg-foreground/15" />
        </div>

        {/* Tile 2: tall right column, lime accent — the "hero stat" */}
        <div
          className="row-span-2 rounded-lg border border-primary/40 bg-primary/15 build-tile flex flex-col justify-between p-2.5"
          style={{ animationDelay: '0.35s' }}
        >
          <div className="h-1 w-2/3 rounded-full bg-primary/60" />
          <div className="flex items-end gap-0.5 h-12">
            <div className="w-1.5 h-1/3 rounded-sm bg-primary/50" />
            <div className="w-1.5 h-1/2 rounded-sm bg-primary/60" />
            <div className="w-1.5 h-2/3 rounded-sm bg-primary/70" />
            <div className="w-1.5 h-full rounded-sm bg-primary" />
          </div>
        </div>

        {/* Tile 3: middle-left */}
        <div
          className="rounded-lg border border-border/70 bg-card/70 build-tile p-2.5"
          style={{ animationDelay: '0.7s' }}
        >
          <div className="h-1 w-3/4 rounded-full bg-foreground/15 mb-1" />
          <div className="h-1 w-1/2 rounded-full bg-foreground/10" />
        </div>

        {/* Tile 4: middle-middle */}
        <div
          className="rounded-lg border border-border/70 bg-card/70 build-tile flex items-center justify-center"
          style={{ animationDelay: '1.05s' }}
        >
          <div className="w-4 h-4 rounded-full border border-primary/50 bg-primary/20" />
        </div>

        {/* Tile 5: bottom wide bar — looks like a footer/CTA */}
        <div
          className="col-span-3 rounded-lg border border-border/70 bg-card/70 build-tile flex items-center gap-2 px-3"
          style={{ animationDelay: '1.4s' }}
        >
          <div className="h-2 w-2 rounded-full bg-primary" />
          <div className="h-1.5 w-1/3 rounded-full bg-foreground/15" />
          <div className="ml-auto h-2 w-10 rounded-md bg-primary/50" />
        </div>
      </div>
    </div>
  );
}

function LaunchGraphic({ active }: { active: boolean }) {
  // Same path used by the static trail outline, the animated drawn trail,
  // and the rocket's motion path — keep them in sync if you edit.
  const PATH = 'M20,170 Q60,40 180,30';

  return (
    <div
      className={`relative w-full max-w-[300px] aspect-square transition-opacity duration-500 ${
        active ? 'opacity-100' : 'opacity-55'
      }`}
    >
      <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden>
        <defs>
          <radialGradient id="lg-fog" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#CEF84E" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#CEF84E" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lg-trail" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#CEF84E" stopOpacity="0" />
            <stop offset="100%" stopColor="#CEF84E" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Hazy backdrop, biased toward the upper-right where the rocket lands */}
        <circle cx="130" cy="70" r="90" fill="url(#lg-fog)" />

        {/* Twinkling stars scattered around */}
        {(
          [
            [40, 40],
            [150, 80],
            [170, 50],
            [60, 90],
            [120, 30],
            [90, 150],
            [30, 110],
            [55, 25],
            [180, 110],
          ] as const
        ).map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="1.3"
            fill="#CEF84E"
            className="launch-star"
            style={{ animationDelay: `${i * 0.28}s` }}
          />
        ))}

        {/* Static dashed trajectory outline */}
        <path
          d={PATH}
          fill="none"
          stroke="#CEF84E"
          strokeWidth="1"
          strokeDasharray="3 5"
          strokeOpacity="0.32"
        />

        {/* Animated drawn trail that follows behind the rocket */}
        <path
          d={PATH}
          fill="none"
          stroke="url(#lg-trail)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="launch-trail"
          pathLength="200"
        />

        {/* Origin / launch pad pulse */}
        <circle cx="20" cy="170" r="3" fill="#CEF84E" />
        <circle cx="20" cy="170" r="3" fill="none" stroke="#CEF84E" strokeWidth="1.4" className="radar-pulse" />

        {/* Rocket — drawn pointing UP in local coords, then rotated 90° clockwise
            so the NOSE points to positive X. Combined with animateMotion's
            rotate="auto", positive X aligns with the direction of travel, so
            the nose leads and the flame trails. */}
        <g>
          <g transform="rotate(90)">
            {/* Body — nose at y=-8 (top in local coords), base at y=8 */}
            <path
              d="M-3,-8 L3,-8 L4.5,0 L3,8 L-3,8 L-4.5,0 Z"
              fill="#CEF84E"
              stroke="#0f172a"
              strokeWidth="0.6"
            />
            {/* Window — sits near the nose */}
            <circle cx="0" cy="-3" r="1.6" fill="#0f172a" />
            {/* Side fins — flare out at the base */}
            <path d="M-4.5,0 L-7,5 L-3,5 Z" fill="#CEF84E" opacity="0.85" />
            <path d="M4.5,0 L7,5 L3,5 Z" fill="#CEF84E" opacity="0.85" />
            {/* Flame — extends below the base, away from the nose */}
            <path d="M-2,8 L0,14 L2,8 Z" fill="#f97316" opacity="0.95" />
            <path d="M-1,8 L0,11 L1,8 Z" fill="#fde047" />
          </g>
          <animateMotion
            dur="6s"
            repeatCount="indefinite"
            path={PATH}
            rotate="auto"
            keyTimes="0;1"
            keyPoints="0;1"
            calcMode="spline"
            keySplines="0.4 0 0.2 1"
          />
        </g>

        {/* Landing target — small ring at the path's end */}
        <circle cx="180" cy="30" r="5" fill="none" stroke="#CEF84E" strokeOpacity="0.5" />
        <circle cx="180" cy="30" r="1.6" fill="#CEF84E" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step data
// ---------------------------------------------------------------------------

const steps: Step[] = [
  {
    name: 'Discover',
    essence: ['Listen', 'Map', 'Align'],
    meta: 'Day 1 · 30 minutes',
    icon: <MessageSquare className="w-4 h-4" />,
    Graphic: DiscoverGraphic,
    bullets: [
      'No sales script, no slide deck',
      'In Bahasa or English',
      'Walk away with a plan, even if you do not hire us',
    ],
  },
  {
    name: 'Build',
    essence: ['Scope', 'Ship', 'Polish'],
    meta: 'Within 48 hours',
    icon: <Wrench className="w-4 h-4" />,
    Graphic: BuildGraphic,
    bullets: [
      'Weekly check-ins on a live preview link',
      'Replies in hours, not weeks',
      'You always know what we are shipping next',
    ],
  },
  {
    name: 'Launch',
    essence: ['Deploy', 'Train', 'Stay'],
    meta: 'Launch day & beyond',
    icon: <Rocket className="w-4 h-4" />,
    Graphic: LaunchGraphic,
    bullets: [
      'Hands-on training for your team',
      'Care plans are optional, never locked',
      'We answer Slack a year later',
    ],
  },
];

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

/**
 * "How we work" — three vertically stacked cards. A lime fill bar on the
 * left of each card rises from empty to full over ~4.5s, pauses, then the
 * next card's bar takes over — visual proof that the steps happen in order.
 * Each card has its own right-side illustration (radar, assembly, rocket)
 * to reflect the step's character. Pauses on hover.
 */
export default function ProcessTimeline() {
  // -1 means "no card active yet" — used as the brief idle frame between
  // loop iterations so all bars visibly reset to empty before card 0 fires.
  const [activeIdx, setActiveIdx] = useState<number>(-1);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;

    let nextIdx: number;
    let nextDelay: number;

    if (activeIdx === -1) {
      nextIdx = 0;
      nextDelay = 250;
    } else if (activeIdx < steps.length - 1) {
      nextIdx = activeIdx + 1;
      nextDelay = FILL_DURATION + STEP_DELAY;
    } else {
      nextIdx = -1;
      nextDelay = FILL_DURATION + LOOP_DELAY;
    }

    const t = setTimeout(() => setActiveIdx(nextIdx), nextDelay);
    return () => clearTimeout(t);
  }, [activeIdx, paused]);

  // During the brief idle frame between loops, display the upcoming step's
  // graphic so the right panel never goes blank.
  const displayIdx = activeIdx < 0 ? 0 : activeIdx;
  const displayStep = steps[displayIdx];

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative px-6 py-28 md:py-32 border-t border-border/60 overflow-hidden"
    >
      {/* Glow stack: lime drifts in from the left to lead the timeline, sky
          accent closes the section on the lower-right. */}
      <div className="absolute top-1/3 left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.06] blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[420px] h-[420px] rounded-full bg-sky-400/[0.06] blur-[130px] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-medium mb-3">
            How we work
          </p>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
            From first message to live in three steps.
          </h2>
          <p className="mt-5 text-base text-muted-foreground max-w-xl leading-relaxed">
            The same shape for a landing page or a full internal tool — only
            the depth of each step changes.
          </p>
        </div>

        {/* Two-column layout: smaller cards on the left with a single shared
            progressive bar running along their left edge, then a bigger
            graphic floating on the page background on the right. */}
        <div className="grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] gap-8 lg:gap-14 items-start">
          <StepsRail activeIdx={activeIdx} onSelect={setActiveIdx} />

          <div className="lg:sticky lg:top-28">
            <GraphicPanel step={displayStep} stepIndex={displayIdx} />
          </div>
        </div>
      </div>
    </section>
  );
}

function cardStateFor(i: number, activeIdx: number): CardState {
  if (activeIdx === -1) return 'pending';
  if (i < activeIdx) return 'completed';
  if (i === activeIdx) return 'active';
  return 'pending';
}

interface StepsRailProps {
  activeIdx: number;
  onSelect: (i: number) => void;
}

/**
 * The full left rail: one continuous lime progress bar running vertically
 * along the left edge, with the three step cards stacked beside it. The bar
 * fills 0 → 33% → 66% → 100% as `activeIdx` advances. CSS handles the actual
 * animation — `transition-duration` matches the parent's setTimeout cadence
 * so the bar finishes filling its current segment just as the next step
 * activates.
 */
function StepsRail({ activeIdx, onSelect }: StepsRailProps) {
  const isAnimating = activeIdx >= 0;
  const progress =
    activeIdx < 0 ? 0 : ((activeIdx + 1) / steps.length) * 100;

  return (
    <div className="relative">
      {/* Single shared progress bar — spans the full height of the card stack. */}
      <div
        aria-hidden
        className="absolute left-0 top-2 bottom-2 w-1.5 rounded-full bg-border/40 overflow-hidden"
      >
        <div
          className="absolute inset-x-0 top-0 bg-primary rounded-full"
          style={{
            height: `${progress}%`,
            boxShadow: progress > 0 ? '0 0 18px rgba(206, 248, 78, 0.6)' : 'none',
            transitionProperty: 'height',
            transitionDuration: isAnimating ? `${FILL_DURATION}ms` : '450ms',
            transitionTimingFunction: isAnimating
              ? 'linear'
              : 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </div>

      <div className="pl-7 md:pl-8 space-y-4">
        {steps.map((step, i) => (
          <StepCard
            key={step.name}
            step={step}
            index={i}
            state={cardStateFor(i, activeIdx)}
            onActivate={() => onSelect(i)}
          />
        ))}
      </div>
    </div>
  );
}

interface StepCardProps {
  step: Step;
  index: number;
  state: CardState;
  onActivate: () => void;
}

/**
 * Step card — no fill-bar inside (the rail handles overall progress now).
 * Shows the "N. Name" header, meta caption, and a tight bullet list. No
 * verb essence (the user asked us to drop it from this section).
 */
function StepCard({ step, index, state, onActivate }: StepCardProps) {
  const isLitUp = state !== 'pending';

  return (
    <div
      onClick={onActivate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onActivate();
        }
      }}
      className={`group relative rounded-2xl border bg-card/55 backdrop-blur-sm p-4 md:p-5 cursor-pointer transition-colors ${
        state === 'active'
          ? 'border-primary/45 shadow-[0_18px_50px_-28px_rgba(206,248,78,0.45)]'
          : 'border-border/70 hover:border-foreground/25'
      }`}
    >
      {/* Header row: "1. Discover" + meta */}
      <div className="flex items-baseline gap-3 flex-wrap mb-3">
        <span
          className={`text-xl md:text-2xl font-semibold tabular-nums leading-none tracking-tight transition-colors duration-500 ${
            isLitUp ? 'text-primary text-glow-lime' : 'text-foreground/25'
          }`}
        >
          {index + 1}.
        </span>
        <span
          className={`text-xl md:text-2xl font-semibold tracking-tight transition-colors ${
            isLitUp ? 'text-foreground' : 'text-foreground/55'
          }`}
        >
          {step.name}
        </span>
        <span className="ml-auto text-[10px] uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap">
          {step.meta}
        </span>
      </div>

      {/* Bullets */}
      <ul className="space-y-1.5">
        {step.bullets.map((b) => (
          <li
            key={b}
            className="flex items-start gap-2 text-xs md:text-sm text-foreground/80"
          >
            <ArrowRight
              className={`w-3 h-3 mt-1 shrink-0 transition-colors ${
                isLitUp ? 'text-primary' : 'text-muted-foreground'
              }`}
            />
            <span className="leading-relaxed">{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface GraphicPanelProps {
  step: Step;
  stepIndex: number;
}

/**
 * Single shared graphic on the right — no container, no labels. Just the
 * active step's bespoke illustration (radar / assembly / rocket) floating
 * on the page background. Slightly larger than the cards rail so it carries
 * the page's visual weight.
 */
function GraphicPanel({ stepIndex, step }: GraphicPanelProps) {
  const Graphic = step.Graphic;

  return (
    <div className="relative w-full max-w-[640px] mx-auto aspect-square">
      <div
        key={`graphic-${stepIndex}`}
        className="fade-soft absolute inset-0 flex items-center justify-center"
      >
        <Graphic active />
      </div>
    </div>
  );
}
