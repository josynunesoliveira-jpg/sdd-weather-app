import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const tempDirectories: string[] = [];
const reportScript = resolve('scripts/availability-report.mjs');

afterEach(() => {
  for (const directory of tempDirectories.splice(0))
    rmSync(directory, { recursive: true, force: true });
});

function runReport(csv: string, month: string): string {
  const directory = mkdtempSync(join(tmpdir(), 'weather-sli-'));
  tempDirectories.push(directory);
  const file = join(directory, 'checks.csv');
  writeFileSync(file, csv);
  return execFileSync(process.execPath, [reportScript, file, month], { encoding: 'utf8' });
}

describe('relatório mensal de disponibilidade', () => {
  it('calcula shell 2xx e mantém Open-Meteo em série separada', () => {
    const output = runReport(
      [
        'timestamp,target,http_status',
        '2026-10-01T00:00:00Z,shell,200',
        '2026-10-01T00:01:00Z,shell,503',
        '2026-10-01T00:02:00Z,shell,204',
        '2026-10-01T00:00:00Z,open-meteo,429',
        '2026-10-01T00:01:00Z,open-meteo,200',
        '2026-09-30T23:59:00Z,shell,200',
      ].join('\n'),
      '2026-10',
    );
    expect(JSON.parse(output)).toEqual({
      month: '2026-10',
      shell: {
        successes: 2,
        total: 3,
        availabilityPercent: 66.667,
        goalPercent: 99.5,
        meetsGoal: false,
      },
      openMeteo: { successes: 1, total: 2, availabilityPercent: 50 },
    });
  });

  it('conta timeout sem status como verificação não bem-sucedida e trata mês sem amostras', () => {
    const output = runReport(
      ['timestamp,target,http_status', '2026-10-01T00:00:00Z,shell,'].join('\n'),
      '2026-10',
    );
    expect(JSON.parse(output).shell).toMatchObject({
      successes: 0,
      total: 1,
      availabilityPercent: 0,
      meetsGoal: false,
    });
    const empty = JSON.parse(runReport('timestamp,target,http_status\n', '2026-11'));
    expect(empty.shell).toMatchObject({
      successes: 0,
      total: 0,
      availabilityPercent: null,
      meetsGoal: false,
    });
  });

  it('rejeita mês e CSV inválidos', () => {
    expect(() => runReport('timestamp,target,http_status\n', '2026-13')).toThrow();
    expect(() => runReport('wrong\n', '2026-10')).toThrow();
  });
});
