# Tella — Demo Script for Non-Technical Audiences

This is a spoken-word guide. Read it before your demo, not from it live.
Adapt the wording to the room. The analogies are your tool — use the ones that land.

---

## Opening hook (30 seconds)

> "Imagine you write a brilliant newsletter. Every month, 500 people pay to read it.
> But Substack holds the keys — they have your subscribers, your content, your money.
> One day they change the terms, or they ban you, or they just go bankrupt.
> Everything you built is gone.
>
> Tella is what happens when you take that newsletter and put it on a blockchain instead.
> Nobody holds the keys except the person who paid for access."

Pause. Let that land.

---

## What Tella is (60 seconds)

Break it into three plain sentences:

1. **An AI writes the content.**
   Every day at 1pm UTC (8am New York / 9pm Singapore), an AI agent wakes up, scans the internet for the most important news about AI and crypto, and writes a professional research digest. No human editor. No manual work. The AI is the creator.

2. **The content is locked in a digital vault.**
   The article is encrypted — scrambled so only the right key can unscramble it. The encrypted article is stored on a global, permanent file system (IPFS). It cannot be deleted. Even we can't delete it.

3. **A blockchain decides who gets the key.**
   A smart contract on Vara Network holds the key. If you pay in VARA (Vara's currency), the contract gives you the key. Your pass is recorded on the blockchain permanently. You own it. Nobody can take it from you.

---

## The Substack comparison (use if the room isn't crypto-native)

> "You know Substack? Same concept — writers publish, readers pay, content unlocks.
> The difference is that on Substack, Substack is in the middle.
> They can change prices, ban creators, lose your data, or just shut down.
>
> Tella has no middle. The rules are written in code on a blockchain.
> No company can change them. No one can be banned. No one can take your pass away.
> It just runs."

---

## The live demo (walk through this exactly)

Before you start: make sure you have VARA in a reader wallet and the frontend is open at `/browse`.

---

### Step 1 — Show the browse page

Open `https://tella-ai.vercel.app/browse`

Say:
> "This is the front page. Every card here is a real AI-written research digest.
> You can see the title, a teaser line, and the price — 1 VARA.
> Notice the countdown at the top — that's how long until the next one drops.
> And those are real wallets watching, waiting for the next digest."

Point to the watcher count. Let the countdown tick for a moment.

---

### Step 2 — Open an article

Click any content card.

Say:
> "Here's what everyone can see for free — the title and the teaser.
> The full article is locked. You can see the 'body locked' indicator.
>
> This is not a database hiding content behind a login.
> The content is literally encrypted — scrambled data sitting on a global file system.
> Without the key, it's noise. The key is held by the blockchain."

---

### Step 3 — Connect a wallet

Click **Connect Wallet** in the nav.

Say:
> "This is a crypto wallet — like a digital bank account, but you control it.
> No username, no password. Just a key you own.
> When I connect it here, the app asks the blockchain: does this wallet own a pass for this article?
> Right now — no."

---

### Step 4 — Buy the pass

Click **Buy Access Pass — 1 VARA**. Approve the transaction in the wallet extension.

Say while waiting for confirmation:
> "I just sent 1 VARA directly to the smart contract.
> The contract checks: is the payment correct? Yes.
> It records: this wallet now owns a pass for content #2.
> And it holds the payment for the creator to claim later.
>
> There's no Stripe. No PayPal. No bank. The blockchain is the payment processor."

---

### Step 5 — Watch it decrypt

After confirmation, the article unlocks automatically.

Say:
> "Watch this — no page reload, no 'you now have access' email.
> The app just asked the blockchain for the key, fetched the encrypted file,
> and decrypted it right here in the browser.
> The plaintext never touched our servers.
>
> That's the article. Written by an AI at 13:00 UTC today.
> And my pass is now permanently on the blockchain — it cannot expire, it cannot be revoked."

---

### Step 6 — Show My Passes (optional)

Navigate to `/my-passes`.

Say:
> "Here are all the passes I've ever bought.
> These are blockchain records. Even if this website goes offline tomorrow,
> my ownership is still there. Anyone could build a different website
> that reads the same smart contract and shows me my content."

---

### Step 7 — Creator revenue (optional)

Navigate to `/creator`.

Say:
> "This is the creator dashboard.
> That 1 VARA I paid? It's sitting here as pending revenue.
> When the creator hits Claim, it goes straight to their wallet.
> No 30-day payout cycle. No 10% platform cut. Just the money."

---

### Step 8 — Show the agent running (terminal, optional)

```bash
cd agent && npm run run-once
```

Say while logs appear:
> "This is the agent running. Watch what happens:
> It calls Claude — Anthropic's AI — and asks it to research the news.
> Claude searches the web, picks the top stories, writes the digest.
> Then it encrypts it, uploads the encrypted blob to IPFS,
> and publishes the metadata to the blockchain.
>
> That whole pipeline just ran. A new article now exists on-chain."

---

## The "so what" — why this matters (30 seconds)

> "What you just saw is a fully autonomous content business.
> No human writer. No platform. No payment processor.
> An AI writes. A blockchain sells. A user reads.
>
> The creator earns revenue from every pass, forever.
> Passes don't expire. Content can't be censored.
> The AI runs whether the creator is awake or asleep.
>
> This is what it looks like when AI and crypto actually do something together
> instead of just being buzzwords in the same sentence."

---

## Analogies cheat sheet

Use whichever fits the room:

| Technical thing | Plain analogy |
|----------------|---------------|
| IPFS | A shared hard drive that no one company controls, spread across thousands of computers worldwide. Content you put on it stays there permanently. |
| Smart contract | A vending machine with rules baked in. You put in the right coin, you get the item. No cashier, no manager, no exceptions. |
| AES-256 encryption | A lock so strong it would take longer than the age of the universe to crack by brute force. |
| Blockchain pass | A concert ticket stub that can never be faked, never expires, and you can prove you own it with a signature only you can make. |
| VARA | The native currency of Vara Network — like tokens at an arcade, but they exist on a global ledger instead of in a chuck e. cheese. |
| Wallet | Your digital identity. No account creation, no password reset. If you have the key, you are you. |

---

## Common questions and answers

**"Couldn't someone just screenshot the article and share it?"**

Yes, the same way someone could photocopy a book. What they can't do is transfer your on-chain pass. Your pass is provably yours — if a platform ever required verified ownership (e.g. for deeper perks), screenshots don't help.

**"What if Anthropic shuts down?"**

The agent can be pointed at any AI. Claude is the default, but the contract and the content format don't care what generated the text. The already-published content on IPFS is unaffected by any API going away.

**"What if IPFS goes down?"**

IPFS doesn't "go down" the way a server does — it's a distributed network. As long as at least one node is pinning the content (which Pinata handles), it stays accessible. Multiple pinning services can be added for redundancy.

**"What stops someone from not paying and just reading?"**

The encryption. The article body on IPFS is scrambled ciphertext. Without the AES key — which the contract only hands over after verifying your pass — it's unreadable garbage. There is no decrypted copy sitting on a server somewhere.

**"Who owns the keys?"**

The smart contract holds the encrypted AES key. The contract releases it only to verified pass holders. The contract itself is open source — anyone can audit what it does.

**"Can this work for any kind of content?"**

Yes. The current agent writes AI x crypto digests, but the system is content-agnostic. Any creator who can produce an encrypted file and a Pinata CID can publish. The `/creator` dashboard handles manual publishing for non-agent use cases.

---

## Closing line

> "Tella is an existence proof.
> AI can create. Crypto can sell. Nobody needs to be in the middle.
> That's the whole idea."
