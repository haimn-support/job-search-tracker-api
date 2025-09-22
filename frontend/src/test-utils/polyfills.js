// Polyfills for Node.js test environment
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch if not available
if (!global.fetch) {
  global.fetch = require('whatwg-fetch').fetch;
}

// Mock URL if not available
if (!global.URL) {
  global.URL = require('url').URL;
}