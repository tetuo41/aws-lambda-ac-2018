/*
 * RSS Notifier to Slack
 * https://github.com/blueimp/aws-lambda
 *
 * Required environment variables:
 * - webhook:     AWS KMS encrypted Slack WebHook URL.
 *
 * Optional environment variables:
 * - channel:     Slack channel to send the messages to.
 * - username:    Bot username used for the slack messages.
 * - icon_emoji:  Bot icon emoji used for the slack messages.
 * - icon_url:    Bot icon url used for the slack messages.
 *
 * Copyright 2018, Hiroki Hatsushika
 *
 * Licensed under the MIT license:
 * https://opensource.org/licenses/MIT
 */

'use strict';

const ENV = process.env;
if (!ENV.webhook) throw new Error('Missing environment variable: webhook');

let webhook;

const AWS = require('aws-sdk');
const url = require('url');
const https = require('https');
let Parser = require('rss-parser');
let parser = new Parser();

function handleResponse (response, callback) {
  const statusCode = response.statusCode;
  console.log('Status code:', statusCode);
  let responseBody = '';
  response
    .on('data', chunk => { responseBody += chunk; })
    .on('end', chunk => {
      console.log('Response:', responseBody);
      if (statusCode >= 200 && statusCode < 300) {
        callback(null, 'Request completed successfully.');
      } else {
        callback(new Error(`Request failed with status code ${statusCode}.`));
      }
    });
}

function post (requestURL, data, callback) {
  const body = JSON.stringify(data);
  const options = url.parse(requestURL);
  options.method = 'POST';
  options.headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  };
  console.log('Request options:', JSON.stringify(options));
  console.log('Request body:', body);
  https.request(
    options,
    response => { handleResponse(response, callback); }
  ).on('error', err => { callback(err); }).end(body);
}

function buildSlackMessage (data) {
  return {
    channel: ENV.channel,
    username: ENV.username,
    icon_emoji: ENV.icon_emoji,
    icon_url: ENV.icon_url,
    text: data.link,
    attachments: [
      {
        fallback: data.title,
        title: data.title,
        title_link: data.link,
        text: data.link
      }
    ]
  };
};

function fetchRssContents (url) {
  return new Promise((resolve, reject) => {
    parser.parseURL(url).then(function (feed) {
      if (!feed) {
        reject(new Error('Feed Read Error'));
      }
      const item = feed.items[0];
      resolve({
        title: item.title,
        link: item.link
      });
    });
  });
}

function processEvent (event, context, callback) {
  console.log('Event:', JSON.stringify(event));
  fetchRssContents(ENV.feed).then((rssData) => {
    const postData = buildSlackMessage(rssData);
    post(webhook, postData, callback);
  }).catch((error) => {
    console.log(error);
  });
}

function decryptAndProcess (event, context, callback) {
  const kms = new AWS.KMS();
  const enc = {CiphertextBlob: Buffer.from(ENV.webhook, 'base64')};
  kms.decrypt(enc, (err, data) => {
    if (err) return callback(err);
    webhook = data.Plaintext.toString('ascii');
    processEvent(event, context, callback);
  });
}

exports.handler = (event, context, callback) => {
  if (webhook) {
    processEvent(event, context, callback);
  } else {
    decryptAndProcess(event, context, callback);
  }
};
