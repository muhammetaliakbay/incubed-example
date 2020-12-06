import path from "path";

/**
 * Loads ABI definitions of specified contract from compiled files
 * Tries to load using Node.js's module system, first. (works if abi-util module is running
 * inside 'lib' folder of the project)
 * If it don't work, then tries to load using absolute path of the compiled file.
 * And then, returns 'abi' field of the compiled structure json.
 * @param contractName Contract name to look for its ABI
 */
export function loadABI(contractName: string) {
    try {
        return require(`../contracts/${contractName}.json`).abi;
    } catch (e) {
        return require(`../../lib/contracts/${contractName}.json`).abi;
        // return JSON.parse(readFileSync(path.resolve(`./lib/contracts/${contractName}.json`), {encoding: 'utf8'})).abi;
    }
}
