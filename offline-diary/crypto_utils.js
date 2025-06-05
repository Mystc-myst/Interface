// Crypto utilities
const enc = new TextEncoder();
const dec = new TextDecoder();

// Helper functions for Base64 ArrayBuffer
// Uses Node.js Buffer for robust Base64 handling in test environment
function _arrayBufferToBase64(buffer) {
  // console.log("_arrayBufferToBase64: input buffer length:", buffer.byteLength);
  const base64 = Buffer.from(buffer).toString('base64');
  // console.log("_arrayBufferToBase64: output base64 length:", base64.length);
  return base64;
}

function _base64ToArrayBuffer(base64) {
  // console.log("_base64ToArrayBuffer: input base64 length:", base64.length);
  const nodeBuffer = Buffer.from(base64, 'base64');
  // console.log("_base64ToArrayBuffer: decoded NodeBuffer length:", nodeBuffer.length);
  // Convert Node Buffer to ArrayBuffer
  // Create a new ArrayBuffer and copy data to ensure it's a true ArrayBuffer
  // as expected by Web Crypto API, not just a view on Node Buffer's underlying memory.
  const arrayBuffer = new ArrayBuffer(nodeBuffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < nodeBuffer.length; ++i) {
    view[i] = nodeBuffer[i];
  }
  // console.log("_base64ToArrayBuffer: output ArrayBuffer length:", arrayBuffer.byteLength);
  return arrayBuffer;
}

async function getKey(password, salt, usage) {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, usage);
}

function bufToHex(buf) { // Renamed for clarity
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hexStr) {
  if (!hexStr || hexStr.length % 2 !== 0) return new Uint8Array(0); // Basic validation
  const arr = [];
  for (let i = 0; i < hexStr.length; i += 2) {
    arr.push(parseInt(hexStr.substr(i, 2), 16));
  }
  return new Uint8Array(arr);
}

async function encryptDiary(text, password) {
  console.log("encryptDiary: input text length:", text.length, "password:", password ? "yes" : "no");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt, ['encrypt']);
  const dataBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));
  const result = {salt: bufToHex(salt), iv: bufToHex(iv), data: _arrayBufferToBase64(dataBuffer)}; // Use helper
  console.log("encryptDiary: result object:", JSON.stringify(result).substring(0, 100) + "...");
  return result;
}

async function decryptDiary(encryptedObj, password) {
  console.log("decryptDiary: received encryptedObj.data length:", encryptedObj.data.length);
  console.log("decryptDiary: received encryptedObj.data (first 50):", encryptedObj.data.substring(0,50));
  console.log("decryptDiary: received encryptedObj.data (last 50):", encryptedObj.data.substring(encryptedObj.data.length - 50));

  const salt = hexToBuf(encryptedObj.salt);
  const iv = hexToBuf(encryptedObj.iv);
  if (salt.length === 0 || iv.length === 0) throw new Error("Invalid salt or iv in encrypted data.");
  const key = await getKey(password, salt, ['decrypt']);
  const dataBuffer = _base64ToArrayBuffer(encryptedObj.data); // Use helper
  // console.log("decryptDiary: encryptedObj.salt:", encryptedObj.salt, "encryptedObj.iv:", encryptedObj.iv); // Redundant with above
  // console.log("decryptDiary: salt buffer length:", salt.length, "iv buffer length:", iv.length); // Redundant
  console.log("decryptDiary: dataBuffer from _base64ToArrayBuffer (byteLength):", dataBuffer.byteLength);
  const txtBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, dataBuffer);
  console.log("decryptDiary: txtBuffer from crypto.subtle.decrypt (byteLength):", txtBuffer.byteLength);
  const decodedText = dec.decode(txtBuffer);
  console.log("decryptDiary: decodedText (first 100 chars):", decodedText.substring(0,100));
  return decodedText;
}
