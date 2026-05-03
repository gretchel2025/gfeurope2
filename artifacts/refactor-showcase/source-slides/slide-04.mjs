import {
  jsx,
  jsxs,
  SlideShell,
  TitleBlock,
  NoteCard,
  PhaseRoadmap,
  Grid,
  MetricStrip,
  theme,
} from "./deck-helpers.mjs";

export async function slide04(presentation) {
  const slide = presentation.slides.add();

  const phasesTop = [
    { title: "Lay the foundation", text: "Create the new architecture skeleton and naming conventions first.", fill: "#EAF2F8", accent: theme.blue },
    { title: "Normalize the domain", text: "Move models, enums, and business rules into clearer domain modules.", fill: "#F0ECF9", accent: "#6A5AA6" },
    { title: "Decouple the services", text: "Replace framework-aware workflows with application services and app-level errors.", fill: "#E4F1EA", accent: theme.green },
  ];
  const phasesBottom = [
    { title: "Rebuild persistence seams", text: "Move Mongo concerns into repository implementations behind ports.", fill: "#F5EFE7", accent: theme.warmDark },
    { title: "Centralize the platform", text: "Gather auth, config, bootstrap, logging, media, and email under infrastructure.", fill: "#E6F0EE", accent: theme.teal },
    { title: "Thin the routes and clean house", text: "Convert routes into adapters, remove noisy leftovers, and smoke test the main flows.", fill: "#FBEEE4", accent: theme.warm },
  ];

  slide.compose(
    jsx(SlideShell, {
      footer: "The refactor was designed as a sequence of safe moves, not a big-bang rewrite",
      children: jsxs(Grid, {
        width: "fill",
        height: "fill",
        rows: ["auto", "auto", "auto", "auto"],
        rowGap: 20,
        children: [
          jsx(TitleBlock, {
            eyebrow: "Refactoring Phases",
            title: "We treated the cleanup as a guided migration",
            subtitle:
              "The structure changed a lot, but the strategy stayed steady: add a cleaner path, move one slice at a time, then remove the legacy path once it was safe.",
            rightNote: {
              title: "Why this approach helped",
              lines: [
                "Reduced the risk of breaking the booking and admin flows.",
                "Made each architectural move easier to reason about.",
                "Let smoke testing happen against meaningful checkpoints.",
              ],
            },
          }),
          jsx(PhaseRoadmap, { phases: phasesTop }),
          jsx(PhaseRoadmap, { phases: phasesBottom }),
          jsx(MetricStrip, {
            items: [
              { value: "6", label: "implementation phases in the working plan" },
              { value: "1", label: "core principle: add the new path before deleting the old path" },
              { value: "96", label: "files touched in the main refactor commit" },
            ],
          }),
        ],
      }),
    }),
  );

  return slide;
}
