#![no_std]

use sails_rs::{collections::BTreeMap, prelude::*};

// ---------------------------------------------------------------------------
// Global state — static mut pattern (no_std compatible, matches RMRK catalog)
// ---------------------------------------------------------------------------

static mut STATE: Option<ContentAgentState> = None;

pub struct ContentAgentState {
    pub admin: ActorId,
    pub contents: BTreeMap<u64, ContentItem>,
    /// Key is (content_id, holder_actor_id)
    pub passes: BTreeMap<(u64, ActorId), PassInfo>,
    /// Pending revenue per creator, in smallest VARA unit
    pub revenue: BTreeMap<ActorId, u128>,
    pub content_counter: u64,
}

#[allow(static_mut_refs)]
fn state() -> &'static ContentAgentState {
    unsafe { STATE.as_ref().expect("state not initialized") }
}

#[allow(static_mut_refs)]
fn state_mut() -> &'static mut ContentAgentState {
    unsafe { STATE.as_mut().expect("state not initialized") }
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

#[sails_rs::sails_type]
#[derive(Clone, Debug, PartialEq)]
pub enum ContentType {
    Article,
    Newsletter,
}

#[sails_rs::sails_type]
#[derive(Clone, Debug, PartialEq)]
pub struct ContentItem {
    pub id: u64,
    pub creator: ActorId,
    pub title: String,
    pub description: String,
    pub ipfs_cid: String,
    /// Smallest VARA unit (1 VARA = 1_000_000_000_000)
    pub price: u128,
    /// "key_hex:iv_hex" — AES-256-GCM key stored on-chain, gated by pass check
    pub encrypted_aes_key: String,
    pub published_at: u32,
    pub pass_count: u32,
    pub content_type: ContentType,
}

#[sails_rs::sails_type]
#[derive(Clone, Debug, PartialEq)]
pub struct PassInfo {
    pub content_id: u64,
    pub holder: ActorId,
    pub minted_at: u32,
}

/// Lightweight listing DTO — never exposes the AES key
#[sails_rs::sails_type]
#[derive(Clone, Debug, PartialEq)]
pub struct ContentMeta {
    pub id: u64,
    pub creator: ActorId,
    pub title: String,
    pub description: String,
    pub ipfs_cid: String,
    pub price: u128,
    pub pass_count: u32,
    pub content_type: ContentType,
    pub published_at: u32,
}

impl From<&ContentItem> for ContentMeta {
    fn from(item: &ContentItem) -> Self {
        ContentMeta {
            id: item.id,
            creator: item.creator,
            title: item.title.clone(),
            description: item.description.clone(),
            ipfs_cid: item.ipfs_cid.clone(),
            price: item.price,
            pass_count: item.pass_count,
            content_type: item.content_type.clone(),
            published_at: item.published_at,
        }
    }
}

// ---------------------------------------------------------------------------
// Events — single enum shared across all services
// ---------------------------------------------------------------------------

#[sails_rs::sails_type]
#[sails_rs::event]
#[derive(Clone, Debug, PartialEq)]
pub enum AgentEvents {
    ContentPublished { id: u64, creator: ActorId, title: String },
    PassMinted { content_id: u64, holder: ActorId, price: u128 },
    RevenueWithdrawn { creator: ActorId, amount: u128 },
    AccessKeyRequested { content_id: u64, requester: ActorId },
}

// ---------------------------------------------------------------------------
// Service 1 — ContentService
// ---------------------------------------------------------------------------

pub struct ContentService;

#[sails_rs::service(events = AgentEvents)]
impl ContentService {
    /// Publish new gated content. Caller becomes creator.
    /// `encrypted_aes_key` is "key_hex:iv_hex" from AES-256-GCM keygen.
    #[export]
    pub fn publish(
        &mut self,
        title: String,
        description: String,
        ipfs_cid: String,
        price: u128,
        encrypted_aes_key: String,
        content_type: ContentType,
    ) -> u64 {
        let s = state_mut();
        s.content_counter += 1;
        let id = s.content_counter;
        let creator = Syscall::message_source();

        s.contents.insert(
            id,
            ContentItem {
                id,
                creator,
                title: title.clone(),
                description,
                ipfs_cid,
                price,
                encrypted_aes_key,
                published_at: Syscall::block_height(),
                pass_count: 0,
                content_type,
            },
        );

        self.emit_event(AgentEvents::ContentPublished { id, creator, title })
            .unwrap();

        id
    }

    /// Paginated list of content metadata (AES keys never included).
    #[export]
    pub fn list_content(&self, offset: u32, limit: u32) -> Vec<ContentMeta> {
        state()
            .contents
            .values()
            .skip(offset as usize)
            .take(limit as usize)
            .map(ContentMeta::from)
            .collect()
    }

    /// Single content metadata (no AES key).
    #[export]
    pub fn get_content(&self, id: u64) -> Option<ContentMeta> {
        state().contents.get(&id).map(ContentMeta::from)
    }

    /// Return AES key only if caller holds a pass (or is the creator).
    #[export]
    pub fn request_access_key(&mut self, content_id: u64) -> Result<String, String> {
        let caller = Syscall::message_source();
        let s = state_mut();

        let item = s
            .contents
            .get(&content_id)
            .ok_or_else(|| "content not found".to_string())?;

        let has_pass = s.passes.contains_key(&(content_id, caller));
        let is_creator = item.creator == caller;

        if !has_pass && !is_creator {
            return Err("no access pass held".to_string());
        }

        let key = item.encrypted_aes_key.clone();

        self.emit_event(AgentEvents::AccessKeyRequested {
            content_id,
            requester: caller,
        })
        .unwrap();

        Ok(key)
    }
}

// ---------------------------------------------------------------------------
// Service 2 — PassService
// ---------------------------------------------------------------------------

pub struct PassService;

#[sails_rs::service(events = AgentEvents)]
impl PassService {
    /// Mint a pass. Message value must be >= content price.
    /// Exact price accrues to creator; any excess is noted but kept (v1 simplicity).
    #[export]
    pub fn mint_pass(&mut self, content_id: u64) -> Result<PassInfo, String> {
        let caller = Syscall::message_source();
        let value = Syscall::message_value();
        let block = Syscall::block_height();
        let s = state_mut();

        let item = s
            .contents
            .get_mut(&content_id)
            .ok_or_else(|| "content not found".to_string())?;

        if value < item.price {
            return Err("insufficient payment".to_string());
        }

        if s.passes.contains_key(&(content_id, caller)) {
            return Err("pass already held".to_string());
        }

        let creator = item.creator;
        let price = item.price;
        item.pass_count += 1;
        *s.revenue.entry(creator).or_insert(0) += price;

        let pass = PassInfo {
            content_id,
            holder: caller,
            minted_at: block,
        };
        s.passes.insert((content_id, caller), pass.clone());

        self.emit_event(AgentEvents::PassMinted {
            content_id,
            holder: caller,
            price,
        })
        .unwrap();

        Ok(pass)
    }

    /// Returns true if `holder` has access (pass or is creator).
    #[export]
    pub fn check_access(&self, content_id: u64, holder: ActorId) -> bool {
        let s = state();
        s.passes.contains_key(&(content_id, holder))
            || s.contents
                .get(&content_id)
                .map(|c| c.creator == holder)
                .unwrap_or(false)
    }

    /// All passes owned by `holder`.
    #[export]
    pub fn get_user_passes(&self, holder: ActorId) -> Vec<PassInfo> {
        state()
            .passes
            .values()
            .filter(|p| p.holder == holder)
            .cloned()
            .collect()
    }
}

// ---------------------------------------------------------------------------
// Service 3 — TreasuryService
// ---------------------------------------------------------------------------

pub struct TreasuryService;

#[sails_rs::service(events = AgentEvents)]
impl TreasuryService {
    /// Claim all pending revenue for caller. Clears balance.
    #[export]
    pub fn claim_revenue(&mut self) -> Result<u128, String> {
        let caller = Syscall::message_source();
        let s = state_mut();

        let amount = s.revenue.remove(&caller).unwrap_or(0);
        if amount == 0 {
            return Err("no revenue to claim".to_string());
        }

        self.emit_event(AgentEvents::RevenueWithdrawn {
            creator: caller,
            amount,
        })
        .unwrap();

        Ok(amount)
    }

    /// Pending unclaimed revenue for a creator.
    #[export]
    pub fn get_pending_revenue(&self, creator: ActorId) -> u128 {
        *state().revenue.get(&creator).unwrap_or(&0)
    }
}

// ---------------------------------------------------------------------------
// Program root
// ---------------------------------------------------------------------------

pub struct ContentAgentProgram;

#[sails_rs::program(payable)]
impl ContentAgentProgram {
    /// Initialise program. Caller becomes admin.
    pub fn new() -> Self {
        unsafe {
            STATE = Some(ContentAgentState {
                admin: Syscall::message_source(),
                contents: BTreeMap::new(),
                passes: BTreeMap::new(),
                revenue: BTreeMap::new(),
                content_counter: 0,
            });
        }
        Self
    }

    pub fn content(&self) -> ContentService {
        ContentService
    }

    pub fn pass(&self) -> PassService {
        PassService
    }

    pub fn treasury(&self) -> TreasuryService {
        TreasuryService
    }
}

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use sails_rs::gstd::services::Service as _;

    const ONE_VARA: u128 = 1_000_000_000_000;

    fn alice() -> ActorId {
        ActorId::from(1)
    }
    fn bob() -> ActorId {
        ActorId::from(2)
    }

    fn init_state(admin: ActorId) {
        unsafe {
            STATE = Some(ContentAgentState {
                admin,
                contents: BTreeMap::new(),
                passes: BTreeMap::new(),
                revenue: BTreeMap::new(),
                content_counter: 0,
            });
        }
    }

    fn publish_sample(creator: ActorId) -> u64 {
        Syscall::with_message_source(creator);
        Syscall::with_block_height(1);
        ContentService.expose(0).publish(
            "AI x Crypto Weekly".to_string(),
            "Top 3 stories this week".to_string(),
            "QmTestCid".to_string(),
            ONE_VARA,
            "deadbeef:cafebabe".to_string(),
            ContentType::Newsletter,
        )
    }

    #[test]
    fn content_publish_and_list() {
        init_state(alice());
        let id = publish_sample(alice());
        assert_eq!(id, 1);

        let svc = ContentService.expose(0);
        let list = svc.list_content(0, 10);
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].title, "AI x Crypto Weekly");
        assert_eq!(list[0].price, ONE_VARA);

        let meta = svc.get_content(1).unwrap();
        assert_eq!(meta.id, 1);
        assert_eq!(meta.creator, alice());
    }

    #[test]
    fn pass_mint_pays_creator() {
        init_state(alice());
        publish_sample(alice());

        Syscall::with_message_source(bob());
        Syscall::with_message_value(ONE_VARA);
        PassService.expose(0).mint_pass(1).expect("mint should succeed");

        assert_eq!(
            TreasuryService.expose(0).get_pending_revenue(alice()),
            ONE_VARA
        );

        let passes = PassService.expose(0).get_user_passes(bob());
        assert_eq!(passes.len(), 1);
        assert_eq!(passes[0].content_id, 1);
    }

    #[test]
    fn pass_mint_rejects_insufficient_payment() {
        init_state(alice());
        publish_sample(alice());

        Syscall::with_message_source(bob());
        Syscall::with_message_value(ONE_VARA - 1);
        let result = PassService.expose(0).mint_pass(1);
        assert_eq!(result.unwrap_err(), "insufficient payment");
    }

    #[test]
    fn access_key_gated_by_pass() {
        init_state(alice());
        publish_sample(alice());

        // Bob has no pass — rejected
        Syscall::with_message_source(bob());
        let result = ContentService.expose(0).request_access_key(1);
        assert_eq!(result.unwrap_err(), "no access pass held");

        // Bob mints pass
        Syscall::with_message_value(ONE_VARA);
        PassService.expose(0).mint_pass(1).unwrap();

        // Now bob gets the key
        let key = ContentService.expose(0).request_access_key(1).unwrap();
        assert_eq!(key, "deadbeef:cafebabe");
    }

    #[test]
    fn creator_always_has_access() {
        init_state(alice());
        publish_sample(alice());

        Syscall::with_message_source(alice());
        let key = ContentService.expose(0).request_access_key(1).unwrap();
        assert_eq!(key, "deadbeef:cafebabe");
    }

    #[test]
    fn duplicate_pass_rejected() {
        init_state(alice());
        publish_sample(alice());

        Syscall::with_message_source(bob());
        Syscall::with_message_value(ONE_VARA);
        PassService.expose(0).mint_pass(1).unwrap();

        Syscall::with_message_value(ONE_VARA);
        let result = PassService.expose(0).mint_pass(1);
        assert_eq!(result.unwrap_err(), "pass already held");
    }

    #[test]
    fn revenue_claim_clears_balance() {
        init_state(alice());
        publish_sample(alice());

        Syscall::with_message_source(bob());
        Syscall::with_message_value(ONE_VARA);
        PassService.expose(0).mint_pass(1).unwrap();

        Syscall::with_message_source(alice());
        let claimed = TreasuryService.expose(0).claim_revenue().unwrap();
        assert_eq!(claimed, ONE_VARA);
        assert_eq!(TreasuryService.expose(0).get_pending_revenue(alice()), 0);

        let result = TreasuryService.expose(0).claim_revenue();
        assert_eq!(result.unwrap_err(), "no revenue to claim");
    }
}
