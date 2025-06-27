import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { SDUSD_ADDRESS, SDNFT_ADDRESS, TIMELOCK_ADDRESS, SDUSDAO_ADDRESS } from '../utils'


// Replace with your contract ABIs and addresses
import SDUSD_ABI from '../abis/sdusdAbi.json'
import SDUSDAO_ABI from '../abis/sdusdaoAbi.json'

const SDUSDAO_ADDRESS = '0xYourGovernorAddress'

export default function Home() {
  const [signer, setSigner] = useState(null)
  const [newThreshold, setNewThreshold] = useState('')
  const [functionType, setFunctionType] = useState('changeMintingThreshold')


  const propose = async () => {
    const governor = new ethers.Contract(SDUSDAO_ADDRESS, SDUSDAO_ABI, signer)
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

  return (

      <Card>
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
          <Button onClick={propose}>Submit Proposal</Button>
        </CardContent>
      </Card>
  )
}
