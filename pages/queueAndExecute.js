import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// Replace with your contract ABIs and addresses
import SDUSD_ABI from '../abis/SDUSD.json'
import TIMELOCK_ABI from '../abis/TimelockController.json'
import GOVERNOR_ABI from '../abis/Governor.json'

const SDUSD_ADDRESS = '0xYourSDUSDAddress'
const TIMELOCK_ADDRESS = '0xYourTimelockAddress'
const GOVERNOR_ADDRESS = '0xYourGovernorAddress'

export default function Home() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [address, setAddress] = useState(null)
  const [mintingThreshold, setMintingThreshold] = useState('')
  const [degeadationThreshold, setDegeadationThreshold] = useState('')
  const [votingPower, setVotingPower] = useState(null)
  const [proposals, setProposals] = useState([])
  const [proposalId, setProposalId] = useState(null)
  const [voteChoice, setVoteChoice] = useState(1)
  const [newThreshold, setNewThreshold] = useState('')
  const [functionType, setFunctionType] = useState('changeMintingThreshold')

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
    await fetchProposals(signer)
  }

  const fetchValues = async (signer) => {
    const sdusd = new ethers.Contract(SDUSD_ADDRESS, SDUSD_ABI, signer)
    const governor = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer)
    const threshold = await sdusd.mintingThreshold()
    const deg = await sdusd.degeadationThreshold()
    const votes = await governor.getVotes(await signer.getAddress())
    setMintingThreshold(threshold.toString())
    setDegeadationThreshold(deg.toString())
    setVotingPower(votes.toString())
  }

  const fetchProposals = async (signer) => {
    const governor = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer)
    const count = await governor.proposalCount?.() || 0
    const loadedProposals = []
    for (let i = 1; i <= count; i++) {
      try {
        const state = await governor.state(i)
        loadedProposals.push({ id: i, state })
      } catch {}
    }
    setProposals(loadedProposals)
  }

  const voteOnProposal = async () => {
    const governor = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer)
    const tx = await governor.castVote(proposalId, voteChoice)
    await tx.wait()
    alert('Vote cast!')
  }

  const propose = async () => {
    const governor = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer)
    const iface = new ethers.utils.Interface(SDUSD_ABI)
    const encodedFunction = iface.encodeFunctionData(functionType, [newThreshold])
    const tx = await governor.propose(
      [SDUSD_ADDRESS],
      [0],
      [encodedFunction],
      `Proposal to change ${functionType} to ${newThreshold}`
    )
    await tx.wait()
    alert('Proposal submitted!')
  }

  const queueProposal = async () => {
    const governor = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer)
    const iface = new ethers.utils.Interface(SDUSD_ABI)
    const encodedFunction = iface.encodeFunctionData(functionType, [newThreshold])
    const descriptionHash = ethers.utils.id(`Proposal to change ${functionType} to ${newThreshold}`)
    const tx = await governor.queue(
      [SDUSD_ADDRESS],
      [0],
      [encodedFunction],
      descriptionHash
    )
    await tx.wait()
    alert('Proposal queued!')
  }

  const executeProposal = async () => {
    const governor = new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, signer)
    const iface = new ethers.utils.Interface(SDUSD_ABI)
    const encodedFunction = iface.encodeFunctionData(functionType, [newThreshold])
    const descriptionHash = ethers.utils.id(`Proposal to change ${functionType} to ${newThreshold}`)
    const tx = await governor.execute(
      [SDUSD_ADDRESS],
      [0],
      [encodedFunction],
      descriptionHash
    )
    await tx.wait()
    alert('Proposal executed!')
  }

  return (
    <main className="p-4 max-w-3xl mx-auto">

      <Card className="mb-4">
        <CardContent>
          <h2 className="text-lg font-semibold mb-2">Create Proposal</h2>
          <div className="mb-2">
            <select
              value={functionType}
              onChange={(e) => setFunctionType(e.target.value)}
              className="border p-1"
            >
              <option value="changeMintingThreshold">Change Minting Threshold</option>
              <option value="changeDegeadationThreshold">Change Degeadation Threshold</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="New value"
            value={newThreshold}
            onChange={(e) => setNewThreshold(e.target.value)}
            className="border p-1 mr-2"
          />
          <Button onClick={propose} className="mr-2">Submit Proposal</Button>
          <Button onClick={queueProposal} className="mr-2">Queue</Button>
          <Button onClick={executeProposal}>Execute</Button>
        </CardContent>
      </Card>
    </main>
  )
}
