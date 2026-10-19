use std::{path::PathBuf, sync::{Arc, Mutex}};
use baconconsole::launcher::{GameLauncher, LaunchError, LaunchRequest, ProcessRunner};

#[derive(Clone, Default)] struct Runner(Arc<Mutex<Vec<(PathBuf, Vec<String>)>>>);
impl ProcessRunner for Runner { fn run(&self, executable: PathBuf, arguments: Vec<String>) -> Result<(), String> { self.0.lock().unwrap().push((executable, arguments)); Ok(()) } }

#[test]
fn launches_with_discrete_executable_and_arguments() {
    let runner = Runner::default(); let launcher = GameLauncher::new(runner.clone());
    launcher.launch(LaunchRequest::new("C:/RetroArch/retroarch.exe", vec!["-L".into(), "core.dll".into(), "game.nes".into()])).unwrap();
    assert_eq!(runner.0.lock().unwrap()[0].1, vec!["-L", "core.dll", "game.nes"]);
}

#[test]
fn rejects_a_second_session_while_one_is_running() {
    let launcher = GameLauncher::new(Runner::default());
    launcher.launch(LaunchRequest::new("C:/a.exe", vec![])).unwrap();
    assert!(matches!(launcher.launch(LaunchRequest::new("C:/b.exe", vec![])), Err(LaunchError::AlreadyRunning)));
}
