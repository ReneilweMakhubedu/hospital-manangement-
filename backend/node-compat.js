// jsonwebtoken's transitive dependency expects SlowBuffer on newer Node versions.
const buffer = require('buffer');

if (!buffer.SlowBuffer) {
  buffer.SlowBuffer = buffer.Buffer;
}