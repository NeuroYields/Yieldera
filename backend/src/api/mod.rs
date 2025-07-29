use actix_web::{HttpResponse, Responder, get, post, web};

use crate::{
    config::CONFIG,
    state::AppState,
    types::{AdminAssociateVaultTokensRequest, VaultDetails},
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
    )
)]
#[post("/api/v1/admin/vault/associate-tokens")]
async fn handle_admin_associate_vault_tokens(
    app_state: web::Data<AppState>,
    body: web::Json<AdminAssociateVaultTokensRequest>,
) -> impl Responder {
    HttpResponse::Ok().body("true")
}
