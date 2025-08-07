import { useEffect, useState } from 'react'
import { ethers, Interface } from 'ethers'
// import { Button } from '../components/ui/button'
// import { Card, CardContent } from '../components/ui/card'
import Link from 'next/link'
import { SDUSD_ADDRESS, SDNFT_ADDRESS, TIMELOCK_ADDRESS, SDUSDAO_ADDRESS } from '../utils';


// Replace with your contract ABIs and addresses
import SDUSD_ABI from '../abis/sdusdAbi.json';
import SDNFT_ABI from '../abis/sdnftAbi.json';
import TIMELOCK_ABI from '../abis/timelockAbi.json';
import DAO_ABI from '../abis/sdusdaoAbi.json';

const stateMap = [
  "Pending",
  "Active",
  "Canceled",
  "Defeated",
  "Succeeded",
  "Queued",
  "Expired",
  "Executed"
]

export default function Dao() {
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [address, setAddress] = useState(null)
  const [mintingThreshold, setMintingThreshold] = useState('')
  const [degredationThreshold, setDegredationThreshold] = useState('')
  const [votingPower, setVotingPower] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [proposalId, setProposalId] = useState();
  const [functionType, setFunctionType] = useState("changeMintingThreshold");
  const [newThreshold, setNewThreshold] = useState(-1);
  const [voteChoice, setVoteChoice] = useState(1);
  const [delegateAddress, setDelegateAddress] = useState("");
  const [delegateStatus, setDelegateStatus] = useState("");

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
    setAddress(accounts[0]);
    setDelegateAddress(accounts[0]);
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
    setDegredationThreshold(degThresh.toString())
    setVotingPower(votes.toString())
  }

  const fetchProposals = async (signer) => {
    const provider = signer.provider // get the provider from the signer
    const currentBlock = await provider.getBlockNumber();

    // connect contract with provider (not signer) to use queryFilter
    const sdusdao = new ethers.Contract(SDUSDAO_ADDRESS, DAO_ABI, provider)

    const filter = sdusdao.filters.ProposalCreated();
    const events = await sdusdao.queryFilter(filter, 0, 'latest')

    const loadedProposals = await Promise.all(
      events.map(async (event) => {
        const proposalId = event.args[0];
        const proposer = event.args[1];
        const targets = event.args[2];
        const values = event.args[3];
        const calldatas = event.args[5];
        const startBlock = event.args[6];
        const endBlock = event.args[7];
        const description = event.args[8];

        console.log("StartBlock : ", startBlock);
        console.log("EndBlock : ", endBlock);

        const startBlockNum = Number(startBlock) || 0;
        const endBlockNum = Number(endBlock) || 0;

        console.log("StartBlockNum : ", startBlockNum);
        console.log("EndBlockNum : ", endBlockNum);

        // fetch state using signer-connected contract
        const sdusdaoWithSigner = sdusdao.connect(signer);
        const state = await sdusdaoWithSigner.state(proposalId);

        const stateNum = Number(state);

        console.log("state : ", state);
        console.log(typeof state);

        let blocksRemaining = 0;
        if (stateNum === 0) { // Pending
          blocksRemaining = startBlockNum - currentBlock
        } else if (stateNum === 1) { // Active
          blocksRemaining = endBlockNum - currentBlock
        }

        return {
          id: proposalId.toString(),
          proposer,
          targets,
          calldatas,
          values,
          description,
          state: stateNum,
          startBlock: startBlockNum,
          endBlock: endBlockNum,
          blocksRemaining
        }
      })
    )

    setProposals(loadedProposals)
  }

  const voteOnProposal = async () => {
    const governor = new ethers.Contract(SDUSDAO_ADDRESS, DAO_ABI, signer);
    const tx = await governor.castVote(proposalId, voteChoice);
    await tx.wait();
    alert('Vote cast!');
  }

  const handleDelegate = async () => {
    try {
      const sdusd = new ethers.Contract(SDUSD_ADDRESS, SDUSD_ABI, signer);
      const sdnft = new ethers.Contract(SDNFT_ADDRESS, SDNFT_ABI, signer);

      const finalDelegate = delegateAddress;

      setDelegateStatus("Submitting delegation transaction...");

      const tx1 = await sdusd.delegate(finalDelegate);
      await tx1.wait();
      const tx2 = await sdnft.delegate(finalDelegate);
      await tx2.wait();

      setDelegateStatus(`Delegated to ${finalDelegate} (will update after next block)`);
    } catch (err) {
      console.error(err);
      setDelegateStatus("Error: " + (err.reason || err.message));
    }
  };
  

  const propose = async () => {
    try {
      const sdusdao = new ethers.Contract(SDUSDAO_ADDRESS, DAO_ABI, signer);
      const iface = new Interface(SDUSD_ABI);
      const newThresholdInt = parseInt(newThreshold);
      console.log(newThresholdInt);
      const encodedFunction = iface.encodeFunctionData(functionType, [newThresholdInt]);

      console.log(functionType) // Must be EXACTLY the function name in ABI: "changeMintingThreshold"
      console.log(encodedFunction) // Should look like: 0xabcdef... with 64 trailing hex chars
      console.log(SDUSD_ADDRESS);
      console.log(SDUSDAO_ADDRESS);
      const blockNumber = await provider.getBlockNumber();
      const votingPower = await sdusdao.getVotes(await signer.getAddress(), blockNumber - 1);
      console.log("Voting power:", votingPower.toString());
      const tx = await sdusdao.propose(
        [SDUSD_ADDRESS],
        [0],
        [encodedFunction],
        `Proposal to change ${functionType} to ${newThreshold}`
      )
      await tx.wait()
      alert('Proposal submitted!')
    }
    catch (err) {
      console.error(err);
    }
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
    <main style={{ padding: '1rem', maxWidth: '48rem', margin: '0 auto' }}>
      <Link href="/">Home</Link>
      <div style={{ marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>SDUSD DAO Dashboard</h1>
          {!address ? (
            <button onClick={connectWallet}>Connect Wallet</button>
          ) : (
            <div>
              <p>Connected as: {address}</p>
              <p>Voting Power: {votingPower}</p>
              <p>Minting Threshold: {mintingThreshold}</p>
              <p>Degredation Threshold: {degredationThreshold}</p>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          padding: '1rem',
          backgroundColor: '#f3f4f6',
          borderRadius: '0.75rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '1rem',
        }}
      >
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Delegate Your Votes</h3>
        <p>You must delegate your voting stake, either to yourself or another address, before you can vote.</p>

        <input
          type="text"
          placeholder={address}
          value={delegateAddress}
          onChange={(e) => setDelegateAddress(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem',
            border: '1px solid #d1d5db',
            borderRadius: '0.375rem',
            marginBottom: '0.75rem',
          }}
        />

        <button
          onClick={handleDelegate}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            transition: 'background-color 0.2s ease',
          }}
        >
          Delegate
        </button>

        {delegateStatus && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>{delegateStatus}</p>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            padding: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            marginBottom: '1rem',
            flex: 1,
            minWidth: '300px',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Vote on proposals</h2>
          <p>Proposals can be voted on starting 1 week after being proposed</p>
          <p>Must have a minimum of 10,000 voting power to submit a proposal</p>
          <div style={{ marginTop: '1rem' }}>
            <input
              type="number"
              placeholder="Enter proposal ID"
              value={proposalId || ''}
              onChange={(e) => setProposalId(e.target.value)}
              style={{ border: '1px solid #d1d5db', padding: '0.25rem', marginRight: '0.5rem' }}
            />
            <select
              onChange={(e) => setVoteChoice(Number(e.target.value))}
              style={{ border: '1px solid #d1d5db', padding: '0.25rem', marginRight: '0.5rem' }}
            >
              <option value={1}>For</option>
              <option value={0}>Against</option>
              <option value={2}>Abstain</option>
            </select>
            <button
              onClick={voteOnProposal}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#16a34a',
                color: 'white',
                borderRadius: '0.375rem',
              }}
            >
              Vote
            </button>
          </div>

          {proposals.map((p) => (
            <div key={p.id} style={{ borderBottom: '1px solid #ccc', padding: '16px 0' }}>
              <p>
                <strong>Proposal ID:</strong> {p.id}
              </p>
              <p>
                <strong>Proposer:</strong> {p.proposer}
              </p>
              <p>
                <strong>Value:</strong> {p.values?.join(', ') || '0'}
              </p>
              <p>
                <strong>Description:</strong> {p.description}
              </p>
              <p>
                <strong>Status:</strong> {stateMap[p.state]}
              </p>
              {(p.state === 0 || p.state === 1) && (
                <p>
                  ⏳ {p.blocksRemaining} blocks remaining until{' '}
                  {p.state === 0 ? 'Active' : 'Voting Ends'}
                </p>
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            padding: '1rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            marginBottom: '1rem',
            flex: 1,
            minWidth: '300px',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>Create Proposal</h2>
          <div style={{ marginBottom: '0.5rem' }}>
            <select
              value={functionType}
              onChange={(e) => setFunctionType(e.target.value)}
              style={{ border: '1px solid #d1d5db', padding: '0.25rem' }}
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
            style={{ border: '1px solid #d1d5db', padding: '0.25rem', marginRight: '0.5rem' }}
          />
          <button
            onClick={propose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '0.375rem',
              marginRight: '0.5rem',
            }}
          >
            Submit Proposal
          </button>
          <button
            onClick={queueProposal}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ca8a04',
              color: 'white',
              borderRadius: '0.375rem',
              marginRight: '0.5rem',
            }}
          >
            Queue
          </button>
          <button
            onClick={executeProposal}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#15803d',
              color: 'white',
              borderRadius: '0.375rem',
            }}
          >
            Execute
          </button>
        </div>
      </div>
    </main>
  )
}
