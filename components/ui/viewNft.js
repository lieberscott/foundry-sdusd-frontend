import { useState, useEffect } from "react";

export function ViewNft(props) {

    const { sdnftContract } = props;

    const [index, setIndex] = useState(-1);
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
      if (!sdnftContract) return;

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
