import * as _ from 'lodash';
import { BitmexRequest } from 'bitmex-request';
function parseArgs() {
  const ArgumentParser = require('argparse').ArgumentParser;
  const parser = new ArgumentParser({
    version: '0.0.1',
    addHelp: true,
    description: 'encryption',
  });
  parser.addArgument(['--key'], {
    help: 'true|false',
  });
  parser.addArgument(['--secret'], {
    help: 'true|false',
  });
  return parser.parseArgs();
}
const csvWriter = require('csv-write-stream');
const fs = require('fs');

interface dumpConfig {
  startDate: Date;
  endDate: Date;
  exchange: string;
  pairDb: string;
  resolution: number;
}

function createCSVWriter() {
  return csvWriter({
    // heads should match writeRow
    headers: ['date', 'change', 'balance'],
    sendHeaders: true,
  });
}
function writeRow(writer: any, row: any) {
  writer.write([row.ts, row.changeAmount, row.balance]);
}

async function main() {
  const { key, secret } = parseArgs();
  if (!key || !secret) {
    console.error(`key and secret are required`);
    process.exit(1);
    return;
  }

  const bitmexRequest = new BitmexRequest({
    apiKey: key,
    apiSecret: secret,
  });
  const dataRaw = await bitmexRequest.getWalletHistory();
  const data = _.map(dataRaw, d => ({
    ts: new Date(d.timestamp).toISOString(),
    changeAmount: d.amount / 100000000,
    balance: d.walletBalance / 100000000,
  }));
  console.log(`data`, data);
  const writer = createCSVWriter();
  writer.pipe(fs.createWriteStream(__dirname + `/output.csv`));
  _.each(data, (doc: any) => {
    writeRow(writer, doc);
  });
}

main();
