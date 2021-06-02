#!/usr/bin/env node
import Table from 'tty-table';
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
program.option('-f --format <format>', '公历日期的格式化方式, 自动识别 DD/MM-DD/YYYY-MM-DD');
program.action(async (gregorian: string) => {
  const options = program.opts();

  let date: moment.Moment;
  if(gregorian) {
    const format = options.format;
    if(format) {
      date = moment(gregorian, format);
    } else {
      const length = gregorian.length;
      if(length === 2) {
        date = moment(gregorian, 'DD');
      } else if(length === 4) {
        date = moment(gregorian, 'M-DD');
      } else if(length === 5) {
        date = moment(gregorian, 'MM-DD');
      } else if(length === 7) {
        date = moment(gregorian, 'YY-M-DD');
      } else if(length === 8) {
        date = moment(gregorian, 'YY-MM-DD');
      } else if(length === 9) {
        date = moment(gregorian, 'YYYY-M-DD');
      } else if(length === 10) {
        date = moment(gregorian, 'YYYY-MM-DD');
      } else {
        process.stdout.write(`Invalid format\n`.red);
        program.help();
        process.exit(1);
      }
    }
  } else {
    date = moment();
  }

  if(!date.isValid()) {
    process.stdout.write(`Invalid date\n`.red);
    program.help();
    process.exit(1);
  }

  const compoundDate = database.getCompoundDate(date.year(), date.month() + 1, date.date());

  const table = Table([
    {
      name: '公历',
      value: `${ colors.blue(date.format('YYYY年MM月DD日 dddd')) }`,
    },
    {
      name: '农历',
      value: `${ colors.blue(compoundDate.toString('lunar')) }`,
    },
  ]);

  process.stdout.write(`${ table.render() }\n`);
});
