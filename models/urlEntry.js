'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UrlEntry = new Schema({
  original_url: { type: String, required: true },
  short_url: { type: String, required: true }
});

module.exports = mongoose.model('UrlEntry', UrlEntry);
