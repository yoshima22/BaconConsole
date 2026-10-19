use std::{path::PathBuf, sync::{Arc, Mutex}};
use thiserror::Error;

#[derive(Debug, Error, PartialEq, Eq)] pub enum LaunchError { #[error("a game session is already running")] AlreadyRunning, #[error("process failed: {0}")] Process(String) }
#[derive(Clone)] pub struct LaunchRequest { pub executable: PathBuf, pub arguments: Vec<String> }
impl LaunchRequest { pub fn new(executable: impl Into<PathBuf>, arguments: Vec<String>) -> Self { Self { executable: executable.into(), arguments } } }
pub trait ProcessRunner: Send + Sync + Clone + 'static { fn run(&self, executable: PathBuf, arguments: Vec<String>) -> Result<(), String>; }
#[derive(Clone, Default)] pub struct NativeProcessRunner;
impl ProcessRunner for NativeProcessRunner { fn run(&self, executable: PathBuf, arguments: Vec<String>) -> Result<(), String> { std::process::Command::new(executable).args(arguments).spawn().map_err(|error| error.to_string())?.wait().map_err(|error| error.to_string())?; Ok(()) } }
#[derive(Clone)] pub struct GameLauncher<R: ProcessRunner> { runner: R, active: Arc<Mutex<bool>> }
impl<R: ProcessRunner> GameLauncher<R> { pub fn new(runner: R) -> Self { Self { runner, active: Arc::new(Mutex::new(false)) } } pub fn launch(&self, request: LaunchRequest) -> Result<(), LaunchError> { let mut active = self.active.lock().map_err(|_| LaunchError::AlreadyRunning)?; if *active { return Err(LaunchError::AlreadyRunning); } *active = true; self.runner.run(request.executable, request.arguments).map_err(LaunchError::Process) } }
