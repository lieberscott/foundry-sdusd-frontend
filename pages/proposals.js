import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SDUSD_ADDRESS, SDNFT_ADDRESS, TIMELOCK_ADDRESS, SDUSDAO_ADDRESS } from '../utils'

// Replace with your contract ABIs and addresses
import SDUSD_ABI from '../abis/SDUSD.json'
import TIMELOCK_ABI from '../abis/timelockAbi.json'
import DAO_ABI from '../abis/sdusdaoAbi.json'

export default function Proposals() {
  const [signer, setSigner] = useState(null)
  const [proposals, setProposals] = useState([])
  const [proposalId, setProposalId] = useState(null)
  const [voteChoice, setVoteChoice] = useState(1)


  const voteOnProposal = async () => {
    const dao = new ethers.Contract(SDUSDAO_ADDRESS, DAO_ABI, signer)
    const tx = await dao.castVote(proposalId, voteChoice)
    await tx.wait()
    alert('Vote cast!')
  }

  return (

    <Card className="mb-4">
      <CardContent>
        <h2 className="text-lg font-semibold mb-2">Proposals</h2>
        {proposals.map((p) => (
          <div key={p.id} className="mb-2">
            <p>Proposal ID: {p.id}</p>
            <p>Status: {p.state}</p>
          </div>
        ))}
        <div className="mt-4">
          <input
            type="number"
            placeholder="Proposal ID"
            value={proposalId || ''}
            onChange={(e) => setProposalId(e.target.value)}
            className="border p-1 mr-2"
          />
          <select onChange={(e) => setVoteChoice(Number(e.target.value))}>
            <option value={1}>For</option>
            <option value={0}>Against</option>
            <option value={2}>Abstain</option>
          </select>
          <Button className="ml-2" onClick={voteOnProposal}>Vote</Button>
        </div>
      </CardContent>
    </Card>
  )
}
