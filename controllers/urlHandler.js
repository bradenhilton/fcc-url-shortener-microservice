'use strict';

const UrlEntry = require('../models/urlEntry.js');

const dns = require('dns');
const md5 = require('md5');

const hexToBin = (hex) => {
  return hex.split('').reduce((acc, curr) => acc += parseInt(curr, 16).toString(2).padStart(4, 0), '');
};

const binToDec = (bin) => {
  return bin.split('').reverse().reduce((acc, curr, ind) => acc += curr * Math.pow(2, ind), 0);
};

const decToBase62 = (dec) => {
  const base62 = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  while (dec > 0) {
    result = base62[dec % 62] + result;
    dec = Math.floor(dec / 62);
  }

  return result;
};

// convert a long url to a short url and add to the database
// long url -> md5 -> 7 character base62 -> short url
const addUrl = (req, res) => {
  const trailingSlashRegex = /\/$/i;
  const protocolRegex = /^https?:\/{2}(.*)/i // https://... or http://...
  const hostnameRegex = /^([a-z0-9\-_]+\.)+[a-z0-9\-_]+/i; // ***.***.***...
  
  let url = req.body.url;
  
  // check end of url string for trailing / and remove it
  if (url.match(trailingSlashRegex)) {
    url = url.slice(0, -1);    
  }
  
  // check url string for protocol
  const urlProtocolMatch = url.match(protocolRegex);
  if (urlProtocolMatch) {
    // check url string for hostname
    const urlWithoutProtocol = urlProtocolMatch[1];
    const urlHostnameMatch = urlWithoutProtocol.match(hostnameRegex);
    if (urlHostnameMatch) {
      // check valid hostname with dns lookup
      dns.lookup(urlHostnameMatch[0], (err) => {
        if (err) {
          res.json({ error: 'Invalid Hostname' });
        } else {
          // generate md5 hash and base62
          const hash = md5(url);
          const shortUrl = decToBase62(binToDec(hexToBin(hash).substr(0, 42))); // 7 character url = (62^7 = ~3.5 Trillion) = (~2^42 = ~4.4 Trillion) = 42 bits needed
          
          // check database for short url
          UrlEntry.findOne({ short_url: shortUrl }, (err, dbUrl) => {
            if (err) {
              console.log(err);
              return;
            }
            
            // return database url if found
            if (dbUrl) {
              res.json({
                original_url: dbUrl.original_url,
                short_url: dbUrl.short_url
              });
            } else {
              // create and save new url
              const newUrl = new UrlEntry({
                original_url: url,
                short_url: shortUrl
              });
              
              newUrl.save(err => {
                if (err) {
                  console.log(err);
                  return;
                }
                
                res.json({ original_url: url, short_url: shortUrl });
              });
            }
          });
        }
      });
    } else {
      res.json({ error: 'Invalid Hostname' });
    }
  } else {
    res.json({ error: 'Invalid URL' });
  }
};

// redirect short url to long url from the database
const redirectUrl = (req, res) => {
  const shortUrl = req.params.url;
  
  // search database for short url
  UrlEntry.findOne({ short_url: shortUrl }, (err, dbUrl) => {
    if (err) {
      console.log(err);
      return;
    }
    
    if (dbUrl) {
      res.redirect(dbUrl.original_url); // redirect to original url if found
    } else {
      res.json({ error: `No URL entry found for ${shortUrl}` });
    }
  });
};

module.exports = { addUrl, redirectUrl };
