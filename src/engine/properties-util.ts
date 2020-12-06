import {NodeProperties} from "./node-registry-api";

// Flag masks by the properties of node
const proof = BigInt('0x01');
const multichain = BigInt('0x02');
const archive = BigInt('0x04');
const http = BigInt('0x08');
const binary = BigInt('0x10');
const onion = BigInt('0x20');
const signer = BigInt('0x40');
const data = BigInt('0x80');
const stats = BigInt('0x100');

/**
 * Combines mask values by the parameters and minBlockHeight value by shifting.
 * @param properties Node properties
 */
export function buildProps(
    properties: Partial<NodeProperties>
): bigint {
    let sum = BigInt(0);

    if (properties.proof) sum |= proof;
    if (properties.multichain) sum |= multichain;
    if (properties.archive) sum |= archive;
    if (properties.http) sum |= http;
    if (properties.binary) sum |= binary;
    if (properties.onion) sum |= onion;
    if (properties.signer) sum |= signer;
    if (properties.data) sum |= data;
    if (properties.stats) sum |= stats;

    if (properties.minBlockHeight != undefined) {
        sum |= (properties.minBlockHeight & BigInt('0xff')) << BigInt(32);
    }

    return sum;
}


function check(
    props: bigint,
    flag: bigint
): boolean {
    return (props & flag) === flag;
}

/**
 * Parses parameters and minBlockHeight value from 'props' field of In3Node structure.
 * @param props Flags for the parameters
 */
export function parseProps(
    props: bigint
): NodeProperties {
    return {
        proof: check(props, proof),
        multichain: check(props, multichain),
        archive: check(props, archive),
        http: check(props, http),
        binary: check(props, binary),
        onion: check(props, onion),
        signer: check(props, signer),
        data: check(props, data),
        stats: check(props, stats),
        minBlockHeight: (props >> BigInt(32)) & BigInt('0xff')
    };
}
