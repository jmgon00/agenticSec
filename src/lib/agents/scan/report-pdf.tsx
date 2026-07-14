import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer"
import type { CategoryCheckResult, ScanEstado } from "@/lib/agents/types"

export interface ScanReportInput {
  target: string
  summary: string
  findings: CategoryCheckResult[]
  generatedAt: Date
}

const ESTADO_COLORS: Record<ScanEstado, { background: string; color: string }> = {
  Aprobado: { background: "#22c55e", color: "#ffffff" },
  Fallido: { background: "#ef4444", color: "#ffffff" },
  Pendiente: { background: "#eab308", color: "#1f2937" },
  "No aplica": { background: "#6b7280", color: "#ffffff" },
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 100,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1f2937",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#030712",
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  brand: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#22d3ee",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#d1d5db",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#030712",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  summaryText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 8,
    marginBottom: 6,
  },
  rowMain: {
    flex: 1,
    paddingRight: 8,
  },
  point: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  result: {
    fontSize: 9,
    color: "#4b5563",
    marginBottom: 2,
  },
  evidence: {
    fontSize: 8,
    color: "#6b7280",
    marginBottom: 2,
  },
  recommendation: {
    fontSize: 8,
    color: "#4b5563",
    fontFamily: "Helvetica-Oblique",
  },
  badge: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
  },
})

export function ScanReportDocument({ target, summary, findings, generatedAt }: ScanReportInput) {
  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>AgenticSec</Text>
          <Text style={styles.title}>Reporte de Auditoría de Seguridad</Text>
          <Text style={styles.meta}>Target: {target}</Text>
          <Text style={styles.meta}>
            Generado: {generatedAt.toLocaleString("es-AR", { dateStyle: "long", timeStyle: "short" })}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>

        {findings.map((cat) => (
          <View key={cat.category} style={styles.section} wrap={false}>
            <Text style={styles.sectionTitle}>{cat.category}</Text>
            {cat.points.map((p, idx) => (
              <View key={idx} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.point}>{p.point}</Text>
                  <Text style={styles.result}>Resultado: {p.result}</Text>
                  <Text style={styles.evidence}>{p.evidence}</Text>
                  <Text style={styles.recommendation}>{p.recommendation}</Text>
                </View>
                <Text
                  style={[
                    styles.badge,
                    {
                      backgroundColor: ESTADO_COLORS[p.estado].background,
                      color: ESTADO_COLORS[p.estado].color,
                    },
                  ]}
                >
                  {p.estado}
                </Text>
              </View>
            ))}
          </View>
        ))}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages} · Este reporte fue generado automáticamente por un agente de IA como apoyo informativo y no reemplaza una auditoría de seguridad profesional completa.`
          }
        />
      </Page>
    </Document>
  )
}

export async function renderScanReportPdf(input: ScanReportInput): Promise<Buffer> {
  return renderToBuffer(<ScanReportDocument {...input} />)
}
