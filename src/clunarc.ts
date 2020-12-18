#!/usr/bin/env node
import Table from 'cli-table';
import moment from 'moment';
import colors from 'colors';
import { Command } from 'commander';
import { Database } from 'traditional-chinese-calendar-database';
import 'moment/locale/zh-cn';

const pkg = require('../package.json');

moment.locale('zh-cn');

const database = new Database();
database.load()
  .then(() => program.parse(process.argv));

const program = new Command();
program.storeOptionsAsProperties(false);
program.version(pkg.version);

program.command('month [month]', '按月显示', { executableFile: 'clunarc-month.js' });

program.arguments('[gregorian]');
program.option('-f --format <format>', '公历日期的格式化方式', 'YYYY-MM-DD');
program.action(async (gregorian) => {
  const options = program.opts();
  const date = gregorian ? moment(gregorian, options.format) : moment();

  const compoundDate = database.getCompoundDate(date.year(), date.month() + 1, date.date());

  const table = new Table();
  table.push(
    { '公历': `${ colors.blue(date.format('YYYY年MM月DD日 dddd')) }` },
    { '农历': `${ colors.blue(compoundDate.toString('lunar')) }` }
  );
  process.stdout.write(`${ table.toString() }\n`);
});
