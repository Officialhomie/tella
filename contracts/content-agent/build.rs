fn main() {
    // Build WASM
    if let Some((_, wasm_path)) = sails_rs::build_wasm() {
        // Generate IDL and embed it into WASM
        sails_rs::ClientBuilder::<::content_agent_app::ContentAgentProgram>::from_wasm_path(wasm_path).build_idl();
    }
}