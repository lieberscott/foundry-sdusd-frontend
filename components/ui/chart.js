import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export function LineChart(props) {

    const { ethPrice, ethBalanceOfSdusdContract, supplyOfSdusd } = props;

    const [params, setParams] = useState({
        sdusdBeingRedeemed: 1000,
        degredationThreshold: 1.5,
        sdusdTotalSupply: 500000,
        priceOfEth: 2000,
        ethInSdusdContract: 1000
    });
    const [userAdjustedCollateralRatio, setUserAdjustedCollateralRatio] = useState(1);

    useEffect(() => {
      const userRedemptionRate = calculateR(params.sdusdBeingRedeemed, params.degredationThreshold, params.sdusdTotalSupply, params.priceOfEth, params.ethInSdusdContract);
      const userCollateralRatio = calculateCollateralRatio(params.sdusdBeingRedeemed, params.sdusdTotalSupply, params.priceOfEth, params.ethInSdusdContract, userRedemptionRate);
      setUserAdjustedCollateralRatio(userCollateralRatio.toFixed(3));
    }, [params])

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

    const redemptionParams = {
      sdusdBeingRedeemed: 1000,
      degredationThreshold: 1.5,
      sdusdTotalSupply: 2000000,
      priceOfEth: 2000,
      ethInSdusdContract: 1000
    }

    const pValues = Array.from({ length: 40 }, (_, i) => i * 100);
    const redemptionRates = pValues.map(p => calculateR(redemptionParams.sdusdBeingRedeemed, redemptionParams.degredationThreshold, redemptionParams.sdusdTotalSupply, p, redemptionParams.ethInSdusdContract));
    const xAxisValues = redemptionRates.map((r, i) => parseFloat(calculateCollateralRatio(redemptionParams.sdusdBeingRedeemed, redemptionParams.sdusdTotalSupply, pValues[i], redemptionParams.ethInSdusdContract, r)).toFixed(2));


    const currentCollateralRatio = calculateCollateralRatio(0, supplyOfSdusd == 0 ? 1 : supplyOfSdusd, ethPrice, parseFloat(ethBalanceOfSdusdContract), 0);


    const data = {
        labels: xAxisValues,
        datasets: [
            {
                label: "r Value",
                data: redemptionRates,
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
                  let xLabel = `Collateral ratio: ${context.label}`;
                  let yLabel = `Redemption rate: ${(context.raw * 100).toFixed(3) + "%"}`;
                  // let dLabel = `d: ${params.degredationThreshold}`;
                  // let uLabel = `u: ${params.sdusdTotalSupply}`;
                  // let pLabel = `Eth price: $${params.priceOfEth}`;
                  // let bLabel = `Eth balance in SDUSD contract: ${params.ethInSdusdContract}`;
                  return [xLabel, yLabel];
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
            <h2>Redemption rate of SDUSD based on collateral ratio</h2>
            <div>
              SDUSD <b>may depeg by design during times of extreme market drawdowns</b>.<br/>
              This occurs when the ETH amount in the SDUSD contract falls below a given threshold in relation to the amount of SDUSD minted. As deployed, this threshold is 150%.<br/>
              However:<br/>
              <ul>If the redemption rate falls below 1:1, it means the price of ETH has dropped massively, at least 60%+, and usually much higher (the exact percentage drop depends on how much SDUSD is minted)</ul>
              <ul>If a depeg occurs, on the way down, SDUSD will lose value <b>slower</b> than ETH</ul>
              <ul>Check the chart below. It shows the redemption rate given certain values.</ul>
            </div>
            <p>Collateral ratio is: (dollar value of ETH in SDUSD contract) / (SDUSD minted)</p>
            <p><b>Current collateral ratio: {currentCollateralRatio}</b></p>
            <Line data={data} options={options} />
            <div>
              <p>
                Adjust parameters:
              </p>
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
                <p>User-adjusted collateral Ratio: {userAdjustedCollateralRatio}</p>
            </div>
        </div>
    );
}
