use color_eyre::eyre::{Context, Result};
use lettre::{Message, SmtpTransport, Transport, transport::smtp::authentication::Credentials};
use tracing::info;

use crate::config::CONFIG;

pub async fn init_mailer() -> Result<SmtpTransport> {
    let mail_credentials = Credentials::new(
        CONFIG.mailer_username.clone(),
        CONFIG.mailer_password.clone(),
    );

    let mailer = SmtpTransport::relay("smtp.gmail.com")
        .context("Failed to create SMTP transport")?
        .credentials(mail_credentials)
        .build();

    Ok(mailer)
}

pub async fn send_email_notification(
    subject: &str,
    body: String,
    mailer: &SmtpTransport,
) -> Result<()> {
    let email = Message::builder()
        .from(CONFIG.mailer_username.parse()?)
        .to(CONFIG.admin_email.parse()?)
        .subject(subject.to_string())
        .body(body)?;

    // Send the email using the configured SMTP server
    mailer.send(&email)?;

    info!("Email '{}' sent successfully!", subject);
    Ok(())
}
