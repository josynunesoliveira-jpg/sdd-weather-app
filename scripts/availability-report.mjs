import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const GOAL_PERCENT = 99.5;

function parseCsv(filePath) {
  const lines = readFileSync(filePath, 'utf8').trim().split(/\r?\n/);
  if (lines.shift() !== 'timestamp,target,http_status') {
    throw new Error('Cabeçalho CSV inválido. Use timestamp,target,http_status.');
  }
  return lines.filter(Boolean).map((line, index) => {
    const [timestamp, target, statusText, ...extra] = line.split(',');
    if (extra.length > 0 || !timestamp || !['shell', 'open-meteo'].includes(target)) {
      throw new Error(`Linha CSV inválida: ${String(index + 2)}`);
    }
    if (
      statusText !== '' &&
      (!/^\d{3}$/.test(statusText) || Number(statusText) < 100 || Number(statusText) > 599)
    ) {
      throw new Error(`Status HTTP inválido na linha ${String(index + 2)}`);
    }
    if (Number.isNaN(Date.parse(timestamp)))
      throw new Error(`Timestamp inválido na linha ${String(index + 2)}`);
    return { timestamp, target, status: statusText === '' ? null : Number(statusText) };
  });
}

function summarize(rows) {
  const total = rows.length;
  const successes = rows.filter(
    (row) => row.status !== null && row.status >= 200 && row.status < 300,
  ).length;
  const availabilityPercent = total === 0 ? null : Number(((100 * successes) / total).toFixed(3));
  return { successes, total, availabilityPercent };
}

export function createMonthlyReport(rows, month) {
  if (!MONTH_PATTERN.test(month)) throw new Error('Mês deve usar o formato YYYY-MM.');
  const monthRows = rows.filter((row) => row.timestamp.slice(0, 7) === month);
  const shell = summarize(monthRows.filter((row) => row.target === 'shell'));
  const openMeteo = summarize(monthRows.filter((row) => row.target === 'open-meteo'));
  return {
    month,
    shell: {
      ...shell,
      goalPercent: GOAL_PERCENT,
      meetsGoal: shell.total > 0 && (100 * shell.successes) / shell.total >= GOAL_PERCENT,
    },
    openMeteo,
  };
}

export function buildReport(filePath, month) {
  return createMonthlyReport(parseCsv(filePath), month);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [, , filePath, month] = process.argv;
  if (!filePath || !month) {
    console.error('Uso: node scripts/availability-report.mjs <checks.csv> <YYYY-MM>');
    process.exitCode = 2;
  } else {
    try {
      console.log(JSON.stringify(buildReport(filePath, month), null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Erro ao gerar relatório.');
      process.exitCode = 1;
    }
  }
}
