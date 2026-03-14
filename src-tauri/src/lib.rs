use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;
use tauri::{AppHandle, Emitter, State, Manager};
use futures_util::StreamExt;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_util::sync::CancellationToken;
use tauri_plugin_opener::OpenerExt;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub username: String,
    pub linux_runner: Option<String>,
    pub skin_base64: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Runner {
    pub id: String,
    pub name: String,
    pub path: String,
    pub r#type: String,
}

pub struct DownloadState { pub token: Arc<Mutex<Option<CancellationToken>>> }

fn get_app_dir(app: &AppHandle) -> PathBuf {
    app.path().app_local_data_dir().unwrap_or_else(|_| {
        std::env::current_dir().unwrap_or_default()
    })
}

fn get_config_path(app: &AppHandle) -> PathBuf {
    get_app_dir(app).join("emerald_legacy_config.json")
}

#[tauri::command]
fn save_config(app: AppHandle, config: AppConfig) {
    let path = get_config_path(&app);
    let _ = fs::create_dir_all(path.parent().unwrap());
    if let Ok(json) = serde_json::to_string(&config) {
        let _ = fs::write(path, json);
    }
}

#[tauri::command]
fn load_config(app: AppHandle) -> AppConfig {
    let path = get_config_path(&app);
    if let Ok(content) = fs::read_to_string(path) {
        if let Ok(config) = serde_json::from_str(&content) {
            return config;
        }
    }
    
    let old_path = get_app_dir(&app).join("emerald_legacy_config.txt");
    let username = fs::read_to_string(old_path).unwrap_or_else(|_| "Player".into());
    AppConfig { username, linux_runner: None, skin_base64: None }
}

#[tauri::command]
fn get_available_runners() -> Vec<Runner> {
    let mut runners = Vec::new();

    #[cfg(target_os = "linux")]
    {
        if let Ok(output) = Command::new("which").arg("wine").output() {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                runners.push(Runner {
                    id: "wine".to_string(),
                    name: "System Wine".to_string(),
                    path,
                    r#type: "wine".to_string(),
                });
            }
        }

        let home = std::env::var("HOME").unwrap_or_default();
        let steam_paths = [
            format!("{}/.steam/steam/steamapps/common", home),
            format!("{}/.local/share/Steam/steamapps/common", home),
        ];

        for base_path in steam_paths {
            if let Ok(entries) = fs::read_dir(base_path) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        let name = entry.file_name().to_string_lossy().to_string();
                        if name.starts_with("Proton") {
                            runners.push(Runner {
                                id: format!("proton_{}", name),
                                name: name,
                                path: path.to_string_lossy().to_string(),
                                r#type: "proton".to_string(),
                            });
                        }
                    }
                }
            }
        }
    }

    runners
}

#[tauri::command]
#[allow(non_snake_case)]
fn check_game_installed(app: AppHandle, instanceId: String) -> bool {
    get_app_dir(&app).join("instances").join(&instanceId).join("Minecraft.Client.exe").exists()
}

#[tauri::command]
#[allow(non_snake_case)]
fn open_instance_folder(app: AppHandle, instanceId: String) {
    let dir = get_app_dir(&app).join("instances").join(&instanceId);
    if dir.exists() {
        let _ = app.opener().open_path(dir.to_str().unwrap(), None::<&str>);
    }
}

#[tauri::command]
async fn cancel_download(state: State<'_, DownloadState>) -> Result<(), String> {
    if let Some(token) = state.token.lock().await.take() { token.cancel(); }
    Ok(())
}

#[tauri::command]
#[allow(non_snake_case)]
async fn download_and_install(app: AppHandle, state: State<'_, DownloadState>, url: String, instanceId: String) -> Result<String, String> {
    let root = get_app_dir(&app);
    let instance_dir = root.join("instances").join(&instanceId);
    let token = CancellationToken::new();
    let child_token = token.clone();
    { *state.token.lock().await = Some(token); }
    
    if instance_dir.exists() { let _ = fs::remove_dir_all(&instance_dir); }
    fs::create_dir_all(&instance_dir).map_err(|e| e.to_string())?;
    
    let zip_path = root.join(format!("temp_{}.zip", instanceId));
    let response = reqwest::get(&url).await.map_err(|e| e.to_string())?;
    
    if !response.status().is_success() {
        return Err(format!("Download failed: {}", response.status()));
    }

    let total_size = response.content_length().unwrap_or(0) as f64;
    let mut file = fs::File::create(&zip_path).map_err(|e| e.to_string())?;
    let mut downloaded = 0.0;
    let mut stream = response.bytes_stream();
    
    while let Some(chunk) = stream.next().await {
        if child_token.is_cancelled() {
            drop(file); let _ = fs::remove_file(&zip_path);
            return Err("CANCELLED".into());
        }
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as f64;
        if total_size > 0.0 { let _ = app.emit("download-progress", downloaded / total_size * 100.0); }
    }
    
    drop(file);
    { *state.token.lock().await = None; }
    
    #[cfg(target_os = "linux")]
    let status = Command::new("unzip")
        .args(["-q", zip_path.to_str().unwrap(), "-d", instance_dir.to_str().unwrap()])
        .status()
        .map_err(|e| e.to_string())?;

    #[cfg(not(target_os = "linux"))]
    let status = Command::new("tar")
        .args(["-xf", zip_path.to_str().unwrap(), "-C", instance_dir.to_str().unwrap()])
        .status()
        .map_err(|e| e.to_string())?;
        
    let _ = fs::remove_file(&zip_path);

    if !status.success() {
        return Err("Extraction failed".into());
    }

    if let Ok(entries) = fs::read_dir(&instance_dir) {
        let entries_vec: Vec<_> = entries.flatten().collect();
        
        if entries_vec.len() == 1 && entries_vec[0].path().is_dir() {
            let inner_dir = entries_vec[0].path();
            
            if let Ok(inner_entries) = fs::read_dir(&inner_dir) {
                for inner_entry in inner_entries.flatten() {
                    let file_name = inner_entry.file_name();
                    let dest_path = instance_dir.join(file_name);
                    let _ = fs::rename(inner_entry.path(), dest_path);
                }
            }
            let _ = fs::remove_dir(&inner_dir);
        }
    }
    
    Ok("Success".into())
}

#[tauri::command]
#[allow(non_snake_case)]
async fn launch_game(app: AppHandle, instanceId: String) -> Result<(), String> {
    let root = get_app_dir(&app);
    let instance_dir = root.join("instances").join(&instanceId);
    let config = load_config(app.clone());
    let username = config.username;
    
    let _ = fs::write(instance_dir.join("username.txt"), &username);

    if let Some(skin_data) = config.skin_base64 {
        use base64::{Engine as _, engine::general_purpose};
        let base64_str = skin_data.split(',').nth(1).unwrap_or(&skin_data);
        if let Ok(bytes) = general_purpose::STANDARD.decode(base64_str) {
            let skin_dir = instance_dir.join("Common").join("res").join("mob");
            let _ = fs::create_dir_all(&skin_dir);
            let _ = fs::write(skin_dir.join("char.png"), bytes);
        }
    }
    
    let game_exe = instance_dir.join("Minecraft.Client.exe");
    if !game_exe.exists() {
        return Err("Game executable not found in instance folder.".into());
    }

    #[cfg(target_os = "linux")]
    {
        if let Some(runner_id) = config.linux_runner {
            let runners = get_available_runners();
            if let Some(runner) = runners.into_iter().find(|r| r.id == runner_id) {
                let mut cmd = if runner.r#type == "proton" {
                    let proton_exe = PathBuf::from(&runner.path).join("proton");
                    let mut c = Command::new(proton_exe);
                    let compat_data = instance_dir.join("proton_prefix");
                    fs::create_dir_all(&compat_data).map_err(|e| e.to_string())?;
                    c.env("STEAM_COMPAT_CLIENT_INSTALL_PATH", "");
                    c.env("STEAM_COMPAT_DATA_PATH", compat_data.to_str().unwrap());
                    c.arg("run");
                    c
                } else {
                    Command::new(runner.path)
                };

                cmd.arg(&game_exe)
                   .current_dir(&instance_dir)
                   .spawn()
                   .map_err(|e| e.to_string())?;
                return Ok(());
            }
        }
        Err("No Linux runner selected in settings.".into())
    }

    #[cfg(not(target_os = "linux"))]
    {
        let _ = Command::new(&game_exe).spawn().map_err(|e| e.to_string())?;
        Ok(())
    }
}

pub fn run() {
    tauri::Builder::default()
        .manage(DownloadState { token: Arc::new(Mutex::new(None)) })
        .plugin(tauri_plugin_gamepad::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![launch_game, check_game_installed, save_config, load_config, download_and_install, open_instance_folder, cancel_download, get_available_runners])
        .run(tauri::generate_context!())
        .expect("error");
}