use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;

#[cfg(target_os = "macos")]
use std::process::Stdio;

use tauri::{AppHandle, Emitter, State, Manager};
use futures_util::StreamExt;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_util::sync::CancellationToken;
use tauri_plugin_opener::OpenerExt;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct McServer {
    pub name: String,
    pub ip: String,
    pub port: u16,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SkinLibraryItem {
    pub id: String,
    pub name: String,
    pub skin_base64: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CustomEdition {
    pub id: String,
    pub name: String,
    pub desc: String,
    pub url: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub username: String,
    pub linux_runner: Option<String>,
    pub skin_base64: Option<String>,
    pub skin_library: Option<Vec<SkinLibraryItem>>,
    pub theme_style_id: Option<String>,
    pub theme_palette_id: Option<String>,
    pub apple_silicon_performance_boost: Option<bool>,
    pub custom_editions: Option<Vec<CustomEdition>>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ThemePalette {
    pub id: String,
    pub name: String,
    pub colors: serde_json::Value,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Runner {
    pub id: String,
    pub name: String,
    pub path: String,
    pub r#type: String,
}

pub struct DownloadState { pub token: Arc<Mutex<Option<CancellationToken>>> }
pub struct GameState { pub child: Arc<Mutex<Option<tokio::process::Child>>> }

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
#[cfg(target_os = "macos")]
struct MacosSetupProgressPayload {
    stage: String,
    message: String,
    percent: Option<f64>,
}

fn get_app_dir(app: &AppHandle) -> PathBuf {
    app.path().app_local_data_dir().unwrap_or_else(|_| {
        std::env::current_dir().unwrap_or_default()
    })
}

#[cfg(target_os = "macos")]
fn get_macos_runtime_dir(app: &AppHandle) -> PathBuf {
    let home = app
        .path()
        .home_dir()
        .ok()
        .or_else(|| std::env::var("HOME").ok().map(PathBuf::from))
        .unwrap_or_else(|| PathBuf::from("/"));
    home.join("Library")
        .join("Application Support")
        .join("Emerald")
        .join("runtime")
}

#[cfg(target_os = "macos")]
fn emit_macos_setup_progress(window: &tauri::Window, stage: &str, message: String, percent: Option<f64>) {
    let _ = window.emit(
        "macos-setup-progress",
        MacosSetupProgressPayload {
            stage: stage.to_string(),
            message,
            percent,
        },
    );
}

#[cfg(target_os = "macos")]
fn find_executable_recursive(root: &PathBuf, file_name: &str) -> Option<PathBuf> {
    let entries = fs::read_dir(root).ok()?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            if let Some(found) = find_executable_recursive(&path, file_name) {
                return Some(found);
            }
            continue;
        }

        if path.file_name().and_then(|n| n.to_str()) == Some(file_name) {
            return Some(path);
        }
    }
    None
}

#[cfg(unix)]
fn unix_path_to_wine_z_path(unix_path: &PathBuf) -> String {
    let p = unix_path.to_string_lossy();
    let mut out = String::with_capacity(p.len() + 3);
    out.push_str("Z:");
    for ch in p.chars() {
        if ch == '/' {
            out.push('\\');
        } else {
            out.push(ch);
        }
    }
    out
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
    AppConfig {
        username,
        linux_runner: None,
        skin_base64: None,
        skin_library: None,
        theme_style_id: None,
        theme_palette_id: None,
        apple_silicon_performance_boost: None,
        custom_editions: None,
    }
}

#[tauri::command]
fn get_external_palettes(app: AppHandle) -> Vec<ThemePalette> {
    let themes_dir = get_app_dir(&app).join("themes");
    let _ = fs::create_dir_all(&themes_dir);
    let mut palettes = Vec::new();

    if let Ok(entries) = fs::read_dir(themes_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(palette) = serde_json::from_str::<ThemePalette>(&content) {
                        palettes.push(palette);
                    }
                }
            }
        }
    }
    palettes
}

#[tauri::command]
fn import_theme(app: AppHandle) -> Result<String, String> {
    let file = rfd::FileDialog::new()
        .add_filter("JSON Theme", &["json"])
        .set_title("Import Theme Palette")
        .pick_file();

    if let Some(src_path) = file {
        let content = fs::read_to_string(&src_path).map_err(|e| e.to_string())?;
        let palette: ThemePalette = serde_json::from_str(&content).map_err(|_| "Invalid theme JSON format".to_string())?;

        let themes_dir = get_app_dir(&app).join("themes");
        let _ = fs::create_dir_all(&themes_dir);

        let dest_path = themes_dir.join(format!("{}.json", palette.id));
        fs::write(dest_path, content).map_err(|e| e.to_string())?;

        Ok(palette.name)
    } else {
        Err("CANCELED".into())
    }
}

#[tauri::command]
fn get_available_runners(app: AppHandle) -> Vec<Runner> {
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

        if let Ok(output) = Command::new("ls").arg("/usr/share/emerald-legacy-launcher/wine/bin/wine").output() {
            if output.status.success() {
                let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
                runners.push(Runner {
                    id: "flatpaksucks".to_string(),
                    name: "Default for Flatpak".to_string(),
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

        let runners_dir = get_app_dir(&app).join("runners");
        let _ = fs::create_dir_all(&runners_dir);
        if let Ok(entries) = fs::read_dir(&runners_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let dir_name = entry.file_name().to_string_lossy().to_string();
                    let wine_bin = path.join("bin").join("wine");
                    let proton_bin = path.join("proton");

                    if proton_bin.exists() {
                        runners.push(Runner {
                            id: format!("downloaded_{}", dir_name),
                            name: format!("{} (downloaded)", dir_name),
                            path: path.to_string_lossy().to_string(),
                            r#type: "proton".to_string(),
                        });
                    } else if wine_bin.exists() {
                        runners.push(Runner {
                            id: format!("downloaded_{}", dir_name),
                            name: format!("{} (downloaded)", dir_name),
                            path: wine_bin.to_string_lossy().to_string(),
                            r#type: "wine".to_string(),
                        });
                    }
                }
            }
        }
    }

    runners
}

#[tauri::command]
async fn download_runner(app: AppHandle, state: State<'_, DownloadState>, name: String, url: String) -> Result<String, String> {
    let runners_dir = get_app_dir(&app).join("runners");
    fs::create_dir_all(&runners_dir).map_err(|e| e.to_string())?;

    let runner_dir = runners_dir.join(&name);
    if runner_dir.exists() {
        let _ = fs::remove_dir_all(&runner_dir);
    }
    fs::create_dir_all(&runner_dir).map_err(|e| e.to_string())?;

    let token = CancellationToken::new();
    let child_token = token.clone();
    {
        let mut lock = state.token.lock().await;
        if let Some(old_token) = lock.take() {
            old_token.cancel();
        }
        *lock = Some(token);
    }

    let tarball_path = runners_dir.join(format!("{}.tar.gz", name));
    let response = reqwest::get(&url).await.map_err(|e| e.to_string())?;

    if !response.status().is_success() {
        return Err(format!("Download failed: {}", response.status()));
    }

    let total_size = response.content_length().unwrap_or(0) as f64;
    let mut file = fs::File::create(&tarball_path).map_err(|e| e.to_string())?;
    let mut downloaded = 0.0;
    let mut stream = response.bytes_stream();

    while let Some(chunk) = stream.next().await {
        if child_token.is_cancelled() {
            drop(file);
            let _ = fs::remove_file(&tarball_path);
            let _ = fs::remove_dir_all(&runner_dir);
            return Err("CANCELLED".into());
        }
        let chunk = chunk.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as f64;
        if total_size > 0.0 {
            let _ = app.emit("runner-download-progress", downloaded / total_size * 100.0);
        }
    }

    drop(file);
    { *state.token.lock().await = None; }

    let status = Command::new("tar")
        .args(["-zxf", tarball_path.to_str().unwrap(), "-C", runner_dir.to_str().unwrap(), "--strip-components=1"])
        .status()
        .map_err(|e| e.to_string())?;

    let _ = fs::remove_file(&tarball_path);

    if !status.success() {
        let _ = fs::remove_dir_all(&runner_dir);
        return Err("Extraction failed".into());
    }

    Ok(name)
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
#[allow(non_snake_case)]
fn delete_instance(app: AppHandle, instanceId: String) -> Result<(), String> {
    let dir = get_app_dir(&app).join("instances").join(&instanceId);
    if dir.exists() {
        let _ = fs::remove_dir_all(dir);
    }
    Ok(())
}

#[tauri::command]
async fn cancel_download(state: State<'_, DownloadState>) -> Result<(), String> {
    if let Some(token) = state.token.lock().await.take() { token.cancel(); }
    Ok(())
}

#[tauri::command]
async fn setup_macos_runtime(window: tauri::Window, app: AppHandle) -> Result<(), String> {
    #[cfg(not(target_os = "macos"))]
    {
        let _ = window;
        let _ = app;
        return Err("macOS runtime setup is only supported on macOS.".into());
    }

    #[cfg(target_os = "macos")]
    {
        #[derive(Deserialize)]
        struct GithubAsset {
            name: String,
            browser_download_url: String,
        }

        #[derive(Deserialize)]
        struct GithubRelease {
            tag_name: String,
            assets: Vec<GithubAsset>,
        }

        emit_macos_setup_progress(&window, "resolving", "Resolving macOS compatibility runtime…".into(), None);

        let client = reqwest::Client::new();
        let release_text = client
            .get("https://api.github.com/repos/Gcenx/game-porting-toolkit/releases/latest")
            .header("User-Agent", "Emerald-Legacy-Launcher")
            .send()
            .await
            .map_err(|e| e.to_string())?
            .error_for_status()
            .map_err(|e| e.to_string())?
            .text()
            .await
            .map_err(|e| e.to_string())?;

        let release: GithubRelease = serde_json::from_str(&release_text).map_err(|e| e.to_string())?;
        let asset = release
            .assets
            .iter()
            .find(|a| a.name.ends_with(".tar.xz") || a.name.ends_with(".tar.gz"))
            .ok_or_else(|| "No compatible runtime asset found in latest release.".to_string())?;

        let runtime_dir = get_macos_runtime_dir(&app);
        let toolkit_dir = runtime_dir.join("toolkit");
        let prefix_dir = runtime_dir.join("prefix");
        fs::create_dir_all(&runtime_dir).map_err(|e| e.to_string())?;

        if toolkit_dir.exists() {
            let _ = fs::remove_dir_all(&toolkit_dir);
        }
        fs::create_dir_all(&toolkit_dir).map_err(|e| e.to_string())?;

        emit_macos_setup_progress(
            &window,
            "downloading",
            format!("Downloading runtime ({})…", release.tag_name),
            Some(0.0),
        );

        let archive_path = runtime_dir.join(format!("gptk_{}", asset.name));
        let response = client
            .get(&asset.browser_download_url)
            .header("User-Agent", "Emerald-Legacy-Launcher")
            .send()
            .await
            .map_err(|e| e.to_string())?
            .error_for_status()
            .map_err(|e| e.to_string())?;

        let total_size = response.content_length().unwrap_or(0) as f64;
        let mut file = fs::File::create(&archive_path).map_err(|e| e.to_string())?;
        let mut downloaded = 0.0;
        let mut last_percent_sent: i64 = -1;
        let mut stream = response.bytes_stream();

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| e.to_string())?;
            file.write_all(&chunk).map_err(|e| e.to_string())?;
            downloaded += chunk.len() as f64;

            if total_size > 0.0 {
                let percent = (downloaded / total_size * 100.0).clamp(0.0, 100.0);
                let rounded = percent.floor() as i64;
                if rounded != last_percent_sent {
                    last_percent_sent = rounded;
                    emit_macos_setup_progress(
                        &window,
                        "downloading",
                        format!("Downloading runtime… {}%", rounded),
                        Some(percent),
                    );
                }
            }
        }
        drop(file);

        emit_macos_setup_progress(&window, "extracting", "Extracting runtime…".into(), None);
        let status = Command::new("tar")
            .args([
                "-xf",
                archive_path.to_str().ok_or_else(|| "Invalid archive path".to_string())?,
                "-C",
                toolkit_dir.to_str().ok_or_else(|| "Invalid toolkit path".to_string())?,
            ])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map_err(|e| e.to_string())?;
        let _ = fs::remove_file(&archive_path);
        if !status.success() {
            return Err("Extraction failed".into());
        }

        fs::create_dir_all(&prefix_dir).map_err(|e| e.to_string())?;

        let wine_binary = find_executable_recursive(&toolkit_dir, "wine64")
            .or_else(|| find_executable_recursive(&toolkit_dir, "wine"))
            .ok_or_else(|| "Unable to locate wine binary inside runtime.".to_string())?;

        let wine_bin_dir = wine_binary
            .parent()
            .map(|pp| pp.to_path_buf())
            .ok_or_else(|| "Unable to locate wine bin directory inside runtime.".to_string())?;

        emit_macos_setup_progress(&window, "initializing", "Initializing Wine prefix…".into(), None);

        let mut cmd = Command::new(&wine_binary);
        cmd.arg("wineboot");
        cmd.arg("-u");
        cmd.env("WINEPREFIX", &prefix_dir);
        cmd.env("WINEARCH", "win64");
        cmd.env("WINEDEBUG", "-all");
        cmd.env("WINEESYNC", "1");
        cmd.env("WINEDLLOVERRIDES", "winemenubuilder.exe=d;mscoree,mshtml=");
        cmd.env("MTL_HUD_ENABLED", "0");
        cmd.env(
            "PATH",
            format!(
                "{}:{}",
                wine_bin_dir.to_string_lossy(),
                std::env::var("PATH").unwrap_or_default()
            ),
        );
        cmd.stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null());

        let status = cmd.status().map_err(|e| e.to_string())?;
        if !status.success() {
            return Err("Wine prefix initialization failed".into());
        }

        emit_macos_setup_progress(&window, "done", "Setup complete.".into(), Some(100.0));
        Ok(())
    }
}

fn copy_dir_all(src: impl AsRef<std::path::Path>, dst: impl AsRef<std::path::Path>) -> std::io::Result<()> {
    fs::create_dir_all(&dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}

#[tauri::command]
#[allow(non_snake_case)]
async fn download_and_install(app: AppHandle, state: State<'_, DownloadState>, url: String, instanceId: String) -> Result<String, String> {
    let root = get_app_dir(&app);
    let instance_dir = root.join("instances").join(&instanceId);
    let token = CancellationToken::new();
    let child_token = token.clone();
    {
        let mut lock = state.token.lock().await;
        if let Some(old_token) = lock.take() {
            old_token.cancel();
        }
        *lock = Some(token);
    }

    if !instance_dir.exists() {
        fs::create_dir_all(&instance_dir).map_err(|e| e.to_string())?;
    } else {
        if let Ok(entries) = fs::read_dir(&instance_dir) {
            for entry in entries.flatten() {
                let file_name = entry.file_name();
                let name_str = file_name.to_string_lossy();

                let keep_list = ["Windows64", "uid.dat", "username.txt", "settings.dat", "servers.dat", "servers.txt", "server.properties", "Common", "options.txt", "servers.db"];
                if !keep_list.contains(&name_str.as_ref()) {
                    let path = entry.path();
                    if path.is_dir() {
                        let _ = fs::remove_dir_all(path);
                    } else {
                        let _ = fs::remove_file(path);
                    }
                } else if name_str == "Common" {
                    let common_dir = entry.path();
                    if let Ok(common_entries) = fs::read_dir(&common_dir) {
                        for c_entry in common_entries.flatten() {
                            let c_name = c_entry.file_name();
                            if c_name.to_string_lossy() != "res" {
                                let c_path = c_entry.path();
                                if c_path.is_dir() { let _ = fs::remove_dir_all(c_path); } else { let _ = fs::remove_file(c_path); }
                            } else {
                                let res_dir = c_entry.path();
                                if let Ok(res_entries) = fs::read_dir(&res_dir) {
                                    for r_entry in res_entries.flatten() {
                                        let r_name = r_entry.file_name();
                                        if r_name.to_string_lossy() != "mob" {
                                            let r_path = r_entry.path();
                                            if r_path.is_dir() { let _ = fs::remove_dir_all(r_path); } else { let _ = fs::remove_file(r_path); }
                                        } else {
                                            let mob_dir = r_entry.path();
                                            if let Ok(mob_entries) = fs::read_dir(&mob_dir) {
                                                for m_entry in mob_entries.flatten() {
                                                    let m_name = m_entry.file_name();
                                                    if m_name.to_string_lossy() != "char.png" {
                                                        let m_path = m_entry.path();
                                                        if m_path.is_dir() { let _ = fs::remove_dir_all(m_path); } else { let _ = fs::remove_file(m_path); }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

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
    {
        let unzip_check = Command::new("unzip").arg("-v").status();
        if unzip_check.is_err() || !unzip_check.unwrap().success() {
            return Err("The 'unzip' command was not found. Please install it (e.g., 'sudo apt install unzip') to continue.".into());
        }

        let status = Command::new("unzip")
            .args(["-o", "-q", zip_path.to_str().unwrap(), "-d", instance_dir.to_str().unwrap()])
            .status()
            .map_err(|e| e.to_string())?;

        if !status.success() {
            return Err("Extraction failed".into());
        }
    }

    #[cfg(not(target_os = "linux"))]
    {
        let status = Command::new("tar")
            .args(["-xf", zip_path.to_str().unwrap(), "-C", instance_dir.to_str().unwrap()])
            .status()
            .map_err(|e| e.to_string())?;

        if !status.success() {
            return Err("Extraction failed".into());
        }
    }

    let _ = fs::remove_file(&zip_path);

    if let Ok(entries) = fs::read_dir(&instance_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                let check_exe = path.join("Minecraft.Client.exe");
                if check_exe.exists() {
                    let inner_dir = path;
                    if let Ok(inner_entries) = fs::read_dir(&inner_dir) {
                        for inner_entry in inner_entries.flatten() {
                            let file_name = inner_entry.file_name();
                            let dest_path = instance_dir.join(file_name);
                            if fs::rename(inner_entry.path(), &dest_path).is_err() {
                                if inner_entry.path().is_dir() {
                                    let _ = copy_dir_all(inner_entry.path(), &dest_path);
                                    let _ = fs::remove_dir_all(inner_entry.path());
                                } else {
                                    let _ = fs::copy(inner_entry.path(), &dest_path);
                                    let _ = fs::remove_file(inner_entry.path());
                                }
                            }
                        }
                    }
                    let _ = fs::remove_dir_all(&inner_dir);
                    break;
                }
            }
        }
    }

    Ok("Success".into())
}

fn ensure_server_list(instance_dir: &PathBuf, servers: Vec<McServer>) {
    let servers_db = instance_dir.join("servers.db");
    if servers.is_empty() { return; }
    let mut records = Vec::new();
    for server in &servers {
        let ip_bytes = server.ip.as_bytes();
        let name_bytes = server.name.as_bytes();
        records.extend_from_slice(&(ip_bytes.len() as u16).to_le_bytes());
        records.extend_from_slice(ip_bytes);
        records.extend_from_slice(&server.port.to_le_bytes());
        records.extend_from_slice(&(name_bytes.len() as u16).to_le_bytes());
        records.extend_from_slice(name_bytes);
    }

    if !servers_db.exists() {
        let mut file_content = Vec::new();
        file_content.extend_from_slice(b"MCSV");
        file_content.extend_from_slice(&1u32.to_le_bytes()); // Version
        file_content.extend_from_slice(&(servers.len() as u32).to_le_bytes()); // Count
        file_content.append(&mut records);
        let _ = fs::write(&servers_db, file_content);
    } else {
        if let Ok(mut content) = fs::read(&servers_db) {
            if content.len() < 12 || &content[0..4] != b"MCSV" { return; }
            let mut count = u32::from_le_bytes(content[8..12].try_into().unwrap_or([0; 4]));
            let mut modified = false;
            for server in servers {
                let ip_bytes = server.ip.as_bytes();
                if !content.windows(ip_bytes.len()).any(|w| w == ip_bytes) {
                    let name_bytes = server.name.as_bytes();
                    content.extend_from_slice(&(ip_bytes.len() as u16).to_le_bytes());
                    content.extend_from_slice(ip_bytes);
                    content.extend_from_slice(&server.port.to_le_bytes());
                    content.extend_from_slice(&(name_bytes.len() as u16).to_le_bytes());
                    content.extend_from_slice(name_bytes);
                    count += 1;
                    modified = true;
                }
            }

            if modified {
                content[8..12].copy_from_slice(&count.to_le_bytes());
                let _ = fs::write(&servers_db, content);
            }
        }
    }
}

#[tauri::command]
#[allow(non_snake_case)]
async fn launch_game(app: AppHandle, state: State<'_, GameState>, instanceId: String, servers: Vec<McServer>) -> Result<(), String> {
    let root = get_app_dir(&app);
    let instance_dir = root.join("instances").join(&instanceId);
    let config = load_config(app.clone());
    let username = config.username;
    let _ = fs::write(instance_dir.join("username.txt"), &username);
    ensure_server_list(&instance_dir, servers);
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
            let runners = get_available_runners(app.clone());
            if let Some(runner) = runners.into_iter().find(|r| r.id == runner_id) {
                let mut cmd = if runner.r#type == "proton" {
                    let proton_exe = PathBuf::from(&runner.path).join("proton");
                    let mut c = tokio::process::Command::new(proton_exe);
                    let compat_data = instance_dir.join("proton_prefix");
                    fs::create_dir_all(&compat_data).map_err(|e| e.to_string())?;
                    c.env("STEAM_COMPAT_CLIENT_INSTALL_PATH", "");
                    c.env("STEAM_COMPAT_DATA_PATH", compat_data.to_str().unwrap());
                    c.arg("run");
                    c
                } else {
                    tokio::process::Command::new(runner.path)
                };

                #[cfg(unix)]
                cmd.process_group(0);

                cmd.arg(&game_exe)
                   .current_dir(&instance_dir);

                let child = cmd.spawn().map_err(|e| e.to_string())?;
                {
                    let mut lock = state.child.lock().await;
                    *lock = Some(child);
                }

                let status = loop {
                    {
                        let mut lock = state.child.lock().await;
                        if let Some(ref mut c) = *lock {
                            if let Some(s) = c.try_wait().map_err(|e| e.to_string())? {
                                break s;
                            }
                        } else {
                            return Ok(());
                        }
                    }
                    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                };

                {
                    let mut lock = state.child.lock().await;
                    *lock = None;
                }

                return if status.success() || status.code() == Some(253) || status.code() == Some(96) { Ok(()) } else { Err(format!("Game exited with status: {}", status)) };
            }
        }
        Err("No Linux runner selected in settings.".into())
    }

    #[cfg(not(target_os = "linux"))]
    {
        #[cfg(target_os = "macos")]
        {
            let runtime_dir = get_macos_runtime_dir(&app);
            let toolkit_dir = runtime_dir.join("toolkit");
            let prefix_dir = runtime_dir.join("prefix");

            if !toolkit_dir.exists() || !prefix_dir.exists() {
                return Err("macOS Compatibility is not set up. Open Settings and run Setup macOS Compatibility.".into());
            }

            let gptk_no_hud = find_executable_recursive(&toolkit_dir, "gameportingtoolkit-no-hud")
                .or_else(|| find_executable_recursive(&toolkit_dir, "gameportingtoolkit"));

            let wine_binary = find_executable_recursive(&toolkit_dir, "wine64")
                .or_else(|| find_executable_recursive(&toolkit_dir, "wine"))
                .ok_or_else(|| "Unable to locate wine binary inside runtime.".to_string())?;

            let wine_bin_dir = wine_binary
                .parent()
                .map(|pp| pp.to_path_buf())
                .ok_or_else(|| "Unable to locate wine bin directory inside runtime.".to_string())?;

            let mut cmd = if let Some(wrapper) = gptk_no_hud {
                let win_path = unix_path_to_wine_z_path(&game_exe);
                let mut c = tokio::process::Command::new(wrapper);
                c.arg(&prefix_dir);
                c.arg(win_path);
                c
            } else {
                let mut c = tokio::process::Command::new(&wine_binary);
                c.env("WINEPREFIX", &prefix_dir);
                c.arg(&game_exe);
                c
            };

            #[cfg(unix)]
            cmd.process_group(0);

            cmd.current_dir(&instance_dir);
            cmd.env("WINEPREFIX", &prefix_dir);
            cmd.env("WINEDEBUG", "-all");
            let perf_boost = config.apple_silicon_performance_boost.unwrap_or(false);
            if perf_boost {
                #[cfg(target_arch = "aarch64")]
                {
                    cmd.env("WINE_MSYNC", "1");
                    cmd.env("MVK_ALLOW_METAL_FENCES", "1");
                }
                #[cfg(not(target_arch = "aarch64"))]
                {
                    cmd.env("WINEESYNC", "1");
                }
            } else {
                cmd.env("WINEESYNC", "1");
            }
            cmd.env("WINEDLLOVERRIDES", "winemenubuilder.exe=d;mscoree,mshtml=");
            cmd.env("MTL_HUD_ENABLED", "0");
            cmd.env("MVK_CONFIG_RESUME_LOST_DEVICE", "1");
            cmd.env(
                "PATH",
                format!(
                    "{}:{}",
                    wine_bin_dir.to_string_lossy(),
                    std::env::var("PATH").unwrap_or_default()
                ),
            );
            cmd.stdin(Stdio::null())
                .stdout(Stdio::null())
                .stderr(Stdio::null());

            let mut child = cmd.spawn().map_err(|e| e.to_string())?;
            {
                let mut lock = state.child.lock().await;
                *lock = Some(child);
            }

            let status = loop {
                {
                    let mut lock = state.child.lock().await;
                    if let Some(ref mut c) = *lock {
                        if let Some(s) = c.try_wait().map_err(|e| e.to_string())? {
                            break s;
                        }
                    } else {
                        return Ok(());
                    }
                }
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            };

            {
                let mut lock = state.child.lock().await;
                *lock = None;
            }

            return if status.success() || status.code() == Some(253) || status.code() == Some(96) { Ok(()) } else { Err(format!("Game exited with status: {}", status)) };
        }

        #[cfg(all(not(target_os = "macos"), not(target_os = "linux")))]
        {
            let mut cmd = tokio::process::Command::new(&game_exe);
            #[cfg(unix)]
            cmd.process_group(0);
            cmd.current_dir(&instance_dir);
            let mut child = cmd.spawn().map_err(|e| e.to_string())?;
            {
                let mut lock = state.child.lock().await;
                *lock = Some(child);
            }
            let status = loop {
                {
                    let mut lock = state.child.lock().await;
                    if let Some(ref mut c) = *lock {
                        if let Some(s) = c.try_wait().map_err(|e| e.to_string())? {
                            break s;
                        }
                    } else {
                        return Ok(());
                    }
                }
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            };
            {
                let mut lock = state.child.lock().await;
                *lock = None;
            }
            return if status.success() || status.code() == Some(253) || status.code() == Some(96) { Ok(()) } else { Err(format!("Game exited with status: {}", status)) };
        }
    }
}

#[cfg(unix)]
fn kill_process_tree(app: &AppHandle, instance_id: &str) { // neo: dont question me.
    let root = get_app_dir(&app);
    let instance_dir = root.join("instances").join(instance_id);
    let target = unix_path_to_wine_z_path(&instance_dir.join("Minecraft.Client.exe"));
    let Ok(entries) = fs::read_dir("/proc") else { return };
    for entry in entries.flatten() {
        let Ok(pid) = entry.file_name().to_string_lossy().parse::<u32>() else { continue };
        let cmdline = fs::read_to_string(format!("/proc/{}/cmdline", pid))
            .unwrap_or_default();
        if cmdline.contains(&*target) {
            unsafe { libc::kill(pid as i32, libc::SIGKILL); }
        }
    }
}

#[tauri::command]
async fn stop_game(app: AppHandle, instance_id: String, state: State<'_, GameState>) -> Result<(), String> {
    let mut lock = state.child.lock().await;
    if let Some(mut child) = lock.take() {
        #[cfg(unix)] kill_process_tree(&app, &instance_id);
        let _ = child.kill().await;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(DownloadState { token: Arc::new(Mutex::new(None)) })
        .manage(GameState { child: Arc::new(Mutex::new(None)) })
        .plugin(tauri_plugin_gamepad::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_drpc::init())
        .invoke_handler(tauri::generate_handler![setup_macos_runtime, launch_game, stop_game, check_game_installed, save_config, load_config, download_and_install, open_instance_folder, cancel_download, get_available_runners, get_external_palettes, import_theme, download_runner, delete_instance])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
