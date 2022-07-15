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
import phase1 from "../../assests/images/phase-01.png";
import phase2 from "../../assests/images/phase-02.png";
import phase3 from "../../assests/images/phase-03.png";
import btnOpenSea from "../../assests/images/btn-opensea.png";
import mintWithCard from "../../assests/images/btn-mintCard.png";

const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
const web3 = createAlchemyWeb3(
  "https://eth-rinkeby.alchemyapi.io/v2/pBY3syVarS-tO2ZAQlA3uWBq_OqzwIDw"
);
var Web3 = require("web3");
var Contract = require("web3-eth-contract");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

// Whitelist MerkleTree
const leafNodes = whitelistAddresses.map((addr) => keccak256(addr));
const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
const rootHash = merkleTree.getRoot();
console.log("Whitelist Merkle Tree\n", merkleTree.toString());

// EarlyAccess MerkleTree
const leafNodesEarly = earlyAccessAddresses.map((addr) => keccak256(addr));
const merkleTreeEarly = new MerkleTree(leafNodesEarly, keccak256, {
  sortPairs: true,
});
const rootHashEarly = merkleTreeEarly.getRoot();
console.log("Early Access Tree\n", merkleTreeEarly.toString());

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
  const [canMintWL, setCanMintWL] = useState(false);
  const [canMintEA, setCanMintEA] = useState(false);
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

    // const estGas = await blockchain.smartContract.methods.
    // mint(mintAmount,proof).estimateGas({
    //   from: blockchain.account,
    //   to: CONFIG.CONTRACT_ADDRESS,
    // });
    // console.log({ estGas });

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
        let totalPublic = 500;
        supply < totalPublic ? setDisable(false) : setDisable(true);
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
      "0x1B2F60C37530AC8c6D2651bd9345D7827637941B"
    );
    contract.setProvider(web3.currentProvider);
    // Get Total Supply
    const totalSupply = await contract.methods.totalSupply().call();
    setTotalSupply(totalSupply);

    // Get Contract State
    let currentState = await contract.methods.currentState().call();
    setState(currentState);

    // Set Price and Max According to State

    if (currentState == 0) {
      setStatusAlert("MINT NOT LIVE YET!");
      setDisable(true);
      setDisplayCost(0.0);
      setMax(0);
    } else if (currentState == 1) {
      let puCost = await contract.methods.cost().call();
      setDisplayCost(web3.utils.fromWei(puCost));
      setNftCost(web3.utils.fromWei(puCost));
      setStatusAlert("Public Mint is Live");
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
          <img src={Connectwallet} className="wallet" />

          {/* phases based on state */}

          <img src={phase1} className="phases" />
          <a href="https://opensea.io/collection/nftmagpass" target="blank">
            <img src={btnOpenSea} className="btn-opensea" />
          </a>

          {/* timer hide code */}
          {days >= 0 && hours >= 0 && minutes >= 0 && seconds >= 0 && (
            <div className="timer-container">
              <BtnContainer
                countH={days * 24 + hours <= 0 ? "00" : days * 24 + hours}
                text="LAUNCH IN"
                countM={minutes <= 0 ? "00" : minutes}
                countS={seconds < 0 ? "00" : seconds}
              />
            </div>
          )}

          <img src={mintWithCard} className="mintWithCard" />

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

          <div className="total-price mint-amount">
            Total Price: {displayCost}
          </div>

          <a>
            <img src={mint} alt="" className="mint" />
          </a>
          <div className="maxMintable">
            <p>*MAX 10 MINTABLE</p>
          </div>
        </div>
      </div>

      {/* purana code */}

      <s.FlexContainer jc={"center"} fd={"row"}>
        <s.Mint style={{ display: "none" }}>
          <s.SpacerSmall />
          <s.SpacerSmall />
          <s.FlexContainer fd={"row"} ai={"center"} jc={"center"}>
            <img src={"config/images/logo.png"} className="logo" alt="Logo" />
          </s.FlexContainer>
          <s.SpacerSmall />
          <s.FlexContainer fd={"row"} ai={"center"} jc={"center"}>
            <img
              src={"config/images/heading.png"}
              className="heading"
              alt="Logo"
            />
          </s.FlexContainer>
          <s.SpacerSmall />
          <s.FlexContainer fd={"row"} ai={"center"} jc={"center"}>
            <span className="paper-text">
              BE THE FIRST ONE TO HAVE ALL THE EXCLUSIVE NFT NEWS DELIVERED TO
              YOUR DOORSTEP
            </span>
          </s.FlexContainer>
          <s.SpacerSmall />
          <s.FlexContainer
            fd={"row"}
            ai={"center"}
            jc={"center"}
            className="align-mob"
          >
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
            <div
              style={{ cursor: "pointer" }}
              onClick={(e) => {
                e.preventDefault();
                maxNfts();
              }}
            >
              <img
                src={"config/images/btn-max.png"}
                class="btn-max"
                alt="max button"
              />
            </div>
          </s.FlexContainer>
          <s.SpacerSmall />
          <s.FlexContainer fd={"row"} ai={"center"} jc={"center"}>
            {blockchain.account !== "" &&
            blockchain.smartContract !== null &&
            blockchain.errorMsg === "" ? (
              <s.Container ai={"center"} jc={"center"} fd={"row"}>
                <s.connectButtonImg
                  disabled={disable}
                  onClick={(e) => {
                    e.preventDefault();
                    claimNFTs();
                  }}
                >
                  {claimingNft ? "Confirm Transaction in Wallet" : ""}
                  {/* {mintDone && !claimingNft  ? feedback : ""} */}
                </s.connectButtonImg>{" "}
              </s.Container>
            ) : (
              <>
                {/* {blockchain.errorMsg === "" ? ( */}
                <img
                  className="btn-mint"
                  disabled={state == 0 ? 1 : 0}
                  onClick={(e) => {
                    e.preventDefault();
                    dispatch(connectWallet());
                    getData();
                  }}
                  src={"config/images/btn-connect.png"}
                  style={{
                    cursor: "pointer",
                  }}
                  alt="mint btn"
                />

                {/* ) : ("")} */}
              </>
            )}
          </s.FlexContainer>
          <s.FlexContainer fd={"row"} ai={"center"} jc={"center"}>
            <span className="mint-available"> / {CONFIG.MAX_SUPPLY} </span>
          </s.FlexContainer>
          <s.SpacerLarge />
          {blockchain.errorMsg !== "" ? (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <s.connectButton
                style={{
                  textAlign: "center",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                {blockchain.errorMsg}
              </s.connectButton>
            </div>
          ) : (
            <s.TextDescription
              style={{
                textAlign: "center",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {feedback}
            </s.TextDescription>
          )}
        </s.Mint>
      </s.FlexContainer>
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
