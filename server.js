'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const cors = require('cors');
const urlHandler = require('./controllers/urlHandler.js');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI, err => { if (err) console.log(err) });

app.use(cors());

/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/is-mongoose-ok', (req, res) => {
  if (mongoose) {
    res.json({ isMongooseOk: !!mongoose.connection.readyState });
  } else {
    res.json({ isMongooseOk: false });
  }
});
  
// your first API endpoint... 
app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' });
});

// convert long url to short url
app.post('/api/shorturl/new', urlHandler.addUrl);

// redirect short url to long url
app.get('/api/shorturl/:url', urlHandler.redirectUrl);

app.listen(port, () => {
  console.log('Node.js listening ...');
});
