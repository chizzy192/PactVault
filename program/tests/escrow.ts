import * as anchor from "@anchor-lang/core";
import { AnchorError, BN, Program } from "@anchor-lang/core";
import {
  createAssociatedTokenAccount,
  getAccount,
  mintTo,
} from "@solana/spl-token";
import { expect } from "chai";
import { createHash } from "crypto";
import { PactVault } from "../target/types/pact_vault";

const {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  Transaction,
} = anchor.web3;
type Keypair = anchor.web3.Keypair;
type PublicKey = anchor.web3.PublicKey;

const DECIMALS = 6;

/** Tokens -> base units (6 decimals), e.g. usdc(4.8) = 4_800_000. */
const usdc = (tokens: number) => new BN(Math.round(tokens * 10 ** DECIMALS));

const sha256 = (text: string) =>
  Array.from(createHash("sha256").update(text).digest());

const CONTRACT_HASH = sha256("PactVault test contract v1");
const PROOF_HASH = sha256("deliverable.zip");
const LONG_REVIEW_WINDOW = 3_600;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Runs after tests/pact_vault.ts (see Anchor.toml) and reuses its pool.
// Starting state: 550 shares backed by 550 idle tokens, nothing advanced.
describe("pact_vault stage 2: escrow and advance", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.pactVault as Program<PactVault>;
  const connection = provider.connection;
  const admin = (provider.wallet as anchor.Wallet).payer;

  const pda = (...seeds: Buffer[]) =>
    PublicKey.findProgramAddressSync(seeds, program.programId)[0];
  const poolPda = pda(Buffer.from("pool"));
  const poolVaultPda = pda(Buffer.from("pool_vault"));
  const positionPda = (investor: PublicKey) =>
    pda(Buffer.from("position"), investor.toBuffer());
  const escrowPda = (client: PublicKey, id: BN) =>
    pda(
      Buffer.from("escrow"),
      client.toBuffer(),
      id.toArrayLike(Buffer, "le", 8)
    );
  const escrowVaultPda = (escrow: PublicKey) =>
    pda(Buffer.from("escrow_vault"), escrow.toBuffer());

  const client = Keypair.generate();
  const freelancer = Keypair.generate();
  const resolver = Keypair.generate();
  const stranger = Keypair.generate();
  const investorC = Keypair.generate();

  let mint: PublicKey;
  let clientAta: PublicKey;
  let freelancerAta: PublicKey;
  let investorCAta: PublicKey;
  let farDeadline: BN;
  let nextEscrowId = 1;

  // ---------- helpers ----------

  const tokenBalance = async (account: PublicKey) =>
    new BN((await getAccount(connection, account)).amount.toString());
  const fetchPool = () => program.account.pool.fetch(poolPda);
  const fetchEscrow = (escrow: PublicKey) =>
    program.account.escrow.fetch(escrow);

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

  /** Unix time according to the chain's Clock sysvar (not this machine). */
  async function chainTime(): Promise<number> {
    const clock = await connection.getAccountInfo(SYSVAR_CLOCK_PUBKEY);
    // Clock layout: slot, epoch_start_timestamp, epoch,
    // leader_schedule_epoch (8 bytes each), then unix_timestamp.
    return Number(clock!.data.readBigInt64LE(32));
  }

  type EscrowRefs = { id: BN; escrow: PublicKey; vault: PublicKey };

  /** Builds a create_escrow call without sending it (for failure tests). */
  function prepareEscrow(opts: {
    total: BN;
    upfrontBps: number;
    reviewWindowSecs?: number;
    deadline?: BN;
    creator?: Keypair;
    freelancer?: PublicKey;
    resolver?: PublicKey;
  }) {
    const id = new BN(nextEscrowId++);
    const escrow = escrowPda(client.publicKey, id);
    const vault = escrowVaultPda(escrow);
    const creator = opts.creator ?? client;
    const send = () =>
      program.methods
        .createEscrow(
          id,
          opts.total,
          opts.upfrontBps,
          CONTRACT_HASH,
          opts.deadline ?? farDeadline,
          new BN(opts.reviewWindowSecs ?? LONG_REVIEW_WINDOW)
        )
        .accountsPartial({
          creator: creator.publicKey,
          client: client.publicKey,
          freelancer: opts.freelancer ?? freelancer.publicKey,
          resolver: opts.resolver ?? resolver.publicKey,
          pool: poolPda,
          mint,
          escrow,
          escrowVault: vault,
        })
        .signers([creator])
        .rpc();
    return { id, escrow, vault, send };
  }

  async function createEscrow(
    opts: Parameters<typeof prepareEscrow>[0]
  ): Promise<EscrowRefs> {
    const { send, ...refs } = prepareEscrow(opts);
    await send();
    return refs;
  }

  const sign = (e: EscrowRefs, party: Keypair, hash = CONTRACT_HASH) =>
    program.methods
      .signContract(hash)
      .accountsPartial({ party: party.publicKey, escrow: e.escrow })
      .signers([party])
      .rpc();

  const fund = (e: EscrowRefs) =>
    program.methods
      .fundEscrow()
      .accountsPartial({
        client: client.publicKey,
        escrow: e.escrow,
        mint,
        escrowVault: e.vault,
        clientTokenAccount: clientAta,
        freelancerTokenAccount: freelancerAta,
      })
      .signers([client])
      .rpc();

  const submit = (e: EscrowRefs) =>
    program.methods
      .submitWork(PROOF_HASH)
      .accountsPartial({ freelancer: freelancer.publicKey, escrow: e.escrow })
      .signers([freelancer])
      .rpc();

  const takeAdvance = (e: EscrowRefs) =>
    program.methods
      .takeAdvance()
      .accountsPartial({
        freelancer: freelancer.publicKey,
        escrow: e.escrow,
        pool: poolPda,
        mint,
        poolVault: poolVaultPda,
        freelancerTokenAccount: freelancerAta,
      })
      .signers([freelancer])
      .rpc();

  const settleAccounts = (e: EscrowRefs, caller: Keypair) => ({
    caller: caller.publicKey,
    escrow: e.escrow,
    escrowVault: e.vault,
    pool: poolPda,
    poolVault: poolVaultPda,
    mint,
    freelancerTokenAccount: freelancerAta,
  });

  const approve = (e: EscrowRefs, caller: Keypair = client) =>
    program.methods
      .approve()
      .accountsPartial(settleAccounts(e, caller))
      .signers([caller])
      .rpc();

  const autoRelease = (e: EscrowRefs, caller: Keypair = stranger) =>
    program.methods
      .autoRelease()
      .accountsPartial(settleAccounts(e, caller))
      .signers([caller])
      .rpc();

  /** create -> both sign -> fund -> submit. */
  async function escrowAtSubmitted(
    opts: Parameters<typeof prepareEscrow>[0]
  ): Promise<EscrowRefs> {
    const e = await createEscrow(opts);
    await sign(e, client);
    await sign(e, freelancer);
    await fund(e);
    await submit(e);
    return e;
  }

  // ---------- setup ----------

  before(async () => {
    const pool = await program.account.pool.fetchNullable(poolPda);
    if (!pool) {
      throw new Error("Pool not found: run tests/pact_vault.ts first.");
    }
    mint = pool.mint; // created by pact_vault.ts with admin as mint authority

    for (const kp of [client, freelancer, stranger, investorC]) {
      await fundSol(kp.publicKey);
    }
    clientAta = await createAssociatedTokenAccount(
      connection,
      admin,
      mint,
      client.publicKey
    );
    await mintTo(
      connection,
      admin,
      mint,
      clientAta,
      admin,
      BigInt(usdc(10_000).toString())
    );
    freelancerAta = await createAssociatedTokenAccount(
      connection,
      admin,
      mint,
      freelancer.publicKey
    );
    investorCAta = await createAssociatedTokenAccount(
      connection,
      admin,
      mint,
      investorC.publicKey
    );
    await mintTo(
      connection,
      admin,
      mint,
      investorCAta,
      admin,
      BigInt(usdc(500).toString())
    );

    farDeadline = new BN((await chainTime()) + 30 * 24 * 3600);
  });

  it("setup: investor C funds the pool with 500", async () => {
    const before = await fetchPool();

    await program.methods
      .deposit(usdc(500))
      .accountsPartial({
        investor: investorC.publicKey,
        pool: poolPda,
        mint,
        vault: poolVaultPda,
        investorTokenAccount: investorCAta,
        position: positionPda(investorC.publicKey),
      })
      .signers([investorC])
      .rpc();

    const after = await fetchPool();
    expectBn(after.idleAssets.sub(before.idleAssets), usdc(500));
    const position = await program.account.investorPosition.fetch(
      positionPda(investorC.publicKey)
    );
    expectBn(position.shares, usdc(500)); // price is still 1 token per share
  });

  // ---------- spec tests ----------

  it("A. no advance, $200 at 50% upfront: 100 at funding, 97 at approval, pool +3", async () => {
    const e = await createEscrow({ total: usdc(200), upfrontBps: 5000 });
    expect((await fetchEscrow(e.escrow)).status).to.deep.equal({ draft: {} });

    await sign(e, client);
    let escrow = await fetchEscrow(e.escrow);
    expect(escrow.clientSigned).to.equal(true);
    expect(escrow.status).to.deep.equal({ draft: {} });
    await sign(e, freelancer);
    expect((await fetchEscrow(e.escrow)).status).to.deep.equal({ signed: {} });

    const f0 = await tokenBalance(freelancerAta);
    await fund(e);
    expectBn((await tokenBalance(freelancerAta)).sub(f0), usdc(100));
    expectBn(await tokenBalance(e.vault), usdc(100));
    expect((await fetchEscrow(e.escrow)).status).to.deep.equal({ active: {} });

    await submit(e);
    escrow = await fetchEscrow(e.escrow);
    expect(escrow.status).to.deep.equal({ submitted: {} });
    expect(escrow.proofHash).to.deep.equal(PROOF_HASH);
    expect(escrow.submittedAt.toNumber()).to.be.greaterThan(0);

    const f1 = await tokenBalance(freelancerAta);
    const pv1 = await tokenBalance(poolVaultPda);
    const pool1 = await fetchPool();
    await approve(e);

    expectBn((await tokenBalance(freelancerAta)).sub(f1), usdc(97));
    expectBn((await tokenBalance(poolVaultPda)).sub(pv1), usdc(3));
    const pool2 = await fetchPool();
    expectBn(pool2.idleAssets.sub(pool1.idleAssets), usdc(3));
    expectBn(pool2.outstandingAdvances, pool1.outstandingAdvances);
    expectBn(await tokenBalance(e.vault), new BN(0));
    expect((await fetchEscrow(e.escrow)).status).to.deep.equal({
      completed: {},
    });
  });

  it("B. with advance, $200 at 50% upfront: 100, then 80 advance, then 17; pool gets 83", async () => {
    // The freelancer creates this one, to show either party can.
    const e = await createEscrow({
      total: usdc(200),
      upfrontBps: 5000,
      creator: freelancer,
    });
    await sign(e, client);
    await sign(e, freelancer);

    const f0 = await tokenBalance(freelancerAta);
    await fund(e);
    expectBn((await tokenBalance(freelancerAta)).sub(f0), usdc(100));
    await submit(e);

    const f1 = await tokenBalance(freelancerAta);
    const pv1 = await tokenBalance(poolVaultPda);
    const pool1 = await fetchPool();
    await takeAdvance(e);

    expectBn((await tokenBalance(freelancerAta)).sub(f1), usdc(80));
    expectBn(pv1.sub(await tokenBalance(poolVaultPda)), usdc(80));
    const pool2 = await fetchPool();
    expectBn(pool1.idleAssets.sub(pool2.idleAssets), usdc(80));
    expectBn(
      pool2.outstandingAdvances.sub(pool1.outstandingAdvances),
      usdc(80)
    );
    expectBn((await fetchEscrow(e.escrow)).advanceAmount, usdc(80));

    const f2 = await tokenBalance(freelancerAta);
    const pv2 = await tokenBalance(poolVaultPda);
    await approve(e);

    expectBn((await tokenBalance(freelancerAta)).sub(f2), usdc(17));
    expectBn((await tokenBalance(poolVaultPda)).sub(pv2), usdc(83));
    const pool3 = await fetchPool();
    expectBn(pool3.idleAssets.sub(pool2.idleAssets), usdc(83));
    expectBn(pool3.outstandingAdvances, new BN(0));
    expectBn(await tokenBalance(e.vault), new BN(0));
  });

  it("E. after B, an investor who withdraws all shares gets more than they deposited", async () => {
    const position = positionPda(investorC.publicKey);
    const shares = (await program.account.investorPosition.fetch(position))
      .shares;
    const pool = await fetchPool();
    const expected = shares
      .mul(pool.idleAssets.add(pool.outstandingAdvances))
      .div(pool.totalShares);

    const before = await tokenBalance(investorCAta);
    await program.methods
      .withdraw(shares)
      .accountsPartial({
        investor: investorC.publicKey,
        pool: poolPda,
        mint,
        vault: poolVaultPda,
        investorTokenAccount: investorCAta,
        position,
      })
      .signers([investorC])
      .rpc();
    const received = (await tokenBalance(investorCAta)).sub(before);

    expectBn(received, expected);
    expect(
      received.gt(usdc(500)),
      `received ${received.toString()} base units for a 500 deposit`
    ).to.equal(true);
  });

  it("C. $200 at 20% upfront with advance: 40, then 128, fee 4.8, final 27.2", async () => {
    const e = await createEscrow({ total: usdc(200), upfrontBps: 2000 });
    await sign(e, client);
    await sign(e, freelancer);

    const f0 = await tokenBalance(freelancerAta);
    await fund(e);
    expectBn((await tokenBalance(freelancerAta)).sub(f0), usdc(40));
    await submit(e);

    const pool1 = await fetchPool();
    const f1 = await tokenBalance(freelancerAta);
    await takeAdvance(e);
    expectBn((await tokenBalance(freelancerAta)).sub(f1), usdc(128));

    const f2 = await tokenBalance(freelancerAta);
    const pv2 = await tokenBalance(poolVaultPda);
    await approve(e);

    expectBn((await tokenBalance(freelancerAta)).sub(f2), usdc(27.2));
    expectBn((await tokenBalance(poolVaultPda)).sub(pv2), usdc(132.8));
    // Net effect on the pool across advance + settlement is just the fee.
    const pool2 = await fetchPool();
    expectBn(pool2.idleAssets.sub(pool1.idleAssets), usdc(4.8));
    expectBn(pool2.outstandingAdvances, pool1.outstandingAdvances);
  });

  it("D. auto_release fails inside the 60s review window and works after it (waits ~1 minute)", async () => {
    const e = await escrowAtSubmitted({
      total: usdc(100),
      upfrontBps: 5000,
      reviewWindowSecs: 60,
    });

    await expectAnchorError(autoRelease(e), "ReviewWindowOpen");

    const escrow = await fetchEscrow(e.escrow);
    const releaseAt =
      escrow.submittedAt.toNumber() + escrow.reviewWindowSecs.toNumber();
    const giveUpAt = Date.now() + 180_000;
    while ((await chainTime()) < releaseAt) {
      if (Date.now() > giveUpAt) throw new Error("chain clock did not advance");
      await sleep(2_000);
    }

    // A stranger (not client, not freelancer) can release it.
    const f0 = await tokenBalance(freelancerAta);
    await autoRelease(e, stranger);
    expectBn((await tokenBalance(freelancerAta)).sub(f0), usdc(48.5)); // 50 - 3% fee
    expect((await fetchEscrow(e.escrow)).status).to.deep.equal({
      completed: {},
    });
  });

  // ---------- failure cases ----------

  it("fund_escrow before both parties signed fails", async () => {
    const e = await createEscrow({ total: usdc(200), upfrontBps: 5000 });
    await sign(e, client);

    await expectAnchorError(fund(e), "InvalidEscrowStatus");
  });

  it("sign_contract with a wrong hash fails", async () => {
    const e = await createEscrow({ total: usdc(200), upfrontBps: 5000 });

    await expectAnchorError(
      sign(e, client, sha256("a different contract")),
      "ContractHashMismatch"
    );
  });

  it("create_escrow with upfront_bps above 5000 fails", async () => {
    await expectAnchorError(
      prepareEscrow({ total: usdc(200), upfrontBps: 5001 }).send(),
      "InvalidUpfrontBps"
    );
  });

  it("take_advance before submit_work fails", async () => {
    const e = await createEscrow({ total: usdc(200), upfrontBps: 5000 });
    await sign(e, client);
    await sign(e, freelancer);
    await fund(e); // Active, not Submitted

    await expectAnchorError(takeAdvance(e), "InvalidEscrowStatus");
  });

  it("take_advance twice fails", async () => {
    const e = await escrowAtSubmitted({ total: usdc(200), upfrontBps: 5000 });
    await takeAdvance(e);

    await expectAnchorError(takeAdvance(e), "AdvanceAlreadyTaken");

    await approve(e); // settle so the advance is repaid
    expectBn((await fetchPool()).outstandingAdvances, new BN(0));
  });

  it("take_advance when the pool does not have enough idle tokens fails", async () => {
    // 0% upfront: locked 5000, advance 4000 -- far more than the pool holds.
    const e = await escrowAtSubmitted({ total: usdc(5000), upfrontBps: 0 });
    const pool = await fetchPool();
    expect(pool.idleAssets.lt(usdc(4000))).to.equal(true);

    await expectAnchorError(takeAdvance(e), "InsufficientLiquidity");
  });

  it("approve by someone other than the client fails", async () => {
    const e = await escrowAtSubmitted({ total: usdc(200), upfrontBps: 5000 });

    await expectAnchorError(approve(e, freelancer), "NotClient");
    await expectAnchorError(approve(e, stranger), "NotClient");
  });

  it("create_escrow with the resolver equal to the client or freelancer fails", async () => {
    await expectAnchorError(
      prepareEscrow({
        total: usdc(200),
        upfrontBps: 5000,
        resolver: client.publicKey,
      }).send(),
      "InvalidResolver"
    );
    await expectAnchorError(
      prepareEscrow({
        total: usdc(200),
        upfrontBps: 5000,
        resolver: freelancer.publicKey,
      }).send(),
      "InvalidResolver"
    );
  });

  it("create_escrow with a deadline that is not in the future fails", async () => {
    await expectAnchorError(
      prepareEscrow({
        total: usdc(200),
        upfrontBps: 5000,
        deadline: new BN((await chainTime()) - 1),
      }).send(),
      "InvalidDeadline"
    );
  });

  it("create_escrow rejects other bad input", async () => {
    const base = { total: usdc(200), upfrontBps: 5000 };
    await expectAnchorError(
      prepareEscrow({ ...base, creator: stranger }).send(),
      "NotParty"
    );
    await expectAnchorError(
      prepareEscrow({ ...base, freelancer: client.publicKey }).send(),
      "SameParty"
    );
    await expectAnchorError(
      prepareEscrow({ ...base, total: new BN(0) }).send(),
      "ZeroAmount"
    );
    await expectAnchorError(
      prepareEscrow({ ...base, reviewWindowSecs: 59 }).send(),
      "InvalidReviewWindow"
    );
    await expectAnchorError(
      prepareEscrow({ ...base, reviewWindowSecs: 604_801 }).send(),
      "InvalidReviewWindow"
    );
  });

  it("books: no advance left outstanding, vault covers idle_assets", async () => {
    const pool = await fetchPool();
    expectBn(pool.outstandingAdvances, new BN(0));
    expect((await tokenBalance(poolVaultPda)).gte(pool.idleAssets)).to.equal(
      true
    );
  });
});
