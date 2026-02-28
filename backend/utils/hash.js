const crypto = require('crypto-js');

/**
 * Hash a file buffer (for deed verification)
 */
function hashFile(buffer) {
  const wordArray = crypto.lib.WordArray.create(buffer);
  return crypto.SHA256(wordArray).toString();
}

/**
 * Hash a string
 */
function hashString(str) {
  return crypto.SHA256(str).toString();
}

/**
 * Verify hash match
 */
function verifyHash(hash1, hash2) {
  return hash1.toLowerCase() === hash2.toLowerCase();
}

module.exports = {
  hashFile,
  hashString,
  verifyHash
};