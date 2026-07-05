export function parseL402Receipt(receipt) {
    const [macaroon, preimage] = receipt.split(":");
    if (!macaroon || !preimage)
        return { valid: false, macaroon: null, preimage: null };
    return { valid: true, macaroon, preimage };
}
