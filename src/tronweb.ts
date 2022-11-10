const TronWeb = require('tronweb');
let tronWeb: any | null = null;

export const getTronWeb = () => {
  if (tronWeb !== null) {
    return tronWeb;
  }

  const host = 'https://api.trongrid.io';
  const tronProApiKey = process.env.TRON_PRO_API;
  tronWeb = new TronWeb({
    fullHost: host,
    headers: tronProApiKey ? { 'TRON-PRO-API-KEY': tronProApiKey } : {},
    privateKey: ''
  });
  return tronWeb;
};
