
// d(u-x)r² + xr - pb = 0
const d = 1.5; // degredation threshold
// const u = 625000; // sdusd minted
const x = 5000; // sdusd being redeemed
const p = 800; // price of ETH
// const b = 1000; // balance of ETH in SDUSD contract

const howManyPeople = () => {

  let u = 625000; // sdusd minted
  let b = 1000; // balance of ETH in SDUSD contract
  let usdValueOfEthInSdusdContract = p * b;

  let collateralRatio = usdValueOfEthInSdusdContract / u;
  // console.log("Starting collateral Ratio : ", collateralRatio);
  let numPeople = 0;
  let sdusdRedeemed = 0;

  while (collateralRatio < 1.5) {
  // while (numPeople < 1) {
    const rate = redemptionRate(u, usdValueOfEthInSdusdContract);
    const newNumerator = performRedemption(rate, usdValueOfEthInSdusdContract);

    // console.log("rate : ", rate);
    // console.log("newNumerator : ", newNumerator);
    
    u = u - x;
    usdValueOfEthInSdusdContract = newNumerator;

    numPeople++;
    collateralRatio = usdValueOfEthInSdusdContract / u;
    // console.log("collateralRatio : ", collateralRatio);
  }

  console.log("Number of people redeeming 5000 SDUSD before we re-reached 1.5 collateralization Ratio : ", numPeople);
  console.log("sdusdInCirculation : ", u);
  console.log("Dollar value of ETH in SDUSD contract : ", usdValueOfEthInSdusdContract);
  console.log("Ending Collateral ratio : ", collateralRatio);

}

const performRedemption = (_rate, _usdValueOfEthInSdusdContract) => {
  return _usdValueOfEthInSdusdContract - (_rate*x);
}


const redemptionRate = (_u, _usdValueOfEthInSdusdContract) => {
  // d(u-x)r² + xr - pb = 0

  const quadraticA = d*(_u-x);
  const quadraticB = x;
  const quadraticC = _usdValueOfEthInSdusdContract * -1;

  const numerator = -quadraticB + Math.sqrt((quadraticB * quadraticB) - 4 * quadraticA * quadraticC);
  const denominator = 2 * quadraticA;


  return numerator / denominator;

}

// How many people redeeming 5000 SDUSD at a time will it take
// before SDUSD is fully recollateralized
// This assumes a drop in ETH price from $2,500 to $800 and 625,000 SDUSD minted (100% capacity at $2,500 ETH price)
howManyPeople();