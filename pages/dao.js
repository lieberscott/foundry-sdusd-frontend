import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
// import { Button } from '../components/ui/button'
// import { Card, CardContent } from '../components/ui/card'
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
  const [degredationThreshold, setDegeadationThreshold] = useState('')
  const [votingPower, setVotingPower] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [proposalId, setProposalId] = useState(-1);
  const [functionType, setFunctionType] = useState("changeMintingThreshold");
  const [newThreshold, setNewThreshold] = useState(-1);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const providerInstance = new ethers.BrowserProvider(window.ethereum);
      setProvider(providerInstance);
    }
  }, [])

  const connectWallet = async () => {
    const accounts = await provider.send('eth_requestAccounts', [])
    const signer = await provider.getSigner()
    setSigner(signer)
    setAddress(accounts[0])
    await fetchValues(signer);
    await fetchProposals(signer);
  }

  const fetchValues = async (signer) => {
    const sdusd = new ethers.Contract(SDUSD_ADDRESS, SDUSD_ABI, signer)
    const dao = new ethers.Contract(SDUSDAO_ADDRESS, DAO_ABI, signer);
    const blockNumber = await provider.getBlockNumber();
    const mintThresh = await sdusd.getEthCollateralRatio(); // also known as mintingThreshold
    const degThresh = await sdusd.getDegredationThreshold();
    console.log("blockNumber : ", parseInt(blockNumber));
    const votes = await dao.getVotes(await signer.getAddress(), blockNumber - 1);
    setMintingThreshold(mintThresh.toString())
    setDegeadationThreshold(degThresh.toString())
    setVotingPower(votes.toString())
  }

  const fetchProposals = async (signer) => {
    const sdusdao = new ethers.Contract(SDUSDAO_ADDRESS, DAO_ABI, signer)
    const count = await sdusdao.proposalCount?.() || 0
    const loadedProposals = []
    for (let i = 1; i <= count; i++) {
      try {
        const state = await sdusdao.state(i)
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
    const sdusdao = new ethers.Contract(SDUSDAO_ADDRESS, DAO_ABI, signer)
    const iface = new ethers.utils.Interface(SDUSD_ABI)
    const encodedFunction = iface.encodeFunctionData(functionType, [newThreshold])
    const tx = await sdusdao.propose(
      [SDUSD_ADDRESS],
      [0],
      [encodedFunction],
      `Proposal to change ${functionType} to ${newThreshold}`
    )
    await tx.wait()
    alert('Proposal submitted!')
  }


   const queueProposal = async () => {
    const sdusdao = new ethers.Contract(SDUSDAO_ADDRESS, DAO_ABI, signer)
    const iface = new ethers.utils.Interface(SDUSD_ABI)
    const encodedFunction = iface.encodeFunctionData(functionType, [newThreshold])
    const descriptionHash = ethers.utils.id(`Proposal to change ${functionType} to ${newThreshold}`)
    const tx = await sdusdao.queue(
      [SDUSD_ADDRESS],
      [0],
      [encodedFunction],
      descriptionHash
    )
    await tx.wait()
    alert('Proposal queued!')
  }

  const executeProposal = async () => {
    const sdusdao = new ethers.Contract(SDUSDAO_ADDRESS, DAO_ABI, signer)
    const iface = new ethers.utils.Interface(SDUSD_ABI)
    const encodedFunction = iface.encodeFunctionData(functionType, [newThreshold])
    const descriptionHash = ethers.utils.id(`Proposal to change ${functionType} to ${newThreshold}`)
    const tx = await sdusdao.execute(
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
      <Link href="/">Home</Link>
      <div className="mb-4">
        <div>
          <h1 className="text-xl font-bold mb-2">SDUSD DAO Dashboard</h1>
          {!address ? (
            <button onClick={connectWallet}>Connect Wallet</button>
          ) : (
            <div>
              <p>Connected as: {address}</p>
              <p>Voting Power: {votingPower}</p>
              <p>Minting Threshold: {mintingThreshold}</p>
              <p>Degeadation Threshold: {degredationThreshold}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-4">
          <div className="border rounded p-4 shadow mb-4">
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
              <select onChange={(e) => setVoteChoice(Number(e.target.value))} className="border p-1 mr-2">
                <option value={1}>For</option>
                <option value={0}>Against</option>
                <option value={2}>Abstain</option>
              </select>
              <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={voteOnProposal}>Vote</button>
            </div>
          </div>
         <div className="border rounded p-4 shadow mb-4">
          <h2 className="text-lg font-semibold mb-2">Create Proposal</h2>
          <div className="mb-2">
            <select
              value={functionType}
              onChange={(e) => setFunctionType(e.target.value)}
              className="border p-1"
            >
              <option value="changeMintingThreshold">Change Minting Threshold</option>
              <option value="changeDegredationThreshold">Change Degradation Threshold</option>
            </select>
          </div>
          <input
            type="text"
            placeholder="New value"
            value={newThreshold}
            onChange={(e) => setNewThreshold(e.target.value)}
            className="border p-1 mr-2"
          />
          <button onClick={propose} className="px-4 py-2 bg-blue-600 text-white rounded mr-2">Submit Proposal</button>
          <button onClick={queueProposal} className="px-4 py-2 bg-yellow-600 text-white rounded mr-2">Queue</button>
          <button onClick={executeProposal} className="px-4 py-2 bg-green-700 text-white rounded">Execute</button>
        </div>
      </div>
    </main>
  )
}
