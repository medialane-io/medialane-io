<img width="1260" height="640" alt="Medialane: Programmable IP on Starknet" src="https://github.com/user-attachments/assets/a72bca86-bb82-42c4-8f61-9558484df5b9" />

# Medialane

**Create, protect, license and trade your work onchain.**

[medialane.io](https://medialane.io) is the home of the Medialane creator economy: a launchpad and marketplace where creative work becomes programmable intellectual property, owned by its creator and traded on open rails. Sign up with an email, and your self-custody wallet is ready in seconds, secured by your device passkey.

Live on Starknet mainnet since March 2026.

---

## Why Medialane

Creators deserve more than a place to post. They deserve a permanent record that the work is theirs, terms that travel with it, and direct ways to earn from the people who value it. Medialane gives every work that foundation and opens the door to **creator capital markets**: editions, drops, coins, memberships and sponsorships that let a creative community grow alongside the work.

- **You own it.** Your wallet is self-custody from the first moment. No seed phrase, no browser extension.
- **Your terms travel with it.** License, commercial use, derivatives, territory, royalty and AI policy are written into every asset.
- **It works everywhere.** Assets follow open standards, so they show up in any compatible wallet, explorer or marketplace.

---

## Creator Launchpad

**NFTs**
- **Single NFT:** Create an immutable NFT with licensing for your content.
- **Limited Edition NFT:** Create an immutable, licensed NFT in multiple copies for your audience to collect and trade.
- **NFT Remix:** Create a new NFT from an existing one, with its own license and recorded credit to the original.

**Collections**
- **NFT Collection:** Create an onchain collection you own for a series, project or catalog.
- **Limited Edition NFT Collection:** Set up your own contract for releasing multiple limited editions as one series.
- **NFT Drop:** Launch a new collection your audience can get directly from you, for free or at your price.

**Coins**
- **Creator Coin:** Create a coin to build your community, launched with its own liquidity pair.

**Membership**
- **POP Protocol:** Issue soulbound certificates as lasting proof of participation and achievement.
- **IP Tickets:** Create event tickets with verifiable ownership and validity, which holders can resell.
- **IP Club:** Create memberships that give your community access to the benefits you offer.

**Licensing**
- **IP Sponsorship:** Create an onchain deal where a sponsor pays an NFT's creator and receives a license.

**Claims**
- **Username:** Claim your name and get a public creator page to share.
- **Existing Collection:** Bring a collection you already own to your profile and manage its page.
- **Collection Address:** Give your collection a short, memorable link that's easy to share.
- **Existing Memecoin:** Connect a memecoin you've already launched to your creator profile.

---

## Marketplace

- Browse, search and filter every asset and collection.
- Buy instantly, make offers, or check out a whole cart with a single confirmation.
- Pay with USDC, USDT, ETH, STRK or WBTC.
- Every asset page shows its license, provenance, listings, offers and full history.
- Manage your listings, offers and remix requests from your portfolio.

---

## Programmable licensing

Every asset carries its terms in its metadata, in the attribute format the wider NFT ecosystem already reads.

| License | Commercial use | Derivatives | Attribution |
|---|---|---|---|
| CC BY-SA (default) | Yes | Share-alike | Required |
| CC0 | Yes | Allowed | Not required |
| CC BY | Yes | Allowed | Required |
| CC BY-NC | No | Allowed | Required |
| CC BY-ND | Yes | Not allowed | Required |
| CC BY-NC-SA | No | Share-alike | Required |
| CC BY-NC-ND | No | Not allowed | Required |
| All Rights Reserved | No | Not allowed | Required |
| Custom | Your terms | Your terms | Your terms |

Each asset also records its **AI policy** (Allowed, Training Only or Not Allowed), its territory and its royalty, together with a timestamped record of authorship.

---

## Creators and collectors

- **Creator pages** with your collections, works, activity and links, at a username you claim.
- **Portfolio** for everything you own, list, offer and remix.
- **Remix requests:** ask a creator for a license on their terms. Open licenses approve automatically.
- **Notifications** for offers, sales and remix requests.
- **Rewards** for creating and collecting.

---

## Part of the Medialane platform

| | |
|---|---|
| [starknet.medialane.io](https://starknet.medialane.io) | The same launchpad and marketplace with your own Starknet wallet |
| [portal.medialane.io](https://portal.medialane.io) | For organizations, developers and AI agents |
| [docs.medialane.io](https://docs.medialane.io) | Guides and developer reference |
| [medialane.org](https://medialane.org) | The Medialane DAO |
| [@medialane/sdk](https://github.com/medialane-io/medialane-sdk) | Build your own app on Medialane |

---

## Development

```bash
bun install
cp .env.example .env.local
bun dev
```

Before opening a pull request, run `bun run typecheck`, `bun run lint` and `bun test`.

---

## License

[MIT](LICENSE)
