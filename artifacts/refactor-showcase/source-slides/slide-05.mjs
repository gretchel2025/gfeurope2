import {
  jsx,
  jsxs,
  SlideShell,
  TitleBlock,
  TreePanel,
  Grid,
  MetricStrip,
  NoteCard,
  theme,
} from "./deck-helpers.mjs";

export async function slide05(presentation) {
  const slide = presentation.slides.add();

  const beforeTree = `src/lib/
  entities/
  server/workflows/
  server/data_sources/
  server/external_services/

src/routes/
  api/
  testing/
  init/
  ...`;

  const afterTree = `src/lib/
  domain/
  application/
  infrastructure/
  server/http/

src/routes/
  public pages
  admin pages
  ...`;

  slide.compose(
    jsx(SlideShell, {
      footer: "The folder story became much easier to explain to a new teammate",
      children: jsxs(Grid, {
        width: "fill",
        height: "fill",
        rows: ["auto", "fr(1)", "auto"],
        rowGap: 22,
        children: [
          jsx(TitleBlock, {
            eyebrow: "Structure Shift",
            title: "The directory layout now tells a much clearer story",
            subtitle:
              "This is the kind of change that pays off every time somebody opens the repo and asks, “Where should I start?”",
            rightNote: {
              title: "What improved",
              lines: [
                "More explicit names for business logic and infrastructure.",
                "Less ambiguity between feature code and persistence code.",
                "Far fewer false leads during repo search and onboarding.",
              ],
            },
          }),
          jsx(Grid, {
            width: "fill",
            columns: ["fr(1)", "fr(1)", "fr(0.75)"],
            columnGap: 18,
            children: [
              jsx(TreePanel, {
                title: "Before",
                body: beforeTree,
                accent: theme.red,
              }),
              jsx(TreePanel, {
                title: "After",
                body: afterTree,
                accent: theme.green,
              }),
              jsx(NoteCard, {
                title: "Refactor footprint",
                fill: theme.darkPanel,
                textColor: theme.white,
                accent: theme.warm,
                lines: [
                  "Legacy workflows, data sources, and external service modules were retired.",
                  "Thin compatibility exports were kept for a gentler transition.",
                  "The active app now hangs off the new layered core.",
                ],
              }),
            ],
          }),
          jsx(MetricStrip, {
            items: [
              { value: "2005", label: "lines added in the main refactor commit" },
              { value: "3387", label: "lines removed while deleting legacy paths" },
              { value: "4", label: "main architectural buckets added under src/lib" },
            ],
          }),
        ],
      }),
    }),
  );

  return slide;
}
