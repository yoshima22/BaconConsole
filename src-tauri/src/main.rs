#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .manage(commands::CopyJobs(std::sync::Mutex::new(std::collections::HashMap::new())))
    .manage(commands::NativeLauncher(baconconsole::launcher::GameLauncher::new(baconconsole::launcher::NativeProcessRunner)))
    .invoke_handler(tauri::generate_handler![commands::inspect_simulated_disc, commands::verify_simulated_disc, commands::get_storage_targets, commands::start_verified_copy, commands::cancel_copy, commands::list_library_records, commands::list_catalog_games, commands::sync_steam_library, commands::register_windows_application, commands::launch_steam_game, commands::list_local_users, commands::get_active_local_user, commands::create_local_user, commands::set_active_local_user, commands::toggle_catalog_favorite, commands::steamgriddb_status, commands::integration_status, commands::configure_and_test_steamgriddb, commands::configure_and_test_retroachievements, commands::configure_steamgriddb, commands::search_steamgriddb, commands::steamgriddb_artwork_options, commands::cache_steamgriddb_artwork, commands::selected_game_artwork, commands::copy_simulated_disc, commands::list_emulator_profiles, commands::list_effective_emulator_profiles, commands::bundled_emulator_profiles, commands::save_emulator_profile, commands::import_authorized_library, commands::launch_game, commands::launch_catalog_game])
    .run(tauri::generate_context!())
    .expect("error while running BaconConsole");
}
