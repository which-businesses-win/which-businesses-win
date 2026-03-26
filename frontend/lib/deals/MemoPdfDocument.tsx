import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

import type { DealMemoFullPayload } from "@/lib/deals/memoPayload";

/** Institutional palette — black / white / minimal accent */
const C = {
  ink: "#0a0a0a",
  muted: "#525252",
  line: "#e5e5e5",
  green: "#14532d",
  red: "#991b1b",
};

const styles = StyleSheet.create({
  coverPage: {
    padding: 48,
    paddingBottom: 56,
    fontFamily: "Helvetica",
  },
  contentPage: {
    padding: 40,
    paddingBottom: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: C.ink,
    lineHeight: 1.42,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 36,
  },
  logoMark: {
    width: 10,
    height: 10,
    backgroundColor: C.ink,
    marginRight: 10,
  },
  brandName: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 13,
    letterSpacing: 0.5,
    color: C.ink,
  },
  brandTagline: {
    fontSize: 7,
    color: C.muted,
    marginTop: 3,
    letterSpacing: 0.2,
    maxWidth: 280,
  },
  docTitle: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2.4,
    color: C.ink,
    marginBottom: 14,
  },
  dealTitle: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 10,
    color: C.ink,
    letterSpacing: -0.3,
  },
  dateLine: {
    fontSize: 10,
    color: C.muted,
    marginBottom: 0,
  },
  coverRule: {
    marginTop: 28,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  coverFooter: {
    marginTop: 48,
    fontSize: 8,
    color: C.muted,
    letterSpacing: 0.4,
  },
  sectionLabel: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: C.ink,
    marginTop: 14,
    marginBottom: 7,
  },
  sectionLabelFirst: {
    marginTop: 0,
  },
  body: {
    fontSize: 10,
    color: C.ink,
    lineHeight: 1.48,
  },
  bodyRisk: {
    fontSize: 10,
    color: C.red,
    lineHeight: 1.48,
  },
  signalBox: {
    borderWidth: 1,
    borderColor: C.line,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: "#fafafa",
  },
  signalTitle: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 10,
    color: C.ink,
  },
  signalLine: {
    fontSize: 10,
    marginBottom: 4,
    color: C.green,
  },
  signalUplift: {
    marginTop: 8,
    marginBottom: 6,
    fontSize: 10,
  },
  signalDriven: {
    fontSize: 9,
    color: C.muted,
    marginBottom: 4,
    marginTop: 4,
  },
  driverLine: {
    fontSize: 10,
    color: C.ink,
    marginBottom: 2,
  },
  scenarioBlock: {
    marginTop: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.line,
    padding: 12,
  },
  scenarioTitle: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 10,
    color: C.ink,
  },
  scenarioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f0f0f0",
  },
  scenarioRowLast: {
    borderBottomWidth: 0,
  },
  scenarioName: {
    fontSize: 10,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
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

function sectorHeadlineName(
  sector: NonNullable<DealMemoFullPayload["sector"]>,
): string {
  return sector.displayTitle ?? sector.name;
}

function scenarioNarrativeOnly(scenariosText: string): string {
  const parts = scenariosText.split(/\n\n+/);
  if (parts.length >= 2) return parts.slice(1).join("\n\n").trim();
  return scenariosText;
}

function driverBullets(payload: DealMemoFullPayload): string[] {
  const hints = payload.signalImpact?.driverHints ?? [];
  if (hints.length > 0) return hints.slice(0, 4);
  const dr = payload.sector?.drivers ?? [];
  if (dr.length > 0) return dr.slice(0, 4).map((d) => d.title);
  return ["See market context section."];
}

export function MemoPdfDocument({
  payload,
}: {
  payload: DealMemoFullPayload;
}) {
  const { memo, dealDisplayName, locationDisplay, signalImpact, sensitivity, sector } =
    payload;
  const m = memo.sections;

  const bull = sensitivity?.scenarios.find((x) => x.name === "Bull Case");
  const base = sensitivity?.scenarios.find((x) => x.name === "Base Case");
  const bear = sensitivity?.scenarios.find((x) => x.name === "Bear Case");

  const drivers = driverBullets(payload);
  const sectorTitle = sector ? sectorHeadlineName(sector) : "Sector";

  return (
    <Document>
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.brandRow}>
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
        <View style={styles.coverRule} />
        <Text style={styles.coverFooter}>Confidential · For professional use only</Text>
      </Page>

      <Page size="A4" style={styles.contentPage} wrap>
        <Text style={[styles.sectionLabel, styles.sectionLabelFirst]}>
          1. Executive summary
        </Text>
        <Paragraphs text={memo.summary} variant="body" />

        <Text style={styles.sectionLabel}>2. Deal overview</Text>
        <Paragraphs text={m.overview} variant="body" />

        {signalImpact ? (
          <View style={styles.signalBox} wrap={false}>
            <Text style={styles.signalTitle}>Signal impact</Text>
            <Text style={styles.signalLine}>
              + {signalImpact.geoLabel} — {cityLabel(locationDisplay, signalImpact.canonicalLocation)}{" "}
              ({Math.round(signalImpact.geoScore)})
            </Text>
            <Text style={styles.signalLine}>
              + {signalImpact.sectorLabel} — {sectorTitle} ({Math.round(signalImpact.sectorScore)})
            </Text>
            <Text style={styles.signalUplift}>
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
              <Text style={{ color: C.muted }}> driven by:</Text>
            </Text>
            {drivers.map((d, i) => (
              <Text key={i} style={styles.driverLine}>
                → {d}
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.signalBox} wrap={false}>
            <Text style={styles.signalTitle}>Signal impact</Text>
            <Text style={[styles.body, { color: C.muted }]}>
              Sector mapping required — connect deal.sector to live market data for signal
              overlay and driver lines.
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
              <Text style={[styles.scenarioVal, styles.bear]}>{bear.irr.toFixed(1)}%</Text>
            </View>
            <View style={styles.scenarioRow}>
              <Text style={styles.scenarioName}>Base</Text>
              <Text style={[styles.scenarioVal, styles.base]}>{base.irr.toFixed(1)}%</Text>
            </View>
            <View style={[styles.scenarioRow, styles.scenarioRowLast]}>
              <Text style={styles.scenarioName}>Bull</Text>
              <Text style={[styles.scenarioVal, styles.bull]}>{bull.irr.toFixed(1)}%</Text>
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
