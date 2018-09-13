'use strict';

const fs = require('fs-extra');

async function run()
{
  await fs.remove('cache');
  // eslint-disable-next-line global-require
  require('./update');
}

run();
