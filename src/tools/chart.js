/**
 * Returns a deterministic mock Chart.js bar chart config.
 * @param {any} input - Passed through in meta.input.
 * @returns {Promise<{ type: string, data: { labels: string[], datasets: object[] }, options: object, meta: object }>}
 */
export async function ChartJsTool(input) {
  return {
    type: "bar",
    data: {
      labels: ["A", "B", "C", "D", "E"],
      datasets: [
        {
          label: "Values",
          data: [12, 19, 8, 15, 7],
          backgroundColor: "rgba(54, 1p62, 235, 0.5)",
          borderColor: "rgb(54, 162, 235)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
    },
    meta: {
      note: "Mock Chart.js config (fixed)",
      input,
    },
  };
}
