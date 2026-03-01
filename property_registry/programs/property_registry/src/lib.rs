use anchor_lang::prelude::*;

declare_id!("5GGuCnwt8Lk3c9ZJMKLjQYAuD5wwihP73RKNuEFmTB7G");

pub const MAX_PROPERTY_ID_LEN: usize = 100;
pub const MAX_ADDRESS_LEN: usize = 500;
pub const MAX_OWNER_ID_LEN: usize = 100;
pub const MAX_OWNER_NAME_LEN: usize = 200;
pub const MAX_DEED_HASH_LEN: usize = 256;
pub const MAX_PREVIOUS_OWNER_LEN: usize = 200;

#[program]
pub mod property_registry {
    use super::*;

    pub fn register_property(
        ctx: Context<RegisterProperty>,
        property_id: String,
        address: String,
        owner_id: String,
        owner_name: String,
        deed_hash: String,
        sale_price: u64,
    ) -> Result<()> {
        require!(property_id.len() <= MAX_PROPERTY_ID_LEN, PropertyError::PropertyIdTooLong);
        require!(address.len() <= MAX_ADDRESS_LEN, PropertyError::AddressTooLong);
        require!(owner_id.len() <= MAX_OWNER_ID_LEN, PropertyError::OwnerIdTooLong);
        require!(
            owner_name.len() <= MAX_OWNER_NAME_LEN,
            PropertyError::OwnerNameTooLong
        );
        require!(deed_hash.len() <= MAX_DEED_HASH_LEN, PropertyError::DeedHashTooLong);
        require!(sale_price > 0, PropertyError::InvalidSalePrice);

        let property = &mut ctx.accounts.property;
        property.authority = ctx.accounts.authority.key();
        property.property_id = property_id;
        property.address = address;
        property.owner_id = owner_id;
        property.owner_name = owner_name;
        property.deed_hash = deed_hash;
        property.timestamp = Clock::get()?.unix_timestamp;
        property.sale_price = sale_price;
        property.previous_owner = String::new();
        property.is_active = true;

        Ok(())
    }

    pub fn transfer_property(
        ctx: Context<TransferProperty>,
        new_owner_id: String,
        new_owner_name: String,
        new_deed_hash: String,
        new_sale_price: u64,
    ) -> Result<()> {
        require!(
            new_owner_id.len() <= MAX_OWNER_ID_LEN,
            PropertyError::OwnerIdTooLong
        );
        require!(
            new_owner_name.len() <= MAX_OWNER_NAME_LEN,
            PropertyError::OwnerNameTooLong
        );
        require!(
            new_deed_hash.len() <= MAX_DEED_HASH_LEN,
            PropertyError::DeedHashTooLong
        );
        require!(new_sale_price > 0, PropertyError::InvalidSalePrice);

        let property = &mut ctx.accounts.property;
        property.previous_owner = property.owner_name.clone();
        property.owner_id = new_owner_id;
        property.owner_name = new_owner_name;
        property.deed_hash = new_deed_hash;
        property.sale_price = new_sale_price;
        property.timestamp = Clock::get()?.unix_timestamp;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(
    property_id: String,
    address: String,
    owner_id: String,
    owner_name: String,
    deed_hash: String,
    sale_price: u64
)]
pub struct RegisterProperty<'info> {
    #[account(
        init,
        payer = authority,
        space = Property::INIT_SPACE,
        seeds = [b"property", property_id.as_bytes()],
        bump
    )]
    pub property: Account<'info, Property>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferProperty<'info> {
    #[account(
        mut,
        seeds = [b"property", property.property_id.as_bytes()],
        bump,
        has_one = authority
    )]
    pub property: Account<'info, Property>,

    pub authority: Signer<'info>,
}

#[account]
pub struct Property {
    pub authority: Pubkey,
    pub property_id: String,
    pub address: String,
    pub owner_id: String,
    pub owner_name: String,
    pub deed_hash: String,
    pub timestamp: i64,
    pub sale_price: u64,
    pub previous_owner: String,
    pub is_active: bool,
}

impl Property {
    pub const INIT_SPACE: usize = 8  // discriminator
        + 32 // authority
        + 4 + MAX_PROPERTY_ID_LEN
        + 4 + MAX_ADDRESS_LEN
        + 4 + MAX_OWNER_ID_LEN
        + 4 + MAX_OWNER_NAME_LEN
        + 4 + MAX_DEED_HASH_LEN
        + 8 // timestamp
        + 8 // sale_price
        + 4 + MAX_PREVIOUS_OWNER_LEN
        + 1; // is_active
}

#[error_code]
pub enum PropertyError {
    #[msg("Property ID exceeds maximum length.")]
    PropertyIdTooLong,
    #[msg("Property address exceeds maximum length.")]
    AddressTooLong,
    #[msg("Owner ID exceeds maximum length.")]
    OwnerIdTooLong,
    #[msg("Owner name exceeds maximum length.")]
    OwnerNameTooLong,
    #[msg("Deed hash exceeds maximum length.")]
    DeedHashTooLong,
    #[msg("Sale price must be greater than zero.")]
    InvalidSalePrice,
}
