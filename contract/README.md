# Solana Smart Contracts

Anchor framework program managing VM rental sessions, escrow payments, and DePIN host registration.

**Program ID (devnet):** `J7nyNjMR7p9Xi8ohzkNAFmnAeVUBb1AMpGKTFGtFvVjJ`

## Instructions

### VM Rental (11)
| Instruction | Description |
|-------------|-------------|
| `initialize_vault` | Create admin vault PDA |
| `transfer_to_vault_and_rent` | Start rental with escrow deposit |
| `transfer_from_vault` | End session and settle payment |
| `end_rental_session` | Complete rental period |
| `fund_vault` | Top up admin vault |
| `withdraw_funds` | Withdraw from admin vault |
| `start_rental_with_escrow` | Begin escrow rental |
| `finalize_rental_escrow` | Settle escrow rental |
| `top_up_escrow` | Add funds to active escrow |
| `force_terminate_rental` | Admin-force termination |

### DePIN Host (5)
| Instruction | Description |
|-------------|-------------|
| `initialise_host_registration` | Register a host machine |
| `activate_host` | Enable host for requests |
| `deactivate_host` | Disable host |
| `claim_rewards` | Withdraw earned SOL |
| `penalize_host` | Penalize misbehaving host |

## Develop

```bash
anchor build
anchor test
anchor deploy --provider.cluster devnet
```

## State Accounts

- `VaultAccount` — Admin SOL vault
- `RentalSession` — Active VM rental
- `EscrowSession` — Escrow-managed rental
- `HostMachineRegistration` — DePIN host record
