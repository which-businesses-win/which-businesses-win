import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

import type { DealMemoFullPayload } from "@/lib/deals/memoPayload";

const C = {
  ink: "#111111",
  muted: "#444444",
  line: "#d4d4d4",
  green: "#166534",
  red: "#b91c1c",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingBottom: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.ink,
    lineHeight: 1.45,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  logoMark: {
    width: 11,
    height: 11,
    backgroundColor: C.ink,
    marginRight: 9,
    marginTop: 2,
  },
  brandName: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  brandTagline: {
    fontSize: 8,
    color: C.muted,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  docTitle: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 8,
  },
  dealTitle: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 6,
  },
  dateLine: {
    fontSize: 10,
    color: C.muted,
    marginBottom: 22,
  },
  rule: {
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    marginBottom: 18,
  },
  sectionLabel: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    marginTop: 12,
    marginBottom: 6,
  },
  body: {
    fontSize: 10,
    color: C.ink,
    lineHeight: 1.5,
  },
  bodyRisk: {
    fontSize: 10,
    color: C.red,
    lineHeight: 1.5,
  },
  signalBox: {
    borderWidth: 1,
    borderColor: C.line,
    padding: 12,
    marginBottom: 4,
  },
  signalTitle: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    marginBottom: 8,
  },
  signalLine: {
    fontSize: 10,
    marginBottom: 3,
  },
  scenarioBlock: {
    marginTop: 6,
    marginBottom: 4,
  },
  scenarioTitle: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 1.8,
    marginBottom: 8,
  },
  scenarioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eeeeee",
  },
  scenarioName: {
    fontSize: 10,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  scenarioVal: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 11,
  },
  bull: { color: C.green },
  base: { color: C.ink },
  bear: { color: C.red },
});

function Paragraphs({
  text,
  variant,
}: {
  text: string;
  variant: "body" | "risk";
}) {
  const style = variant === "risk" ? styles.bodyRisk : styles.body;
  const parts = text.split(/\n/).filter((l) => l.length > 0);
  return (
    <>
      {parts.map((line, i) => (
        <Text key={i} style={[style, i > 0 ? { marginTop: 3 } : {}]}>
          {line}
        </Text>
      ))}
    </>
  );
}

function cityLabel(
  locationDisplay: string,
  canonical: string | null,
): string {
  if (canonical && canonical !== "UK") return canonical;
  const t = locationDisplay.trim();
  if (!t) return "UK";
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/** Drop repeated bull/base/bear lines when we render the IRR table. */
function scenarioNarrativeOnly(scenariosText: string): string {
  const parts = scenariosText.split(/\n\n+/);
  if (parts.length >= 2) return parts.slice(1).join("\n\n").trim();
  return scenariosText;
}

export function MemoPdfDocument({
  payload,
}: {
  payload: DealMemoFullPayload;
}) {
  const { memo, dealDisplayName, locationDisplay, signalImpact, sensitivity } =
    payload;
  const m = memo.sections;

  const bull = sensitivity?.scenarios.find((x) => x.name === "Bull Case");
  const base = sensitivity?.scenarios.find((x) => x.name === "Base Case");
  const bear = sensitivity?.scenarios.find((x) => x.name === "Bear Case");

  const drivers = signalImpact?.driverHints.slice(0, 3) ?? [];

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.brandRow} fixed>
          <View style={styles.logoMark} />
          <View>
            <Text style={styles.brandName}>PlanSureAI</Text>
            <Text style={styles.brandTagline}>
              Market Intelligence for Development Finance
            </Text>
          </View>
        </View>

        <Text style={styles.docTitle}>Investment Memorandum</Text>
        <Text style={styles.dealTitle}>{dealDisplayName}</Text>
        <Text style={styles.dateLine}>Date: {payload.dateLabel}</Text>
        <View style={styles.rule} />

        <Text style={styles.sectionLabel}>1. Executive summary</Text>
        <Paragraphs text={memo.summary} variant="body" />

        <Text style={styles.sectionLabel}>2. Deal overview</Text>
        <Paragraphs text={m.overview} variant="body" />

        {signalImpact ? (
          <View style={styles.signalBox} wrap={false}>
            <Text style={styles.signalTitle}>Market signals impact</Text>
            <Text style={[styles.signalLine, { color: C.green }]}>
              + {signalImpact.geoLabel} — {cityLabel(locationDisplay, signalImpact.canonicalLocation)} (
              {Math.round(signalImpact.geoScore)})
            </Text>
            <Text style={[styles.signalLine, { color: C.green }]}>
              + {signalImpact.sectorLabel} — sector ({Math.round(signalImpact.sectorScore)})
            </Text>
            <Text style={[styles.signalLine, { marginTop: 6 }]}>
              <Text
                style={{
                  fontFamily: "Helvetica",
                  fontWeight: "bold",
                  color: payload.irrAdjustment >= 0 ? C.green : C.red,
                }}
              >
                {payload.irrAdjustment >= 0 ? "+" : ""}
                {payload.irrAdjustment.toFixed(1)}% IRR uplift
              </Text>
              <Text> vs base case (signal overlay)</Text>
            </Text>
            {drivers.length > 0 ? (
              <>
                <Text style={[styles.body, { marginTop: 8 }]}>
                  Driven by:
                </Text>
                {drivers.map((d, i) => (
                  <Text key={i} style={styles.body}>
                    → {d}
                  </Text>
                ))}
              </>
            ) : null}
          </View>
        ) : (
          <View style={styles.signalBox} wrap={false}>
            <Text style={styles.signalTitle}>Market signals impact</Text>
            <Text style={[styles.body, { color: C.muted }]}>
              Sector mapping required — connect deal sector to live market data for
              geo/sector uplift and driver lines.
            </Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>3. Market context</Text>
        <Paragraphs text={m.market} variant="body" />

        <Text style={styles.sectionLabel}>4. Financials</Text>
        <Paragraphs text={m.financials} variant="body" />

        <Text style={styles.sectionLabel}>5. Risks</Text>
        <Paragraphs text={m.risks} variant="risk" />

        <Text style={styles.sectionLabel}>6. Scenario analysis</Text>
        {bear && base && bull ? (
          <View style={styles.scenarioBlock}>
            <Text style={styles.scenarioTitle}>IRR range</Text>
            <View style={styles.scenarioRow}>
              <Text style={styles.scenarioName}>Bear</Text>
              <Text style={[styles.scenarioVal, styles.bear]}>
                {bear.irr.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.scenarioRow}>
              <Text style={styles.scenarioName}>Base</Text>
              <Text style={[styles.scenarioVal, styles.base]}>
                {base.irr.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.scenarioRow}>
              <Text style={styles.scenarioName}>Bull</Text>
              <Text style={[styles.scenarioVal, styles.bull]}>
                {bull.irr.toFixed(1)}%
              </Text>
            </View>
          </View>
        ) : null}
        <Paragraphs
          text={
            bear && base && bull
              ? scenarioNarrativeOnly(m.scenarios)
              : m.scenarios
          }
          variant="body"
        />

        <Text style={styles.sectionLabel}>7. Recommendation</Text>
        <Paragraphs text={m.recommendation} variant="body" />
      </Page>
    </Document>
  );
}
