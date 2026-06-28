import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { EstimateWithRelations } from "@/types";
import { ESTIMATE_DISCLAIMER, COST_CATEGORIES } from "@/types";
import { APP_NAME } from "@/lib/constants";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#555" },
  section: { marginTop: 16, marginBottom: 8 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#333",
    fontWeight: "bold",
    fontSize: 12,
  },
  disclaimer: {
    marginTop: 24,
    padding: 10,
    backgroundColor: "#f5f5f5",
    fontSize: 8,
    color: "#666",
  },
  meta: { fontSize: 9, color: "#666", marginBottom: 2 },
});

function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

interface EstimateReportProps {
  estimate: EstimateWithRelations;
}

function EstimateReportDocument({ estimate }: EstimateReportProps) {
  const { project, assumptions, line_items, category_totals, total_cost, currency } =
    estimate;

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{APP_NAME} — Draft Estimate</Text>
          <Text style={styles.subtitle}>{project.name}</Text>
          <Text style={styles.meta}>
            {project.city}, {project.state} · {project.project_type}
          </Text>
          <Text style={styles.meta}>
            Generated: {new Date(estimate.created_at).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assumptions</Text>
          <Text style={styles.meta}>
            {assumptions.summary ?? "AI-generated scope assumptions"}
          </Text>
          {assumptions.gross_sqft ? (
            <Text style={styles.meta}>
              Gross area: {assumptions.gross_sqft.toLocaleString()} sq ft ·{" "}
              {assumptions.stories ?? 1} story
            </Text>
          ) : null}
          {assumptions.confidence_overall != null ? (
            <Text style={styles.meta}>
              Confidence: {(assumptions.confidence_overall * 100).toFixed(0)}%
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cost Summary by Category</Text>
          {COST_CATEGORIES.map((cat) => (
            <View key={cat} style={styles.row}>
              <Text>{cat}</Text>
              <Text>{formatMoney(category_totals[cat] ?? 0, currency)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text>Total Estimated Cost</Text>
            <Text>{formatMoney(total_cost, currency)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          {line_items.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text>
                [{item.category}] {item.description} — {item.quantity} {item.unit}
              </Text>
              <Text>{formatMoney(item.total_cost, currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Text>{ESTIMATE_DISCLAIMER}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderEstimatePdf(
  estimate: EstimateWithRelations
): Promise<Buffer> {
  return renderToBuffer(<EstimateReportDocument estimate={estimate} />);
}
