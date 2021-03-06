import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { connectWallet } from "../../redux/blockchain/blockchainActions";
import { fetchData } from "./../../redux/data/dataActions";
import * as s from "./../../styles/globalStyles";
import whitelistAddresses from "../walletAddresses";
import earlyAccessAddresses from "../walletAddressesEarlyAccess";
import Loader from "../../components/Loader/loader";
// Add this import line at the top
import { CrossmintPayButton } from "@crossmint/client-sdk-react-ui";

import bg from "../../assests/images/bg.png";
import mbg from "../../assests/images/m-bg.png";
import paper from "../../assests/images/paper.png";
import mpaper from "../../assests/images/m-paper.png";
import token from "../../assests/images/token.png";
import mtoken from "../../assests/images/m-token.png";
import btn from "../../assests/images/btn.png";
import mint from "../../assests/images/mint.png";
import Connectwallet from "../../assests/images/Connect_Wallet.png";
import phase0 from "../../assests/images/phase-00.png";
import phase1 from "../../assests/images/phase-01.png";
import phase2 from "../../assests/images/phase-02.png";
import phase3 from "../../assests/images/phase-03.png";
import btnOpenSea from "../../assests/images/btn-opensea.png";
import mintWithCard from "../../assests/images/btn-mintCard.png";

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(
  "https://eth-mainnet.alchemyapi.io/v2/pBY3syVarS-tO2ZAQlA3uWBq_OqzwIDw"
);
var Web3 = require("web3");
var Contract = require("web3-eth-contract");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

// Whitelist MerkleTree
const leafNodes = whitelistAddresses.map((addr) => keccak256(addr));
const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
const rootHash = merkleTree.getRoot();
console.log("Allowlist Merkle Tree\n", merkleTree.toString());

// EarlyAccess MerkleTree
const leafNodesEarly = earlyAccessAddresses.map((addr) => keccak256(addr));
const merkleTreeEarly = new MerkleTree(leafNodesEarly, keccak256, {
  sortPairs: true,
});
const rootHashEarly = merkleTreeEarly.getRoot();

function Home() {
  const dispatch = useDispatch();
  const blockchain = useSelector((state) => state.blockchain);
  const data = useSelector((state) => state.data);
  const [claimingNft, setClaimingNft] = useState(false);
  const [mintDone, setMintDone] = useState(false);
  const [supply, setTotalSupply] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [statusAlert, setStatusAlert] = useState("");
  const [mintAmount, setMintAmount] = useState(1);
  const [displayCost, setDisplayCost] = useState(0.0);
  const [state, setState] = useState(-1);
  const [nftCost, setNftCost] = useState(-1);
  const [canMintFree, setCanMintFree] = useState(false);
  const [canMintWL, setCanMintWL] = useState(false);
  const [disable, setDisable] = useState(false);
  const [max, setMax] = useState(0);
  const [loading, setLoading] = useState(true);
  const [proof, setProof] = useState([]);
  const [totalMint, setTotalMint] = useState(0);
  const [CONFIG, SET_CONFIG] = useState({
    CONTRACT_ADDRESS: "",
    SCAN_LINK: "",
    NETWORK: {
      NAME: "",
      SYMBOL: "",
      ID: 0,
    },
    NFT_NAME: "",
    SYMBOL: "",
    MAX_SUPPLY: 1,
    WEI_COST: 0,
    DISPLAY_COST: 0,
    GAS_LIMIT: 0,
    MARKETPLACE: "",
    MARKETPLACE_LINK: "",
    SHOW_BACKGROUND: false,
  });

  let countDownDate = new Date("2022-07-15T18:30:00-0800");

  let now = new Date().getTime();
  let timeleft = countDownDate - now;

  const [days, setDays] = useState();
  const [hours, setHour] = useState();
  const [minutes, setMint] = useState();
  const [seconds, setSec] = useState();

  const claimNFTs = async () => {
    let cost = nftCost;
    cost = Web3.utils.toWei(String(cost), "ether");

    let gasLimit = CONFIG.GAS_LIMIT;
    let totalCostWei = String(cost * mintAmount);
    let totalGasLimit = String(gasLimit * mintAmount);
    setFeedback(`Minting your ${CONFIG.NFT_NAME}`);
    setClaimingNft(true);
    setLoading(true);

    blockchain.smartContract.methods
      .mint(mintAmount, proof)
      .send({
        gasLimit: String(totalGasLimit),
        to: CONFIG.CONTRACT_ADDRESS,
        from: blockchain.account,
        value: totalCostWei,
      })
      .once("error", (err) => {
        console.log(err);
        setFeedback("Sorry, something went wrong please try again later.");
        setClaimingNft(false);
        setLoading(false);
      })
      .then((receipt) => {
        setLoading(false);
        setMintDone(true);
        setFeedback(`Congratulation, your mint is successful.`);
        setClaimingNft(false);
        blockchain.smartContract.methods
          .totalSupply()
          .call()
          .then((res) => {
            setTotalSupply(res);
          });
        dispatch(fetchData(blockchain.account));
        getData();
      });
  };

  const decrementMintAmount = () => {
    let newMintAmount = mintAmount - 1;
    if (newMintAmount < 1) {
      newMintAmount = 1;
    }
    setMintAmount(newMintAmount);
    setDisplayCost(parseFloat(nftCost * newMintAmount).toFixed(2));
  };

  const incrementMintAmount = () => {
    let newMintAmount = mintAmount + 1;
    newMintAmount > max ? (newMintAmount = max) : newMintAmount;
    setDisplayCost(parseFloat(nftCost * newMintAmount).toFixed(2));
    setMintAmount(newMintAmount);
  };

  const maxNfts = () => {
    setMintAmount(max);
    setDisplayCost(parseFloat(nftCost * max).toFixed(2));
  };

  const getData = async () => {
    if (blockchain.account !== "" && blockchain.smartContract !== null) {
      dispatch(fetchData(blockchain.account));
      const totalSupply = await blockchain.smartContract.methods
        .totalSupply()
        .call();
      setTotalSupply(totalSupply);
      let currentState = await blockchain.smartContract.methods
        .currentState()
        .call();
      setState(currentState);

      //  no of nfts minted by user
      let nftMintedByUser = await blockchain.smartContract.methods
        .mintableAmountForUser(blockchain.account)
        .call();
      setMax(nftMintedByUser);
      console.log({ nftMintedByUser });

      // Nft states
      if (currentState == 1) {
        let canMint = await blockchain.smartContract.methods
          .hasMintPass(blockchain.account)
          .call();
        console.log({ canMint });
        setCanMintFree(canMint);
        if (canMint) {
          setCanMintFree(canMint);
          setFeedback(
            `Welcome, you can mint up to ${nftMintedByUser} NFTs per transaction`
          );
        } else {
          setFeedback(`Sorry, You don't have Mint Pass`);
          setDisable(true);
        }
      } else if (currentState == 2) {
        const claimingAddress = keccak256(blockchain.account);
        // `getHexProof` returns the neighbour leaf and all parent nodes hashes that will
        // be required to derive the Merkle Trees root hash.
        const hexProof = merkleTree.getHexProof(claimingAddress);
        setProof(hexProof);
        let mintWL = merkleTree.verify(hexProof, claimingAddress, rootHash);
        let mintWLContractMethod = await blockchain.smartContract.methods
          .isWhitelisted(blockchain.account, hexProof)
          .call();
        let canMint = await blockchain.smartContract.methods
          .hasMintPass(blockchain.account)
          .call();
        if ((mintWLContractMethod && mintWL) || canMint) {
          setCanMintWL(mintWL);
          setFeedback(
            `Welcome Allowlist Member, you can mint up to ${nftMintedByUser} NFTs`
          );
        } else {
          setFeedback(
            `Sorry, You don't have Mint Pass and not in the Allowlist`
          );
          setDisable(true);
        }
      } else if (currentState == 3) {
        setFeedback(
          `Welcome, you can mint up to ${nftMintedByUser} NFTs per transaction`
        );
      }
    }
  };

  const getDataWithAlchemy = async () => {
    const abiResponse = await fetch("/config/abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const abi = await abiResponse.json();
    var contract = new Contract(
      abi,
      "0x053b6492184e812d93d2c739d1ef918c012d93aa"
    );
    contract.setProvider(web3.currentProvider);
    // Get Total Supply
    const totalSupply = await contract.methods.totalSupply().call();
    setTotalSupply(totalSupply);

    // Get Contract State
    let currentState = await contract.methods.currentState().call();
    setState(currentState);
    console.log({ currentState });

    // Set Price and Max According to State

    if (currentState == 0) {
      setStatusAlert("MINT NOT LIVE YET!");
      setFeedback("MINT NOT LIVE YET!");
      setDisable(true);
      setDisplayCost(0.0);
      setMax(0);
    } else if (currentState == 1) {
      let puCost = await contract.methods.mintPassCost().call();
      setDisplayCost(web3.utils.fromWei(puCost));
      setNftCost(web3.utils.fromWei(puCost));
      let puMax = await contract.methods.maxMintAmountPublic().call();
      setMax(puMax);
    } else if (currentState == 2) {
      let puCost = await contract.methods.allowListCost().call();
      setDisplayCost(web3.utils.fromWei(puCost));
      setNftCost(web3.utils.fromWei(puCost));
      let puMax = await contract.methods.maxMintAmountPublic().call();
      setMax(puMax);
    } else if (currentState == 3) {
      let puCost = await contract.methods.cost().call();
      setDisplayCost(web3.utils.fromWei(puCost));
      setNftCost(web3.utils.fromWei(puCost));
      let puMax = await contract.methods.maxMintAmountPublic().call();
      setMax(puMax);
    }
  };

  const getConfig = async () => {
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const config = await configResponse.json();
    SET_CONFIG(config);
  };

  useEffect(() => {
    getConfig();
    getDataWithAlchemy();
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  }, []);

  useEffect(() => {
    getData();
  }, [blockchain.account]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDays(Math.floor(timeleft / (1000 * 60 * 60 * 24)));
      setHour(
        Math.floor((timeleft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      );
      setMint(Math.floor((timeleft % (1000 * 60 * 60)) / (1000 * 60)));
      setSec(Math.floor((timeleft % (1000 * 60)) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [days, hours, minutes, seconds]);

  return (
    <>
      {loading && <Loader />}

      <div className="root">
        <div className="bg">
          <img src={bg} alt="" />
        </div>

        <div className="m-bg">
          <img src={mbg} alt="" />
        </div>

        <div className="paper">
          <img src={paper} alt="" />
        </div>

        <div className="m-paper">
          <img src={mpaper} alt="" />
        </div>

        <div className="main">
          {blockchain.account === null &&
          blockchain.smartContract === null &&
          state != 0 ? (
            <img
              src={Connectwallet}
              className="wallet"
              onClick={(e) => {
                e.preventDefault();
                dispatch(connectWallet());
                getData();
              }}
            />
          ) : (
            <>
              <button
                className="walletMsg"
                style={{
                  backgroundColor: "#ff0000",
                  border: "none",
                  color: "#fff",
                  borderRadius: "17px",
                  fontFamily: "Rubric",
                }}
              >
                {feedback}
              </button>
            </>
          )}

          <div className="supply">
            AVAILABLE : {CONFIG.MAX_SUPPLY - supply} / {CONFIG.MAX_SUPPLY}
          </div>

          {/* phases based on state */}
          {state == 0 ? (
            <>
              <img src={phase0} className="phases" />
              <a href="https://opensea.io/collection/nftmagpass" target="blank">
                <img src={btnOpenSea} className="btn-opensea" />
              </a>
            </>
          ) : (
            ""
          )}
          {state == 1 ? (
            <>
              <img src={phase1} className="phases" />
              <a href="https://opensea.io/collection/nftmagpass" target="blank">
                <img src={btnOpenSea} className="btn-opensea" />
              </a>
            </>
          ) : (
            ""
          )}

          {state == 2 ? (
            <>
              <img src={phase2} className="phases" />
              <a href="https://opensea.io/collection/nftmagpass" target="blank">
                <img src={btnOpenSea} className="btn-opensea" />
              </a>
            </>
          ) : (
            ""
          )}

          {state == 3 ? (
            <>
              <img src={phase3} className="phases" />
              <a href="https://opensea.io/collection/nftmagpass" target="blank">
                <img src={btnOpenSea} className="btn-opensea" />
              </a>
            </>
          ) : (
            ""
          )}

          {/* timer hide code */}
          {days >= 0 && hours >= 0 && minutes >= 0 && seconds >= 0 && (
            <div className="timer-container">
              <BtnContainer
                countH={
                  days * 24 + hours <= 0 ? "00" : "0" + (days * 24 + hours)
                }
                text="LAUNCH IN"
                countM={minutes <= 0 ? "00" : minutes}
                countS={seconds < 0 ? "00" : seconds}
              />
            </div>
          )}

          {state == 3 && (
            <CrossmintPayButton
              collectionTitle="PaperBoyz NFT"
              collectionDescription="PaperBoyz NFT"
              collectionPhoto=""
              className="mintWithCard"
              clientId="967600f7-81af-43e3-b7e7-0739d68e292f"
              mintConfig={{ _mintAmount: mintAmount, totalPrice: displayCost }}
            />
          )}
          {/* <img src={mintWithCard} className="mintWithCard" /> */}

          {state == 3 ? (
            ""
          ) : (
            <div
              className="mintWithCard"
              style={{
                color: "#ff0000",
                fontSize: "25px",
                fontFamily: "Rubric",
              }}
            >
              Cannot Mint Using Credit Card Until Public Sale
            </div>
          )}

          <div className="token">
            <img src={token} alt="" />
          </div>

          <div className="m-token">
            <img src={mtoken} alt="" />
          </div>

          <div className="mint-amt">
            <s.AmountContainer
              ai={"center"}
              jc={"center"}
              fd={"row"}
              style={{ paddingRight: "25px" }}
            >
              <s.StyledRoundButton
                style={{ lineHeight: 0.4 }}
                disabled={claimingNft ? 1 : 0}
                onClick={(e) => {
                  e.preventDefault();
                  decrementMintAmount();
                }}
              >
                -
              </s.StyledRoundButton>
              <s.SpacerMedium />
              <s.TextDescription>
                <span className="mint-amount">{mintAmount}</span>
              </s.TextDescription>
              <s.SpacerMedium />
              <s.StyledRoundButton
                disabled={claimingNft ? 1 : 0}
                onClick={(e) => {
                  e.preventDefault();
                  incrementMintAmount();
                }}
              >
                +
              </s.StyledRoundButton>
            </s.AmountContainer>
          </div>

          <div className="total-price">TOTAL PRICE: {displayCost}</div>

          <a>
            {blockchain.account !== "" &&
            blockchain.smartContract !== null &&
            blockchain.errorMsg === "" &&
            disable == false ? (
              <img
                src={mint}
                alt=""
                className="mint"
                onClick={(e) => {
                  e.preventDefault();
                  claimNFTs();
                }}
              />
            ) : (
              <img
                src={mint}
                alt=""
                className="mint"
                style={{
                  filter: "grayscale(100%)",
                }}
              />
            )}
          </a>
          <div className="maxMintable">
            <p>*MAX 10 MINTABLE</p>
          </div>
        </div>
      </div>
    </>
  );
}

const BtnContainer = ({ countH, countM, countS, text }) => {
  return (
    <div className="btn-container">
      <div className="count">
        <img src={btn} alt="" />
        <div className="no">
          <div className="text">{text}</div>
          {countH}:{countM}:{countS}
        </div>
      </div>
    </div>
  );
};

export default Home;
