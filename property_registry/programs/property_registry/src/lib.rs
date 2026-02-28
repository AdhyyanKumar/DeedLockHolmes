use anchor_lang::prelude::*;

declare_id!("5GGuCnwt8Lk3c9ZJMKLjQYAuD5wwihP73RKNuEFmTB7G");

pub const MAX_ADDRESS_LEN: usize = 200;
pub const MAX_OWNER_LEN: usize = 100;
pub const DEED_HASH_LEN: usize = 64;

#[program]
pub mod property_registry {
    use super::*;

    pub fn register_property(
        ctx: Context<RegisterProperty>,
        property_address: String,
        owner_name: String,
        deed_hash: String,
        gemini_confidence: u8,
        fraud_risk: u8,
    ) -> Result<()> {
        require!(
            property_address.len() <= MAX_ADDRESS_LEN,
            PropertyError::AddressTooLong
        );
        require!(
            owner_name.len() <= MAX_OWNER_LEN,
            PropertyError::OwnerNameTooLong
        );
        require!(deed_hash.len() == DEED_HASH_LEN, PropertyError::InvalidDeedHash);
        require!(gemini_confidence <= 100, PropertyError::InvalidConfidence);
        require!(fraud_risk <= 100, PropertyError::InvalidFraudRisk);

        let property = &mut ctx.accounts.property;
        property.authority = ctx.accounts.authority.key();
        property.property_address = property_address;
        property.owner_name = owner_name;
        property.deed_hash = deed_hash;
        property.gemini_confidence = gemini_confidence;
        property.fraud_risk = fraud_risk;
        property.registered_at = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(
    property_address: String,
    owner_name: String,
    deed_hash: String,
    gemini_confidence: u8,
    fraud_risk: u8
)]
pub struct RegisterProperty<'info> {
    #[account(
        init,
        payer = authority,
        space = Property::INIT_SPACE,
        seeds = [b"property", authority.key().as_ref(), deed_hash.as_bytes()],
        bump
    )]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Property {
    pub authority: Pubkey,
    pub property_address: String,
    pub owner_name: String,
    pub deed_hash: String,
    pub gemini_confidence: u8,
    pub fraud_risk: u8,
    pub registered_at: i64,
}

impl Property {
    pub const INIT_SPACE: usize = 8  // discriminator
        + 32 // authority
        + 4 + MAX_ADDRESS_LEN
        + 4 + MAX_OWNER_LEN
        + 4 + DEED_HASH_LEN
        + 1 // gemini_confidence
        + 1 // fraud_risk
        + 8; // registered_at
}

#[error_code]
pub enum PropertyError {
    #[msg("Deed hash must be exactly 64 hex characters.")]
    InvalidDeedHash,
    #[msg("Gemini confidence must be between 0 and 100.")]
    InvalidConfidence,
    #[msg("Fraud risk must be between 0 and 100.")]
    InvalidFraudRisk,
    #[msg("Property address exceeds maximum length.")]
    AddressTooLong,
    #[msg("Owner name exceeds maximum length.")]
    OwnerNameTooLong,
}
