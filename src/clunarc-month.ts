#!/usr/bin/env node
import Table from 'tty-table';
import moment, { Moment } from 'moment';
import colors from 'colors';
import { Command } from 'commander';
import { Database } from 'traditional-chinese-calendar-database';
import 'moment/locale/zh-cn';

moment.locale('zh-cn');

const database = new Database();
database.load()
  .then(() => program.parse(process.argv));

const program = new Command();
program.storeOptionsAsProperties(false);

program.arguments('[gregorian]');
program.option('-f --format <format>', '公历日期的格式化方式');
program.action(async (gregorian: string) => {
  const options = program.opts();
  let current: Moment;
  if(gregorian) {
    let format: string;
    if(options.format) {
      format = options.format;
    } else {
      if(gregorian.length === 1) {
        format = 'M';
      } else if(gregorian.length === 2) {
        format = 'MM';
      } else if(gregorian.length === 4) {
        format = 'YY-M';
      } else if(gregorian.length === 4) {
        format = 'YY-MM';
      } else if(gregorian.length === 6) {
        format = 'YYYY-M';
      } else if(gregorian.length === 7) {
        format = 'YYYY-MM';
      } else {
        process.stderr.write(`ERROR: unknown format ${ gregorian }\n`.red);
        process.exit(1);
      }
    }
    current = moment(gregorian, format)
  } else {
    current = moment();
  }

  if(!current.isValid()) {
    process.stderr.write(`ERROR: invalid date ${ gregorian }\n`.red);
    process.exit(1);
  }

  process.stdout.write(`  ${ colors.bold.blue(current.format('YYYY年MM月')) }`);

  const dates = [
    ...Array.from({ length: current.clone().startOf('month').day() })
      .map((_, index) => current.clone().startOf('month').subtract(index + 1, 'day'))
      .reverse(),
    ...Array.from({ length: current.clone().endOf('month').date() })
      .map((_, index) => current.clone().startOf('month').add(index, 'day')),
    ...Array.from({ length: 6 - current.clone().endOf('month').day() })
      .map((_, index) => current.clone().endOf('month').add(index + 1, 'day'))
  ];

  const groups = Array.from({ length: Math.ceil(dates.length / 7) })
    .map((_, index) => dates.slice(index * 7, (index * 7) + 7));


  const table = Table(
    ['第\\周', '周日', '周一', '周二', '周三', '周四', '周五', '周六'].map(value => {
      const color = ['周六', '周日'].includes(value) ? 'red' : undefined;
      return {
        value,
        width: 100,
        color: color,
        formatter: value => value,
      };
    }),
    groups.map(group => {
      const _group = group.map(date => {
        const today = date.isSame(moment(), 'date');
        const withinRange = date.isSame(current, 'month');
        const compoundDate = database.getCompoundDate(date.toDate());
        const string = `${ date.format('MM/DD') }\n${ compoundDate.lunarDate === 1 ? compoundDate.toString('lunarMonth') : compoundDate.toString('lunarDate') }`;
        const segments = string.split('\n');
        return segments.map(segment => today ? colors.bold.blue(segment) : (!withinRange ? colors.italic.gray(segment) : segment)).join('\n');
      });
      return [colors.gray(group[1].format('Wo')), ..._group];
    }),
    {
      width: '92'
    }
  );

  process.stdout.write(`${ table.render() }\n`);
});
