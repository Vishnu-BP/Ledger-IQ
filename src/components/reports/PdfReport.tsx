"use client";

/**
 * @file PdfReport.tsx — react-pdf Document for the LedgerIQ audit report.
 * @module components/reports
 *
 * Client-only. Used with PDFDownloadLink from @react-pdf/renderer.
 * Sections: header · P&L summary · top categories · GST summary · anomalies.
 *
 * @dependencies @react-pdf/renderer
 * @related PdfExportButton.tsx, lib/reports/buildReportData.ts
 */

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { ReportData } from "@/lib/reports";

const styles = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 40, color: "#111" },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#666" },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
    marginBottom: 8,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#555" },
  value: { fontFamily: "Helvetica-Bold" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 4,
    marginBottom: 2,
  },
  tableRow: { flexDirection: "row", padding: 4, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: "right" },
  anomalyItem: { marginBottom: 8, borderLeftWidth: 2, borderLeftColor: "#ef4444", paddingLeft: 8 },
  footer: { marginTop: 32, color: "#aaa", fontSize: 8, textAlign: "center" },
});

function fmt(n: string | number): string {
  return `₹${Number(n ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export function PdfReport({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.businessName}</Text>
          <Text style={styles.subtitle}>
            LedgerIQ Financial Report · Generated {new Date().toLocaleDateString("en-IN")}
          </Text>
        </View>

        {/* P&L Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Total Revenue</Text>
            <Text style={styles.value}>{fmt(data.totals.totalRevenue)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>GST Liability (Output Tax)</Text>
            <Text style={styles.value}>{fmt(data.totals.gstLiability)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Open Anomalies</Text>
            <Text style={styles.value}>{data.totals.openAnomalyCount}</Text>
          </View>
          {data.totals.cashRunwayDays != null && (
            <View style={styles.row}>
              <Text style={styles.label}>Cash Runway</Text>
              <Text style={styles.value}>{data.totals.cashRunwayDays} days</Text>
            </View>
          )}
        </View>

        {/* GSTR-3B */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GSTR-3B Summary</Text>
          <View style={styles.row}>
            <Text style={styles.label}>3.1 Taxable Sales</Text>
            <Text style={styles.value}>{fmt(data.gstr3b.outwardTaxableValue)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>3.1 Output GST</Text>
            <Text style={styles.value}>{fmt(data.gstr3b.outwardTax)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>4A Eligible ITC</Text>
            <Text style={styles.value}>{fmt(data.gstr3b.itcEligible)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>6.1 Net GST Payable</Text>
            <Text style={styles.value}>{fmt(data.gstr3b.netGstPayable)}</Text>
          </View>
        </View>

        {/* Top Categories */}
        {data.topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Expense Categories</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Category</Text>
              <Text style={styles.col2}>Total Spend</Text>
            </View>
            {data.topCategories.slice(0, 8).map((c) => (
              <View key={c.category} style={styles.tableRow}>
                <Text style={styles.col1}>{c.category}</Text>
                <Text style={styles.col2}>{fmt(c.total)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Anomalies */}
        {data.openAnomalies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Open Anomalies</Text>
            {data.openAnomalies.slice(0, 5).map((a, i) => (
              <View key={i} style={styles.anomalyItem}>
                <Text style={{ fontFamily: "Helvetica-Bold", marginBottom: 2 }}>{a.title}</Text>
                {a.ai_explanation && (
                  <Text style={{ color: "#555" }}>{a.ai_explanation.slice(0, 200)}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          Generated by LedgerIQ · AI-powered financial autopilot for Indian SMBs · For internal use only
        </Text>
      </Page>
    </Document>
  );
}
