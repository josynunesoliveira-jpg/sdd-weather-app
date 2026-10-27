export const weatherCodes = {
  0: 'Céu limpo',
  1: 'Predominantemente limpo',
  2: 'Parcialmente nublado',
  3: 'Encoberto',
  45: 'Nevoeiro',
  48: 'Nevoeiro com geada',
  51: 'Garoa fraca',
  53: 'Garoa moderada',
  55: 'Garoa intensa',
  56: 'Garoa congelante fraca',
  57: 'Garoa congelante intensa',
  61: 'Chuva fraca',
  63: 'Chuva moderada',
  65: 'Chuva intensa',
  66: 'Chuva congelante fraca',
  67: 'Chuva congelante intensa',
  71: 'Neve fraca',
  73: 'Neve moderada',
  75: 'Neve intensa',
  77: 'Grãos de neve',
  80: 'Pancadas de chuva fracas',
  81: 'Pancadas de chuva moderadas',
  82: 'Pancadas de chuva violentas',
  85: 'Pancadas de neve fracas',
  86: 'Pancadas de neve intensas',
  95: 'Trovoada',
  96: 'Trovoada com granizo fraco',
  99: 'Trovoada com granizo intenso',
} as const satisfies Record<number, string>;

export function getWeatherDescription(code: number): string {
  return weatherCodes[code as keyof typeof weatherCodes] ?? 'Condição indisponível';
}
