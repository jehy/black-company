'use strict';

const fs = require('fs-extra');
const readline = require('readline');
const {google} = require('googleapis');
const debug = require('debug')('devDuty:init');
const Promise = require('bluebird');

debug.enabled = true;

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const TOKEN_PATH = 'config/token.json';

async function ask(question) {

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, input => resolve(input));
  })
    .finally(()=> rl.close());
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
async function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  debug('Authorize this app by visiting this url:', authUrl);
  const code = await ask('Enter the code from that page here: ');
  const token = await Promise.promisify(oAuth2Client.getToken, {context: oAuth2Client})(code);
  oAuth2Client.setCredentials(token);
  // Store the token to disk for later program executions
  await fs.writeJson(TOKEN_PATH, token);
  debug('Token stored to', TOKEN_PATH);
  return oAuth2Client;
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize(credentials) {
  // eslint-disable-next-line camelcase
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0],
  );

  // Check if we have previously stored a token.
  let token;
  try {
    token = await fs.readJson(TOKEN_PATH);
  }
  catch (err) {
    token = await getNewToken(oAuth2Client);
  }
  oAuth2Client.setCredentials(token);
  return oAuth2Client;
}

async function init() {
// Load client secrets from a local file.
  let content;
  try {
    content = await fs.readJson('config/credentials.json');
  }
  catch (err) {
    debug('Error loading client secret file:', err);
    process.exit(1);
  }
  // Authorize a client with credentials, then call the Google Sheets API.
  const oAuth2Client = await authorize(content);
  debug('auth ok');
}
init();
