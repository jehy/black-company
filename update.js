'use strict';

const {google} = require('googleapis');
const Debug = require('debug');
const Promise = require('bluebird');
const fs = require('fs-extra');
const pretty = require('pretty');
const cheerio = require('cheerio');


const decode = require('./decode');


const debug = Debug('generator');
// Load client secrets from a local file.
const credentials = require('./config/credentials.json');
const token = require('./config/token.json');
const pages = require('./config/pages');

debug.enabled = true;

// eslint-disable-next-line camelcase
const {client_secret, client_id, redirect_uris} = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(
  client_id, client_secret, redirect_uris[0],
);
oAuth2Client.setCredentials(token);

const drive = google.drive({version: 'v3', auth: oAuth2Client});
const driveExport = Promise.promisify(drive.files.export, {context: drive});
const driveInfo = Promise.promisify(drive.files.get, {context: drive});

function getPagePath(filename) {
  return `pages/${filename}.html`;
}

function getCachePath(filename) {
  return `cache/${filename}.html`;
}

function processPage(data)
{
  /* const cleanParagraph = new RegExp('<p[^>]*>(.*?)</p>', 'ig');
    let clean = data.replace(cleanParagraph, '<p>$1</p>');
    const cleanBold = new RegExp('<span[^>]*font-weight:700*font-style:normal[^>]*>(.*?)</span>', 'ig');
    clean = clean.replace(cleanBold, '<b>$1</b>');
    const cleanH2 = new RegExp('<span[^>]*font-size:12pt[^>]*>(.*?)</span>', 'ig');
    clean = clean.replace(cleanH2, '<h1>$1</h1>');
    const cleanH1 = new RegExp('<span[^>]*font-weight:700[^>]*>(.*?)</span>', 'ig');
    clean = clean.replace(cleanH1, '<h2>$1</h2>');
    const cleanSpan = new RegExp('<span[^>]*>(.*?)</span>', 'ig');
    clean = clean.replace(cleanSpan, '$1');
    const cleanTrash = new RegExp('<h1></h1>', 'ig');
    clean = clean.replace(cleanTrash, '');
    const cleanTrash2 = new RegExp('<h2></h2>', 'ig');
    clean = clean.replace(cleanTrash2, '');
    const cleanTrash3 = new RegExp('<p></p>', 'ig');
    clean = clean.replace(cleanTrash3, '<br/>');
    const cleanTrash4 = new RegExp('<br>', 'ig');
    clean = clean.replace(cleanTrash4, '<br/>');
    */
  // const addLink = new RegExp('<body[^>]*>(.*?)</body>', 'ig');
  // data = data.replace(addLink, '<body><p><a href="https://jehy.github.io/black-company/">Все правила</a></p>$1</body>');
  // data = data.substr(data.indexOf('<body'));
  // const body = $(data).find('body');
  let clean = data.replace(/ style="color:inherit;text-decoration:inherit;"/g, '');
  clean = clean.replace(/ style="color:inherit;text-decoration:inherit"/g, '');
  // const fixLink = new RegExp(/"https:\/\/www\.google\.com\/url\?q=(.*?)"/g, 'ig');
  // clean = clean.replace(fixLink, '"$1"');

  const $ = cheerio.load(pretty(clean));
  const body = $('body');
  const style = $('style').html();
  // const head = `<head><meta content="text/html; charset=UTF-8" http-equiv="content-type"><style>${style || ''}</style></head>`;
  // body.prepend('<p><a href="index.html">Все правила</a></p>');
  body.find('span').each(function (index) {
    const size = $(this).css('font-size');
    if (!size)
    {
      return;
    }
    const sizeNum = parseInt(size.replace('pt', ''), 10);
    if (sizeNum < 12)
    {
      $(this).css('font-size', '+=2');
    }
  });
  body.find('p').each(function (index) {
    const size = $(this).css('font-size');
    if (!size)
    {
      return;
    }
    const sizeNum = parseInt(size.replace('pt', ''), 10);
    if (sizeNum < 12)
    {
      $(this).css('font-size', '+=2');
    }
  });
  body.find('li').each(function (index) {
    const size = $(this).css('font-size');
    if (!size)
    {
      return;
    }
    const sizeNum = parseInt(size.replace('pt', ''), 10);
    if (sizeNum < 12)
    {
      $(this).css('font-size', '+=2');
    }
  });
  // let html = `<html>${head}<body>${body.html()}</body></html>`;
  let html = `<style>${style || ''}</style>${body.html()}`;
  html = pretty(html);
  html = decode(html);
  html = html.replace(new RegExp('&quot;', 'ig'), '\'');
  return html;
}


async function run() {
  debug('Updating...');
  await fs.ensureDir('./cache');
  await Promise.map(pages, async (page) => {
    let data;
    const cacheFound = await fs.pathExists(getCachePath(page.filename));
    if (cacheFound) {
      debug(`fetching data from cache ${page.filename}`);
      data = await fs.readFile(getCachePath(page.filename), {encoding: 'utf8'});
    }
    else {
      debug(`fetching data from google docs ${page.id}`);
      const reply = await driveExport({fileId: page.id, mimeType: 'text/html'});
      const info = await driveInfo({fileId: page.id});
      page.name = info.data.name;
      data = pretty(reply.data);
      await fs.writeFile(getCachePath(page.filename), data, {encoding: 'utf8'});
    }
    if (!data || !data.length || !data.replace) {
      debug(`Smth wrong with ${page.filename} - data is ${JSON.stringify(data)}`);
    }
    const html = processPage(data);
    await fs.writeFile(getPagePath(page.filename), html);
    return Promise.delay(100);
  }, {concurrency: 1});

  await fs.writeJson('config/pages.json', pages, {spaces: 2}); // update doc names
  debug('Updated.');
}

run();
