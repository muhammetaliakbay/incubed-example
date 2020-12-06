/**
 * Original: https://github.com/blockchainsllc/in3-contracts/tree/19b23ca9f030b041cd12efddaca960bbf0b09d82/src/utils/deployment.js
 */

import fs from 'fs';

export async function deployBlockHashRegistry(web3, privateKey) {

    //const web3 = new Web3(url ? url : "http://localhost:8545")

    const ethAcc = await web3.eth.accounts.privateKeyToAccount(privateKey ? privateKey : "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7");

    const bin = JSON.parse(fs.readFileSync('lib/contracts/BlockhashRegistry.json', 'utf8'))

    const nonce = await web3.eth.getTransactionCount(ethAcc.address)

    const gasPrice = await web3.eth.getGasPrice()

    const transactionParams = {
        from: ethAcc.address,
        data: bin.bytecode,
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: ''
    }

    const signedTx = await web3.eth.accounts.signTransaction(transactionParams, ethAcc.privateKey);
    const tx = await (web3.eth.sendSignedTransaction(signedTx.rawTransaction));

    // console.log("------------------")
    // console.log("blockhashRegistry")
    // console.log("deployed by:", ethAcc.address)
    // console.log("gasUsed:", tx.gasUsed)
    // console.log("costs", web3.utils.toBN(tx.gasUsed).mul(web3.utils.toBN(gasPrice)).div(web3.utils.toBN('1000000000000000000')).toString('hex') + " ether")
    // console.log("blockhashRegistry-address: " + tx.contractAddress)
    // console.log("------------------")
    return tx
}

export async function deployNodeRegistryLogic(web3, blockHashRegistryAddress, nodeRegistryDataAddress, privateKey, minDeposit?) {

    const ethAcc = await web3.eth.accounts.privateKeyToAccount(privateKey ? privateKey : "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7");

    const bin = JSON.parse(fs.readFileSync('lib/contracts/NodeRegistryLogic.json', 'utf8'))

    const bhAddress = blockHashRegistryAddress ? blockHashRegistryAddress : (await deployBlockHashRegistry(web3, ethAcc.privateKey)).contractAddress

    const blockBefore = await web3.eth.getBlock('latest')

    const nonce = await web3.eth.getTransactionCount(ethAcc.address)
    const gasPrice = await web3.eth.getGasPrice()

    const transactionParams = {
        from: ethAcc.address,
        data: bin.bytecode + web3.eth.abi.encodeParameters(['address', 'address', 'uint'], [bhAddress, nodeRegistryDataAddress, minDeposit ?? "10000000000000000"]).substr(2),
        gas: blockBefore.gasLimit,
        nonce: nonce,
        gasPrice: gasPrice,
        to: ''

    }

    const signedTx = await web3.eth.accounts.signTransaction(transactionParams, ethAcc.privateKey);

    const tx = await (web3.eth.sendSignedTransaction(signedTx.rawTransaction));

    // console.log("nodeRegistryLogic")
    // console.log("------------------")
    // console.log("deployed by:", ethAcc.address)
    // console.log("gasUsed:", tx.gasUsed)
    // console.log("costs", web3.utils.toBN(tx.gasUsed).mul(web3.utils.toBN(gasPrice)).div(web3.utils.toBN('1000000000000000000')).toString('hex') + " ether")
    // console.log("nodeRegistry-address: " + tx.contractAddress)
    // console.log("------------------")
    return tx

}

export async function deployNodeRegistryData(web3, privateKey) {


    const ethAcc = await web3.eth.accounts.privateKeyToAccount(privateKey ? privateKey : "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7");

    const bin = JSON.parse(fs.readFileSync('lib/contracts/NodeRegistryData.json', 'utf8'))

    const nonce = await web3.eth.getTransactionCount(ethAcc.address)

    const gasPrice = await web3.eth.getGasPrice()

    const transactionParams = {
        from: ethAcc.address,
        data: bin.bytecode,
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: ''
    }

    const signedTx = await web3.eth.accounts.signTransaction(transactionParams, ethAcc.privateKey);
    const tx = await (web3.eth.sendSignedTransaction(signedTx.rawTransaction));
    //  console.log("------------------")
    //  console.log("nodeRegistryData")
    //  console.log("deployed by:", ethAcc.address)
    //  console.log("gasUsed:", tx.gasUsed)
    //  console.log("costs", web3.utils.toBN(tx.gasUsed).mul(web3.utils.toBN(gasPrice)).div(web3.utils.toBN('1000000000000000000')).toString('hex') + " ether")
    //  console.log("nodeRegistry-address: " + tx.contractAddress)
    //  console.log("------------------")
    return tx
}

export async function deployContracts(web3, privateKey?, minDeposit?) {

    const pk = privateKey ?? "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7"
    const ethAcc = await web3.eth.accounts.privateKeyToAccount(pk);

    const blockHashRegistryDeployTx = await deployBlockHashRegistry(web3, pk)
    const blockHashRegistryAddress = blockHashRegistryDeployTx.contractAddress

    const nodeRegistryDataDeployTx = await deployNodeRegistryData(web3, pk)
    const nodeRegistryDataAddress = nodeRegistryDataDeployTx.contractAddress

    const nodeRegistryLogicDeployTx = await deployNodeRegistryLogic(web3, blockHashRegistryAddress, nodeRegistryDataAddress, pk, minDeposit)
    const nodeRegistryLogicAddress = nodeRegistryLogicDeployTx.contractAddress

    const ERC20TokenDeployTx = await deployERC20Wrapper(web3, pk)
    const ERC20TokenAddress = ERC20TokenDeployTx.contractAddress

    const bin = JSON.parse(fs.readFileSync('lib/contracts/NodeRegistryData.json', 'utf8'))

    const nodeRegistryData = new web3.eth.Contract(bin.abi, nodeRegistryDataAddress)

    let nonce = await web3.eth.getTransactionCount(ethAcc.address)
    let gasPrice = await web3.eth.getGasPrice()
    const txParamsSetERC20Token = {
        from: ethAcc.address,
        data: nodeRegistryData.methods.adminSetSupportedToken(ERC20TokenAddress).encodeABI(),
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: nodeRegistryDataAddress
    }

    const signedSetToken = await web3.eth.accounts.signTransaction(txParamsSetERC20Token, ethAcc.privateKey);
    await (web3.eth.sendSignedTransaction(signedSetToken.rawTransaction));

    nonce = await web3.eth.getTransactionCount(ethAcc.address)
    gasPrice = await web3.eth.getGasPrice()
    const txParamsSetLogic = {
        from: ethAcc.address,
        data: nodeRegistryData.methods.adminSetLogic(nodeRegistryLogicAddress).encodeABI(),
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: nodeRegistryDataAddress
    }

    const signedSetLogic = await web3.eth.accounts.signTransaction(txParamsSetLogic, ethAcc.privateKey);
    await (web3.eth.sendSignedTransaction(signedSetLogic.rawTransaction));

    return {
        blockhashRegistry: blockHashRegistryAddress,
        nodeRegistryLogic: nodeRegistryLogicAddress,
        nodeRegistryData: nodeRegistryDataAddress,
        ERC20Token: ERC20TokenAddress
    }

}

export async function deployERC20Wrapper(web3, privateKey) {
    const pk = privateKey || "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7"
    const ethAcc = await web3.eth.accounts.privateKeyToAccount(pk);
    const bin = JSON.parse(fs.readFileSync('lib/contracts/ERC20Wrapper.json', 'utf8'))
    const nonce = await web3.eth.getTransactionCount(ethAcc.address)
    const gasPrice = await web3.eth.getGasPrice()
    const transactionParams = {
        from: ethAcc.address,
        data: bin.bytecode,
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: ''
    }

    const signedTx = await web3.eth.accounts.signTransaction(transactionParams, ethAcc.privateKey);
    return web3.eth.sendSignedTransaction(signedTx.rawTransaction);

}

export async function deployWhiteListContract(web3, nodeRegistryDataAddress, privateKey) {
    const pk = privateKey || "0x4d5db4107d237df6a3d58ee5f70ae63d73d7658d4026f2eefd2f204c81682cb7"
    const ethAcc = await web3.eth.accounts.privateKeyToAccount(pk);
    const bin = JSON.parse(fs.readFileSync('lib/contracts/IN3WhiteList.json', 'utf8'))
    const nonce = await web3.eth.getTransactionCount(ethAcc.address)
    const gasPrice = await web3.eth.getGasPrice()
    const transactionParams = {
        from: ethAcc.address,
        data: bin.bytecode + web3.eth.abi.encodeParameters(['address'], [ nodeRegistryDataAddress]).substr(2),
        gas: 7000000,
        nonce: nonce,
        gasPrice: gasPrice,
        to: ''
    }

    const signedTx = await web3.eth.accounts.signTransaction(transactionParams, ethAcc.privateKey);
    return web3.eth.sendSignedTransaction(signedTx.rawTransaction);

}