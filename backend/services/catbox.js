const fetch = require('node-fetch');
const FormData = require('form-data');

/**
 * Upload a file buffer to Catbox.moe and return the public URL.
 * @param {Buffer} buffer - The file data
 * @param {string} filename - e.g. 'recording.webm'
 * @returns {Promise<string>} Public URL like https://files.catbox.moe/xxxxx.webm
 */
async function uploadToCatbox(buffer, filename) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', buffer, { filename, contentType: 'audio/webm' });

  const response = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Catbox upload failed: ${response.status} ${response.statusText}`);
  }

  const url = await response.text();
  if (!url.startsWith('https://')) {
    throw new Error(`Catbox returned unexpected response: ${url}`);
  }

  return url.trim();
}

module.exports = { uploadToCatbox };
