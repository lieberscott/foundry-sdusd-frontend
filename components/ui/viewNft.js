import { useState, useEffect } from "react";

export function ViewNft(props) {

    const { sdnftContract } = props;

    console.log("Sdnft contract : ", sdnftContract);

    const [index, setIndex] = useState(0);
    const [nftText, setNftText] = useState("");


    const handleChange = (e) => {
      setIndex(e.target.value);
    };

    const handleClick = () => {
      if (index >= 0 && index <= 9999) {
        viewNft(index);
      }
    }

    const viewNft = async (index) => {
      console.log("viewNft")
      if (!sdnftContract) return;

      console.log("after initial check")

      try {
        const nftRawText = await sdnftContract.tokenURI(index);
        console.log(nftRawText);
        setNftText(nftRawText);
      }
      catch (error) {
        console.log(error);
      }
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: "80px" }}>
            <h2>View NFT</h2>
            <p>Connect wallet to view</p>
            <div>
                <div>
                  <label>Index No.: </label>
                  <input
                    type="number"
                    name="number"
                    value={index}
                    onChange={handleChange}
                  />
                  <button onClick={handleClick}>View Nft</button>
                </div>
                <p style={{ whiteSpace: 'pre-wrap' }}>{nftText}</p>
            </div>
        </div>
    );
}
