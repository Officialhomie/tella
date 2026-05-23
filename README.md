# Tella

**Tella** — AI × crypto intelligence, encrypted on IPFS, gated on Vara Network.

| Part | Path | Role |
|------|------|------|
| Agent | `agent/` | Generates digests, pins to IPFS, publishes on-chain |
| Contract | `contracts/tella/` | Sails program (Content / Pass / Treasury) |
| Frontend | `frontend/` | Browse, buy passes, creator dashboard |

## Deploy frontend (Vercel)

```bash
cd frontend
vercel --prod
```

Set `NEXT_PUBLIC_PROGRAM_ID` and `NEXT_PUBLIC_NETWORK` in the Vercel project settings.

## License

MIT
