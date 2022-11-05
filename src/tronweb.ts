const TronWeb = require('tronweb');
let tronWeb: any | null = null;

export const getTronWeb = (network: string) => {
  if (tronWeb !== null) {
    return tronWeb;
  }

  const host = getTronGridURL(network);
  const tronProApiKey = process.env.TRON_PRO_API;
  tronWeb = new TronWeb({
    fullHost: host,
    headers: tronProApiKey ? { 'TRON-PRO-API-KEY': tronProApiKey } : {},
    privateKey: ''
  });
  return tronWeb;
};

export const getTronGridURL = (network: string) => {
  const host =
    network === 'tron'
      ? 'https://api.trongrid.io'
      : `https://api.${network}.trongrid.io`;
  return host;
};
