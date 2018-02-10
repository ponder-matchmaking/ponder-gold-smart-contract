/*
 * Test for Ponder Gold Token Smart Contract.
 * Author: devsatish
 */

tests.push ({
  name: "PonderGoldToken",
  steps: [
    { name: "Ensure there is at least one account: Alice",
      body: function (test) {
        while (web3.eth.accounts.length < 1)
          personal.newAccount ("");

        test.alice = web3.eth.accounts [0];
      }},
    { name: "Ensure Alice has at least 5 ETH",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getBalance (test.alice).gte (web3.toWei ("5", "ether"));
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Alice deploys three Wallet contracts: Bob, Carol and Dave",
      body: function (test) {
        loadScript (
          "target/test-solc-js/Wallet.abi.js");
        var walletABI = _;
        loadScript (
          "target/test-solc-js/Wallet.bin.js");
        var walletCode = _;
        test.walletContract =
          web3.eth.contract (walletABI);

        personal.unlockAccount (test.alice, "");
        test.tx1 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx2 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
        test.tx3 = test.walletContract.new (
          {from: test.alice, data: walletCode, gas: 1000000}).
          transactionHash;
      }},
    { name: "Make sure contracts were deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx1) &&
          web3.eth.getTransactionReceipt (test.tx2) &&
          web3.eth.getTransactionReceipt (test.tx3);
      },
      body: function (test) {
        miner.stop ();

        assert (
          'web3.eth.getTransactionReceipt (test.tx1).contractAddress',
          web3.eth.getTransactionReceipt (test.tx1).contractAddress);

        assert (
          'web3.eth.getTransactionReceipt (test.tx2).contractAddress',
          web3.eth.getTransactionReceipt (test.tx2).contractAddress);

        assert (
          'web3.eth.getTransactionReceipt (test.tx3).contractAddress',
          web3.eth.getTransactionReceipt (test.tx3).contractAddress);

        test.bob = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx1).contractAddress);

        test.carol = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx2).contractAddress);

        test.dave = test.walletContract.at (
            web3.eth.getTransactionReceipt (test.tx3).contractAddress);
      }},
    { name: "Alice deploys PonderGoldTokenWrapper contract",
      body: function (test) {
        loadScript (
          "target/test-solc-js/PonderGoldTokenWrapper.abi.js");
        var ponderGoldTokenWrapperABI = _;
        loadScript (
          "target/test-solc-js/PonderGoldTokenWrapper.bin.js");
        var ponderGoldTokenWrapperCode = _;
        test.ponderGoldTokenWrapperContract =
          web3.eth.contract (ponderGoldTokenWrapperABI);

        personal.unlockAccount (test.alice, "");
        test.tx = test.ponderGoldTokenWrapperContract.new (
          {
            from: test.alice,
            data: ponderGoldTokenWrapperCode,
            gas: 2000000
          }).
          transactionHash;
      }},
    { name: "Make sure contract was deployed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assert (
          'web3.eth.getTransactionReceipt (test.tx).contractAddress',
          web3.eth.getTransactionReceipt (test.tx).contractAddress);

        test.ponderGoldTokenWrapper =
          test.ponderGoldTokenWrapperContract.at (
            web3.eth.getTransactionReceipt (test.tx).contractAddress);

        assert ('"PROTOS" == test.ponderGoldTokenWrapper.name ()',
            "PROTOS" == test.ponderGoldTokenWrapper.name ());

        assert ('"PRTS" == test.ponderGoldTokenWrapper.symbol ()',
            "PRTS" == test.ponderGoldTokenWrapper.symbol ());

        assert ('0 == test.ponderGoldTokenWrapper.decimals ()',
            0 == test.ponderGoldTokenWrapper.decimals ());
      }},
    { name: "Alice makes Bob the owner of smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.ponderGoldTokenWrapper.setOwner (
          test.bob.address,
          {
            from: test.alice,
            gas: 1000000
          });
      }},
    { name: "Make sure transaction succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();
      }},
    { name: "Dave tries to create 1000 tokens but he is not an owner of the contract",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.totalSupply () == 0',
          test.ponderGoldTokenWrapper.totalSupply () == 0);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 0',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.createTokens.getData (1000),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 0',
          resultEvents.length == 0);

        assert (
          'test.ponderGoldTokenWrapper.totalSupply () == 0',
          test.ponderGoldTokenWrapper.totalSupply () == 0);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 0',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 0);
      }},
    { name: "Bob creates 1000 tokens",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.totalSupply () == 0',
          test.ponderGoldTokenWrapper.totalSupply () == 0);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 0',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.createTokens.getData (1000),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure 1000 tokens were created and given to Bob",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.ponderGoldTokenWrapper.totalSupply () == 1000',
          test.ponderGoldTokenWrapper.totalSupply () == 1000);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 1000',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 1000);
      }},
    { name: "Dave tries to freeze token transfers but he is not an owner of the contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure freeze failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var freezeEvents = test.ponderGoldTokenWrapper.Freeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'freezeEvents.length == 0',
          freezeEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);
      }},
    { name: "Bob transfers 1 token to Dave",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 1000',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 1000);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 0',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.transfer.getData (
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Bob lost and Dave got 1 token",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.ponderGoldTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
            'transferEvents [0].args._from == test.bob.address',
            transferEvents [0].args._from == test.bob.address);

        assert (
            'transferEvents [0].args._to == test.dave.address',
            transferEvents [0].args._to == test.dave.address);

        assert (
            'transferEvents [0].args._value == 1',
            transferEvents [0].args._value == 1);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 999',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 999);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 1',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 1);
      }},
    { name: "Bob allows Carol to transfer 100 of his tokens",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 0',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 0);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.approve.getData (
              test.carol.address,
              100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Carol is now allowed to transfer 100 Bob's tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var approvalEvents = test.ponderGoldTokenWrapper.Approval (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'approvalEvents.length == 1',
          approvalEvents.length == 1);

        assert (
            'approvalEvents [0].args._owner == test.bob.address',
            approvalEvents [0].args._owner == test.bob.address);

        assert (
            'approvalEvents [0].args._spender == test.carol.address',
            approvalEvents [0].args._spender == test.carol.address);

        assert (
            'approvalEvents [0].args._value == 100',
            approvalEvents [0].args._value == 100);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 100',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 100);
      }},
    { name: "Carol transfers 1 Bob's token to Dave",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 999',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 999);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 1',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 1);

        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 100',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 100);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.transferFrom.getData (
              test.bob.address,
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Bob lost and Dave got 1 token and Carol's allowance decreased by 1",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.ponderGoldTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
            'transferEvents [0].args._from == test.bob.address',
            transferEvents [0].args._from == test.bob.address);

        assert (
            'transferEvents [0].args._to == test.dave.address',
            transferEvents [0].args._to == test.dave.address);

        assert (
            'transferEvents [0].args._value == 1',
            transferEvents [0].args._value == 1);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2);

        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 99',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 99);
      }},
    { name: "Bob freezes token transfers",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfers were frozen",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var freezeEvents = test.ponderGoldTokenWrapper.Freeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'freezeEvents.length == 1',
          freezeEvents.length == 1);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);
      }},
    { name: "Bob freezes token transfers again",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.freezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure freeze failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var freezeEvents = test.ponderGoldTokenWrapper.Freeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'freezeEvents.length == 0',
          freezeEvents.length == 0);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);
      }},
    { name: "Dave tries to unfreeze token transfers but he is not an owner of the smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure unfreeze failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var unfreezeEvents = test.ponderGoldTokenWrapper.Unfreeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'unfreezeEvents.length == 0',
          unfreezeEvents.length == 0);

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);
      }},
    { name: "Bob tries to transfer 1 token to Dave, but transfers are frozen",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.transfer.getData (
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.ponderGoldTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            '!resultEvents [0].args._value',
            !resultEvents [0].args._value);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2);
      }},
    { name: "Carol tries to transfer 1 Bob's token to Dave but transfers are frozen",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2);

        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 99',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 99);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.transferFrom.getData (
              test.bob.address,
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfer failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.ponderGoldTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 0',
          transferEvents.length == 0);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            '!resultEvents [0].args._value',
            !resultEvents [0].args._value);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2);

        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 99',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 99);
      }},
    { name: "Bob unfreezes token transfers",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transfers were unfrozen",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var unfreezeEvents = test.ponderGoldTokenWrapper.Unfreeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'unfreezeEvents.length == 1',
          unfreezeEvents.length == 1);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);
      }},
    { name: "Bob unfreezes token transfers again",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.unfreezeTransfers.getData (),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure unfreeze failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var unfreezeEvents = test.ponderGoldTokenWrapper.Unfreeze (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'unfreezeEvents.length == 0',
          unfreezeEvents.length == 0);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);
      }},
    { name: "Bob transfers 1 token to Dave",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 998);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 2);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.transfer.getData (
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Bob lost and Dave got 1 token",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.ponderGoldTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
            'transferEvents [0].args._from == test.bob.address',
            transferEvents [0].args._from == test.bob.address);

        assert (
            'transferEvents [0].args._to == test.dave.address',
            transferEvents [0].args._to == test.dave.address);

        assert (
            'transferEvents [0].args._value == 1',
            transferEvents [0].args._value == 1);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 997',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 997);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 3',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 3);
      }},
    { name: "Carol transfers 1 Bob's token to Dave",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 997',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 997);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 3',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 3);

        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 99',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 99);

        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.transferFrom.getData (
              test.bob.address,
              test.dave.address,
              1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Bob lost and Dave got 1 token and Carol's allowance decreased by 1",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var transferEvents = test.ponderGoldTokenWrapper.Transfer (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'transferEvents.length == 1',
          transferEvents.length == 1);

        assert (
            'transferEvents [0].args._from == test.bob.address',
            transferEvents [0].args._from == test.bob.address);

        assert (
            'transferEvents [0].args._to == test.dave.address',
            transferEvents [0].args._to == test.dave.address);

        assert (
            'transferEvents [0].args._value == 1',
            transferEvents [0].args._value == 1);

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 996',
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address) == 996);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 4',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 4);

        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 98',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 98);
      }},
    { name: "Bob tries to allow Carol to transfer 200 of his tokens assuming that current allowance is 97 while actual allowance is 98",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 98',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 98);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.approve['address,uint256,uint256'].getData (
              test.carol.address,
              97,
              200),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure allowance was not changed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var approvalEvents = test.ponderGoldTokenWrapper.Approval (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'approvalEvents.length == 0',
          approvalEvents.length == 0);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            '!resultEvents [0].args._value',
            !resultEvents [0].args._value);

        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 98',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 98);
      }},
    { name: "Bob allows Carol to transfer 200 of his tokens assuming that current allowance is 98 which is correct",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 98',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 98);

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.approve['address,uint256,uint256'].getData (
              test.carol.address,
              98,
              200),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure Carol is now able to transfer 200 of Bob's tokens",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var approvalEvents = test.ponderGoldTokenWrapper.Approval (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'approvalEvents.length == 1',
          approvalEvents.length == 1);

        assert (
          'approvalEvents [0].args._owner == test.bob.address',
          approvalEvents [0].args._owner == test.bob.address);

        assert (
          'approvalEvents [0].args._spender == test.carol.address',
          approvalEvents [0].args._spender == test.carol.address);

        assert (
          'approvalEvents [0].args._value == 200',
          approvalEvents [0].args._value == 200);

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 2',
          resultEvents.length == 2);

        assert (
          'resultEvents [0].args._value',
          resultEvents [0].args._value);

        assert (
          'resultEvents [1].args._value',
          resultEvents [1].args._value);

        assert (
          'test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 200',
          test.ponderGoldTokenWrapper.allowance (test.bob.address, test.carol.address) == 200);
      }},
    { name: "Carol tries to make Dave an owner of the smart contract but she is not an owner of the smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.carol.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.setOwner.getData (test.dave.address),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.carol.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);
      }},
    { name: "Dave tries to create 1 token but he is not an owner of the smart contract",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.totalSupply () == 1000',
          test.ponderGoldTokenWrapper.totalSupply () == 1000);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 4',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 4);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.createTokens.getData (1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          '!execResultEvents [0].args._value',
          !execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 0',
          resultEvents.length == 0);

        assert (
          'test.ponderGoldTokenWrapper.totalSupply () == 1000',
          test.ponderGoldTokenWrapper.totalSupply () == 1000);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 4',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 4);
      }},
    { name: "Bob makes Dave an owner of the smart contract",
      body: function (test) {
        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.setOwner.getData (test.dave.address),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure transaction executed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.bob.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

      }},
    { name: "Dave creates 1 token",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.totalSupply () == 1000',
          test.ponderGoldTokenWrapper.totalSupply () == 1000);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 4',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 4);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.createTokens.getData (1),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token was created and given to Dave",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'test.ponderGoldTokenWrapper.totalSupply () == 1001',
          test.ponderGoldTokenWrapper.totalSupply () == 1001);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 5',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 5);
      }},
    { name: "Dave tries to create 2^256 - 1001 tokens which would exceed limit for number of tokens in circulation",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.totalSupply () == 1001',
          test.ponderGoldTokenWrapper.totalSupply () == 1001);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 5',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 5);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.createTokens.getData (
            web3.toBigNumber ('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC17')),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation failed",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            '!resultEvents [0].args._value',
            !resultEvents [0].args._value);

        assert (
          'test.ponderGoldTokenWrapper.totalSupply () == 1001',
          test.ponderGoldTokenWrapper.totalSupply () == 1001);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dsve.address) == 5',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 5);
      }},
    { name: "Dave creates 2^256 - 1002 tokens",
      body: function (test) {
        assert (
          'test.ponderGoldTokenWrapper.totalSupply () == 1001',
          test.ponderGoldTokenWrapper.totalSupply () == 1001);

        assert (
          'test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 5',
          test.ponderGoldTokenWrapper.balanceOf (test.dave.address) == 5);

        personal.unlockAccount (test.alice, "");
        test.tx = test.dave.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.createTokens.getData (
            web3.toBigNumber ('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC16')),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        var execResultEvents = test.dave.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'execResultEvents.length == 1',
          execResultEvents.length == 1);

        assert (
          'execResultEvents [0].args._value',
          execResultEvents [0].args._value);

        var resultEvents = test.ponderGoldTokenWrapper.Result (
          {}, 
          {
            fromBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber,
            toBlock: web3.eth.getTransactionReceipt (test.tx).blockNumber
          }).get ();

        assert (
          'resultEvents.length == 1',
          resultEvents.length == 1);

        assert (
            'resultEvents [0].args._value',
            resultEvents [0].args._value);

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (test.ponderGoldTokenWrapper.totalSupply ())',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF").eq (test.ponderGoldTokenWrapper.totalSupply ()));

        assert (
          'web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC1B").eq (test.ponderGoldTokenWrapper.balanceOf (test.dave.address))',
          web3.toBigNumber ("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC1B").eq (test.ponderGoldTokenWrapper.balanceOf (test.dave.address)));
      }},
    { name: "Bob tries to burn 997 tokens but he has only 996",
      body: function (test) {
        assertBNEquals (
          'test.ponderGoldTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          test.ponderGoldTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address)',
          996,
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.burnTokens.getData (997),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded but no tokens were burned",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.ponderGoldTokenWrapper.Result",
          test.ponderGoldTokenWrapper,
          test.ponderGoldTokenWrapper.Result,
          test.tx,
          { _value: false });

        assertBNEquals (
          'test.ponderGoldTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          test.ponderGoldTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address)',
          996,
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 0 tokens",
      body: function (test) {
        assertBNEquals (
          'test.ponderGoldTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          test.ponderGoldTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address)',
          996,
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.burnTokens.getData (0),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.ponderGoldTokenWrapper.Result",
          test.ponderGoldTokenWrapper,
          test.ponderGoldTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
          'test.ponderGoldTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          test.ponderGoldTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address)',
          996,
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 100 tokens",
      body: function (test) {
        assertBNEquals (
          'test.ponderGoldTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
          test.ponderGoldTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address)',
          996,
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.burnTokens.getData (100),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.ponderGoldTokenWrapper.Result",
          test.ponderGoldTokenWrapper,
          test.ponderGoldTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
          'test.ponderGoldTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF9B",
          test.ponderGoldTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address)',
          896,
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 896 tokens",
      body: function (test) {
        assertBNEquals (
          'test.ponderGoldTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF9B",
          test.ponderGoldTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address)',
          896,
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.burnTokens.getData (896),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.ponderGoldTokenWrapper.Result",
          test.ponderGoldTokenWrapper,
          test.ponderGoldTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
          'test.ponderGoldTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC1B",
          test.ponderGoldTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address)',
          0,
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address));
      }},
    { name: "Bob burns 0 tokens",
      body: function (test) {
        assertBNEquals (
          'test.ponderGoldTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC1B",
          test.ponderGoldTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address)',
          0,
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address));

        personal.unlockAccount (test.alice, "");
        test.tx = test.bob.execute (
          test.ponderGoldTokenWrapper.address,
          test.ponderGoldTokenWrapper.burnTokens.getData (0),
          0,
          {from: test.alice, gas: 1000000});
      }},
    { name: "Make sure token creation succeeded",
      precondition: function (test) {
        miner.start ();
        return web3.eth.getTransactionReceipt (test.tx);
      },
      body: function (test) {
        miner.stop ();

        assertEvents (
          "test.bob.Result",
          test.bob,
          test.bob.Result,
          test.tx,
          { _value: true });

        assertEvents (
          "test.ponderGoldTokenWrapper.Result",
          test.ponderGoldTokenWrapper,
          test.ponderGoldTokenWrapper.Result,
          test.tx,
          { _value: true });

        assertBNEquals (
          'test.ponderGoldTokenWrapper.totalSupply ()',
          "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC1B",
          test.ponderGoldTokenWrapper.totalSupply ());

        assertBNEquals (
          'test.ponderGoldTokenWrapper.balanceOf (test.bob.address)',
          0,
          test.ponderGoldTokenWrapper.balanceOf (test.bob.address));
      }}
  ]});