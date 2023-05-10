import { useState } from "react";
import server from "./server";
import { keccak256 } from "ethereum-cryptography/keccak";
import { utf8ToBytes, toHex } from "ethereum-cryptography/utils";
import { secp256k1 } from "ethereum-cryptography/secp256k1";


function Transfer({ address, setBalance }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");
	const [privateKey, setPrivateKey] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

	function hashMessage(message) {
    return keccak256(utf8ToBytes(message));
	}

	async function signMessage(msg) {
    const message = hashMessage(msg);
    return secp256k1.sign(message, privateKey);
	}

	function getAddress(publicKey) {
		const pubKey = publicKey.slice(1, publicKey.length);
		const hashedKey = keccak256(pubKey);
		return hashedKey.slice(-20);
	}

	async function verifyKey(message, signature) {
		const hashedMessage = hashMessage(JSON.stringify(message));
		const pubKey = signature.recoverPublicKey(hashedMessage);
		return `0x${toHex(getAddress(pubKey.toRawBytes()))}` === address;
	}

  async function transfer(evt) {
    evt.preventDefault();

    try {
			const payload = {
				sender: address,
				amount: parseInt(sendAmount),
				recipient,
			};

			const signature = await signMessage(JSON.stringify(payload));

			if(! await verifyKey(payload, signature)) {
				alert("You are not the owner of the sender address");
				throw new Error("You are not the owner of the sender address");
			}

			payload.signature = signature;

      const {
        data: { balance },
      } = await server.post(`send`, payload);
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

			<label>
        Private Key
        <input
          placeholder="This is only to sign the transaction, the key will not be stored"
          value={privateKey}
          onChange={setValue(setPrivateKey)}
        ></input>
      </label>

      <input type="submit" className="button" value="Sign & Transfer" />
    </form>
  );
}

export default Transfer;
