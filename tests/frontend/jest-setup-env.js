// Polyfill TextEncoder / TextDecoder for react-router / history in Jest (jsdom)

const { TextEncoder, TextDecoder } = require('util');

if (!global.TextEncoder) {
    global.TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
    global.TextDecoder = TextDecoder;
}
