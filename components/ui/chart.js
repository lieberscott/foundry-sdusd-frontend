import { useState } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function LineChart() {
    const [params, setParams] = useState({
        x: 1000,
        d: 1.5,
        u: 2000000,
        p: 2000,
        b: 1000
    });

    const calculateR = (x, d, u, p, b) => {
        const numerator = (-x) + Math.sqrt((x * x) - 4 * d * (u - x) * (-p * b));
        const denominator = 2 * d * (u - x);
        return numerator / denominator > 1 ? 1 : numerator / denominator;
    };

    const calculateCollateralRatio = (x, u, p, b, r) => {

      const numerator = (p * b) - (x * r);
      const denominator = u - x;

      return numerator / denominator;
    }

    // const xValues = Array.from({ length: 10 }, (_, i) => i * 100);
    // const rValues = xValues.map(x => calculateR(x, params.d, params.u, params.p, params.b));
    // const xAxisValues = xValues.map((x, i) => ((params.p * params.b) - (x * rValues[i])) / (params.u - x));

    const pValues = Array.from({ length: 40 }, (_, i) => i * 100);
    const rValues = pValues.map(p => calculateR(params.x, params.d, params.u, p, params.b));
    const xAxisValues = rValues.map((r, i) => parseFloat(calculateCollateralRatio(params.x, params.u, pValues[i], params.b, r)).toFixed(2));

    const data = {
        labels: xAxisValues,
        datasets: [
            {
                label: "r Value",
                data: rValues,
                borderColor: "#007bff",
                backgroundColor: "rgba(0, 123, 255, 0.5)",
                fill: false,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#ff0000",
            },
        ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
          tooltip: {
              enabled: true,
              intersect: false,
              mode: 'nearest',
              callbacks: {
                label: function (context) {
                  let xLabel = `X: ${context.label}`;
                  let yLabel = `R: ${context.raw.toFixed(3)}`;
                  let dLabel = `d: ${params.d}`;
                  let uLabel = `u: ${params.u}`;
                  let pLabel = `p: ${params.p}`;
                  let bLabel = `b: ${params.b}`;
                  return [xLabel, yLabel, dLabel, uLabel, pLabel, bLabel];
                },
              },
          },
      },
      hover: {
          mode: 'nearest',
          intersect: false,
      },
      scales: {
          x: {
            title: {
              display: true,
              text: "Collateral ratio",
            },
              grid: {
                  drawOnChartArea: false,
                  drawTicks: false,
              },
          },
          y: {
            title: {
              display: true,
              text: "Redemption rate",
            },
              grid: {
                  drawOnChartArea: false,
                  drawTicks: false,
              },
          },
      },
  };

    const handleChange = (e) => {
        setParams({ ...params, [e.target.name]: parseFloat(e.target.value) });
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2>Line Chart of r</h2>
            <Line data={data} options={options} />
            <div>
                {Object.keys(params).map((key) => (
                    <div key={key}>
                        <label>{key}: </label>
                        <input
                            type="number"
                            name={key}
                            value={params[key]}
                            onChange={handleChange}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
