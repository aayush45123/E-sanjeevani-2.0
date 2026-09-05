import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import styles from "./ShapContributionChart.module.css";
import { Info, TrendingUp, TrendingDown, HelpCircle } from "lucide-react";

/**
 * ShapContributionChart
 * Visualizes feature-level SHAP attributions as a horizontal bar chart.
 * - Positive contribution (teal) pushes the model toward this predicted disease.
 * - Negative contribution (rose) pushes the model away from this disease.
 */
export default function ShapContributionChart({
  contributions = [],
  predictedDisease = "Predicted Disease",
}) {
  if (!contributions || contributions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Info size={18} />
        <span>No specific symptom attributions available for this case.</span>
      </div>
    );
  }

  // Normalize data for Recharts: sort by absolute contribution descending
  const chartData = [...contributions]
    .map((item) => {
      const val = typeof item.value === "number" ? item.value : parseFloat(item.value) || 0;
      return {
        feature: item.feature || item.label,
        name: item.label || (item.feature ? item.feature.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Unknown"),
        value: val,
        absVal: Math.abs(val),
        direction: val >= 0 ? "positive" : "negative",
      };
    })
    .sort((a, b) => b.absVal - a.absVal);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPos = data.value >= 0;
      return (
        <div className={styles.tooltipCard}>
          <div className={styles.tooltipHeader}>
            <strong>{data.name}</strong>
          </div>
          <div className={styles.tooltipRow}>
            <span>SHAP Impact:</span>
            <strong style={{ color: isPos ? "#0ea5a4" : "#ef4444" }}>
              {isPos ? `+${data.value.toFixed(4)}` : data.value.toFixed(4)}
            </strong>
          </div>
          <p className={styles.tooltipDesc}>
            {isPos ? (
              <>
                <TrendingUp size={13} className={styles.iconPos} /> Increases likelihood of{" "}
                <strong>{predictedDisease}</strong>
              </>
            ) : (
              <>
                <TrendingDown size={13} className={styles.iconNeg} /> Decreases likelihood of{" "}
                <strong>{predictedDisease}</strong>
              </>
            )}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartWrapper}>
      <div className={styles.chartHeader}>
        <div>
          <h4 className={styles.chartTitle}>AI Clinical Feature Attribution (SHAP)</h4>
          <p className={styles.chartSubtitle}>
            How each active symptom influenced the AI prediction for <strong>{predictedDisease}</strong>
          </p>
        </div>
        <div className={styles.legendRow}>
          <span className={styles.legendItem}>
            <span className={styles.dotPos}></span>
            <span>Supports {predictedDisease}</span>
          </span>
          <span className={styles.legendItem}>
            <span className={styles.dotNeg}></span>
            <span>Points Away</span>
          </span>
        </div>
      </div>

      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={Math.max(220, chartData.length * 42)}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 10, right: 35, left: 10, bottom: 10 }}
          >
            <XAxis
              type="number"
              domain={["auto", "auto"]}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(v) => v.toFixed(2)}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fill: "#1e293b", fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: "#e2e8f0" }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={18}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value >= 0 ? "#0ea5a4" : "#f43f5e"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.explainerFooter}>
        <HelpCircle size={14} className={styles.infoIcon} />
        <span>
          <strong>How to interpret:</strong> SHAP (Shapley Additive Explanations) measures the exact marginal contribution of each reported symptom to the diagnostic confidence score.
        </span>
      </div>
    </div>
  );
}
