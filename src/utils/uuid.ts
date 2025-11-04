// Using nanoid-like simple generator based on crypto.getRandomValues
export function nanoid(size = 21): string {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < size; i++) id += alphabet[bytes[i] & 63];
  return id;
}


