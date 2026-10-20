use std::{path::PathBuf, sync::{Arc, Mutex, Condvar}};
use baconconsole::launcher::{steam_launch_request, GameLauncher, LaunchError, LaunchRequest, ProcessRunner};

#[derive(Clone, Default)] struct Runner(Arc<Mutex<Vec<(PathBuf, Vec<String>)>>>);
impl ProcessRunner for Runner { fn run(&self, executable: PathBuf, arguments: Vec<String>) -> Result<(), String> { self.0.lock().unwrap().push((executable, arguments)); Ok(()) } }

#[test]
fn launches_with_discrete_executable_and_arguments() {
    let runner = Runner::default(); let launcher = GameLauncher::new(runner.clone());
    launcher.launch(LaunchRequest::new("C:/RetroArch/retroarch.exe", vec!["-L".into(), "core.dll".into(), "game.nes".into()])).unwrap();
    assert_eq!(runner.0.lock().unwrap()[0].1, vec!["-L", "core.dll", "game.nes"]);
}

#[test]
fn allows_a_new_session_after_the_previous_process_exits() {
    let launcher = GameLauncher::new(Runner::default());
    launcher.launch(LaunchRequest::new("C:/a.exe", vec![])).unwrap();
    launcher.launch(LaunchRequest::new("C:/b.exe", vec![])).unwrap();
}

#[derive(Clone, Default)] struct BlockingRunner(Arc<(Mutex<bool>, Condvar)>);
impl ProcessRunner for BlockingRunner {
    fn run(&self, _: PathBuf, _: Vec<String>) -> Result<(), String> {
        let (lock, ready) = &*self.0;
        let mut release = lock.lock().unwrap();
        while !*release { release = ready.wait(release).unwrap(); }
        Ok(())
    }
}

#[test]
fn rejects_a_second_session_while_one_is_running() {
    let runner = BlockingRunner::default();
    let launcher = GameLauncher::new(runner.clone());
    let background = launcher.clone();
    let handle = std::thread::spawn(move || background.launch(LaunchRequest::new("C:/a.exe", vec![])));
    std::thread::sleep(std::time::Duration::from_millis(20));
    assert!(matches!(launcher.launch(LaunchRequest::new("C:/b.exe", vec![])), Err(LaunchError::AlreadyRunning)));
    let (lock, ready) = &*runner.0; *lock.lock().unwrap() = true; ready.notify_all();
    handle.join().unwrap().unwrap();
}
#[test]
fn builds_fixed_steam_uri_only_for_decimal_app_ids(){let request=steam_launch_request("42").unwrap();assert_eq!(request.arguments,vec!["steam://run/42"]);assert!(steam_launch_request("42&x=1").is_err());}
