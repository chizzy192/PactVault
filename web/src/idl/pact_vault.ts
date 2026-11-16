/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/pact_vault.json`.
 */
export type PactVault = {
  "address": "DQGA85XVQcpYtrUoTdiKowiekXPF7WcesLPLYB8XKbuh",
  "metadata": {
    "name": "pactVault",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "PactVault investor pool: deposits, withdrawals and share accounting"
  },
  "instructions": [
    {
      "name": "approve",
      "docs": [
        "Client accepts the work; the escrow settles."
      ],
      "discriminator": [
        69,
        74,
        217,
        36,
        115,
        117,
        97,
        76
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "`approve`: must be the client. `auto_release`: anyone."
          ],
          "signer": true
        },
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "poolVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "freelancerTokenAccount",
          "docs": [
            "Receives the rest of the locked tokens. Checked against the escrow",
            "because `auto_release` can be called by anyone."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "autoRelease",
      "docs": [
        "Anyone settles the escrow after the review window has passed."
      ],
      "discriminator": [
        212,
        34,
        30,
        246,
        192,
        13,
        97,
        31
      ],
      "accounts": [
        {
          "name": "caller",
          "docs": [
            "`approve`: must be the client. `auto_release`: anyone."
          ],
          "signer": true
        },
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "poolVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "freelancerTokenAccount",
          "docs": [
            "Receives the rest of the locked tokens. Checked against the escrow",
            "because `auto_release` can be called by anyone."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "createEscrow",
      "docs": [
        "Client or freelancer creates a Draft escrow and its token vault."
      ],
      "discriminator": [
        253,
        215,
        165,
        116,
        36,
        108,
        68,
        80
      ],
      "accounts": [
        {
          "name": "creator",
          "docs": [
            "The client or the freelancer. Pays rent for the escrow and its vault."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "client"
        },
        {
          "name": "freelancer"
        },
        {
          "name": "resolver"
        },
        {
          "name": "pool",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "docs": [
            "Escrows use the same token as the pool, so advances can be repaid."
          ]
        },
        {
          "name": "escrow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "client"
              },
              {
                "kind": "arg",
                "path": "escrowId"
              }
            ]
          }
        },
        {
          "name": "escrowVault",
          "docs": [
            "Holds the locked part of the escrow. Owned by the escrow PDA."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "escrowId",
          "type": "u64"
        },
        {
          "name": "totalAmount",
          "type": "u64"
        },
        {
          "name": "upfrontBps",
          "type": "u16"
        },
        {
          "name": "contractHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "deadline",
          "type": "i64"
        },
        {
          "name": "reviewWindowSecs",
          "type": "i64"
        }
      ]
    },
    {
      "name": "deposit",
      "docs": [
        "Moves `amount` tokens into the vault and mints shares to the investor."
      ],
      "discriminator": [
        242,
        35,
        198,
        137,
        82,
        225,
        242,
        182
      ],
      "accounts": [
        {
          "name": "investor",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "investorTokenAccount",
          "docs": [
            "Source of the deposit. The token program checks that `investor`",
            "is allowed to move these tokens."
          ],
          "writable": true
        },
        {
          "name": "position",
          "docs": [
            "Created on the investor's first deposit, reused afterwards."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  105,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "investor"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "fundEscrow",
      "docs": [
        "Client deposits the full amount; the upfront part goes to the freelancer."
      ],
      "discriminator": [
        155,
        18,
        218,
        141,
        182,
        213,
        69,
        201
      ],
      "accounts": [
        {
          "name": "client",
          "signer": true,
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "mint",
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "escrowVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  115,
                  99,
                  114,
                  111,
                  119,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "escrow"
              }
            ]
          }
        },
        {
          "name": "clientTokenAccount",
          "docs": [
            "Source of the funds. The token program checks that `client` may",
            "move these tokens."
          ],
          "writable": true
        },
        {
          "name": "freelancerTokenAccount",
          "docs": [
            "Receives the upfront payment."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "initPool",
      "docs": [
        "Creates the pool and its token vault. Can only succeed once."
      ],
      "discriminator": [
        116,
        233,
        199,
        204,
        115,
        159,
        171,
        36
      ],
      "accounts": [
        {
          "name": "admin",
          "docs": [
            "Only the hard-coded admin wallet may create the pool."
          ],
          "writable": true,
          "signer": true,
          "address": "Gz9TAaKYgLTTsSvr4RwUKCkF6venbiUupUVGv9HESuyq"
        },
        {
          "name": "pool",
          "docs": [
            "`init` fails if the pool already exists, so this can only run once."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "docs": [
            "Holds every deposited token. Owned by the pool PDA, so only this",
            "program can move tokens out of it."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "advanceBps",
          "type": "u16"
        },
        {
          "name": "feeBps",
          "type": "u16"
        }
      ]
    },
    {
      "name": "signContract",
      "docs": [
        "Client or freelancer confirms the contract hash. Both -> Signed."
      ],
      "discriminator": [
        145,
        83,
        234,
        177,
        104,
        87,
        183,
        156
      ],
      "accounts": [
        {
          "name": "party",
          "docs": [
            "The client or the freelancer."
          ],
          "signer": true
        },
        {
          "name": "escrow",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "contractHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "submitWork",
      "docs": [
        "Freelancer records proof of work and starts the review window."
      ],
      "discriminator": [
        158,
        80,
        101,
        51,
        114,
        130,
        101,
        253
      ],
      "accounts": [
        {
          "name": "freelancer",
          "signer": true,
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "escrow",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "proofHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "takeAdvance",
      "docs": [
        "Freelancer borrows part of the locked amount from the pool, once."
      ],
      "discriminator": [
        58,
        106,
        82,
        118,
        68,
        195,
        112,
        188
      ],
      "accounts": [
        {
          "name": "freelancer",
          "signer": true,
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "escrow",
          "writable": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "escrow"
          ]
        },
        {
          "name": "poolVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "freelancerTokenAccount",
          "docs": [
            "Receives the advance."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "docs": [
        "Burns `shares` and sends the matching tokens back to the investor."
      ],
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "investor",
          "signer": true,
          "relations": [
            "position"
          ]
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108,
                  95,
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "investorTokenAccount",
          "docs": [
            "Destination of the withdrawal. Must belong to the investor."
          ],
          "writable": true
        },
        {
          "name": "position",
          "docs": [
            "`has_one` rejects anyone but the position's own investor."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "shares",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "escrow",
      "discriminator": [
        31,
        213,
        123,
        187,
        186,
        22,
        218,
        155
      ]
    },
    {
      "name": "investorPosition",
      "discriminator": [
        145,
        143,
        236,
        150,
        229,
        40,
        195,
        88
      ]
    },
    {
      "name": "pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidBps",
      "msg": "Basis points must be between 0 and 10000"
    },
    {
      "code": 6001,
      "name": "zeroAmount",
      "msg": "Amount must be greater than zero"
    },
    {
      "code": 6002,
      "name": "zeroShares",
      "msg": "Shares must be greater than zero"
    },
    {
      "code": 6003,
      "name": "depositTooSmall",
      "msg": "Deposit is too small to mint any shares"
    },
    {
      "code": 6004,
      "name": "withdrawTooSmall",
      "msg": "Withdrawal is too small to return any tokens"
    },
    {
      "code": 6005,
      "name": "insufficientShares",
      "msg": "Position does not hold enough shares"
    },
    {
      "code": 6006,
      "name": "insufficientLiquidity",
      "msg": "Pool does not have enough idle tokens for this withdrawal"
    },
    {
      "code": 6007,
      "name": "invalidMint",
      "msg": "Token mint does not match the pool mint"
    },
    {
      "code": 6008,
      "name": "invalidTokenOwner",
      "msg": "Token account is not owned by the investor"
    },
    {
      "code": 6009,
      "name": "unauthorized",
      "msg": "Signer is not allowed to perform this action"
    },
    {
      "code": 6010,
      "name": "mathOverflow",
      "msg": "Arithmetic overflow or division by zero"
    },
    {
      "code": 6011,
      "name": "invalidMintDecimals",
      "msg": "Pool mint must have 6 decimals"
    },
    {
      "code": 6012,
      "name": "invalidBpsSum",
      "msg": "advance_bps + fee_bps must not exceed 10000"
    },
    {
      "code": 6013,
      "name": "invalidUpfrontBps",
      "msg": "Upfront basis points must not exceed 5000"
    },
    {
      "code": 6014,
      "name": "sameParty",
      "msg": "Client and freelancer must be different wallets"
    },
    {
      "code": 6015,
      "name": "invalidResolver",
      "msg": "Resolver must differ from both the client and the freelancer"
    },
    {
      "code": 6016,
      "name": "invalidReviewWindow",
      "msg": "Review window must be between 60 and 604800 seconds"
    },
    {
      "code": 6017,
      "name": "invalidDeadline",
      "msg": "Deadline must be in the future"
    },
    {
      "code": 6018,
      "name": "invalidEscrowStatus",
      "msg": "Escrow is not in the right status for this action"
    },
    {
      "code": 6019,
      "name": "contractHashMismatch",
      "msg": "Contract hash does not match the escrow"
    },
    {
      "code": 6020,
      "name": "alreadySigned",
      "msg": "This party has already signed the contract"
    },
    {
      "code": 6021,
      "name": "notParty",
      "msg": "Signer is neither the client nor the freelancer"
    },
    {
      "code": 6022,
      "name": "notClient",
      "msg": "Signer is not the escrow's client"
    },
    {
      "code": 6023,
      "name": "notFreelancer",
      "msg": "Signer is not the escrow's freelancer"
    },
    {
      "code": 6024,
      "name": "advanceAlreadyTaken",
      "msg": "An advance has already been taken on this escrow"
    },
    {
      "code": 6025,
      "name": "zeroAdvance",
      "msg": "Advance would be zero"
    },
    {
      "code": 6026,
      "name": "reviewWindowOpen",
      "msg": "The client's review window has not ended yet"
    },
    {
      "code": 6027,
      "name": "invalidFreelancerTokenAccount",
      "msg": "Token account is not owned by the escrow's freelancer"
    }
  ],
  "types": [
    {
      "name": "escrow",
      "docs": [
        "One client/freelancer contract.",
        "PDA with seeds [\"escrow\", client, escrow_id as u64 little-endian]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "escrowId",
            "type": "u64"
          },
          {
            "name": "client",
            "type": "pubkey"
          },
          {
            "name": "freelancer",
            "type": "pubkey"
          },
          {
            "name": "resolver",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          },
          {
            "name": "upfrontBps",
            "type": "u16"
          },
          {
            "name": "contractHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "clientSigned",
            "type": "bool"
          },
          {
            "name": "freelancerSigned",
            "type": "bool"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "escrowStatus"
              }
            }
          },
          {
            "name": "deadline",
            "docs": [
              "Unix time. Must be in the future at creation; no rule uses it yet."
            ],
            "type": "i64"
          },
          {
            "name": "reviewWindowSecs",
            "type": "i64"
          },
          {
            "name": "submittedAt",
            "docs": [
              "Unix time of `submit_work`; 0 until then."
            ],
            "type": "i64"
          },
          {
            "name": "proofHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "advanceAmount",
            "docs": [
              "Tokens advanced from the pool; 0 if no advance was taken."
            ],
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "escrowStatus",
      "docs": [
        "Where an escrow is in its life. Disputed and Cancelled are not used yet."
      ],
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "draft"
          },
          {
            "name": "signed"
          },
          {
            "name": "active"
          },
          {
            "name": "submitted"
          },
          {
            "name": "disputed"
          },
          {
            "name": "completed"
          },
          {
            "name": "cancelled"
          }
        ]
      }
    },
    {
      "name": "investorPosition",
      "docs": [
        "One investor's share balance. PDA with seeds [\"position\", investor]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "investor",
            "type": "pubkey"
          },
          {
            "name": "shares",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "pool",
      "docs": [
        "Global pool state. PDA with seeds [\"pool\"]."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "docs": [
              "The only token this pool accepts (a 6-decimal USDC stand-in)."
            ],
            "type": "pubkey"
          },
          {
            "name": "totalShares",
            "docs": [
              "Sum of every investor's shares."
            ],
            "type": "u64"
          },
          {
            "name": "idleAssets",
            "docs": [
              "Tokens the pool holds and can pay out, as tracked by this program.",
              "Only `deposit` and `withdraw` (and later stages' own instructions)",
              "change it. Tokens sent straight to the vault are NOT counted, so the",
              "live vault balance is never used in any math."
            ],
            "type": "u64"
          },
          {
            "name": "outstandingAdvances",
            "docs": [
              "Tokens lent out and not yet repaid. Always 0 until stage 2."
            ],
            "type": "u64"
          },
          {
            "name": "advanceBps",
            "type": "u16"
          },
          {
            "name": "feeBps",
            "type": "u16"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "constants": [
    {
      "name": "adminPubkey",
      "docs": [
        "The only wallet allowed to call `init_pool`."
      ],
      "type": "pubkey",
      "value": "Gz9TAaKYgLTTsSvr4RwUKCkF6venbiUupUVGv9HESuyq"
    },
    {
      "name": "escrowSeed",
      "docs": [
        "Seed prefix for each escrow PDA: [\"escrow\", client, escrow_id as u64 LE]."
      ],
      "type": "bytes",
      "value": "[101, 115, 99, 114, 111, 119]"
    },
    {
      "name": "escrowVaultSeed",
      "docs": [
        "Seed prefix for each escrow's token vault PDA: [\"escrow_vault\", escrow]."
      ],
      "type": "bytes",
      "value": "[101, 115, 99, 114, 111, 119, 95, 118, 97, 117, 108, 116]"
    },
    {
      "name": "maxBps",
      "docs": [
        "100% expressed in basis points."
      ],
      "type": "u16",
      "value": "10000"
    },
    {
      "name": "maxReviewWindowSecs",
      "docs": [
        "Longest allowed client review window (7 days)."
      ],
      "type": "i64",
      "value": "604800"
    },
    {
      "name": "maxUpfrontBps",
      "docs": [
        "Highest share of an escrow that may be paid upfront (50%)."
      ],
      "type": "u16",
      "value": "5000"
    },
    {
      "name": "mintDecimals",
      "docs": [
        "Decimals the pool mint must have (matches USDC)."
      ],
      "type": "u8",
      "value": "6"
    },
    {
      "name": "minReviewWindowSecs",
      "docs": [
        "Shortest allowed client review window (1 minute)."
      ],
      "type": "i64",
      "value": "60"
    },
    {
      "name": "poolSeed",
      "docs": [
        "Seed for the single Pool PDA."
      ],
      "type": "bytes",
      "value": "[112, 111, 111, 108]"
    },
    {
      "name": "poolVaultSeed",
      "docs": [
        "Seed for the pool's token vault PDA."
      ],
      "type": "bytes",
      "value": "[112, 111, 111, 108, 95, 118, 97, 117, 108, 116]"
    },
    {
      "name": "positionSeed",
      "docs": [
        "Seed prefix for each investor's position PDA: [\"position\", investor]."
      ],
      "type": "bytes",
      "value": "[112, 111, 115, 105, 116, 105, 111, 110]"
    }
  ]
};
