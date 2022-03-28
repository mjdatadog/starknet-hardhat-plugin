#!/bin/bash
set -e

npx hardhat starknet-compile contracts/contract.cairo contracts/util.cairo

npx hardhat test --no-compile test/oz-account-test.ts test/argent-account-test.ts