import {
  jsx,
  jsxs,
  SlideShell,
  TitleBlock,
  ClosingCard,
  Grid,
  MetricStrip,
  NoteCard,
  theme,
} from "./deck-helpers.mjs";

export async function slide07(presentation) {
  const slide = presentation.slides.add();

  slide.compose(
    jsx(SlideShell, {
      footer: "The refactor is done, and the repo is in a much friendlier place for the next round of work",
      children: jsxs(Grid, {
        width: "fill",
        height: "fill",
        rows: ["auto", "fr(1)", "auto"],
        rowGap: 22,
        children: [
          jsx(TitleBlock, {
            eyebrow: "Outcome",
            title: "What we gained from the refactor",
            subtitle:
              "The app is still the same product, but it is now much easier to explain, extend, and operate locally. That is exactly the kind of win that compounds over time.",
            rightNote: {
              title: "Friendly summary",
              lines: [
                "Better onboarding for new developers.",
                "Better leverage for Codex-assisted feature work.",
                "Better confidence when making changes across the stack.",
              ],
            },
          }),
          jsx(Grid, {
            width: "fill",
            columns: ["fr(1)", "fr(1)", "fr(1)"],
            columnGap: 16,
            children: [
              jsx(ClosingCard, {
                title: "For developers",
                accent: theme.green,
                lines: [
                  "The repo now has a more teachable structure and clearer separation of concerns.",
                  "It is easier to find the right place for a feature, a bug fix, or a cleanup task.",
                ],
              }),
              jsx(ClosingCard, {
                title: "For delivery speed",
                accent: theme.blue,
                lines: [
                  "Thin routes and explicit services reduce repeated decision-making during implementation.",
                  "Ports and adapters make external dependencies less invasive during normal product work.",
                ],
              }),
              jsx(ClosingCard, {
                title: "For local development",
                accent: theme.warmDark,
                lines: [
                  "Bootstrap, auth, and local Mongo support now make the app easier to run without waiting on shared infrastructure.",
                  "That shortens the path from idea to working feature.",
                ],
              }),
            ],
          }),
          jsx(MetricStrip, {
            items: [
              { value: "200", label: "HTTP on the home page after the local setup fixes" },
              { value: "0", label: "Svelte check errors after the refactor pass" },
              { value: "1", label: "clearer story to tell the next teammate who opens the repo" },
            ],
          }),
        ],
      }),
    }),
  );

  return slide;
}
