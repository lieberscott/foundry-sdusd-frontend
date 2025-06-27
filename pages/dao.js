import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { SDUSD_ADDRESS, TIMELOCK_ADDRESS, SDUSDAO_ADDRESS } from '../utils'

// Replace with your contract ABIs and addresses
import SDUSD_ABI from '../abis/sdusdAbi.json'
import TIMELOCK_ABI from '../abis/timelockAbi.json'
import DAO_ABI from '../abis/sdusdaoAbi.json'

export default function Dao() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [address, setAddress] = useState(null)
  const [mintingThreshold, setMintingThreshold] = useState('')
  const [degeadationThreshold, setDegeadationThreshold] = useState('')
  const [votingPower, setVotingPower] = useState(null)

  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const newProvider = new ethers.providers.Web3Provider(window.ethereum)
      setProvider(newProvider)
    }
  }, [])

  const connectWallet = async () => {
    const accounts = await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    setSigner(signer)
    setAddress(accounts[0])
    await fetchValues(signer)
  }

  const fetchValues = async (signer) => {
    const sdusd = new ethers.Contract(SDUSD_ADDRESS, SDUSD_ABI, signer)
    const dao = new ethers.Contract(SDUSDAO_ADDRESS, DAO_ABI, signer)
    const mintThresh = await sdusd.mintingThreshold()
    const degThresh = await sdusd.degeadationThreshold()
    const votes = await dao.getVotes(await signer.getAddress())
    setMintingThreshold(mintThresh.toString())
    setDegeadationThreshold(degThresh.toString())
    setVotingPower(votes.toString())
  }

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <Card className="mb-4">
        <CardContent>
          <h1 className="text-xl font-bold mb-2">SDUSD DAO Dashboard</h1>
          {!address ? (
            <Button onClick={connectWallet}>Connect Wallet</Button>
          ) : (
            <div>
              <p>Connected as: {address}</p>
              <p>Voting Power: {votingPower}</p>
              <p>Minting Threshold: {mintingThreshold}</p>
              <p>Degeadation Threshold: {degeadationThreshold}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Link href="/proposals">
          <Button>View Proposals</Button>
        </Link>
        <Link href="/create">
          <Button>Create Proposal</Button>
        </Link>
      </div>
    </main>
  )
}
