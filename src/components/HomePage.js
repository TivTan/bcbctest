import React, { useState, useEffect } from "react";
import { Contract, getDefaultProvider, providers, utils } from "ethers";
import { config } from "../config";
import abi from "../fixtures/abi.json";
import axios from "axios";

const provider = getDefaultProvider("rinkeby", { alchemy: config.alchemyKey });

const contract = new Contract(
  "0xF89615202ee98979749aE2387d1717bf3F56A408",
  abi,
  provider
);

const formatIpfsUrl = (url) => {
  return url.replace(/ipfs:\/\//g, "https://cloudflare-ipfs.com/");
};



export const HomePage = () => {
  const [mintedNftState, setMintedNftState] = useState({
    state: "UNINITIALIZED",
  });
  const [purchaseState, setPurchaseState] = useState({
    state: "UNINITIALIZED",
  });
  const modalVisible =
    purchaseState.state === "PENDING_METAMASK" ||
    purchaseState.state === "PENDING_SIGNER" ||
    purchaseState.state === "PENDING_CONFIRMAION";

  const refreshPage = () => {
    window.location.reload();
  }

  const loadRobotsData = async () => {
    setMintedNftState({
      state: "PENDING",
    });
    const totalSupply = await contract.totalSupply();
    const ids = [...Array(totalSupply.toNumber()).keys()];
    const deferredData = ids.map(async (id) => {
      const ipfsUri = await contract.tokenURI(id);
      const owner = await contract.ownerOf(id);
      const formattedUri = formatIpfsUrl(ipfsUri);
      const metadata = (await axios.get(formattedUri)).data;
      const formattedImage = formatIpfsUrl(metadata.image);
      return {
        id,
        name: metadata.name,
        image: formattedImage,
        description: metadata.description,
        owner,
      };
    });
    const data = await Promise.all(deferredData);
    setMintedNftState({
      state: "SUCCESS",
      data,
    });
  };

  useEffect(() => {
    loadRobotsData();
  }, []);



  const handlePurchase = async () => {
    const { ethereum } = window;
    if (typeof ethereum == "undefined") alert("Metamask is not detected");

    // Prompts Metamask to connect
    setPurchaseState({ state: "PENDING_METAMASK" });
    await ethereum.request({ method: "eth_requestAccounts" });

    // Create new provider from Metamask
    const provider = new providers.Web3Provider(window.ethereum);

    // Get the signer from Metamask
    const signer = provider.getSigner();

    // Create the contract instance
    const contract = new Contract(
      "0xF89615202ee98979749aE2387d1717bf3F56A408",
      abi,
      signer
    );

    // Call the purchase method
    setPurchaseState({ state: "PENDING_SIGNER" });
    try {
      const receipt = await contract.purchase({
        value: utils.parseEther("1"),
      });
      console.log(receipt);
      setPurchaseState({ state: "PENDING_CONFIRMAION" });
      const transaction = await receipt.wait();
      setPurchaseState({ state: "SUCCESS", transaction });
    } catch (err) {
      alert("Transaction rejected, refreshing page");
      setPurchaseState({ state: "UNINITIALIZED" });


      // Reload the Robots
      await loadRobotsData();
    };
  }

  const [recAddress, setRecAddress] = useState("nullAdd");
  const [senderAddress, setSenderAddress] = useState("nullSender");
  const [tokenId, setTokenId] = useState("nullID");

  const handleTransfer = async () => {
    const { ethereum } = window;
    if (typeof ethereum == "undefined") {
      alert("Metamask is not detected");
    } else if (recAddress === "nullAdd") {
      return alert("No address detected in input box");
    }

    setPurchaseState({ state: "PENDING_METAMASK" });
    await ethereum.request({ method: "eth_requestAccounts" });

    const provider = new providers.Web3Provider(window.ethereum);

    const signer = provider.getSigner();
    const contract = new Contract("0xF89615202ee98979749aE2387d1717bf3F56A408", abi, signer);

    // Call the purchase method
    setPurchaseState({ state: "PENDING_SIGNER" });
    try {
      const receipt = await contract.transferFrom(
        senderAddress,
        recAddress,
        tokenId
      );

      setPurchaseState({ state: "PENDING_CONFIRMAION" });
      const transaction = await receipt.wait();
      setPurchaseState({ state: "SUCCESS", transaction });
    } catch (err) {
      if (err.code === 4001) {
        console.log(err.code);
        alert("Transaction rejected by user, refreshing page");
        return setPurchaseState({ state: "UNINITIALIZED" });
      } else {
        console.log(err.code);
        alert(
          "error!"
        );
        return setPurchaseState({ state: "UNINITIALIZED" });
      }
    }

    await loadRobotsData();
    setRecAddress("nullAdd");
  };


  return (
    <div className="min-h-screen bg-blue-500">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 ">
        <div className="text-gray-100 text-6xl pt-20 pb-8">ROBOTS</div>
        <div className="mt-12 mb-6">
          <button
            onClick={handlePurchase}
            type="button"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Buy NFT
          </button>
        </div>
        {mintedNftState.state === "PENDING" && (
          <div className="text-xl text-white">LOADING...</div>
        )}
        {mintedNftState.state === "SUCCESS" && (
          <div className="grid grid-cols-3 gap-5">
            {mintedNftState.data.map(
              ({ id, image, name, description, owner }) => {
                return (
                  <div key={id} className="bg-white rounded p-2 mb-6">
                    <img
                      src={image} className="border-2 border-black mx-auto p-4" alt={name} />
                    <div className="text-xl">{name}</div>
                    <div className="">{description}</div>
                    <hr className="my-4" />
                    <div className="text-left text-sm">Owned By:</div>
                    <div className="text-left text-xs pb-2">{owner}</div>

                    <div className="text-left text-s m-1 space-x-1 pb-1">
                      <label>Transfer: </label>
                      <input
                        className="border-2 border-black py-0"
                        type="text"
                        onChange={(event) => {
                          setRecAddress(event.target.value);
                          setSenderAddress(owner);
                          setTokenId(id);
                        }}
                      />

                      <button
                        className="m-3 items-center px-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-900 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        onClick={handleTransfer}
                      >
                        Gift NFT
                      </button>

                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

      </div>

      {modalVisible && (
        <div
          className="fixed z-10 inset-0 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
            />
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >

            </span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6">
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3
                    className="text-lg leading-6 font-medium text-gray-900"
                    id="modal-title"
                  >
                    {purchaseState.state === "PENDING_METAMASK" &&
                      "Connecting Metamask..."}
                    {purchaseState.state === "PENDING_SIGNER" &&
                      "Waiting for Signed Transaction"}
                    {purchaseState.state === "PENDING_CONFIRMAION" &&
                      "Waiting for Block Confirmation"}
                  </h3>

                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      {purchaseState.state === "PENDING_METAMASK" &&
                        "Allow Metamask to connect to this application in the extension."}
                      {purchaseState.state === "PENDING_SIGNER" &&
                        "Approve the purchase transaction within the Metamask extension"}
                      {purchaseState.state === "PENDING_CONFIRMAION" &&
                        "Transaction has been sent to the blockchain. Please wait while the transaction is being confirmed."}
                    </p>
                    <div className="m-3">
                      <button
                        onClick={refreshPage}
                        type="button"
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-300 hover:bg-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                        Reload
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
      }
    </div >
  )
}
