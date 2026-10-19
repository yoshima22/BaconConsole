use baconconsole::disc::validate_relative_path;

#[test]
fn rejects_manifest_path_traversal() {
    assert!(validate_relative_path("../outside.exe").is_err());
    assert!(validate_relative_path("C:/outside.exe").is_err());
    assert!(validate_relative_path("Game/game.exe").is_ok());
}
