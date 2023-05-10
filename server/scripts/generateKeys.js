const fs = require("fs");
const {secp256k1} = require("ethereum-cryptography/secp256k1");
const { utf8ToBytes, toHex } = require("ethereum-cryptography/utils");
const { keccak256 } = require("ethereum-cryptography/keccak");
console.log(process.argv)
const count = process.argv[2];


function getAddress(publicKey) {
	const pubKey = publicKey.slice(1, publicKey.length);
	const hashedKey = keccak256(pubKey);
	return hashedKey.slice(-20);
}

let keys = {}
let balances = {}

function generateKeys(count) {
	for (let index = 0; index < count; index++) {
		const privateKey = secp256k1.utils.randomPrivateKey();
		const publicKey = secp256k1.getPublicKey(privateKey);
		const address = getAddress(publicKey);
	
		const keyObj = {
			privateKey: toHex(privateKey),
			publicKey: toHex(publicKey),
			address: `0x${toHex(address)}`,
		}
		
		keys[`key${index}`] = keyObj;
		balances[keyObj.address] = Math.floor(Math.random() * 100);
 	}
	console.log(keys);

	fs.writeFileSync("./keys.json", JSON.stringify(keys), 'utf-8');
	fs.writeFileSync("./balance.json", JSON.stringify(balances), 'utf-8');
}

generateKeys(count);