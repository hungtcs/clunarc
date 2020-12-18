#!/usr/bin/env node
import Table from 'cli-table';
import moment from 'moment';
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
program.option('-f --format <format>', '公历日期的格式化方式', 'YYYY-MM');
program.action(async (gregorian) => {
  const options = program.opts();
  const current = gregorian ? moment(gregorian, options.format) : moment();

  process.stdout.write(`\n${ colors.blue(current.format('YYYY年MM月')) }\n`);
  const table = new Table({
    head: ['日', '一', '二', '三', '四', '五', '六'],
    chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
         , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
         , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
         , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
  });

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

  table.push(
    ...groups.map(group => group.map(date => {
      const color = date.isBefore(current.clone().startOf('month'))
                      ? 'gray' :
                        (date.isAfter(current.clone().endOf('month'))
                          ? 'gray' :
                            (date.isSame(moment(), 'date') ? 'blue' : 'black')
                        );
      const compoundDate = database.getCompoundDate(date.toDate());
      return `${ date.format('D号') }\n`[color] +
             `${ compoundDate.lunarDate === 1 ? compoundDate.toString('lunarMonth') : compoundDate.toString('lunarDate') }`[color]
    })),
  );
  process.stdout.write(`${ table.toString() }\n\n`);
});
