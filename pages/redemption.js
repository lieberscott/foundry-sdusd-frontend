import { LineChart } from "../components/ui/chart";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "../components/ui/button";
import { ViewNft } from "../components/ui/viewNft";
import Link from 'next/link';


export default function Redemption() {
  return <LineChart ethPrice={ethPrice} supplyOfSdusd={supplyOfSdusd} ethBalanceOfSdusdContract={ ethBalanceOfSdusdContract } />;
}