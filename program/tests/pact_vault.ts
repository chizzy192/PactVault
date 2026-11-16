import * as anchor from "@anchor-lang/core";
import { AnchorError, BN, Program } from "@anchor-lang/core";
import {
  createAssociatedTokenAccount,
  createMint,
  getAccount,
  mintTo,
  transfer,
} from "@solana/spl-token";
import { expect } from "chai";
import { PactVault } from "../target/types/pact_vault";

const { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } =
  anchor.web3;
type Keypair = anchor.web3.Keypair;
type PublicKey = anchor.web3.PublicKey;

const DECIMALS = 6;
const ADVANCE_BPS = 8000;
const FEE_BPS = 300;

/** Whole tokens -> base units (6 decimals), e.g. usdc(500) = 500_000_000. */
const usdc = (tokens: number) =>
  new BN(tokens).mul(new BN(10).pow(new BN(DECIMALS)));

// The steps below share state and run top to bottom, mirroring the spec.
describe("pact_vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.pactVault as Program<PactVault>;
  const connection = provider.connection;
  const admin = (provider.wallet as anchor.Wallet).payer;

  const [poolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool")],
    program.programId
  );
  const [vaultPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pool_vault")],
    program.programId
  );
  const positionPda = (investor: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from("position"), investor.toBuffer()],
      program.programId
    )[0];

  const investorA = Keypair.generate();
  const investorB = Keypair.generate();
  let mint: PublicKey;
  let ataA: PublicKey;
  let ataB: PublicKey;

  // ---------- helpers ----------

  const tokenBalance = async (account: PublicKey) =>
    new BN((await getAccount(connection, account)).amount.toString());

  const fetchPool = () => program.account.pool.fetch(poolPda);

  const sharesOf = async (investor: PublicKey) =>
    (await program.account.investorPosition.fetch(positionPda(investor)))
      .shares;

  const expectBn = (actual: BN, expected: BN) =>
    expect(actual.toString()).to.equal(expected.toString());

  /** Asserts that `call` fails with the named custom program error. */
  async function expectAnchorError(call: Promise<unknown>, code: string) {
    let error: unknown;
    try {
      await call;
    } catch (err) {
      error = err;
    }
    expect(error, `expected error ${code}`).to.be.instanceOf(AnchorError);
    expect((error as AnchorError).error.errorCode.code).to.equal(code);
  }

  /** Sends `owner` 1 SOL for fees and rent. */
  const fundSol = (owner: PublicKey) =>
    provider.sendAndConfirm(
      new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: admin.publicKey,
          toPubkey: owner,
          lamports: LAMPORTS_PER_SOL,
        })
      )
    );

  /** Gives `owner` SOL for fees plus a token account holding `amount`. */
  async function fundInvestor(
    owner: Keypair,
    tokenMint: PublicKey,
    amount: BN
  ) {
    await fundSol(owner.publicKey);
    const ata = await createAssociatedTokenAccount(
      connection,
      admin,
      tokenMint,
      owner.publicKey
    );
    await mintTo(
      connection,
      admin,
      tokenMint,
      ata,
      admin,
      BigInt(amount.toString())
    );
    return ata;
  }

  /** Calls init_pool, by default as the real admin with the 6-decimal mint. */
  const initPool = (
    opts: {
      signer?: Keypair;
      mint?: PublicKey;
      advanceBps?: number;
      feeBps?: number;
    } = {}
  ) => {
    const signer = opts.signer ?? admin;
    return program.methods
      .initPool(opts.advanceBps ?? ADVANCE_BPS, opts.feeBps ?? FEE_BPS)
      .accountsPartial({
        admin: signer.publicKey,
        pool: poolPda,
        mint: opts.mint ?? mint,
        vault: vaultPda,
      })
      .signers(signer === admin ? [] : [signer])
      .rpc();
  };

  const deposit = (
    investor: Keypair,
    amount: BN,
    accounts: { mint: PublicKey; investorTokenAccount: PublicKey }
  ) =>
    program.methods
      .deposit(amount)
      .accountsPartial({
        investor: investor.publicKey,
        pool: poolPda,
        vault: vaultPda,
        position: positionPda(investor.publicKey),
        ...accounts,
      })
      .signers([investor])
      .rpc();

  const withdraw = (
    investor: Keypair,
    shares: BN,
    accounts: { investorTokenAccount: PublicKey; position: PublicKey }
  ) =>
    program.methods
      .withdraw(shares)
      .accountsPartial({
        investor: investor.publicKey,
        pool: poolPda,
        mint,
        vault: vaultPda,
        ...accounts,
      })
      .signers([investor])
      .rpc();

  // ---------- setup ----------

  before(async () => {
    mint = await createMint(connection, admin, admin.publicKey, null, DECIMALS);
    ataA = await fundInvestor(investorA, mint, usdc(1_000));
    ataB = await fundInvestor(investorB, mint, usdc(1_000));
  });

  // ---------- spec tests ----------

  // The pool is a single PDA, so the init_pool rejections must run before
  // the successful init_pool in test 1.

  it("0a. init_pool by anyone but ADMIN_PUBKEY fails with Unauthorized", async () => {
    const intruder = Keypair.generate();
    await fundSol(intruder.publicKey);

    await expectAnchorError(initPool({ signer: intruder }), "Unauthorized");
    expect(await connection.getAccountInfo(poolPda)).to.equal(null);
  });

  it("0b. init_pool with a mint that is not 6 decimals fails", async () => {
    const nineDecimalMint = await createMint(
      connection,
      admin,
      admin.publicKey,
      null,
      9
    );

    await expectAnchorError(
      initPool({ mint: nineDecimalMint }),
      "InvalidMintDecimals"
    );
    expect(await connection.getAccountInfo(poolPda)).to.equal(null);
  });

  it("0c. init_pool with advance_bps + fee_bps above 10000 fails", async () => {
    await expectAnchorError(
      initPool({ advanceBps: 8000, feeBps: 2001 }),
      "InvalidBpsSum"
    );
    expect(await connection.getAccountInfo(poolPda)).to.equal(null);
  });

  it("1. init_pool succeeds once; a second init_pool fails", async () => {
    await initPool();

    const pool = await fetchPool();
    expect(pool.admin.toBase58()).to.equal(admin.publicKey.toBase58());
    expect(pool.mint.toBase58()).to.equal(mint.toBase58());
    expect(pool.advanceBps).to.equal(ADVANCE_BPS);
    expect(pool.feeBps).to.equal(FEE_BPS);
    expectBn(pool.totalShares, new BN(0));
    expectBn(pool.idleAssets, new BN(0));
    expectBn(pool.outstandingAdvances, new BN(0));

    let error: unknown;
    try {
      await initPool();
    } catch (err) {
      error = err;
    }
    // The pool account already exists, so the System Program refuses to create it again.
    expect(error, "second init_pool should fail").to.exist;
    const logs = (error as { logs?: string[] }).logs ?? [];
    expect([String(error), ...logs].join("\n")).to.match(/already in use/);
  });

  it("2. investor A deposits 500 -> 500 shares, vault holds 500", async () => {
    await deposit(investorA, usdc(500), { mint, investorTokenAccount: ataA });

    expectBn(await sharesOf(investorA.publicKey), usdc(500));
    expectBn(await tokenBalance(vaultPda), usdc(500));
    expectBn((await fetchPool()).idleAssets, usdc(500));
  });

  it("3. investor B deposits 250 -> 250 shares, vault holds 750", async () => {
    await deposit(investorB, usdc(250), { mint, investorTokenAccount: ataB });

    expectBn(await sharesOf(investorB.publicKey), usdc(250));
    expectBn(await tokenBalance(vaultPda), usdc(750));
    const pool = await fetchPool();
    expectBn(pool.totalShares, usdc(750));
    expectBn(pool.idleAssets, usdc(750));
  });

  it("4. A withdraws 200 shares -> receives 200, vault holds 550", async () => {
    const balanceBefore = await tokenBalance(ataA);

    await withdraw(investorA, usdc(200), {
      investorTokenAccount: ataA,
      position: positionPda(investorA.publicKey),
    });

    expectBn((await tokenBalance(ataA)).sub(balanceBefore), usdc(200));
    expectBn(await sharesOf(investorA.publicKey), usdc(300));
    expectBn(await tokenBalance(vaultPda), usdc(550));
    expectBn((await fetchPool()).idleAssets, usdc(550));
  });

  it("5. A cannot withdraw more shares than owned", async () => {
    const owned = await sharesOf(investorA.publicKey);

    await expectAnchorError(
      withdraw(investorA, owned.addn(1), {
        investorTokenAccount: ataA,
        position: positionPda(investorA.publicKey),
      }),
      "InsufficientShares"
    );
  });

  it("6. deposit(0) fails", async () => {
    await expectAnchorError(
      deposit(investorA, new BN(0), { mint, investorTokenAccount: ataA }),
      "ZeroAmount"
    );
  });

  it("7. deposit with a different mint fails", async () => {
    const otherMint = await createMint(
      connection,
      admin,
      admin.publicKey,
      null,
      DECIMALS
    );
    const otherAta = await createAssociatedTokenAccount(
      connection,
      admin,
      otherMint,
      investorA.publicKey
    );
    await mintTo(
      connection,
      admin,
      otherMint,
      otherAta,
      admin,
      BigInt(usdc(100).toString())
    );

    await expectAnchorError(
      deposit(investorA, usdc(100), {
        mint: otherMint,
        investorTokenAccount: otherAta,
      }),
      "InvalidMint"
    );
  });

  it("8. B cannot withdraw from A's position", async () => {
    await expectAnchorError(
      withdraw(investorB, usdc(1), {
        investorTokenAccount: ataB,
        position: positionPda(investorA.publicKey),
      }),
      "Unauthorized"
    );
  });

  it("9. tokens sent straight to the vault do not change the share price", async () => {
    // State from the tests above: 550 shares backed by 550 idle tokens,
    // so 1 share = 1 token.
    const before = await fetchPool();
    expectBn(before.totalShares, usdc(550));
    expectBn(before.idleAssets, usdc(550));

    // Someone transfers 450 tokens directly to the vault, bypassing deposit.
    const donorAta = await createAssociatedTokenAccount(
      connection,
      admin,
      mint,
      admin.publicKey
    );
    await mintTo(
      connection,
      admin,
      mint,
      donorAta,
      admin,
      BigInt(usdc(450).toString())
    );
    await transfer(
      connection,
      admin,
      donorAta,
      vaultPda,
      admin,
      BigInt(usdc(450).toString())
    );

    // The vault balance went up, but the pool's books did not.
    expectBn(await tokenBalance(vaultPda), usdc(1_000));
    const afterDonation = await fetchPool();
    expectBn(afterDonation.idleAssets, usdc(550));
    expectBn(afterDonation.totalShares, usdc(550));

    // Deposits are still priced at 1 token per share. Using the live vault
    // balance would have minted only 100 * 550 / 1000 = 55 shares.
    const sharesBeforeB = await sharesOf(investorB.publicKey);
    await deposit(investorB, usdc(100), { mint, investorTokenAccount: ataB });
    expectBn(
      (await sharesOf(investorB.publicKey)).sub(sharesBeforeB),
      usdc(100)
    );

    // Withdrawals are still priced at 1 token per share. Using the live vault
    // balance would have paid out 100 * 1100 / 650 = ~169 tokens.
    const balanceBeforeA = await tokenBalance(ataA);
    await withdraw(investorA, usdc(100), {
      investorTokenAccount: ataA,
      position: positionPda(investorA.publicKey),
    });
    expectBn((await tokenBalance(ataA)).sub(balanceBeforeA), usdc(100));

    // Books: 550 + 100 - 100 = 550. The 450 sent directly stays stranded.
    const after = await fetchPool();
    expectBn(after.idleAssets, usdc(550));
    expectBn(after.totalShares, usdc(550));
    expectBn(await tokenBalance(vaultPda), usdc(1_000));
  });
});
