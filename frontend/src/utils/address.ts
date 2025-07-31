export const shortenAddress = (
  address: string,
  startChars: number = 6,
  endChars: number = 4
): string => {
  if (!address) return "";
  if (!address.startsWith("0x")) {
    return address;
  }
  if (address.length <= startChars + endChars) {
    return address;
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

export const isEvmAddress = (address: string): boolean => {
  return Boolean(address && address.startsWith("0x") && address.length === 42);
};
