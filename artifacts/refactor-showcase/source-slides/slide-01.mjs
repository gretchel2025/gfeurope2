import { jsx, jsxs, SlideShell, TitleBlock, BeforeAfterDiagram, MetricStrip, Grid } from "./deck-helpers.mjs";

export async function slide01(presentation) {
  const slide = presentation.slides.add();

  slide.compose(
    jsx(SlideShell, {
      footer: "Grand Feast refactor showcase | before, after, and how we moved",
      children: jsxs(Grid, {
        width: "fill",
        rows: ["auto", "fr(1)", "auto"],
        rowGap: 24,
        children: [
          jsx(TitleBlock, {
            eyebrow: "Refactoring Showcase",
            title: "Making the Grand Feast app easier to change",
            subtitle:
              "A friendly walkthrough of what the codebase looked like before, what we improved, and what the finished structure gives us now.",
            rightNote: {
              title: "What this deck covers",
              lines: [
                "Where the old structure slowed us down",
                "The target architecture we aimed for",
                "The phases we used to get there safely",
              ],
            },
          }),
          jsx(BeforeAfterDiagram, {}),
          jsx(MetricStrip, {
            items: [
              { value: "96", label: "files touched in the main refactor commit" },
              { value: "4", label: "clear architecture layers added to the app" },
              { value: "0", label: "Svelte check errors after the cleanup pass" },
            ],
          }),
        ],
      }),
    }),
  );

  return slide;
}
