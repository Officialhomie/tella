## Tella on-chain program

Sails program for [Gear / Vara Network](https://github.com/gear-tech/gear) — gated encrypted content with access passes.

Packages:

- `tella` — WASM binary + IDL
- `tella-app` — program logic (`ContentAgentProgram`)
- `tella-client` — generated client

### Build

```bash
cargo build --release
```

### Test

```bash
cargo test -p tella-app --release
```
