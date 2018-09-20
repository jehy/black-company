'use strict';

const fs = require('fs-extra');
const Debug = require('debug');

const debug = Debug('generator');

async function run()
{
  debug('cleaning cache');
  await fs.remove('cache');
  debug('cache cleaned');
  // eslint-disable-next-line global-require
  require('./update');
}

run();
