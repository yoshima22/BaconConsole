#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![commands::inspect_simulated_disc, commands::verify_simulated_disc, commands::copy_simulated_disc])
    .run(tauri::generate_context!())
    .expect("error while running BaconConsole");
}
