const IMarketContract = artifacts.require('./interfaces/IMarketContract.sol');
const IMarketCollateralPool = artifacts.require('./interfaces/IMarketCollateralPool.sol');
const IERC20 = artifacts.require('./IERC20.sol');
const MaiProtocol = artifacts.require('MaiProtocol.sol');

const assert = require('assert');
const addresses = require('./addresses');
const { infinity } = require('./settings');
const { log } = require('./utils');

async function parseMarketContract (marketContractAddress) {
    const marketContract = await IMarketContract.at(marketContractAddress);
    const collateralPool = await IMarketCollateralPool.at(await marketContract.COLLATERAL_POOL_ADDRESS());

    const collateral = await IERC20.at(await marketContract.COLLATERAL_TOKEN_ADDRESS());
    const long = await IERC20.at(await marketContract.LONG_POSITION_TOKEN());
    const short = await IERC20.at(await marketContract.SHORT_POSITION_TOKEN());
    const mkt = await IERC20.at(await collateralPool.mktToken());

    return {
        marketContract,
        collateralPool,
        collateral,
        long,
        short,
        mkt,
    }
}

module.exports = async () => {
    try {
        const maiProtocol = await MaiProtocol.at(addresses.maiProtocol);

        for (let i = 0; i < addresses.marketContracts.length; i++) {
            const mpContractAddress = addresses.marketContracts[i];
            log("reseting approval tokens for", mpContractAddress);

            const { collateral, collateralPool } = await parseMarketContract(mpContractAddress);
            if (await collateral.allowance(maiProtocol.address, collateralPool.address) > 0) {
                await maiProtocol.approveERC20(collateral.address, collateralPool.address, 0);
                assert.equal(await collateral.allowance(maiProtocol.address, collateralPool.address), 0, "unexpected allowance of collateral");
            }

            const allowance = await collateral.allowance(maiProtocol.address, collateralPool.address)
            log("collateral", collateral.address, "for", collateralPool.address, "is disabled now, allowance =", allowance.toString());
        }

        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }

}
