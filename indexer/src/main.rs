mod config;
#[cfg(feature = "grpc")]
mod grpc;
mod args;
mod instructions;
mod notifier;
mod parser;
mod ws;

use config::{Config, Mode};
use log::info;
use notifier::Notifier;
use parser::ParsedEvent;
use tokio::sync::mpsc;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();
    let cfg = Config::from_env();

    info!("Axion Indexer starting...");
    info!("Program: {}", cfg.program_id);

    let notifier = Notifier::new(cfg.backend_webhook_url, cfg.ws_relayer_url, cfg.indexer_token);
    let (tx, mut rx) = mpsc::unbounded_channel::<ParsedEvent>();

    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            notifier.notify(&event).await;
        }
    });

    match cfg.mode {
        Mode::Ws => {
            info!("Mode: WebSocket ({})", cfg.solana_ws_url);
            ws::run(&cfg.solana_ws_url, &cfg.solana_rpc_url, &cfg.program_id, move |event| {
                let _ = tx.send(event);
            })
            .await?;
        }
        Mode::Grpc => {
            #[cfg(feature = "grpc")]
            {
                info!("Mode: gRPC ({})", cfg.grpc_endpoint);
                grpc::run(&cfg.grpc_endpoint, &cfg.program_id, move |event| {
                    let _ = tx.send(event);
                })
                .await?;
            }
            #[cfg(not(feature = "grpc"))]
            {
                eprintln!("gRPC mode requires the 'grpc' feature. Build with: cargo build --features grpc");
                std::process::exit(1);
            }
        }
    }

    Ok(())
}
