import * as anchor from '@project-serum/anchor'
import { Provider, BN } from '@project-serum/anchor'
import { Keypair, PublicKey } from '@solana/web3.js'
import { Market, Network, Pair, DENOMINATOR, TICK_LIMIT, tou64 } from '@invariant-labs/sdk'
import { FeeTier, Decimal } from '@invariant-labs/sdk/lib/market'
import { fromFee } from '@invariant-labs/sdk/lib/utils'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import {
  createFeeTier,
  createPool,
  createPositionList,
  createState,
  createTick,
  createToken,
  initPosition,
  swap,
  withdrawProtocolFee
} from './testUtils'
import { assert } from 'chai'
import { assertThrowsAsync, ERRORS, toDecimal } from '@invariant-labs/sdk/src/utils'
import {
  CreateFeeTier,
  CreatePool,
  CreateTick,
  InitPosition,
  Swap,
  WithdrawProtocolFee
} from '@invariant-labs/sdk/src/market'

describe('protocol-fee', () => {
  const provider = Provider.local()
  const connection = provider.connection
  // @ts-expect-error
  const wallet = provider.wallet.payer as Keypair
  const mintAuthority = Keypair.generate()
  const positionOwner = Keypair.generate()
  const admin = Keypair.generate()
  let market: Market
  const feeTier: FeeTier = {
    fee: fromFee(new BN(600)),
    tickSpacing: 10
  }
  const lowerTick = -20
  const protocolFee: Decimal = { v: fromFee(new BN(10000)) }
  let pair: Pair
  let tokenX: Token
  let tokenY: Token
  let userTokenXAccount: PublicKey
  let userTokenYAccount: PublicKey

  before(async () => {
    market = await Market.build(
      Network.LOCAL,
      provider.wallet,
      connection,
      anchor.workspace.Amm.programId
    )

    await Promise.all([
      await connection.requestAirdrop(mintAuthority.publicKey, 1e9),
      await connection.requestAirdrop(admin.publicKey, 1e9),
      await connection.requestAirdrop(positionOwner.publicKey, 1e9)
    ])

    const tokens = await Promise.all([
      createToken(connection, wallet, mintAuthority),
      createToken(connection, wallet, mintAuthority)
    ])

    pair = new Pair(tokens[0].publicKey, tokens[1].publicKey, feeTier)
    tokenX = new Token(connection, pair.tokenX, TOKEN_PROGRAM_ID, wallet)
    tokenY = new Token(connection, pair.tokenY, TOKEN_PROGRAM_ID, wallet)

    await createState(market, admin.publicKey, admin)

    const createFeeTierVars: CreateFeeTier = {
      feeTier,
      admin: admin.publicKey
    }
    await createFeeTier(market, createFeeTierVars, admin)
  })

  it('#create()', async () => {
    const createPoolVars: CreatePool = {
      pair,
      payer: admin,
      protocolFee,
      tokenX,
      tokenY
    }
    await createPool(market, createPoolVars)

    const createdPool = await market.getPool(pair)
    assert.ok(createdPool.tokenX.equals(tokenX.publicKey))
    assert.ok(createdPool.tokenY.equals(tokenY.publicKey))
    assert.ok(createdPool.fee.v.eq(feeTier.fee))
    assert.equal(createdPool.tickSpacing, feeTier.tickSpacing)
    assert.ok(createdPool.liquidity.v.eqn(0))
    assert.ok(createdPool.sqrtPrice.v.eq(DENOMINATOR))
    assert.ok(createdPool.currentTickIndex == 0)
    assert.ok(createdPool.feeGrowthGlobalX.v.eqn(0))
    assert.ok(createdPool.feeGrowthGlobalY.v.eqn(0))
    assert.ok(createdPool.feeProtocolTokenX.v.eqn(0))
    assert.ok(createdPool.feeProtocolTokenY.v.eqn(0))

    const tickmapData = await market.getTickmap(pair)
    assert.ok(tickmapData.bitmap.length == TICK_LIMIT / 4)
    assert.ok(tickmapData.bitmap.every(v => v == 0))
  })

  it('#initPosition()', async () => {
    const upperTick = 10
    const lowerTick = -20

    const createTickVars: CreateTick = {
      pair,
      index: upperTick,
      payer: admin.publicKey
    }
    await createTick(market, createTickVars, admin)

    const createTickVars2: CreateTick = {
      pair,
      index: lowerTick,
      payer: admin.publicKey
    }
    await createTick(market, createTickVars2, admin)

    userTokenXAccount = await tokenX.createAccount(positionOwner.publicKey)
    userTokenYAccount = await tokenY.createAccount(positionOwner.publicKey)
    const mintAmount = tou64(new BN(10).pow(new BN(10)))

    await tokenX.mintTo(userTokenXAccount, mintAuthority.publicKey, [mintAuthority], mintAmount)
    await tokenY.mintTo(userTokenYAccount, mintAuthority.publicKey, [mintAuthority], mintAmount)

    const liquidityDelta = { v: new BN(1000000).mul(DENOMINATOR) }

    await createPositionList(market, positionOwner.publicKey, positionOwner)

    const initPositionVars: InitPosition = {
      pair,
      owner: positionOwner.publicKey,
      userTokenX: userTokenXAccount,
      userTokenY: userTokenYAccount,
      lowerTick,
      upperTick,
      liquidityDelta
    }
    await initPosition(market, initPositionVars, positionOwner)

    assert.ok((await market.getPool(pair)).liquidity.v.eq(liquidityDelta.v))
  })
  it('#swap()', async () => {
    const swapper = Keypair.generate()
    await connection.requestAirdrop(swapper.publicKey, 1e9)

    const amount = new BN(1000)
    const accountX = await tokenX.createAccount(swapper.publicKey)
    const accountY = await tokenY.createAccount(swapper.publicKey)

    await tokenX.mintTo(accountX, mintAuthority.publicKey, [mintAuthority], tou64(amount))

    const poolDataBefore = await market.getPool(pair)
    const targetPrice = DENOMINATOR.muln(100).divn(110)
    const reservesBeforeSwap = await market.getReserveBalances(pair, tokenX, tokenY)

    const swapVars: Swap = {
      pair,
      xToY: true,
      owner: swapper.publicKey,
      amount,
      knownPrice: poolDataBefore.sqrtPrice,
      slippage: toDecimal(1, 2),
      accountX,
      accountY,
      byAmountIn: true
    }
    await swap(market, swapVars, swapper)

    const poolDataAfter = await market.getPool(pair)
    assert.ok(poolDataAfter.liquidity.v.eq(poolDataBefore.liquidity.v))
    assert.ok(poolDataAfter.currentTickIndex == lowerTick)
    assert.ok(poolDataAfter.sqrtPrice.v.lt(poolDataBefore.sqrtPrice.v))

    const amountX = (await tokenX.getAccountInfo(accountX)).amount
    const amountY = (await tokenY.getAccountInfo(accountY)).amount
    const reservesAfterSwap = await market.getReserveBalances(pair, tokenX, tokenY)
    const reserveXDelta = reservesAfterSwap.x.sub(reservesBeforeSwap.x)
    const reserveYDelta = reservesBeforeSwap.y.sub(reservesAfterSwap.y)

    assert.ok(amountX.eqn(0))
    assert.ok(amountY.eq(amount.subn(7)))
    assert.ok(reserveXDelta.eq(amount))
    assert.ok(reserveYDelta.eq(amount.subn(7)))
    assert.ok(poolDataAfter.feeGrowthGlobalX.v.eqn(5400000))
    assert.ok(poolDataAfter.feeGrowthGlobalY.v.eqn(0))
    assert.ok(poolDataAfter.feeProtocolTokenX.v.eq(new BN(600000013280)))
    assert.ok(poolDataAfter.feeProtocolTokenY.v.eq(new BN(12945000000)))
  })

  it('Admin #withdrawProtocolFee()', async () => {
    const adminAccountX = await tokenX.createAccount(admin.publicKey)
    const adminAccountY = await tokenY.createAccount(admin.publicKey)
    await tokenX.mintTo(adminAccountX, mintAuthority.publicKey, [mintAuthority], 1e9)
    await tokenY.mintTo(adminAccountY, mintAuthority.publicKey, [mintAuthority], 1e9)

    const reservesBeforeClaim = await market.getReserveBalances(pair, tokenX, tokenY)
    const adminAccountXBeforeClaim = await (await tokenX.getAccountInfo(adminAccountX)).amount

    const withdrawProtocolFeeVars: WithdrawProtocolFee = {
      pair,
      accountX: adminAccountX,
      accountY: adminAccountY,
      admin: admin.publicKey
    }
    await withdrawProtocolFee(market, withdrawProtocolFeeVars, admin)

    const adminAccountXAfterClaim = await (await tokenX.getAccountInfo(adminAccountX)).amount
    const reservesAfterClaim = await market.getReserveBalances(pair, tokenX, tokenY)

    assert.ok(reservesBeforeClaim.x.eq(reservesAfterClaim.x))
    assert.ok(adminAccountXAfterClaim.eq(adminAccountXBeforeClaim))
  })
  it('Non-Admin #withdrawProtocolFee()', async () => {
    const user = await Keypair.generate()
    await Promise.all([await connection.requestAirdrop(user.publicKey, 1e9)])
    const userAccountX = await tokenX.createAccount(user.publicKey)
    const userAccountY = await tokenY.createAccount(user.publicKey)
    await tokenX.mintTo(userAccountX, mintAuthority.publicKey, [mintAuthority], 1e9)
    await tokenY.mintTo(userAccountY, mintAuthority.publicKey, [mintAuthority], 1e9)

    const withdrawProtocolFeeVars: WithdrawProtocolFee = {
      pair,
      accountX: userAccountX,
      accountY: userAccountY,
      admin: user.publicKey
    }
    assertThrowsAsync(
      withdrawProtocolFee(market, withdrawProtocolFeeVars, user),
      ERRORS.CONSTRAINT_RAW
    )
  })
})
