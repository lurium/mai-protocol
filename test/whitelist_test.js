const assert = require('assert');
const LibWhitelist = artifacts.require('./lib/LibWhitelist.sol');
const { newContract, getContracts } = require('./utils');

contract('Whitelist', accounts => {
    it('default whitelist is empty', async () => {
        const whitelistContract = await newContract(LibWhitelist);

        const whitelist = await whitelistContract.methods.getAllAddresses().call({ from: accounts[0] });
        assert.equal(whitelist.length, 0);
    });

    it('can add/remove address into whitelist', async () => {
        const whitelistContract = await newContract(LibWhitelist);
        let whitelist;

        await whitelistContract.methods.addAddress(accounts[1]).send({ from: accounts[0] });
        await whitelistContract.methods.addAddress(accounts[2]).send({ from: accounts[0] });

        whitelist = await whitelistContract.methods.getAllAddresses().call({ from: accounts[0] });
        let expectedAccounts = [accounts[1], accounts[2]];

        assert.equal(whitelist.length, expectedAccounts.length);

        for (let i = 0; i < expectedAccounts.length; i++) {
            assert.equal(whitelist[i].toLowerCase(), expectedAccounts[i].toLowerCase());
        }

        await whitelistContract.methods.removeAddress(accounts[1]).send({ from: accounts[0] });

        whitelist = await whitelistContract.methods.getAllAddresses().call({ from: accounts[0] });
        expectedAccounts = [accounts[2]];

        assert.equal(whitelist.length, expectedAccounts.length);

        for (let i = 0; i < expectedAccounts.length; i++) {
            assert.equal(whitelist[i].toLowerCase(), expectedAccounts[i].toLowerCase());
        }
    });

    it('should revert when caller is not in whitelist', async () => {
        const exchange = (await getContracts()).exchange;

        try {
            await exchange.methods
                .transferOwnership('0x0000000000000000000000000000000000000000')
                .send({ from: accounts[1] });
        } catch (e) {
            assert.ok(e.message.match("revert"));
            return;
        }

        assert(false, 'Should never get here');
    });

    it('add whitelist duplicated', async () => {
        const whitelistContract = await newContract(LibWhitelist);
        await whitelistContract.methods.addAddress(accounts[1]).send({ from: accounts[0] });
        try {
            await whitelistContract.methods.addAddress(accounts[1]).send({ from: accounts[0] });
            throw null;
        } catch (error) {
            assert.equal(error.message.includes("ADDRESS_ALREADY_IN_WHITELIST_ERROR"), true);
        }
    });

    it('remove whitelist duplicated', async () => {
        const whitelistContract = await newContract(LibWhitelist);
        await whitelistContract.methods.addAddress(accounts[1]).send({ from: accounts[0] });
        await whitelistContract.methods.removeAddress(accounts[1]).send({ from: accounts[0] });
        try {
            await whitelistContract.methods.removeAddress(accounts[1]).send({ from: accounts[0] });
            throw null;
        } catch (error) {
            assert.equal(error.message.includes("ADDRESS_NOT_IN_WHITELIST_ERROR"), true);
        }
    });
});
