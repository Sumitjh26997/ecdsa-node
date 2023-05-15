const fs = require("fs");
const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

const secp256k1 = require("ethereum-cryptography/secp256k1");
const { toHex } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");

app.use(cors());
app.use(express.json());

const balances = JSON.parse(fs.readFileSync('./balance.json', 'utf-8')); 

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {
  const { sender, recipient, amount, signature, messageHash } = req.body;
	
	if(!isValidSignature(messageHash, signature, sender)) {
		res.status(400).send({ message: "Invalid signature" });
	}

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}

function getAddress(publicKey) {
	const pubKey = publicKey.slice(1, publicKey.length);
	const hashedKey = keccak256(pubKey);
	return hashedKey.slice(-20);
}

function isValidSignature(messageHash, signedMessage, sender) {
	const [signature, recoveryBit] = signedMessage;
	const sig = Uint8Array.from(Object.values(signature));
	const publicKey = secp256k1.recoverPublicKey(messageHash, sig, recoveryBit);
	const isValid = secp256k1.verify(sig, messageHash, publicKey);
	const isSender = `0x${toHex(getAddress(publicKey))}` === sender;
	
	return isSender && isValid ?  true :  false;
}