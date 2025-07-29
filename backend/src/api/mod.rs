use std::str::FromStr;

use actix_web::{HttpResponse, Responder, get, post, web};
use alloy::primitives::Address;
use tracing::info;

use crate::{
    config::CONFIG,
    core::vault::YielderaVault,
    state::AppState,
    types::{AdminAssociateVaultTokensRequest, ApiErrorResponse, VaultDetails},
};

#[utoipa::path(
        responses(
            (status = 200, description = "Home page", body = String),
        )
    )]
#[get("/")]
async fn get_index_service() -> impl Responder {
    HttpResponse::Ok().body("UP")
}

#[utoipa::path(
    responses(
        (status = 200, description = "Health check", body = String),
    )
)]
#[get("/health")]
async fn get_health_service() -> impl Responder {
    HttpResponse::Ok().body("ok")
}

#[utoipa::path(responses(
    (status = 200, description = "Get all vaults", body = Vec<VaultDetails>),
))]
#[get("/api/v1/vaults")]
async fn handle_get_all_vaults(app_state: web::Data<AppState>) -> impl Responder {
    let all_vaults = app_state
        .all_vaults
        .iter()
        .map(|entry| entry.value().clone())
        .collect::<Vec<VaultDetails>>();

    HttpResponse::Ok().json(all_vaults)
}

#[utoipa::path(
    request_body = AdminAssociateVaultTokensRequest,
    responses(
        (status = 200, description = "Associate vault tokens", body = bool),
        (status = 401, description = "Unauthorized", body = ApiErrorResponse),
        (status = 500, description = "Internal server error", body = ApiErrorResponse),
    )
)]
#[post("/api/v1/admin/vaults/associate-tokens")]
async fn handle_admin_associate_vault_tokens(
    app_state: web::Data<AppState>,
    body: web::Json<AdminAssociateVaultTokensRequest>,
) -> impl Responder {
    let password = body.password.clone();

    let admin_password = CONFIG.admin_password.clone();

    if password != admin_password {
        return HttpResponse::Unauthorized().json(ApiErrorResponse {
            message: "Unauthorized".to_string(),
            error: "Wrong admin password".to_string(),
        });
    }

    let all_vaults = app_state.all_vaults.clone();

    for (address, vault_details) in all_vaults {
        let vault_address = match Address::from_str(address.as_str()) {
            Ok(address) => address,
            Err(e) => {
                return HttpResponse::InternalServerError().json(ApiErrorResponse {
                    message: format!("Failed to parse vault address: {:?}", address),
                    error: e.to_string(),
                });
            }
        };

        if !vault_details.is_vault_tokens_associated {
            let vault_contract = YielderaVault::new(vault_address, &app_state.evm_provider);

            let associate_tx = match vault_contract.associateVaultTokens().send().await {
                Ok(tx) => tx,
                Err(e) => {
                    return HttpResponse::InternalServerError().json(ApiErrorResponse {
                        message: format!(
                            "Failed to simulate associate vault tokens for : {:?}",
                            address
                        ),
                        error: e.to_string(),
                    });
                }
            };

            let associate_tx_receipt = match associate_tx.get_receipt().await {
                Ok(receipt) => receipt,
                Err(e) => {
                    return HttpResponse::InternalServerError().json(ApiErrorResponse {
                        message: format!(
                            "Failed to get associate vault tokens receipt for : {:?}",
                            address
                        ),
                        error: e.to_string(),
                    });
                }
            };

            if !associate_tx_receipt.status() {
                return HttpResponse::InternalServerError().json(ApiErrorResponse {
                    message: format!(
                        "Failed to associate vault tokens for : {:?}. Status retunned false",
                        address
                    ),
                    error: format!(
                        "Associate vault tokens transaction failed with receipt: {:?}",
                        associate_tx_receipt
                    ),
                });
            }

            let mut new_vault_details = vault_details;
            new_vault_details.is_vault_tokens_associated = true;

            // update the vault details in the app state
            app_state
                .all_vaults
                .insert(address.to_string(), new_vault_details);

            info!(
                "Associated vault tokens Successfully for vault: {:?}",
                address
            );
        }
    }

    HttpResponse::Ok().body("true")
}
