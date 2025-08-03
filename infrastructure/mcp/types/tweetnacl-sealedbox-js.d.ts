declare module 'tweetnacl-sealedbox-js' {
  export function seal(message: Uint8Array, recipientPublicKey: Uint8Array): Uint8Array;
  export function open(sealedMessage: Uint8Array, recipientPublicKey: Uint8Array, recipientSecretKey: Uint8Array): Uint8Array | null;
}
