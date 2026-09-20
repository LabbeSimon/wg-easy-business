# wg-easy-business — Self-Hosted Business VPN Built on WireGuard

[![License](https://img.shields.io/github/license/LabbeSimon/wg-easy-business)](LICENSE)
[![Based on wg-easy](https://img.shields.io/badge/fork_of-wg--easy-blue)](https://github.com/wg-easy/wg-easy)
[![WireGuard](https://img.shields.io/badge/protocol-WireGuard-88171A)](https://www.wireguard.com/)

**An open source, self-hosted VPN server for companies and teams.** Give every employee
their own encrypted WireGuard connection, one configuration per device, organised in
folders you can switch off in a single click. Runs on any Linux host with Docker, on your
own hardware, with no per-seat licence and no third party holding your traffic.

This is a business-oriented fork of [wg-easy](https://github.com/wg-easy/wg-easy), the
WireGuard web UI with 28M+ image pulls. It keeps everything that made the original simple
and adds what a company needs to actually administer a fleet.

<p align="center">
  <img src="./assets/screenshot.png" width="802" alt="wg-easy-business web interface listing VPN devices" />
</p>

## Why WireGuard for a business VPN

WireGuard is a modern VPN protocol built into the Linux kernel. Compared with OpenVPN and
IPsec it is roughly 4,000 lines of code instead of hundreds of thousands, which means a far
smaller attack surface and a codebase that has actually been reviewed end to end. It uses
fixed, current cryptography — ChaCha20, Poly1305, Curve25519, BLAKE2s — with no negotiation
of weak legacy ciphers, connects in a single round trip, and roams between Wi-Fi and mobile
data without dropping the tunnel.

For a company that translates into: faster remote access, lower CPU cost on the server,
and a protocol your auditors can read in an afternoon.

## What this fork adds

| Capability | What it does |
|---|---|
| **Folders and subfolders** | Group devices into a tree such as `Acme Corp/Paris/Laptops`. Organise your whole fleet by customer, site, department or device type. |
| **One-click bulk disable** | Switch off a folder and every device below it, nested subfolders included, drops out of the WireGuard configuration immediately. Switch it back on just as fast. |
| **One VPN per device** | An employee with a laptop, a phone and a tablet gets three separate encrypted configurations, each revocable on its own without touching the others. |
| **Employee onboarding in one screen** | Create the person and all of their devices in a single action, filed straight into the right folder. |
| **One-click offboarding** | Disable a departing employee and every device they own at once, wherever those devices are filed. Their login stops working and their tunnels drop. |
| **User administration** | Create, edit, disable and delete accounts from the web interface, with device counts per person and guards against locking yourself out. |

Everything is driven from the web interface. There is no configuration file to hand-edit
and no command line step for day-to-day administration.

## Features inherited from wg-easy

- All-in-one: WireGuard server plus web interface
- List, create, edit, delete, enable and disable devices
- QR code and downloadable configuration file for every device
- One-time links for sending a configuration securely
- Device expiration dates
- Live statistics and Tx/Rx charts per connected device
- Two-factor authentication (TOTP)
- OIDC single sign-on (Google, GitHub, Authelia, Authentik and others)
- Per-device firewall filtering
- IPv6 and CIDR support
- Prometheus metrics
- Automatic light and dark mode, multi-language interface

## Who this is for

- **Companies running remote or hybrid teams** that want encrypted access to internal
  services without paying per seat.
- **Managed service providers** administering VPN access across several client
  organisations, one folder per client.
- **Agencies and consultancies** handing contractors time-limited access that can be
  revoked the day the contract ends.
- **Anyone replacing a commercial VPN** who would rather keep the server, the keys and the
  logs in-house.

## Self-hosted versus commercial VPN services

| | wg-easy-business | Commercial business VPN |
|---|---|---|
| Cost | Your server, no per-user licence | Monthly fee per seat |
| Data | Stays on your infrastructure | Passes through a third party |
| Keys | Generated and stored by you | Held by the provider |
| Audit | Source is open, AGPL-3.0 | Closed, vendor attestation |
| Limits | Whatever your hardware handles | Plan tiers and quotas |

## Quick start

### 1. Install Docker

```shell
curl -sSL https://get.docker.com | sh
```

Log out and back in afterwards.

### 2. Run the server

Follow the [basic installation guide](https://wg-easy.github.io/wg-easy/latest/examples/tutorials/basic-installation/),
substituting this fork's image for the upstream one. Installation, reverse proxy setup and
host requirements are unchanged from wg-easy, so the upstream documentation applies:

- [Getting started](https://wg-easy.github.io/wg-easy/latest/getting-started/)
- [Behind Caddy](https://wg-easy.github.io/wg-easy/latest/examples/tutorials/caddy/)
- [Behind Traefik](https://wg-easy.github.io/wg-easy/latest/examples/tutorials/traefik/)
- [Podman](https://wg-easy.github.io/wg-easy/latest/examples/tutorials/podman-nft/)
- [With AdGuard Home](https://wg-easy.github.io/wg-easy/latest/examples/tutorials/adguard/)

### 3. Enroll your first employee

Open the web interface, go to **Admin → Onboarding**, enter the person's name and the
devices they use, and pick the folder they belong in. Every device gets its own
configuration, ready to send by QR code or one-time link.

## Frequently asked questions

**Is WireGuard secure enough for company traffic?**
WireGuard is in the mainline Linux kernel and uses only modern, fixed cryptographic
primitives. Its small codebase has been formally analysed, which is a large part of why it
has replaced OpenVPN in so many deployments.

**How many devices can one server handle?**
WireGuard itself is very light; the practical limit is your bandwidth and the host running
it. A small VPS comfortably serves a team of dozens.

**What happens when an employee leaves?**
Disable them from the user list. Their account stops authenticating and all of their
devices leave the WireGuard configuration in the same action, whichever folders they are
filed in. Deleting the account removes their devices with it.

**Can one person have several devices?**
Yes, that is the point. Each device carries its own key pair and its own configuration, so
a lost phone is revoked on its own without disturbing the laptop.

**Does disabling a folder delete anything?**
No. It only switches the devices off. Turning the folder back on restores them.

**Can I use my existing single sign-on?**
Yes. OIDC is inherited from wg-easy and works with Google, GitHub, Authelia, Authentik and
other standard providers.

## Development

### Prerequisites

- Docker
- Node LTS with corepack enabled

### Dev server

```shell
pnpm dev
```

The development compose file binds to `127.0.0.1:51830` and `127.0.0.1:51831` so it can run
on a host that already serves a production wg-easy instance.

### Checks

```shell
cd src && pnpm typecheck && pnpm lint && pnpm test:unit
```

## Credits

This project is a fork of [wg-easy](https://github.com/wg-easy/wg-easy) by Emile Nijssen
and its maintainers. All of the groundwork — the WireGuard integration, the web interface,
the installation tooling — comes from them. If this fork is useful to you, consider
supporting the original authors:

- Founder: [Buy Emile a beer](https://github.com/sponsors/WeeJeWel)
- Maintainer: [Buy kaaax0815 a coffee](https://github.com/sponsors/kaaax0815)

## License

Licensed under the AGPL-3.0-only License, inherited from wg-easy — see [LICENSE](LICENSE).

This project is not affiliated, associated, authorized, endorsed by, or in any way
officially connected with Jason A. Donenfeld, ZX2C4 or Edge Security.

"WireGuard" and the "WireGuard" logo are registered trademarks of Jason A. Donenfeld.
