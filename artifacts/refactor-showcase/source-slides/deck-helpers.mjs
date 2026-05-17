import * as art from "@oai/artifact-tool";
import { jsx, jsxs } from "@oai/artifact-tool/presentation-jsx/jsx-runtime";
import { paint, stroke, textStyle } from "@oai/artifact-tool/presentation-jsx";

export { jsx, jsxs };

export const theme = {
  bg: "#F6F3EE",
  ink: "#182126",
  muted: "#5F6B73",
  soft: "#D7D0C6",
  warm: "#F28C52",
  warmDark: "#A94E28",
  green: "#4B7F6A",
  teal: "#2C6E73",
  blue: "#4E6FAE",
  red: "#C65D4B",
  yellow: "#E1B64F",
  panel: "#FFFDF9",
  panelAlt: "#F2EEE7",
  darkPanel: "#24343A",
  white: "#FFFFFF",
};

export function SlideShell({ children, footer }) {
  return jsxs(Layers, {
    width: "fill",
    height: "fill",
    children: [
      jsx(Shape, {
        width: "fill",
        height: "fill",
        fill: paint("linear(180deg, #f7f3ee 0%, #efe8dc 100%)"),
      }),
      jsx(Panel, {
        width: "fill",
        height: "fill",
        padding: 44,
        child: jsxs(Grid, {
          width: "fill",
          height: "fill",
          rows: ["fr(1)", "fixed(28)"],
          rowGap: 18,
          children: [
            jsx(Panel, { width: "fill", height: "fill", child: children }),
            jsx(Text, {
              value: footer ?? "Grand Feast refactor showcase",
              style: textStyle(`font: 13px Aptos; color: ${theme.muted}`),
              width: "fill",
            }),
          ],
        }),
      }),
    ],
  });
}

export function TitleBlock({ eyebrow, title, subtitle, rightNote }) {
  return jsx(Grid, {
    width: "fill",
    columns: ["fr(1.7)", "fr(0.8)"],
    columnGap: 24,
    children: [
      jsxs(Panel, {
        width: "fill",
        child: jsxs(Grid, {
          width: "fill",
          rows: ["auto", "auto", "auto"],
          rowGap: 10,
          children: [
            jsx(Text, {
              value: eyebrow,
              style: textStyle(`font: 14px Aptos; color: ${theme.warmDark}; weight: 700`),
            }),
            jsx(Text, {
              value: title,
              style: textStyle(`font: 30px Aptos Display; color: ${theme.ink}; weight: 700`),
              width: "fill",
            }),
            subtitle
              ? jsx(Text, {
                  value: subtitle,
                  style: textStyle(`font: 17px Aptos; color: ${theme.muted}`),
                  width: "fill",
                })
              : null,
          ].filter(Boolean),
        }),
      }),
      rightNote
        ? jsx(NoteCard, {
            title: rightNote.title,
            lines: rightNote.lines,
            fill: theme.darkPanel,
            textColor: theme.white,
            accent: theme.warm,
          })
        : jsx(Panel, { width: "fill", height: "fill", child: null }),
    ],
  });
}

export function NoteCard({ title, lines, fill = theme.panelAlt, textColor = theme.ink, accent = theme.teal }) {
  return jsx(Panel, {
    fill,
    borderRadius: 18,
    padding: 18,
    width: "fill",
    child: jsxs(Grid, {
      width: "fill",
      rows: ["auto", ...lines.map(() => "auto")],
      rowGap: 10,
      children: [
        jsx(Text, {
          value: title,
          style: textStyle(`font: 16px Aptos Display; color: ${textColor}; weight: 700`),
        }),
        ...lines.map((line) =>
          jsx(Grid, {
            width: "fill",
            columns: ["fixed(12)", "fr(1)"],
            columnGap: 10,
            children: [
              jsx(Shape, {
                width: 10,
                height: 10,
                fill: accent,
                borderRadius: 99,
              }),
              jsx(Text, {
                value: line,
                style: textStyle(`font: 14px Aptos; color: ${textColor}`),
                width: "fill",
              }),
            ],
          })
        ),
      ],
    }),
  });
}

export function MetricStrip({ items }) {
  return jsx(Grid, {
    width: "fill",
    columns: items.map(() => "fr(1)"),
    columnGap: 16,
    children: items.map((item) =>
      jsx(Panel, {
        fill: theme.panel,
        line: stroke(`1 ${theme.soft}`),
        borderRadius: 16,
        padding: 18,
        child: jsxs(Grid, {
          width: "fill",
          rows: ["auto", "auto"],
          rowGap: 6,
          children: [
            jsx(Text, {
              value: item.value,
              style: textStyle(`font: 28px Aptos Display; color: ${theme.ink}; weight: 700`),
            }),
            jsx(Text, {
              value: item.label,
              style: textStyle(`font: 13px Aptos; color: ${theme.muted}`),
            }),
          ],
        }),
      })
    ),
  });
}

export function WeaknessCard({ title, text, tone = "red" }) {
  const color = tone === "red" ? theme.red : tone === "yellow" ? theme.yellow : theme.blue;
  return jsx(Panel, {
    fill: theme.panel,
    line: stroke(`1 ${theme.soft}`),
    borderRadius: 16,
    padding: 16,
    child: jsxs(Grid, {
      width: "fill",
      rows: ["auto", "auto"],
      rowGap: 8,
      children: [
        jsx(Grid, {
          width: "fill",
          columns: ["fixed(12)", "fr(1)"],
          columnGap: 10,
          children: [
            jsx(Shape, { width: 10, height: 10, fill: color, borderRadius: 99 }),
            jsx(Text, {
              value: title,
              style: textStyle(`font: 15px Aptos Display; color: ${theme.ink}; weight: 700`),
            }),
          ],
        }),
        jsx(Text, {
          value: text,
          style: textStyle(`font: 13px Aptos; color: ${theme.muted}`),
          width: "fill",
        }),
      ],
    }),
  });
}

export function SolutionCard({ title, text, accent = theme.green }) {
  return jsx(Panel, {
    fill: theme.panel,
    borderRadius: 16,
    padding: 16,
    child: jsxs(Grid, {
      width: "fill",
      rows: ["auto", "auto"],
      rowGap: 8,
      children: [
        jsx(Text, {
          value: title,
          style: textStyle(`font: 15px Aptos Display; color: ${accent}; weight: 700`),
        }),
        jsx(Text, {
          value: text,
          style: textStyle(`font: 13px Aptos; color: ${theme.muted}`),
          width: "fill",
        }),
      ],
    }),
  });
}

export function LayerNode({ title, subtitle, fill, lineColor, textColor = theme.ink }) {
  return jsx(Panel, {
    fill,
    line: stroke(`1 ${lineColor}`),
    borderRadius: 18,
    padding: 14,
    width: "fill",
    child: jsxs(Grid, {
      width: "fill",
      rows: ["auto", "auto"],
      rowGap: 5,
      children: [
        jsx(Text, {
          value: title,
          style: textStyle(`font: 18px Aptos Display; color: ${textColor}; weight: 700`),
          width: "fill",
        }),
        jsx(Text, {
          value: subtitle,
          style: textStyle(`font: 12px Aptos; color: ${textColor}`),
          width: "fill",
        }),
      ],
    }),
  });
}

export function BeforeAfterDiagram() {
  return jsx(Grid, {
    width: "fill",
    columns: ["fr(1)", "fr(1)"],
    columnGap: 24,
    children: [
      jsx(DiagramPanel, {
        title: "Before",
        subtitle: "Useful logic existed, but responsibilities bled across layers.",
        accent: theme.red,
        nodes: [
          { title: "routes", subtitle: "UI + orchestration + HTTP decisions", fill: "#FBE3DD" },
          { title: "workflows", subtitle: "business rules + SvelteKit errors", fill: "#F6D8CF" },
          { title: "data_sources", subtitle: "Mongo details mixed into app logic", fill: "#F5E6D7" },
          { title: "external_services", subtitle: "email / cloudinary / logging", fill: "#F8EEE6" },
        ],
        footer: "Harder to know where new code should live.",
      }),
      jsx(DiagramPanel, {
        title: "After",
        subtitle: "Each layer has a clearer job and a cleaner path for change.",
        accent: theme.green,
        nodes: [
          { title: "routes", subtitle: "thin web adapters", fill: "#E4F1EA" },
          { title: "server/http", subtitle: "forms, guards, error mapping", fill: "#DCEFEA" },
          { title: "application", subtitle: "services + ports", fill: "#D6EAF3" },
          { title: "domain", subtitle: "core models and rules", fill: "#EAE8F6" },
          { title: "infrastructure", subtitle: "mongo, auth, bootstrap, media", fill: "#F0EEE8" },
        ],
        footer: "Easier for people and Codex to extend safely.",
      }),
    ],
  });
}

export function DiagramPanel({ title, subtitle, nodes, accent, footer }) {
  const rows = [];
  nodes.forEach((node, index) => {
    rows.push("auto");
    if (index < nodes.length - 1) rows.push("14px");
  });
  return jsx(Panel, {
    fill: theme.panel,
    line: stroke(`1 ${theme.soft}`),
    borderRadius: 22,
    padding: 18,
    child: jsxs(Grid, {
      width: "fill",
      rows: ["auto", "auto", ...rows, "auto"],
      rowGap: 8,
      children: [
        jsx(Text, {
          value: title,
          style: textStyle(`font: 20px Aptos Display; color: ${accent}; weight: 700`),
        }),
        jsx(Text, {
          value: subtitle,
          style: textStyle(`font: 13px Aptos; color: ${theme.muted}`),
          width: "fill",
        }),
        ...nodes.flatMap((node, index) => {
          const parts = [
            jsx(LayerNode, {
              title: node.title,
              subtitle: node.subtitle,
              fill: node.fill,
              lineColor: accent,
            }),
          ];
          if (index < nodes.length - 1) {
            parts.push(
              jsx(Panel, {
                width: "fill",
                align: "center",
                child: jsx(Shape, {
                  width: 4,
                  height: 14,
                  fill: accent,
                  borderRadius: 99,
                }),
              })
            );
          }
          return parts;
        }),
        jsx(Text, {
          value: footer,
          style: textStyle(`font: 13px Aptos; color: ${theme.ink}; weight: 700`),
          width: "fill",
        }),
      ],
    }),
  });
}

export function PhaseRoadmap({ phases }) {
  return jsx(Grid, {
    width: "fill",
    columns: phases.map(() => "fr(1)"),
    columnGap: 14,
    children: phases.map((phase, index) =>
      jsx(Panel, {
        fill: phase.fill,
        borderRadius: 18,
        padding: 14,
        child: jsxs(Grid, {
          width: "fill",
          rows: ["auto", "auto", "auto"],
          rowGap: 6,
          children: [
            jsx(Text, {
              value: `Phase ${index + 1}`,
              style: textStyle(`font: 12px Aptos; color: ${phase.accent}; weight: 700`),
            }),
            jsx(Text, {
              value: phase.title,
              style: textStyle(`font: 16px Aptos Display; color: ${theme.ink}; weight: 700`),
            }),
            jsx(Text, {
              value: phase.text,
              style: textStyle(`font: 12px Aptos; color: ${theme.muted}`),
              width: "fill",
            }),
          ],
        }),
      })
    ),
  });
}

export function TreePanel({ title, body, accent }) {
  return jsx(Panel, {
    fill: theme.panel,
    line: stroke(`1 ${theme.soft}`),
    borderRadius: 20,
    padding: 18,
    child: jsxs(Grid, {
      width: "fill",
      rows: ["auto", "auto"],
      rowGap: 10,
      children: [
        jsx(Text, {
          value: title,
          style: textStyle(`font: 18px Aptos Display; color: ${accent}; weight: 700`),
        }),
        jsx(Text, {
          value: body,
          style: textStyle(`font: 15px Aptos Mono; color: ${theme.ink}; leading: 1.3`),
          width: "fill",
        }),
      ],
    }),
  });
}

export function ClosingCard({ title, lines, accent }) {
  return jsx(Panel, {
    fill: theme.panel,
    line: stroke(`1 ${theme.soft}`),
    borderRadius: 18,
    padding: 16,
    child: jsxs(Grid, {
      width: "fill",
      rows: ["auto", ...lines.map(() => "auto")],
      rowGap: 8,
      children: [
        jsx(Text, {
          value: title,
          style: textStyle(`font: 16px Aptos Display; color: ${accent}; weight: 700`),
        }),
        ...lines.map((line) =>
          jsx(Text, {
            value: line,
            style: textStyle(`font: 13px Aptos; color: ${theme.muted}`),
            width: "fill",
          })
        ),
      ],
    }),
  });
}

export function Text({ value, style, width = "hug", height = "hug" }) {
  return art.text(value, { style, width, height });
}

export function Shape({ width = 24, height = 24, fill, line, borderRadius }) {
  return art.shape({ width, height, fill, line, borderRadius });
}

export function Panel({ child, children, ...props }) {
  const content = child ?? children ?? null;
  return art.panel(props, content);
}

export function Grid({ children = [], ...props }) {
  const content = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  const normalized = { columns: ["fr(1)"], ...props };
  if (normalized.columns) normalized.columns = normalized.columns.map(normalizeTrack);
  if (normalized.rows) normalized.rows = normalized.rows.map(normalizeTrack);
  if (!normalized.width && normalized.columns.some(isFrTrack)) normalized.width = "fill";
  if (!normalized.height && normalized.rows?.some(isFrTrack)) normalized.height = "fill";
  return art.grid(normalized, content);
}

export function Layers({ children = [], ...props }) {
  const content = Array.isArray(children) ? children.filter(Boolean) : [children].filter(Boolean);
  return art.layers(props, content);
}

function normalizeTrack(track) {
  if (typeof track !== "string") return track;
  if (track === "auto") return "auto";
  const legacyFrMatch = track.match(/^([-\d.]+)fr$/);
  if (legacyFrMatch) return art.fr(Number(legacyFrMatch[1]));
  const legacyPxMatch = track.match(/^([-\d.]+)px$/);
  if (legacyPxMatch) return art.fixed(Number(legacyPxMatch[1]));
  const frMatch = track.match(/^fr\(([-\d.]+)\)$/);
  if (frMatch) return art.fr(Number(frMatch[1]));
  const fixedMatch = track.match(/^fixed\(([-\d.]+)\)$/);
  if (fixedMatch) return art.fixed(Number(fixedMatch[1]));
  return track;
}

function isFrTrack(track) {
  return Boolean(track && typeof track === "object" && track.mode === "fr");
}
