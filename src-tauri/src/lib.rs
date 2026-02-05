use tauri_plugin_sql::{Migration, MigrationKind};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "Create drivers Table",
            sql: "CREATE TABLE IF NOT EXISTS drivers (
            driverId TEXT PRIMARY KEY,
            driverName TEXT NOT NULL,
            driverNumber INTEGER NOT NULL,
            shortName TEXT NOT NULL,
            active BOOLEAN NOT NULL,
            FOREIGN KEY (teamId) REFERENCES teams (teamId)
            )",
            kind: MigrationKind::Up
        },
        Migration {
            version: 1,
            description: "Create teams Table",
            sql: "",
            kind: MigrationKind::Up
        },
        Migration {
            version: 1,
            description: "Create teamResults Table",
            sql: "",
            kind: MigrationKind::Up
        },
        Migration {
            version: 1,
            description: "Create driverResults Table",
            sql: "",
            kind: MigrationKind::Up
        },
        Migration {
            version: 1,
            description: "Create seasons Table",
            sql: "",
            kind: MigrationKind::Up
        },
        Migration {
            version: 1,
            description: "Create races Table",
            sql: "",
            kind: MigrationKind::Up
        }
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
