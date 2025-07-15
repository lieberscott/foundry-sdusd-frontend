import { LineChart } from "../components/ui/chart";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "../components/ui/button";
import { ViewNft } from "../components/ui/viewNft";
import Link from 'next/link';
import { useRouter } from 'next/router';


export default function Redemption() {

  const router = useRouter();
  const { ethPrice, ethBalanceOfSdusdContract, supplyOfSdusd } = router.query;

  return (
    <div>
      <Link href="/">Home</Link>
      <LineChart ethPrice={ethPrice} supplyOfSdusd={supplyOfSdusd} ethBalanceOfSdusdContract={ ethBalanceOfSdusdContract } />
    </div>);
}