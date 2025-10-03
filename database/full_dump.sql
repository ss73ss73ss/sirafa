--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (63f4182)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP POLICY IF EXISTS dev_themes_policy ON public.dev_themes;
DROP POLICY IF EXISTS dev_pages_policy ON public.dev_pages;
DROP POLICY IF EXISTS dev_feature_flags_policy ON public.dev_feature_flags;
DROP POLICY IF EXISTS dev_components_policy ON public.dev_components;
DROP POLICY IF EXISTS dev_blocks_policy ON public.dev_blocks;
DROP POLICY IF EXISTS dev_audit_logs_policy ON public.dev_audit_logs;
ALTER TABLE IF EXISTS ONLY public.voice_rate_limits DROP CONSTRAINT IF EXISTS voice_rate_limits_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.verification_requests DROP CONSTRAINT IF EXISTS verification_requests_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_referred_by_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_country_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_city_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_rewards DROP CONSTRAINT IF EXISTS user_rewards_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_rewards DROP CONSTRAINT IF EXISTS user_rewards_reward_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_receive_settings DROP CONSTRAINT IF EXISTS user_receive_settings_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_receive_settings DROP CONSTRAINT IF EXISTS user_receive_settings_country_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_points DROP CONSTRAINT IF EXISTS user_points_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_notifications DROP CONSTRAINT IF EXISTS user_notifications_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_badges DROP CONSTRAINT IF EXISTS user_badges_badge_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.user_2fa DROP CONSTRAINT IF EXISTS user_2fa_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.upgrade_requests DROP CONSTRAINT IF EXISTS upgrade_requests_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.upgrade_requests DROP CONSTRAINT IF EXISTS upgrade_requests_decided_by_fkey;
ALTER TABLE IF EXISTS ONLY public.upgrade_requests DROP CONSTRAINT IF EXISTS upgrade_requests_country_id_fkey;
ALTER TABLE IF EXISTS ONLY public.upgrade_requests DROP CONSTRAINT IF EXISTS upgrade_requests_city_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transfers DROP CONSTRAINT IF EXISTS transfers_sender_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.transfers DROP CONSTRAINT IF EXISTS transfers_receiver_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.transaction_logs DROP CONSTRAINT IF EXISTS transaction_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transaction_logs DROP CONSTRAINT IF EXISTS transaction_logs_transfer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transaction_logs DROP CONSTRAINT IF EXISTS transaction_logs_market_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transaction_logs DROP CONSTRAINT IF EXISTS transaction_logs_international_transfer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transaction_logs DROP CONSTRAINT IF EXISTS transaction_logs_city_transfer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transaction_logs DROP CONSTRAINT IF EXISTS transaction_logs_agent_transfer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.system_commission_settings DROP CONSTRAINT IF EXISTS system_commission_settings_updated_by_fkey;
ALTER TABLE IF EXISTS ONLY public.referral_rewards DROP CONSTRAINT IF EXISTS referral_rewards_referrer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.referral_rewards DROP CONSTRAINT IF EXISTS referral_rewards_referred_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.referral_balances DROP CONSTRAINT IF EXISTS referral_balances_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.receipt_audit_log DROP CONSTRAINT IF EXISTS receipt_audit_log_receipt_id_fkey;
ALTER TABLE IF EXISTS ONLY public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.private_messages DROP CONSTRAINT IF EXISTS private_messages_sender_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.private_messages DROP CONSTRAINT IF EXISTS private_messages_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.private_messages DROP CONSTRAINT IF EXISTS private_messages_original_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.private_messages DROP CONSTRAINT IF EXISTS private_messages_chat_id_fkey;
ALTER TABLE IF EXISTS ONLY public.private_message_reads DROP CONSTRAINT IF EXISTS private_message_reads_message_id_fkey;
ALTER TABLE IF EXISTS ONLY public.private_chats DROP CONSTRAINT IF EXISTS private_chats_user2_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.private_chats DROP CONSTRAINT IF EXISTS private_chats_user2_id_fkey;
ALTER TABLE IF EXISTS ONLY public.private_chats DROP CONSTRAINT IF EXISTS private_chats_user1_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.private_chats DROP CONSTRAINT IF EXISTS private_chats_user1_id_fkey;
ALTER TABLE IF EXISTS ONLY public.points_history DROP CONSTRAINT IF EXISTS points_history_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_requests DROP CONSTRAINT IF EXISTS password_reset_requests_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.page_restrictions DROP CONSTRAINT IF EXISTS page_restrictions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.page_restrictions DROP CONSTRAINT IF EXISTS page_restrictions_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.office_country_commissions DROP CONSTRAINT IF EXISTS office_country_commissions_office_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.office_commissions DROP CONSTRAINT IF EXISTS office_commissions_office_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.message_voices DROP CONSTRAINT IF EXISTS message_voices_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_voices DROP CONSTRAINT IF EXISTS message_voices_room_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_voices DROP CONSTRAINT IF EXISTS message_voices_private_room_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_voices DROP CONSTRAINT IF EXISTS message_voices_private_message_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_voices DROP CONSTRAINT IF EXISTS message_voices_message_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_likes DROP CONSTRAINT IF EXISTS message_likes_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.message_likes DROP CONSTRAINT IF EXISTS message_likes_message_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_transactions DROP CONSTRAINT IF EXISTS market_transactions_buyer_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.market_offers DROP CONSTRAINT IF EXISTS market_offers_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_messages DROP CONSTRAINT IF EXISTS market_messages_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_messages DROP CONSTRAINT IF EXISTS market_messages_offer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_messages DROP CONSTRAINT IF EXISTS market_messages_deal_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_messages DROP CONSTRAINT IF EXISTS market_messages_channel_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_messages DROP CONSTRAINT IF EXISTS market_messages_bid_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_deals DROP CONSTRAINT IF EXISTS market_deals_seller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_deals DROP CONSTRAINT IF EXISTS market_deals_offer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_deals DROP CONSTRAINT IF EXISTS market_deals_buyer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_deals DROP CONSTRAINT IF EXISTS market_deals_bid_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_bids DROP CONSTRAINT IF EXISTS market_bids_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.market_bids DROP CONSTRAINT IF EXISTS market_bids_offer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.international_transfers DROP CONSTRAINT IF EXISTS international_transfers_receiving_office_id_fkey;
ALTER TABLE IF EXISTS ONLY public.international_transfers_new DROP CONSTRAINT IF EXISTS international_transfers_new_sender_agent_id_fkey;
ALTER TABLE IF EXISTS ONLY public.international_transfers_new DROP CONSTRAINT IF EXISTS international_transfers_new_receiver_office_id_fkey;
ALTER TABLE IF EXISTS ONLY public.international_transfers DROP CONSTRAINT IF EXISTS international_transfers_agent_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hidden_transfers DROP CONSTRAINT IF EXISTS hidden_transfers_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hidden_transfers DROP CONSTRAINT IF EXISTS hidden_transfers_transfer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.group_messages DROP CONSTRAINT IF EXISTS group_messages_sender_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.group_messages DROP CONSTRAINT IF EXISTS group_messages_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.group_messages DROP CONSTRAINT IF EXISTS group_messages_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.group_message_reads DROP CONSTRAINT IF EXISTS group_message_reads_message_id_fkey;
ALTER TABLE IF EXISTS ONLY public.group_members DROP CONSTRAINT IF EXISTS group_members_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.group_members DROP CONSTRAINT IF EXISTS group_members_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.group_members DROP CONSTRAINT IF EXISTS group_members_group_id_fkey;
ALTER TABLE IF EXISTS ONLY public.group_members DROP CONSTRAINT IF EXISTS group_members_banned_by_fkey;
ALTER TABLE IF EXISTS ONLY public.group_chats DROP CONSTRAINT IF EXISTS group_chats_creator_id_fkey;
ALTER TABLE IF EXISTS ONLY public.export_jobs DROP CONSTRAINT IF EXISTS export_jobs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.dev_blocks DROP CONSTRAINT IF EXISTS dev_blocks_page_id_fkey;
ALTER TABLE IF EXISTS ONLY public.commission_logs DROP CONSTRAINT IF EXISTS commission_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.city_transfers DROP CONSTRAINT IF EXISTS city_transfers_sender_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.city_transfers DROP CONSTRAINT IF EXISTS city_transfers_receiver_office_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.city_transfer_commissions DROP CONSTRAINT IF EXISTS city_transfer_commissions_agent_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cities DROP CONSTRAINT IF EXISTS cities_country_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_room_id_fkey;
ALTER TABLE IF EXISTS ONLY public.chat_message_reads DROP CONSTRAINT IF EXISTS chat_message_reads_message_id_fkey;
ALTER TABLE IF EXISTS ONLY public.balances DROP CONSTRAINT IF EXISTS balances_user_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_actor_id_fkey;
ALTER TABLE IF EXISTS ONLY public.agent_transfers DROP CONSTRAINT IF EXISTS agent_transfers_sender_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.agent_transfers DROP CONSTRAINT IF EXISTS agent_transfers_destination_agent_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.agent_transfers DROP CONSTRAINT IF EXISTS agent_transfers_agent_id_users_id_fk;
ALTER TABLE IF EXISTS ONLY public.agent_offices DROP CONSTRAINT IF EXISTS agent_offices_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.agent_offices DROP CONSTRAINT IF EXISTS agent_offices_country_code_fkey;
ALTER TABLE IF EXISTS ONLY public.agent_offices DROP CONSTRAINT IF EXISTS agent_offices_agent_id_fkey;
ALTER TABLE IF EXISTS ONLY public.admin_messages DROP CONSTRAINT IF EXISTS admin_messages_user_id_fkey;
DROP INDEX IF EXISTS public.signing_keys_kid_idx;
DROP INDEX IF EXISTS public.signing_keys_active_idx;
DROP INDEX IF EXISTS public.receipts_txn_id_idx;
DROP INDEX IF EXISTS public.receipts_revoked_idx;
DROP INDEX IF EXISTS public.receipts_created_at_idx;
DROP INDEX IF EXISTS public.receipt_audit_timestamp_idx;
DROP INDEX IF EXISTS public.receipt_audit_receipt_id_idx;
DROP INDEX IF EXISTS public.idx_transaction_logs_user_ts;
DROP INDEX IF EXISTS public.idx_transaction_logs_type;
DROP INDEX IF EXISTS public.idx_transaction_logs_status;
DROP INDEX IF EXISTS public.idx_transaction_logs_currency;
DROP INDEX IF EXISTS public.idx_page_restrictions_user_id;
DROP INDEX IF EXISTS public.idx_page_restrictions_page_key;
DROP INDEX IF EXISTS public.idx_page_restrictions_account_number;
DROP INDEX IF EXISTS public.idx_message_voices_transcript;
DROP INDEX IF EXISTS public.idx_message_voices_sender;
DROP INDEX IF EXISTS public.idx_message_voices_room;
DROP INDEX IF EXISTS public.idx_message_voices_private_room;
DROP INDEX IF EXISTS public.idx_export_jobs_user;
DROP INDEX IF EXISTS public.idx_export_jobs_status;
DROP INDEX IF EXISTS public.idx_exchange_rates_pair;
DROP INDEX IF EXISTS public.idx_cities_country;
DROP INDEX IF EXISTS public.idx_audit_logs_entity;
DROP INDEX IF EXISTS public.idx_audit_logs_created_at;
DROP INDEX IF EXISTS public.idx_audit_logs_actor_id;
ALTER TABLE IF EXISTS ONLY public.voice_settings DROP CONSTRAINT IF EXISTS voice_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.voice_rate_limits DROP CONSTRAINT IF EXISTS voice_rate_limits_pkey;
ALTER TABLE IF EXISTS ONLY public.verification_requests DROP CONSTRAINT IF EXISTS verification_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_referral_code_key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_account_number_key;
ALTER TABLE IF EXISTS ONLY public.user_settings DROP CONSTRAINT IF EXISTS user_settings_user_id_key;
ALTER TABLE IF EXISTS ONLY public.user_settings DROP CONSTRAINT IF EXISTS user_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.user_rewards DROP CONSTRAINT IF EXISTS user_rewards_pkey;
ALTER TABLE IF EXISTS ONLY public.user_receive_settings DROP CONSTRAINT IF EXISTS user_receive_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.user_points DROP CONSTRAINT IF EXISTS user_points_user_id_key;
ALTER TABLE IF EXISTS ONLY public.user_points DROP CONSTRAINT IF EXISTS user_points_pkey;
ALTER TABLE IF EXISTS ONLY public.user_notifications DROP CONSTRAINT IF EXISTS user_notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.user_badges DROP CONSTRAINT IF EXISTS user_badges_user_id_badge_type_id_key;
ALTER TABLE IF EXISTS ONLY public.user_badges DROP CONSTRAINT IF EXISTS user_badges_pkey;
ALTER TABLE IF EXISTS ONLY public.user_2fa DROP CONSTRAINT IF EXISTS user_2fa_user_id_key;
ALTER TABLE IF EXISTS ONLY public.user_2fa DROP CONSTRAINT IF EXISTS user_2fa_pkey;
ALTER TABLE IF EXISTS ONLY public.upgrade_requests DROP CONSTRAINT IF EXISTS upgrade_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.private_chats DROP CONSTRAINT IF EXISTS unique_user_pairs;
ALTER TABLE IF EXISTS ONLY public.system_commission_settings DROP CONSTRAINT IF EXISTS unique_commission_per_currency;
ALTER TABLE IF EXISTS ONLY public.transfers DROP CONSTRAINT IF EXISTS transfers_reference_number_key;
ALTER TABLE IF EXISTS ONLY public.transfers DROP CONSTRAINT IF EXISTS transfers_pkey;
ALTER TABLE IF EXISTS ONLY public.transactions DROP CONSTRAINT IF EXISTS transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.transaction_logs DROP CONSTRAINT IF EXISTS transaction_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.system_settings DROP CONSTRAINT IF EXISTS system_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.system_commission_settings DROP CONSTRAINT IF EXISTS system_commission_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.system_commission_rates DROP CONSTRAINT IF EXISTS system_commission_rates_pkey;
ALTER TABLE IF EXISTS ONLY public.signing_keys DROP CONSTRAINT IF EXISTS signing_keys_pkey;
ALTER TABLE IF EXISTS ONLY public.signing_keys DROP CONSTRAINT IF EXISTS signing_keys_kid_key;
ALTER TABLE IF EXISTS ONLY public.security_logs DROP CONSTRAINT IF EXISTS security_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.rewards DROP CONSTRAINT IF EXISTS rewards_pkey;
ALTER TABLE IF EXISTS ONLY public.reward_settings DROP CONSTRAINT IF EXISTS reward_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.referral_rewards DROP CONSTRAINT IF EXISTS referral_rewards_tx_id_key;
ALTER TABLE IF EXISTS ONLY public.referral_rewards DROP CONSTRAINT IF EXISTS referral_rewards_pkey;
ALTER TABLE IF EXISTS ONLY public.referral_balances DROP CONSTRAINT IF EXISTS referral_balances_user_id_currency_key;
ALTER TABLE IF EXISTS ONLY public.referral_balances DROP CONSTRAINT IF EXISTS referral_balances_pkey;
ALTER TABLE IF EXISTS ONLY public.receipts DROP CONSTRAINT IF EXISTS receipts_pkey;
ALTER TABLE IF EXISTS ONLY public.receipt_settings DROP CONSTRAINT IF EXISTS receipt_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.receipt_settings DROP CONSTRAINT IF EXISTS receipt_settings_key_key;
ALTER TABLE IF EXISTS ONLY public.receipt_audit_log DROP CONSTRAINT IF EXISTS receipt_audit_log_pkey;
ALTER TABLE IF EXISTS ONLY public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_endpoint_key;
ALTER TABLE IF EXISTS ONLY public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.private_messages DROP CONSTRAINT IF EXISTS private_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.private_message_reads DROP CONSTRAINT IF EXISTS private_message_reads_pkey;
ALTER TABLE IF EXISTS ONLY public.private_chats DROP CONSTRAINT IF EXISTS private_chats_pkey;
ALTER TABLE IF EXISTS ONLY public.points_history DROP CONSTRAINT IF EXISTS points_history_pkey;
ALTER TABLE IF EXISTS ONLY public.password_reset_requests DROP CONSTRAINT IF EXISTS password_reset_requests_token_key;
ALTER TABLE IF EXISTS ONLY public.password_reset_requests DROP CONSTRAINT IF EXISTS password_reset_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.page_restrictions DROP CONSTRAINT IF EXISTS page_restrictions_user_id_page_key_key;
ALTER TABLE IF EXISTS ONLY public.page_restrictions DROP CONSTRAINT IF EXISTS page_restrictions_pkey;
ALTER TABLE IF EXISTS ONLY public.office_country_commissions DROP CONSTRAINT IF EXISTS office_country_commissions_pkey;
ALTER TABLE IF EXISTS ONLY public.office_country_commissions DROP CONSTRAINT IF EXISTS office_country_commissions_office_id_country_unique;
ALTER TABLE IF EXISTS ONLY public.office_commissions DROP CONSTRAINT IF EXISTS office_commissions_pkey;
ALTER TABLE IF EXISTS ONLY public.office_commissions DROP CONSTRAINT IF EXISTS office_commissions_office_id_city_unique;
ALTER TABLE IF EXISTS ONLY public.message_voices DROP CONSTRAINT IF EXISTS message_voices_pkey;
ALTER TABLE IF EXISTS ONLY public.message_likes DROP CONSTRAINT IF EXISTS message_likes_pkey;
ALTER TABLE IF EXISTS ONLY public.message_likes DROP CONSTRAINT IF EXISTS message_likes_message_id_user_id_key;
ALTER TABLE IF EXISTS ONLY public.market_transactions DROP CONSTRAINT IF EXISTS market_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.market_offers DROP CONSTRAINT IF EXISTS market_offers_pkey;
ALTER TABLE IF EXISTS ONLY public.market_messages DROP CONSTRAINT IF EXISTS market_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.market_deals DROP CONSTRAINT IF EXISTS market_deals_pkey;
ALTER TABLE IF EXISTS ONLY public.market_channels DROP CONSTRAINT IF EXISTS market_channels_pkey;
ALTER TABLE IF EXISTS ONLY public.market_bids DROP CONSTRAINT IF EXISTS market_bids_pkey;
ALTER TABLE IF EXISTS ONLY public.international_transfers DROP CONSTRAINT IF EXISTS international_transfers_transfer_code_key;
ALTER TABLE IF EXISTS ONLY public.international_transfers DROP CONSTRAINT IF EXISTS international_transfers_pkey;
ALTER TABLE IF EXISTS ONLY public.international_transfers_new DROP CONSTRAINT IF EXISTS international_transfers_new_transfer_code_key;
ALTER TABLE IF EXISTS ONLY public.international_transfers_new DROP CONSTRAINT IF EXISTS international_transfers_new_pkey;
ALTER TABLE IF EXISTS ONLY public.internal_transfer_logs DROP CONSTRAINT IF EXISTS internal_transfer_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.hidden_transfers DROP CONSTRAINT IF EXISTS hidden_transfers_user_id_transfer_id_key;
ALTER TABLE IF EXISTS ONLY public.hidden_transfers DROP CONSTRAINT IF EXISTS hidden_transfers_pkey;
ALTER TABLE IF EXISTS ONLY public.group_messages DROP CONSTRAINT IF EXISTS group_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.group_message_reads DROP CONSTRAINT IF EXISTS group_message_reads_pkey;
ALTER TABLE IF EXISTS ONLY public.group_members DROP CONSTRAINT IF EXISTS group_members_pkey;
ALTER TABLE IF EXISTS ONLY public.group_members DROP CONSTRAINT IF EXISTS group_members_group_id_user_id_key;
ALTER TABLE IF EXISTS ONLY public.group_chats DROP CONSTRAINT IF EXISTS group_chats_pkey;
ALTER TABLE IF EXISTS ONLY public.export_jobs DROP CONSTRAINT IF EXISTS export_jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.exchange_rates DROP CONSTRAINT IF EXISTS exchange_rates_pkey;
ALTER TABLE IF EXISTS ONLY public.exchange_rates DROP CONSTRAINT IF EXISTS exchange_rates_from_currency_to_currency_fetched_at_key;
ALTER TABLE IF EXISTS ONLY public.dev_themes DROP CONSTRAINT IF EXISTS dev_themes_pkey;
ALTER TABLE IF EXISTS ONLY public.dev_themes DROP CONSTRAINT IF EXISTS dev_themes_name_key;
ALTER TABLE IF EXISTS ONLY public.dev_pages DROP CONSTRAINT IF EXISTS dev_pages_route_key;
ALTER TABLE IF EXISTS ONLY public.dev_pages DROP CONSTRAINT IF EXISTS dev_pages_pkey;
ALTER TABLE IF EXISTS ONLY public.dev_feature_flags DROP CONSTRAINT IF EXISTS dev_feature_flags_pkey;
ALTER TABLE IF EXISTS ONLY public.dev_components DROP CONSTRAINT IF EXISTS dev_components_pkey;
ALTER TABLE IF EXISTS ONLY public.dev_blocks DROP CONSTRAINT IF EXISTS dev_blocks_pkey;
ALTER TABLE IF EXISTS ONLY public.dev_audit_logs DROP CONSTRAINT IF EXISTS dev_audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.crypto_keys DROP CONSTRAINT IF EXISTS crypto_keys_pkey;
ALTER TABLE IF EXISTS ONLY public.crypto_keys DROP CONSTRAINT IF EXISTS crypto_keys_kid_key;
ALTER TABLE IF EXISTS ONLY public.countries DROP CONSTRAINT IF EXISTS countries_pkey;
ALTER TABLE IF EXISTS ONLY public.countries DROP CONSTRAINT IF EXISTS countries_code_key;
ALTER TABLE IF EXISTS ONLY public.commission_pool_transactions DROP CONSTRAINT IF EXISTS commission_pool_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.commission_logs DROP CONSTRAINT IF EXISTS commission_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.city_transfers DROP CONSTRAINT IF EXISTS city_transfers_pkey;
ALTER TABLE IF EXISTS ONLY public.city_transfers DROP CONSTRAINT IF EXISTS city_transfers_code_unique;
ALTER TABLE IF EXISTS ONLY public.city_transfer_commissions DROP CONSTRAINT IF EXISTS city_transfer_commissions_pkey;
ALTER TABLE IF EXISTS ONLY public.cities DROP CONSTRAINT IF EXISTS cities_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_message_reads DROP CONSTRAINT IF EXISTS chat_message_reads_pkey;
ALTER TABLE IF EXISTS ONLY public.balances DROP CONSTRAINT IF EXISTS balances_user_id_currency_unique;
ALTER TABLE IF EXISTS ONLY public.balances DROP CONSTRAINT IF EXISTS balances_pkey;
ALTER TABLE IF EXISTS ONLY public.badge_types DROP CONSTRAINT IF EXISTS badge_types_pkey;
ALTER TABLE IF EXISTS ONLY public.badge_types DROP CONSTRAINT IF EXISTS badge_types_name_key;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.agent_transfers DROP CONSTRAINT IF EXISTS agent_transfers_pkey;
ALTER TABLE IF EXISTS ONLY public.agent_offices DROP CONSTRAINT IF EXISTS agent_offices_pkey;
ALTER TABLE IF EXISTS ONLY public.agent_offices DROP CONSTRAINT IF EXISTS agent_offices_office_code_key;
ALTER TABLE IF EXISTS ONLY public.agent_commissions DROP CONSTRAINT IF EXISTS agent_commissions_pkey;
ALTER TABLE IF EXISTS ONLY public.agent_commissions DROP CONSTRAINT IF EXISTS agent_commissions_agent_id_currency_code_key;
ALTER TABLE IF EXISTS ONLY public.admin_transactions DROP CONSTRAINT IF EXISTS admin_transactions_ref_no_key;
ALTER TABLE IF EXISTS ONLY public.admin_transactions DROP CONSTRAINT IF EXISTS admin_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_settings DROP CONSTRAINT IF EXISTS admin_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_settings DROP CONSTRAINT IF EXISTS admin_settings_key_unique;
ALTER TABLE IF EXISTS ONLY public.admin_messages DROP CONSTRAINT IF EXISTS admin_messages_pkey;
ALTER TABLE IF EXISTS public.verification_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_rewards ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_receive_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_points ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_badges ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.user_2fa ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.upgrade_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.transfers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.transaction_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_commission_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.system_commission_rates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.signing_keys ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.rewards ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.reward_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.referral_rewards ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.referral_balances ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.receipt_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.receipt_audit_log ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.push_subscriptions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.private_messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.private_chats ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.points_history ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.password_reset_requests ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.page_restrictions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.office_country_commissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.office_commissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.message_likes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.market_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.market_offers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.market_messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.market_deals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.market_channels ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.market_bids ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.international_transfers_new ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.international_transfers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.internal_transfer_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.hidden_transfers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.group_messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.group_members ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.group_chats ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.exchange_rates ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.crypto_keys ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.countries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.commission_pool_transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.commission_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.city_transfers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.city_transfer_commissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cities ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.chat_rooms ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.chat_messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.balances ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.badge_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.audit_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.agent_transfers ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.agent_offices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.agent_commissions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admin_settings ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.admin_messages ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.voice_settings;
DROP TABLE IF EXISTS public.voice_rate_limits;
DROP SEQUENCE IF EXISTS public.verification_requests_id_seq;
DROP TABLE IF EXISTS public.verification_requests;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.user_settings_id_seq;
DROP TABLE IF EXISTS public.user_settings;
DROP SEQUENCE IF EXISTS public.user_rewards_id_seq;
DROP TABLE IF EXISTS public.user_rewards;
DROP SEQUENCE IF EXISTS public.user_receive_settings_id_seq;
DROP TABLE IF EXISTS public.user_receive_settings;
DROP SEQUENCE IF EXISTS public.user_points_id_seq;
DROP TABLE IF EXISTS public.user_points;
DROP SEQUENCE IF EXISTS public.user_notifications_id_seq;
DROP TABLE IF EXISTS public.user_notifications;
DROP SEQUENCE IF EXISTS public.user_badges_id_seq;
DROP TABLE IF EXISTS public.user_badges;
DROP SEQUENCE IF EXISTS public.user_2fa_id_seq;
DROP TABLE IF EXISTS public.user_2fa;
DROP SEQUENCE IF EXISTS public.upgrade_requests_id_seq;
DROP TABLE IF EXISTS public.upgrade_requests;
DROP SEQUENCE IF EXISTS public.transfers_id_seq;
DROP TABLE IF EXISTS public.transfers;
DROP SEQUENCE IF EXISTS public.transactions_id_seq;
DROP TABLE IF EXISTS public.transactions;
DROP SEQUENCE IF EXISTS public.transaction_logs_id_seq;
DROP TABLE IF EXISTS public.transaction_logs;
DROP TABLE IF EXISTS public.system_settings;
DROP SEQUENCE IF EXISTS public.system_commission_settings_id_seq;
DROP TABLE IF EXISTS public.system_commission_settings;
DROP SEQUENCE IF EXISTS public.system_commission_rates_id_seq;
DROP TABLE IF EXISTS public.system_commission_rates;
DROP SEQUENCE IF EXISTS public.signing_keys_id_seq;
DROP TABLE IF EXISTS public.signing_keys;
DROP TABLE IF EXISTS public.security_logs;
DROP SEQUENCE IF EXISTS public.rewards_id_seq;
DROP TABLE IF EXISTS public.rewards;
DROP SEQUENCE IF EXISTS public.reward_settings_id_seq;
DROP TABLE IF EXISTS public.reward_settings;
DROP SEQUENCE IF EXISTS public.referral_rewards_id_seq;
DROP TABLE IF EXISTS public.referral_rewards;
DROP SEQUENCE IF EXISTS public.referral_balances_id_seq;
DROP TABLE IF EXISTS public.referral_balances;
DROP TABLE IF EXISTS public.receipts;
DROP SEQUENCE IF EXISTS public.receipt_settings_id_seq;
DROP TABLE IF EXISTS public.receipt_settings;
DROP SEQUENCE IF EXISTS public.receipt_audit_log_id_seq;
DROP TABLE IF EXISTS public.receipt_audit_log;
DROP SEQUENCE IF EXISTS public.push_subscriptions_id_seq;
DROP TABLE IF EXISTS public.push_subscriptions;
DROP SEQUENCE IF EXISTS public.private_messages_id_seq;
DROP TABLE IF EXISTS public.private_messages;
DROP TABLE IF EXISTS public.private_message_reads;
DROP SEQUENCE IF EXISTS public.private_chats_id_seq;
DROP TABLE IF EXISTS public.private_chats;
DROP SEQUENCE IF EXISTS public.points_history_id_seq;
DROP TABLE IF EXISTS public.points_history;
DROP SEQUENCE IF EXISTS public.password_reset_requests_id_seq;
DROP TABLE IF EXISTS public.password_reset_requests;
DROP SEQUENCE IF EXISTS public.page_restrictions_id_seq;
DROP TABLE IF EXISTS public.page_restrictions;
DROP SEQUENCE IF EXISTS public.office_country_commissions_id_seq;
DROP TABLE IF EXISTS public.office_country_commissions;
DROP SEQUENCE IF EXISTS public.office_commissions_id_seq;
DROP TABLE IF EXISTS public.office_commissions;
DROP TABLE IF EXISTS public.message_voices;
DROP SEQUENCE IF EXISTS public.message_likes_id_seq;
DROP TABLE IF EXISTS public.message_likes;
DROP SEQUENCE IF EXISTS public.market_transactions_id_seq;
DROP TABLE IF EXISTS public.market_transactions;
DROP SEQUENCE IF EXISTS public.market_offers_id_seq;
DROP TABLE IF EXISTS public.market_offers;
DROP SEQUENCE IF EXISTS public.market_messages_id_seq;
DROP TABLE IF EXISTS public.market_messages;
DROP SEQUENCE IF EXISTS public.market_deals_id_seq;
DROP TABLE IF EXISTS public.market_deals;
DROP SEQUENCE IF EXISTS public.market_channels_id_seq;
DROP TABLE IF EXISTS public.market_channels;
DROP SEQUENCE IF EXISTS public.market_bids_id_seq;
DROP TABLE IF EXISTS public.market_bids;
DROP SEQUENCE IF EXISTS public.international_transfers_new_id_seq;
DROP TABLE IF EXISTS public.international_transfers_new;
DROP SEQUENCE IF EXISTS public.international_transfers_id_seq;
DROP TABLE IF EXISTS public.international_transfers;
DROP SEQUENCE IF EXISTS public.internal_transfer_logs_id_seq;
DROP TABLE IF EXISTS public.internal_transfer_logs;
DROP SEQUENCE IF EXISTS public.hidden_transfers_id_seq;
DROP TABLE IF EXISTS public.hidden_transfers;
DROP SEQUENCE IF EXISTS public.group_messages_id_seq;
DROP TABLE IF EXISTS public.group_messages;
DROP TABLE IF EXISTS public.group_message_reads;
DROP SEQUENCE IF EXISTS public.group_members_id_seq;
DROP TABLE IF EXISTS public.group_members;
DROP SEQUENCE IF EXISTS public.group_chats_id_seq;
DROP TABLE IF EXISTS public.group_chats;
DROP TABLE IF EXISTS public.export_jobs;
DROP SEQUENCE IF EXISTS public.exchange_rates_id_seq;
DROP TABLE IF EXISTS public.exchange_rates;
DROP TABLE IF EXISTS public.dev_themes;
DROP TABLE IF EXISTS public.dev_pages;
DROP TABLE IF EXISTS public.dev_feature_flags;
DROP TABLE IF EXISTS public.dev_components;
DROP TABLE IF EXISTS public.dev_blocks;
DROP TABLE IF EXISTS public.dev_audit_logs;
DROP SEQUENCE IF EXISTS public.crypto_keys_id_seq;
DROP TABLE IF EXISTS public.crypto_keys;
DROP SEQUENCE IF EXISTS public.countries_id_seq;
DROP TABLE IF EXISTS public.countries;
DROP SEQUENCE IF EXISTS public.commission_pool_transactions_id_seq;
DROP TABLE IF EXISTS public.commission_pool_transactions;
DROP SEQUENCE IF EXISTS public.commission_logs_id_seq;
DROP TABLE IF EXISTS public.commission_logs;
DROP SEQUENCE IF EXISTS public.city_transfers_id_seq;
DROP TABLE IF EXISTS public.city_transfers;
DROP SEQUENCE IF EXISTS public.city_transfer_commissions_id_seq;
DROP TABLE IF EXISTS public.city_transfer_commissions;
DROP SEQUENCE IF EXISTS public.cities_id_seq;
DROP TABLE IF EXISTS public.cities;
DROP SEQUENCE IF EXISTS public.chat_rooms_id_seq;
DROP TABLE IF EXISTS public.chat_rooms;
DROP SEQUENCE IF EXISTS public.chat_messages_id_seq;
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.chat_message_reads;
DROP SEQUENCE IF EXISTS public.balances_id_seq;
DROP TABLE IF EXISTS public.balances;
DROP SEQUENCE IF EXISTS public.badge_types_id_seq;
DROP TABLE IF EXISTS public.badge_types;
DROP SEQUENCE IF EXISTS public.audit_logs_id_seq;
DROP TABLE IF EXISTS public.audit_logs;
DROP SEQUENCE IF EXISTS public.agent_transfers_id_seq;
DROP TABLE IF EXISTS public.agent_transfers;
DROP SEQUENCE IF EXISTS public.agent_offices_id_seq;
DROP TABLE IF EXISTS public.agent_offices;
DROP SEQUENCE IF EXISTS public.agent_commissions_id_seq;
DROP TABLE IF EXISTS public.agent_commissions;
DROP TABLE IF EXISTS public.admin_transactions;
DROP SEQUENCE IF EXISTS public.admin_settings_id_seq;
DROP TABLE IF EXISTS public.admin_settings;
DROP SEQUENCE IF EXISTS public.admin_messages_id_seq;
DROP TABLE IF EXISTS public.admin_messages;
DROP FUNCTION IF EXISTS public.is_dev_studio_authorized(email_to_check text);
DROP FUNCTION IF EXISTS public.dev_studio_page_upsert(p_route text, p_title_ar text, p_layout text, p_status text, p_visibility text, p_allowed_roles text[], p_creator_email text);
DROP FUNCTION IF EXISTS public.dev_studio_flag_set(p_key text, p_enabled boolean, p_per_account jsonb, p_actor_email text);
--
-- Name: dev_studio_flag_set(text, boolean, jsonb, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dev_studio_flag_set(p_key text, p_enabled boolean, p_per_account jsonb DEFAULT '{}'::jsonb, p_actor_email text DEFAULT 'ss73ss73ss73@gmail.com'::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  -- التحقق من الصلاحية
  IF NOT is_dev_studio_authorized(p_actor_email) THEN
    RAISE EXCEPTION 'غير مصرح بالوصول إلى Dev Studio';
  END IF;

  -- إدراج أو تحديث العلم
  INSERT INTO dev_feature_flags (key, enabled, per_account)
  VALUES (p_key, p_enabled, p_per_account)
  ON CONFLICT (key) 
  DO UPDATE SET 
    enabled = EXCLUDED.enabled,
    per_account = EXCLUDED.per_account,
    updated_at = NOW();

  -- تسجيل في audit log
  INSERT INTO dev_audit_logs (actor_email, action, entity, entity_id, data)
  VALUES (p_actor_email, 'set', 'feature_flag', p_key, 
    jsonb_build_object('enabled', p_enabled, 'per_account', p_per_account));

  RETURN TRUE;
END;
$$;


--
-- Name: dev_studio_page_upsert(text, text, text, text, text, text[], text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.dev_studio_page_upsert(p_route text, p_title_ar text, p_layout text DEFAULT 'default'::text, p_status text DEFAULT 'draft'::text, p_visibility text DEFAULT 'public'::text, p_allowed_roles text[] DEFAULT '{}'::text[], p_creator_email text DEFAULT 'ss73ss73ss73@gmail.com'::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  page_id UUID;
BEGIN
  -- التحقق من الصلاحية
  IF NOT is_dev_studio_authorized(p_creator_email) THEN
    RAISE EXCEPTION 'غير مصرح بالوصول إلى Dev Studio';
  END IF;

  -- إدراج أو تحديث الصفحة
  INSERT INTO dev_pages (route, title_ar, layout, status, visibility, allowed_roles, created_by)
  VALUES (p_route, p_title_ar, p_layout, p_status, p_visibility, p_allowed_roles, p_creator_email)
  ON CONFLICT (route) 
  DO UPDATE SET 
    title_ar = EXCLUDED.title_ar,
    layout = EXCLUDED.layout,
    status = EXCLUDED.status,
    visibility = EXCLUDED.visibility,
    allowed_roles = EXCLUDED.allowed_roles,
    updated_at = NOW()
  RETURNING id INTO page_id;

  -- تسجيل في audit log
  INSERT INTO dev_audit_logs (actor_email, action, entity, entity_id, data)
  VALUES (p_creator_email, 'upsert', 'page', page_id::TEXT, 
    jsonb_build_object('route', p_route, 'title_ar', p_title_ar));

  RETURN page_id;
END;
$$;


--
-- Name: is_dev_studio_authorized(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_dev_studio_authorized(email_to_check text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN email_to_check = 'ss73ss73ss73@gmail.com';
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_messages (
    id integer NOT NULL,
    user_id integer,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: admin_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_messages_id_seq OWNED BY public.admin_messages.id;


--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.admin_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: admin_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.admin_settings_id_seq OWNED BY public.admin_settings.id;


--
-- Name: admin_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    ref_no character varying NOT NULL,
    type character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    executed_at timestamp without time zone,
    from_account_id character varying,
    to_account_id character varying,
    user_id integer NOT NULL,
    office_id integer,
    city_from character varying,
    city_to character varying,
    currency character varying NOT NULL,
    amount numeric(15,4) NOT NULL,
    rate numeric(10,6),
    fee_system numeric(15,4),
    fee_recipient numeric(15,4),
    net_amount numeric(15,4) NOT NULL,
    channel character varying DEFAULT 'web'::character varying NOT NULL,
    created_by integer NOT NULL,
    approved_by integer,
    kyc_level integer DEFAULT 1,
    risk_score integer DEFAULT 0,
    flags jsonb DEFAULT '{}'::jsonb,
    parent_txn_id character varying,
    external_provider character varying,
    external_ref character varying,
    notes text,
    meta jsonb DEFAULT '{}'::jsonb
);


--
-- Name: agent_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_commissions (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    currency_code text NOT NULL,
    type text NOT NULL,
    value text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT agent_commissions_type_check CHECK ((type = ANY (ARRAY['percentage'::text, 'fixed'::text])))
);


--
-- Name: agent_commissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_commissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_commissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_commissions_id_seq OWNED BY public.agent_commissions.id;


--
-- Name: agent_offices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_offices (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    country_code text NOT NULL,
    city text NOT NULL,
    office_code text NOT NULL,
    office_name text NOT NULL,
    contact_info text,
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    commission_rate numeric(5,2) DEFAULT 1.5,
    user_id integer
);


--
-- Name: agent_offices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_offices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_offices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_offices_id_seq OWNED BY public.agent_offices.id;


--
-- Name: agent_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agent_transfers (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer,
    agent_id integer NOT NULL,
    destination_agent_id integer,
    amount numeric NOT NULL,
    commission numeric NOT NULL,
    currency text NOT NULL,
    transfer_code text,
    note text,
    status text DEFAULT 'pending'::text NOT NULL,
    type text NOT NULL,
    country text,
    city text,
    recipient_name text NOT NULL,
    recipient_phone text,
    recipient_id text,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    amount_original numeric,
    commission_system numeric,
    commission_recipient numeric,
    amount_pending numeric,
    receiver_code text
);


--
-- Name: agent_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agent_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: agent_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agent_transfers_id_seq OWNED BY public.agent_transfers.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    actor_id integer,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id integer,
    data jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: badge_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badge_types (
    id integer NOT NULL,
    name text NOT NULL,
    name_ar text NOT NULL,
    description text NOT NULL,
    description_ar text NOT NULL,
    icon text NOT NULL,
    color text DEFAULT 'blue'::text NOT NULL,
    rarity text DEFAULT 'common'::text NOT NULL,
    points_required integer DEFAULT 0 NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    condition jsonb,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: badge_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.badge_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: badge_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.badge_types_id_seq OWNED BY public.badge_types.id;


--
-- Name: balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.balances (
    id integer NOT NULL,
    user_id integer NOT NULL,
    currency text NOT NULL,
    amount numeric DEFAULT '0'::numeric NOT NULL
);


--
-- Name: balances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.balances_id_seq OWNED BY public.balances.id;


--
-- Name: chat_message_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_message_reads (
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    read_at timestamp without time zone DEFAULT now()
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    room_id integer NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    is_edited boolean DEFAULT false,
    edited_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_by integer,
    deleted_at timestamp without time zone,
    file_url text,
    file_type text,
    voice_id text,
    voice_duration integer
);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_rooms (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: chat_rooms_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_rooms_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_rooms_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_rooms_id_seq OWNED BY public.chat_rooms.id;


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id integer NOT NULL,
    country_id integer NOT NULL,
    name_ar text NOT NULL,
    name_en text,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- Name: city_transfer_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city_transfer_commissions (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    origin_city text,
    destination_city text,
    min_amount text NOT NULL,
    max_amount text,
    commission text NOT NULL,
    currency_code text DEFAULT 'LYD'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    per_mille_rate numeric(5,3)
);


--
-- Name: city_transfer_commissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.city_transfer_commissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: city_transfer_commissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.city_transfer_commissions_id_seq OWNED BY public.city_transfer_commissions.id;


--
-- Name: city_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city_transfers (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_office_id integer NOT NULL,
    amount numeric NOT NULL,
    commission_for_receiver numeric NOT NULL,
    commission_for_system numeric NOT NULL,
    currency text DEFAULT 'LYD'::text NOT NULL,
    code text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    recipient_name text
);


--
-- Name: city_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.city_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: city_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.city_transfers_id_seq OWNED BY public.city_transfers.id;


--
-- Name: commission_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commission_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    user_name text NOT NULL,
    offer_type text NOT NULL,
    commission_amount numeric(12,2) NOT NULL,
    commission_currency text NOT NULL,
    source_id integer NOT NULL,
    source_type text DEFAULT 'market_offer'::text NOT NULL,
    action text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: commission_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commission_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commission_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commission_logs_id_seq OWNED BY public.commission_logs.id;


--
-- Name: commission_pool_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commission_pool_transactions (
    id integer NOT NULL,
    source_type text NOT NULL,
    source_id integer,
    source_name text,
    currency_code text NOT NULL,
    amount text NOT NULL,
    transaction_type text NOT NULL,
    related_transaction_id integer,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT commission_pool_transactions_source_type_check CHECK ((source_type = ANY (ARRAY['agent'::text, 'user'::text, 'system'::text]))),
    CONSTRAINT commission_pool_transactions_transaction_type_check CHECK ((transaction_type = ANY (ARRAY['credit'::text, 'withdrawal'::text])))
);


--
-- Name: commission_pool_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commission_pool_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commission_pool_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commission_pool_transactions_id_seq OWNED BY public.commission_pool_transactions.id;


--
-- Name: countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.countries (
    id integer NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    currency text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    phone_code character varying(10)
);


--
-- Name: countries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.countries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: countries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.countries_id_seq OWNED BY public.countries.id;


--
-- Name: crypto_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crypto_keys (
    id integer NOT NULL,
    key_type text NOT NULL,
    public_key text NOT NULL,
    encrypted_private_key text NOT NULL,
    kid text NOT NULL,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    expires_at timestamp without time zone
);


--
-- Name: crypto_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crypto_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: crypto_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crypto_keys_id_seq OWNED BY public.crypto_keys.id;


--
-- Name: dev_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dev_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actor_email text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: dev_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dev_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_id uuid NOT NULL,
    slot text NOT NULL,
    component_key text NOT NULL,
    props jsonb DEFAULT '{}'::jsonb,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: dev_components; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dev_components (
    key text NOT NULL,
    display_name text NOT NULL,
    schema jsonb NOT NULL,
    category text DEFAULT 'general'::text,
    is_core boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: dev_feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dev_feature_flags (
    key text NOT NULL,
    description text,
    enabled boolean DEFAULT false,
    per_account jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: dev_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dev_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    route text NOT NULL,
    title_ar text NOT NULL,
    layout text DEFAULT 'default'::text,
    status text DEFAULT 'draft'::text NOT NULL,
    visibility text DEFAULT 'public'::text,
    allowed_roles text[] DEFAULT '{}'::text[],
    created_by text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: dev_themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dev_themes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    tokens jsonb NOT NULL,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: exchange_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.exchange_rates (
    id integer NOT NULL,
    from_currency text NOT NULL,
    to_currency text NOT NULL,
    rate numeric(18,8) NOT NULL,
    fetched_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: exchange_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.exchange_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: exchange_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.exchange_rates_id_seq OWNED BY public.exchange_rates.id;


--
-- Name: export_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.export_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    params json NOT NULL,
    file_path text,
    download_url text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    error_message text
);


--
-- Name: group_chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_chats (
    id integer NOT NULL,
    name text NOT NULL,
    creator_id integer NOT NULL,
    is_private boolean DEFAULT false,
    description text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: group_chats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_chats_id_seq OWNED BY public.group_chats.id;


--
-- Name: group_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_members (
    id integer NOT NULL,
    group_id integer NOT NULL,
    user_id integer NOT NULL,
    role text DEFAULT 'member'::text,
    joined_at timestamp without time zone DEFAULT now(),
    muted_until timestamp without time zone,
    is_banned boolean DEFAULT false,
    banned_by integer,
    banned_at timestamp without time zone,
    ban_reason text
);


--
-- Name: group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_members_id_seq OWNED BY public.group_members.id;


--
-- Name: group_message_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_message_reads (
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    read_at timestamp without time zone DEFAULT now()
);


--
-- Name: group_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_messages (
    id integer NOT NULL,
    group_id integer NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    edited_at timestamp without time zone,
    is_edited boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    deleted_by integer,
    deleted_at timestamp without time zone,
    file_url text,
    file_type text,
    deleted_for_users integer[] DEFAULT '{}'::integer[]
);


--
-- Name: group_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.group_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: group_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.group_messages_id_seq OWNED BY public.group_messages.id;


--
-- Name: hidden_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hidden_transfers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    transfer_id integer NOT NULL,
    hidden_at timestamp without time zone DEFAULT now()
);


--
-- Name: hidden_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hidden_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hidden_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hidden_transfers_id_seq OWNED BY public.hidden_transfers.id;


--
-- Name: internal_transfer_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.internal_transfer_logs (
    id integer NOT NULL,
    transfer_id integer NOT NULL,
    sender_name text NOT NULL,
    sender_account_number text NOT NULL,
    receiver_name text NOT NULL,
    receiver_account_number text NOT NULL,
    amount text NOT NULL,
    commission text NOT NULL,
    currency text NOT NULL,
    note text,
    status text DEFAULT 'completed'::text NOT NULL,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT now(),
    reference_number text
);


--
-- Name: internal_transfer_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.internal_transfer_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: internal_transfer_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.internal_transfer_logs_id_seq OWNED BY public.internal_transfer_logs.id;


--
-- Name: international_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.international_transfers (
    id integer NOT NULL,
    agent_id integer NOT NULL,
    currency_code text NOT NULL,
    amount numeric(12,2) NOT NULL,
    origin_country text NOT NULL,
    destination_country text NOT NULL,
    receiving_office_id integer NOT NULL,
    sender_name text NOT NULL,
    sender_phone text,
    receiver_name text NOT NULL,
    receiver_phone text,
    receiver_code text,
    transfer_code text NOT NULL,
    commission_amount numeric(12,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);


--
-- Name: international_transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.international_transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: international_transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.international_transfers_id_seq OWNED BY public.international_transfers.id;


--
-- Name: international_transfers_new; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.international_transfers_new (
    id integer NOT NULL,
    sender_agent_id integer NOT NULL,
    receiver_office_id integer NOT NULL,
    currency_code text NOT NULL,
    amount_original numeric NOT NULL,
    commission_system numeric NOT NULL,
    commission_recipient numeric NOT NULL,
    amount_pending numeric NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    transfer_code text NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone
);


--
-- Name: international_transfers_new_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.international_transfers_new_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: international_transfers_new_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.international_transfers_new_id_seq OWNED BY public.international_transfers_new.id;


--
-- Name: market_bids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_bids (
    id integer NOT NULL,
    offer_id integer NOT NULL,
    user_id integer NOT NULL,
    amount numeric(15,2) NOT NULL,
    price numeric(15,6) NOT NULL,
    message text,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    CONSTRAINT market_bids_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'expired'::character varying])::text[])))
);


--
-- Name: market_bids_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_bids_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_bids_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_bids_id_seq OWNED BY public.market_bids.id;


--
-- Name: market_channels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_channels (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: market_channels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_channels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_channels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_channels_id_seq OWNED BY public.market_channels.id;


--
-- Name: market_deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_deals (
    id integer NOT NULL,
    offer_id integer NOT NULL,
    bid_id integer,
    seller_id integer NOT NULL,
    buyer_id integer NOT NULL,
    amount numeric(15,2) NOT NULL,
    price numeric(15,6) NOT NULL,
    total_value numeric(15,2) NOT NULL,
    base_currency character varying(5) NOT NULL,
    quote_currency character varying(5) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    escrow_released boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    CONSTRAINT deal_amount_positive CHECK (((amount > (0)::numeric) AND (total_value > (0)::numeric))),
    CONSTRAINT deal_price_positive CHECK ((price > (0)::numeric)),
    CONSTRAINT market_deals_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'confirmed'::character varying, 'disputed'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: market_deals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_deals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_deals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_deals_id_seq OWNED BY public.market_deals.id;


--
-- Name: market_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_messages (
    id integer NOT NULL,
    channel_id integer DEFAULT 1,
    user_id integer NOT NULL,
    type character varying(20) DEFAULT 'MESSAGE'::character varying,
    content text NOT NULL,
    offer_id integer,
    bid_id integer,
    deal_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT market_messages_type_check CHECK (((type)::text = ANY ((ARRAY['MESSAGE'::character varying, 'OFFER'::character varying, 'BID'::character varying, 'DEAL'::character varying, 'SYSTEM'::character varying])::text[])))
);


--
-- Name: market_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_messages_id_seq OWNED BY public.market_messages.id;


--
-- Name: market_offers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_offers (
    id integer NOT NULL,
    user_id integer NOT NULL,
    side character varying(10) NOT NULL,
    base_currency character varying(5) NOT NULL,
    quote_currency character varying(5) NOT NULL,
    price numeric(15,6) NOT NULL,
    min_amount numeric(15,2) NOT NULL,
    max_amount numeric(15,2) NOT NULL,
    remaining_amount numeric(15,2) NOT NULL,
    city character varying(100),
    deliver_type character varying(20) DEFAULT 'internal_transfer'::character varying,
    terms text,
    status character varying(20) DEFAULT 'open'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    allow_counter_price boolean DEFAULT false,
    expires_at timestamp without time zone,
    commission_deducted boolean DEFAULT false,
    CONSTRAINT market_offers_deliver_type_check CHECK (((deliver_type)::text = ANY ((ARRAY['internal_transfer'::character varying, 'bank_transfer'::character varying, 'cash_pickup'::character varying])::text[]))),
    CONSTRAINT market_offers_side_check CHECK (((side)::text = ANY ((ARRAY['buy'::character varying, 'sell'::character varying])::text[]))),
    CONSTRAINT market_offers_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'partial'::character varying, 'filled'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: market_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_offers_id_seq OWNED BY public.market_offers.id;


--
-- Name: market_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_transactions (
    id integer NOT NULL,
    buyer_id integer NOT NULL,
    offer_id integer NOT NULL,
    amount numeric NOT NULL,
    total_cost numeric NOT NULL,
    commission numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: market_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_transactions_id_seq OWNED BY public.market_transactions.id;


--
-- Name: message_likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_likes (
    id integer NOT NULL,
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: message_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.message_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: message_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.message_likes_id_seq OWNED BY public.message_likes.id;


--
-- Name: message_voices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.message_voices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_id integer,
    private_message_id integer,
    sender_id integer NOT NULL,
    room_id integer,
    private_room_id integer,
    storage_key text NOT NULL,
    mime_type text NOT NULL,
    duration_seconds integer NOT NULL,
    file_size_bytes integer NOT NULL,
    waveform_peaks jsonb,
    transcript text,
    transcript_lang text,
    status text DEFAULT 'ready'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: office_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_commissions (
    id integer NOT NULL,
    office_id integer NOT NULL,
    city text NOT NULL,
    commission_rate numeric NOT NULL
);


--
-- Name: office_commissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.office_commissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: office_commissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.office_commissions_id_seq OWNED BY public.office_commissions.id;


--
-- Name: office_country_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.office_country_commissions (
    id integer NOT NULL,
    office_id integer NOT NULL,
    country text NOT NULL,
    commission_rate numeric NOT NULL
);


--
-- Name: office_country_commissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.office_country_commissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: office_country_commissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.office_country_commissions_id_seq OWNED BY public.office_country_commissions.id;


--
-- Name: page_restrictions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_restrictions (
    id integer NOT NULL,
    user_id integer,
    account_number text,
    page_key text NOT NULL,
    scope text DEFAULT 'page'::text NOT NULL,
    reason text,
    is_active boolean DEFAULT true NOT NULL,
    expires_at timestamp with time zone,
    created_by integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: page_restrictions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.page_restrictions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: page_restrictions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.page_restrictions_id_seq OWNED BY public.page_restrictions.id;


--
-- Name: password_reset_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    email text NOT NULL,
    token text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    used boolean DEFAULT false
);


--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_requests_id_seq OWNED BY public.password_reset_requests.id;


--
-- Name: points_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.points_history (
    id integer NOT NULL,
    user_id integer NOT NULL,
    points integer NOT NULL,
    action text NOT NULL,
    description text NOT NULL,
    description_ar text NOT NULL,
    reference_id text,
    reference_type text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: points_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.points_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: points_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.points_history_id_seq OWNED BY public.points_history.id;


--
-- Name: private_chats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.private_chats (
    id integer NOT NULL,
    user1_id integer NOT NULL,
    user2_id integer NOT NULL,
    last_message_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: private_chats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.private_chats_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: private_chats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.private_chats_id_seq OWNED BY public.private_chats.id;


--
-- Name: private_message_reads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.private_message_reads (
    message_id integer NOT NULL,
    user_id integer NOT NULL,
    read_at timestamp without time zone DEFAULT now()
);


--
-- Name: private_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.private_messages (
    id integer NOT NULL,
    chat_id integer NOT NULL,
    sender_id integer NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    is_edited boolean DEFAULT false,
    edited_at timestamp without time zone,
    is_deleted boolean DEFAULT false,
    deleted_by integer,
    deleted_at timestamp without time zone,
    file_url text,
    file_type text,
    deleted_for_users integer[] DEFAULT '{}'::integer[],
    voice_id text,
    voice_duration integer,
    is_forwarded boolean DEFAULT false,
    original_sender_id integer,
    forwarded_from_sender text
);


--
-- Name: private_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.private_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: private_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.private_messages_id_seq OWNED BY public.private_messages.id;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    endpoint text NOT NULL,
    keys_p256dh text NOT NULL,
    keys_auth text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- Name: receipt_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipt_audit_log (
    id integer NOT NULL,
    receipt_id text NOT NULL,
    action text NOT NULL,
    user_id text,
    metadata json,
    ip_address text,
    user_agent text,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: receipt_audit_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipt_audit_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receipt_audit_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.receipt_audit_log_id_seq OWNED BY public.receipt_audit_log.id;


--
-- Name: receipt_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipt_settings (
    id integer NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by text
);


--
-- Name: receipt_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.receipt_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: receipt_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.receipt_settings_id_seq OWNED BY public.receipt_settings.id;


--
-- Name: receipts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.receipts (
    id text DEFAULT gen_random_uuid() NOT NULL,
    txn_id text NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    locale text DEFAULT 'ar'::text NOT NULL,
    storage_path text NOT NULL,
    sha256_base64url text NOT NULL,
    jws_token text NOT NULL,
    pdf_signed boolean DEFAULT false NOT NULL,
    pdf_sign_algo text,
    pdf_cert_serial text,
    revoked boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    created_by text,
    verified_at timestamp with time zone,
    public_copy boolean DEFAULT true NOT NULL
);


--
-- Name: referral_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_balances (
    id integer NOT NULL,
    user_id integer NOT NULL,
    currency text NOT NULL,
    amount numeric(18,6) DEFAULT 0 NOT NULL
);


--
-- Name: referral_balances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.referral_balances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: referral_balances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.referral_balances_id_seq OWNED BY public.referral_balances.id;


--
-- Name: referral_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.referral_rewards (
    id integer NOT NULL,
    tx_id integer NOT NULL,
    referrer_id integer NOT NULL,
    referred_user_id integer NOT NULL,
    commission_base numeric(18,6) NOT NULL,
    reward_amount numeric(18,6) NOT NULL,
    currency text NOT NULL,
    status text DEFAULT 'paid'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    paid_at timestamp without time zone,
    operation_type character varying(50) DEFAULT 'transfer_lyd'::character varying,
    deducted_from_commission numeric(15,6) DEFAULT 0,
    exchange_rate numeric(15,6) DEFAULT NULL::numeric,
    original_currency character varying(3) DEFAULT NULL::character varying,
    CONSTRAINT referral_rewards_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'reversed'::text])))
);


--
-- Name: referral_rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.referral_rewards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: referral_rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.referral_rewards_id_seq OWNED BY public.referral_rewards.id;


--
-- Name: reward_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reward_settings (
    id integer NOT NULL,
    transfer_points integer DEFAULT 1,
    login_points integer DEFAULT 5,
    streak_bonus_points integer DEFAULT 10,
    level_up_bonus integer DEFAULT 50,
    points_per_level integer DEFAULT 1000,
    max_streak_days integer DEFAULT 30,
    system_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: reward_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reward_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reward_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reward_settings_id_seq OWNED BY public.reward_settings.id;


--
-- Name: rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rewards (
    id integer NOT NULL,
    name text NOT NULL,
    name_ar text NOT NULL,
    description text NOT NULL,
    description_ar text NOT NULL,
    icon text NOT NULL,
    points_cost integer NOT NULL,
    reward_type text NOT NULL,
    reward_value text,
    max_redemptions integer,
    current_redemptions integer DEFAULT 0,
    valid_until timestamp without time zone,
    active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rewards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rewards_id_seq OWNED BY public.rewards.id;


--
-- Name: security_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    username text,
    event_type text NOT NULL,
    fingerprint text NOT NULL,
    ip_address text,
    user_agent text,
    country text,
    city text,
    platform text,
    language text,
    screen text,
    timezone text,
    attempts integer DEFAULT 1,
    image_filename text,
    blocked boolean DEFAULT false,
    report_type text DEFAULT 'failed_login'::text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: signing_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signing_keys (
    id integer NOT NULL,
    kid text NOT NULL,
    algorithm text DEFAULT 'RS256'::text NOT NULL,
    public_key text NOT NULL,
    private_key text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone
);


--
-- Name: signing_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.signing_keys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: signing_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.signing_keys_id_seq OWNED BY public.signing_keys.id;


--
-- Name: system_commission_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_commission_rates (
    id integer NOT NULL,
    transfer_type text NOT NULL,
    currency text NOT NULL,
    commission_rate numeric(5,4) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    per_mille_rate numeric(5,3),
    fixed_amount numeric(12,2)
);


--
-- Name: system_commission_rates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_commission_rates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_commission_rates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_commission_rates_id_seq OWNED BY public.system_commission_rates.id;


--
-- Name: system_commission_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_commission_settings (
    id integer NOT NULL,
    type character varying(20) NOT NULL,
    value numeric(10,6) NOT NULL,
    currency character varying(3) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by integer,
    CONSTRAINT system_commission_settings_currency_check CHECK (((currency)::text = ANY ((ARRAY['LYD'::character varying, 'USD'::character varying, 'EUR'::character varying, 'TRY'::character varying, 'AED'::character varying, 'EGP'::character varying, 'TND'::character varying, 'GBP'::character varying])::text[]))),
    CONSTRAINT system_commission_settings_type_check CHECK (((type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[])))
);


--
-- Name: system_commission_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_commission_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: system_commission_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_commission_settings_id_seq OWNED BY public.system_commission_settings.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    key text NOT NULL,
    value jsonb NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: transaction_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transaction_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    ts timestamp without time zone DEFAULT now() NOT NULL,
    type text NOT NULL,
    currency text NOT NULL,
    amount numeric(18,4) NOT NULL,
    commission numeric(18,4) DEFAULT 0,
    direction text NOT NULL,
    counterparty text,
    ref text,
    status text DEFAULT 'completed'::text NOT NULL,
    note text,
    transfer_id integer,
    city_transfer_id integer,
    agent_transfer_id integer,
    market_transaction_id integer,
    international_transfer_id integer,
    metadata json,
    created_at timestamp without time zone DEFAULT now(),
    reference_number character varying(255)
);


--
-- Name: transaction_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transaction_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transaction_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transaction_logs_id_seq OWNED BY public.transaction_logs.id;


--
-- Name: transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    amount text NOT NULL,
    currency text NOT NULL,
    description text,
    date timestamp without time zone DEFAULT now(),
    reference_number text
);


--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transfers (
    id integer NOT NULL,
    sender_id integer NOT NULL,
    receiver_id integer NOT NULL,
    amount numeric NOT NULL,
    commission numeric NOT NULL,
    currency text DEFAULT 'LYD'::text NOT NULL,
    note text,
    created_at timestamp without time zone DEFAULT now(),
    reference_number text,
    transfer_kind text DEFAULT 'internal'::text NOT NULL,
    destination_country text
);


--
-- Name: transfers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transfers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transfers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transfers_id_seq OWNED BY public.transfers.id;


--
-- Name: upgrade_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.upgrade_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    full_name text NOT NULL,
    phone text NOT NULL,
    city text NOT NULL,
    commission_rate numeric,
    message text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    reviewed_at timestamp without time zone,
    review_notes text,
    request_type text DEFAULT 'agent_upgrade'::text NOT NULL,
    requested_limits jsonb,
    documents jsonb,
    decided_at timestamp without time zone,
    decided_by integer,
    country_id integer,
    city_id integer,
    city_name_manual text
);


--
-- Name: upgrade_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.upgrade_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: upgrade_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.upgrade_requests_id_seq OWNED BY public.upgrade_requests.id;


--
-- Name: user_2fa; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_2fa (
    id integer NOT NULL,
    user_id integer NOT NULL,
    is_enabled boolean DEFAULT false NOT NULL,
    secret text,
    backup_codes text[] DEFAULT '{}'::text[],
    last_used_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_2fa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_2fa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_2fa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_2fa_id_seq OWNED BY public.user_2fa.id;


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id integer NOT NULL,
    user_id integer NOT NULL,
    badge_type_id integer NOT NULL,
    earned_at timestamp without time zone DEFAULT now(),
    is_visible boolean DEFAULT true,
    notification_sent boolean DEFAULT false
);


--
-- Name: user_badges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_badges_id_seq OWNED BY public.user_badges.id;


--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    title text NOT NULL,
    body text,
    type text DEFAULT 'info'::text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_notifications_id_seq OWNED BY public.user_notifications.id;


--
-- Name: user_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_points (
    id integer NOT NULL,
    user_id integer NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    available_points integer DEFAULT 0 NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    streak_days integer DEFAULT 0 NOT NULL,
    last_activity_date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_points_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_points_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_points_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_points_id_seq OWNED BY public.user_points.id;


--
-- Name: user_receive_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_receive_settings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    country_id integer NOT NULL,
    commission_rate numeric(5,4) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: user_receive_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_receive_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_receive_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_receive_settings_id_seq OWNED BY public.user_receive_settings.id;


--
-- Name: user_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_rewards (
    id integer NOT NULL,
    user_id integer NOT NULL,
    reward_id integer NOT NULL,
    points_spent integer NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    redemption_code text,
    used_at timestamp without time zone,
    expires_at timestamp without time zone,
    redeemed_at timestamp without time zone DEFAULT now()
);


--
-- Name: user_rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_rewards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_rewards_id_seq OWNED BY public.user_rewards.id;


--
-- Name: user_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_settings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    language character varying(10) DEFAULT 'ar'::character varying,
    theme character varying(20) DEFAULT 'light'::character varying,
    timezone character varying(50) DEFAULT 'Africa/Tripoli'::character varying,
    base_currency character varying(3) DEFAULT 'LYD'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    notifications json DEFAULT '{"email":true,"push":true,"security":true,"marketing":false}'::json
);


--
-- Name: user_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_settings_id_seq OWNED BY public.user_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    password text NOT NULL,
    type text DEFAULT 'user'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    city text,
    commission_rate numeric DEFAULT '1'::numeric,
    countries_supported text[],
    verified boolean DEFAULT false,
    active boolean DEFAULT true,
    account_number text NOT NULL,
    avatar_url text,
    ext_transfer_enabled boolean DEFAULT false NOT NULL,
    ext_daily_limit numeric(18,4) DEFAULT 0,
    ext_monthly_limit numeric(18,4) DEFAULT 0,
    ext_allowed_currencies text[] DEFAULT ARRAY[]::text[],
    ext_allowed_countries text[] DEFAULT ARRAY[]::text[],
    country_id integer NOT NULL,
    city_id integer,
    country_name text NOT NULL,
    city_name text NOT NULL,
    admin_level integer DEFAULT 0,
    can_manage_users boolean DEFAULT false,
    can_manage_market boolean DEFAULT false,
    can_manage_chat boolean DEFAULT false,
    can_manage_internal_transfers boolean DEFAULT false,
    can_manage_external_transfers boolean DEFAULT false,
    can_manage_new_accounts boolean DEFAULT false,
    can_manage_security boolean DEFAULT false,
    can_manage_support boolean DEFAULT false,
    can_manage_reports boolean DEFAULT false,
    can_manage_settings boolean DEFAULT false,
    referral_code text,
    referred_by integer,
    referred_at timestamp without time zone,
    office_name text NOT NULL,
    office_address text
);


--
-- Name: COLUMN users.admin_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.admin_level IS '0: عادي، 1: مدير نظام محدود، 2: مدير عام';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_requests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    id_photo_url text,
    proof_of_address_url text,
    status text DEFAULT 'pending'::text NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone
);


--
-- Name: verification_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_requests_id_seq OWNED BY public.verification_requests.id;


--
-- Name: voice_rate_limits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voice_rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id integer NOT NULL,
    message_count integer DEFAULT 0 NOT NULL,
    window_start_time timestamp without time zone DEFAULT now(),
    last_reset_at timestamp without time zone DEFAULT now()
);


--
-- Name: voice_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.voice_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    max_duration_seconds integer DEFAULT 120 NOT NULL,
    max_file_size_mb integer DEFAULT 10 NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    transcription_enabled boolean DEFAULT true NOT NULL,
    allowed_mime_types text[] DEFAULT ARRAY['audio/ogg'::text, 'audio/mpeg'::text, 'audio/mp4'::text, 'audio/webm'::text]
);


--
-- Name: admin_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_messages ALTER COLUMN id SET DEFAULT nextval('public.admin_messages_id_seq'::regclass);


--
-- Name: admin_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings ALTER COLUMN id SET DEFAULT nextval('public.admin_settings_id_seq'::regclass);


--
-- Name: agent_commissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_commissions ALTER COLUMN id SET DEFAULT nextval('public.agent_commissions_id_seq'::regclass);


--
-- Name: agent_offices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_offices ALTER COLUMN id SET DEFAULT nextval('public.agent_offices_id_seq'::regclass);


--
-- Name: agent_transfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_transfers ALTER COLUMN id SET DEFAULT nextval('public.agent_transfers_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: badge_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_types ALTER COLUMN id SET DEFAULT nextval('public.badge_types_id_seq'::regclass);


--
-- Name: balances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balances ALTER COLUMN id SET DEFAULT nextval('public.balances_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: chat_rooms id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms ALTER COLUMN id SET DEFAULT nextval('public.chat_rooms_id_seq'::regclass);


--
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- Name: city_transfer_commissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_transfer_commissions ALTER COLUMN id SET DEFAULT nextval('public.city_transfer_commissions_id_seq'::regclass);


--
-- Name: city_transfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_transfers ALTER COLUMN id SET DEFAULT nextval('public.city_transfers_id_seq'::regclass);


--
-- Name: commission_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_logs ALTER COLUMN id SET DEFAULT nextval('public.commission_logs_id_seq'::regclass);


--
-- Name: commission_pool_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_pool_transactions ALTER COLUMN id SET DEFAULT nextval('public.commission_pool_transactions_id_seq'::regclass);


--
-- Name: countries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries ALTER COLUMN id SET DEFAULT nextval('public.countries_id_seq'::regclass);


--
-- Name: crypto_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crypto_keys ALTER COLUMN id SET DEFAULT nextval('public.crypto_keys_id_seq'::regclass);


--
-- Name: exchange_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates ALTER COLUMN id SET DEFAULT nextval('public.exchange_rates_id_seq'::regclass);


--
-- Name: group_chats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_chats ALTER COLUMN id SET DEFAULT nextval('public.group_chats_id_seq'::regclass);


--
-- Name: group_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members ALTER COLUMN id SET DEFAULT nextval('public.group_members_id_seq'::regclass);


--
-- Name: group_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages ALTER COLUMN id SET DEFAULT nextval('public.group_messages_id_seq'::regclass);


--
-- Name: hidden_transfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hidden_transfers ALTER COLUMN id SET DEFAULT nextval('public.hidden_transfers_id_seq'::regclass);


--
-- Name: internal_transfer_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.internal_transfer_logs ALTER COLUMN id SET DEFAULT nextval('public.internal_transfer_logs_id_seq'::regclass);


--
-- Name: international_transfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.international_transfers ALTER COLUMN id SET DEFAULT nextval('public.international_transfers_id_seq'::regclass);


--
-- Name: international_transfers_new id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.international_transfers_new ALTER COLUMN id SET DEFAULT nextval('public.international_transfers_new_id_seq'::regclass);


--
-- Name: market_bids id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_bids ALTER COLUMN id SET DEFAULT nextval('public.market_bids_id_seq'::regclass);


--
-- Name: market_channels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_channels ALTER COLUMN id SET DEFAULT nextval('public.market_channels_id_seq'::regclass);


--
-- Name: market_deals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_deals ALTER COLUMN id SET DEFAULT nextval('public.market_deals_id_seq'::regclass);


--
-- Name: market_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_messages ALTER COLUMN id SET DEFAULT nextval('public.market_messages_id_seq'::regclass);


--
-- Name: market_offers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_offers ALTER COLUMN id SET DEFAULT nextval('public.market_offers_id_seq'::regclass);


--
-- Name: market_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_transactions ALTER COLUMN id SET DEFAULT nextval('public.market_transactions_id_seq'::regclass);


--
-- Name: message_likes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_likes ALTER COLUMN id SET DEFAULT nextval('public.message_likes_id_seq'::regclass);


--
-- Name: office_commissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_commissions ALTER COLUMN id SET DEFAULT nextval('public.office_commissions_id_seq'::regclass);


--
-- Name: office_country_commissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_country_commissions ALTER COLUMN id SET DEFAULT nextval('public.office_country_commissions_id_seq'::regclass);


--
-- Name: page_restrictions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_restrictions ALTER COLUMN id SET DEFAULT nextval('public.page_restrictions_id_seq'::regclass);


--
-- Name: password_reset_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests ALTER COLUMN id SET DEFAULT nextval('public.password_reset_requests_id_seq'::regclass);


--
-- Name: points_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_history ALTER COLUMN id SET DEFAULT nextval('public.points_history_id_seq'::regclass);


--
-- Name: private_chats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_chats ALTER COLUMN id SET DEFAULT nextval('public.private_chats_id_seq'::regclass);


--
-- Name: private_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_messages ALTER COLUMN id SET DEFAULT nextval('public.private_messages_id_seq'::regclass);


--
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- Name: receipt_audit_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_audit_log ALTER COLUMN id SET DEFAULT nextval('public.receipt_audit_log_id_seq'::regclass);


--
-- Name: receipt_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_settings ALTER COLUMN id SET DEFAULT nextval('public.receipt_settings_id_seq'::regclass);


--
-- Name: referral_balances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_balances ALTER COLUMN id SET DEFAULT nextval('public.referral_balances_id_seq'::regclass);


--
-- Name: referral_rewards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_rewards ALTER COLUMN id SET DEFAULT nextval('public.referral_rewards_id_seq'::regclass);


--
-- Name: reward_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_settings ALTER COLUMN id SET DEFAULT nextval('public.reward_settings_id_seq'::regclass);


--
-- Name: rewards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards ALTER COLUMN id SET DEFAULT nextval('public.rewards_id_seq'::regclass);


--
-- Name: signing_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signing_keys ALTER COLUMN id SET DEFAULT nextval('public.signing_keys_id_seq'::regclass);


--
-- Name: system_commission_rates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_commission_rates ALTER COLUMN id SET DEFAULT nextval('public.system_commission_rates_id_seq'::regclass);


--
-- Name: system_commission_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_commission_settings ALTER COLUMN id SET DEFAULT nextval('public.system_commission_settings_id_seq'::regclass);


--
-- Name: transaction_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_logs ALTER COLUMN id SET DEFAULT nextval('public.transaction_logs_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: transfers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers ALTER COLUMN id SET DEFAULT nextval('public.transfers_id_seq'::regclass);


--
-- Name: upgrade_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upgrade_requests ALTER COLUMN id SET DEFAULT nextval('public.upgrade_requests_id_seq'::regclass);


--
-- Name: user_2fa id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_2fa ALTER COLUMN id SET DEFAULT nextval('public.user_2fa_id_seq'::regclass);


--
-- Name: user_badges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges ALTER COLUMN id SET DEFAULT nextval('public.user_badges_id_seq'::regclass);


--
-- Name: user_notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications ALTER COLUMN id SET DEFAULT nextval('public.user_notifications_id_seq'::regclass);


--
-- Name: user_points id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_points ALTER COLUMN id SET DEFAULT nextval('public.user_points_id_seq'::regclass);


--
-- Name: user_receive_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_receive_settings ALTER COLUMN id SET DEFAULT nextval('public.user_receive_settings_id_seq'::regclass);


--
-- Name: user_rewards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards ALTER COLUMN id SET DEFAULT nextval('public.user_rewards_id_seq'::regclass);


--
-- Name: user_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings ALTER COLUMN id SET DEFAULT nextval('public.user_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_requests ALTER COLUMN id SET DEFAULT nextval('public.verification_requests_id_seq'::regclass);


--
-- Data for Name: admin_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_messages (id, user_id, message, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: admin_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_settings (id, key, value, description, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: admin_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_transactions (id, ref_no, type, status, created_at, updated_at, executed_at, from_account_id, to_account_id, user_id, office_id, city_from, city_to, currency, amount, rate, fee_system, fee_recipient, net_amount, channel, created_by, approved_by, kyc_level, risk_score, flags, parent_txn_id, external_provider, external_ref, notes, meta) FROM stdin;
d48072a6-10e0-4544-9941-56b4dce8870a	TXN-2025-001	internal_transfer	completed	2025-08-17 19:29:44.773017	2025-08-17 19:29:44.773017	\N	\N	\N	4	\N	\N	\N	LYD	1000.0000	\N	\N	\N	995.0000	web	4	\N	1	0	{}	\N	\N	\N	\N	{}
5cad05e6-d058-4aa8-99dc-a8abb28f7c59	TXN-2025-002	inter_office_transfer	pending	2025-08-17 19:29:44.773017	2025-08-17 19:29:44.773017	\N	\N	\N	28	\N	\N	\N	USD	500.0000	\N	\N	\N	490.0000	web	28	\N	1	0	{}	\N	\N	\N	\N	{}
8243a71f-a407-462a-8ebc-74450c0f5bdc	TXN-2025-003	city_transfer	failed	2025-08-17 19:29:44.773017	2025-08-17 19:29:44.773017	\N	\N	\N	27	\N	\N	\N	LYD	750.0000	\N	\N	\N	740.0000	web	27	\N	1	0	{}	\N	\N	\N	\N	{}
\.


--
-- Data for Name: agent_commissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agent_commissions (id, agent_id, currency_code, type, value, created_at, updated_at) FROM stdin;
64	59	USD	fixed	5.5	2025-09-03 18:20:32.949939	2025-09-03 18:20:32.949939
128	101	USD	fixed	3.5	2025-09-16 13:24:48.221837	2025-09-16 13:24:48.221837
66	57	USD	fixed	4	2025-09-03 18:35:21.104769	2025-09-03 18:35:21.104769
67	58	USD	percentage	1.5	2025-09-03 18:51:07.246562	2025-09-03 18:51:07.246562
68	58	LYD	percentage	1.5	2025-09-03 18:51:07.29199	2025-09-03 18:51:07.29199
69	62	USD	fixed	7.5	2025-09-04 16:16:34.209887	2025-09-04 16:16:34.209887
70	63	USD	fixed	7.5	2025-09-04 16:16:38.719869	2025-09-04 16:16:38.719869
71	64	USD	percentage	1.5	2025-09-04 16:30:46.478038	2025-09-04 16:30:46.478038
72	64	LYD	percentage	1.5	2025-09-04 16:30:46.525401	2025-09-04 16:30:46.525401
73	65	USD	percentage	1.5	2025-09-04 16:33:57.249062	2025-09-04 16:33:57.249062
74	65	LYD	percentage	1.5	2025-09-04 16:33:57.294095	2025-09-04 16:33:57.294095
79	67	USD	fixed	3	2025-09-06 13:45:01.854472	2025-09-06 13:45:01.854472
87	76	LYD	percentage	1.5	2025-09-06 16:25:42.389515	2025-09-06 16:25:42.389515
86	76	USD	fixed	7.5	2025-09-06 16:25:42.33947	2025-09-06 16:26:31.885
106	90	USD	fixed	7	2025-09-14 11:00:45.792383	2025-09-14 11:00:45.792383
107	91	USD	fixed	8	2025-09-14 11:07:28.069524	2025-09-14 11:07:28.069524
60	56	USD	fixed	6	2025-09-01 14:05:25.90308	2025-09-01 14:05:25.90308
61	55	USD	fixed	5	2025-09-01 14:09:06.941925	2025-09-01 14:09:06.941925
62	54	USD	fixed	3	2025-09-01 14:11:51.808643	2025-09-01 14:11:51.808643
121	102	USD	fixed	12	2025-09-14 16:56:50.417591	2025-09-14 16:56:50.417591
123	89	USD	fixed	2	2025-09-15 14:01:20.032007	2025-09-15 14:01:20.032007
\.


--
-- Data for Name: agent_offices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agent_offices (id, agent_id, country_code, city, office_code, office_name, contact_info, address, is_active, created_at, commission_rate, user_id) FROM stdin;
124	101	LY	أجدابيا	AGT0101	ريماس للصرافة	+218 920000001	غير محدد	t	2025-09-14 16:48:06.407763	1.50	\N
126	102	LY	البريقة	AGT0102	الوفاء	+218 920002315	غير محدد	t	2025-09-14 16:55:21.62217	1.50	\N
117	89	LY	طرابلس	LY001	مكتب محمد الدمنهوري - ليبيا	+20 990000000	العنوان الرئيسي، طرابلس	t	2025-09-14 13:20:27.683	1.50	\N
116	90	IQ	بغداد	LY002	مكتب بغداد للحوالات - العراق	+964 990000000	العنوان الرئيسي، بغداد	t	2025-09-14 11:00:05.314	1.50	\N
115	91	SA	الرياض	LY003	مكتب رياضي للحوالات - السعودية	+1 90000000	العنوان الرئيسي، الرياض	t	2025-09-14 11:00:02.786	1.50	\N
\.


--
-- Data for Name: agent_transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agent_transfers (id, sender_id, receiver_id, agent_id, destination_agent_id, amount, commission, currency, transfer_code, note, status, type, country, city, recipient_name, recipient_phone, recipient_id, created_at, completed_at, amount_original, commission_system, commission_recipient, amount_pending, receiver_code) FROM stdin;
179	90	\N	90	89	99.99	9	USD	633735		completed	international	مصر		المستلم ص	1654465151	\N	2025-09-14 16:40:55.83024	2025-09-14 16:42:32.085917	99.99	9	6.5	106.49	633735
180	90	\N	90	102	100	9	USD	623974		completed	international	ليبيا		المستلم ص	1654465151	\N	2025-09-14 16:59:02.066885	2025-09-14 16:59:23.173741	100	9	12	112	623974
181	102	\N	102	89	100	7	USD	771494		completed	international	مصر		تحويل دولي	00000000	\N	2025-09-15 14:05:02.031302	2025-09-15 14:06:30.408175	100	7	2	102	771494
182	90	\N	90	89	100	7	USD	205273		completed	international	مصر		تحويل دولي	00000000	\N	2025-09-15 14:12:59.420147	2025-09-15 14:13:29.048566	100	7	2	102	205273
183	102	\N	102	91	100	7	USD	173100		pending	international	المملكة العربية السعودية		تحويل دولي	00000000	\N	2025-09-17 20:43:06.781476	\N	100	7	8	108	173100
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, actor_id, action, entity, entity_id, data, created_at) FROM stdin;
1	4	upsert_restriction	page_restrictions	1	{"type": "restriction_upsert", "scope": "page", "pageKey": "wallet", "isActive": true, "targetUserId": 55, "accountNumber": "33003003"}	2025-09-04 12:07:25.384721+00
2	4	remove_restriction	page_restrictions	1	{"type": "restriction_removed", "userId": 55, "pageKey": "wallet"}	2025-09-04 12:10:43.190023+00
3	4	upsert_restriction	page_restrictions	2	{"type": "restriction_upsert", "scope": "page", "pageKey": "market", "isActive": true, "targetUserId": 55, "accountNumber": "33003003"}	2025-09-04 12:11:09.553082+00
4	4	remove_restriction	page_restrictions	2	{"type": "restriction_removed", "userId": 55, "pageKey": "market"}	2025-09-04 12:53:45.802166+00
5	4	upsert_restriction	page_restrictions	3	{"type": "restriction_upsert", "scope": "page", "pageKey": "wallet", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 12:55:13.714635+00
6	4	remove_restriction	page_restrictions	3	{"type": "restriction_removed", "userId": 54, "pageKey": "wallet"}	2025-09-04 12:55:44.259495+00
7	4	upsert_restriction	page_restrictions	4	{"type": "restriction_upsert", "scope": "page", "pageKey": "inter_office", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 12:56:14.298076+00
8	4	remove_restriction	page_restrictions	4	{"type": "restriction_removed", "userId": 54, "pageKey": "inter_office"}	2025-09-04 12:56:43.923493+00
9	4	upsert_restriction	page_restrictions	5	{"type": "restriction_upsert", "scope": "page", "pageKey": "international", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 12:56:59.475856+00
10	4	upsert_restriction	page_restrictions	6	{"type": "restriction_upsert", "scope": "page", "pageKey": "international", "isActive": true, "targetUserId": 55, "accountNumber": "33003003"}	2025-09-04 12:57:47.553012+00
11	4	remove_restriction	page_restrictions	6	{"type": "restriction_removed", "userId": 55, "pageKey": "international"}	2025-09-04 13:42:07.80261+00
12	4	upsert_restriction	page_restrictions	7	{"type": "restriction_upsert", "scope": "page", "pageKey": "market", "isActive": true, "targetUserId": 55, "accountNumber": "33003003"}	2025-09-04 13:42:31.104455+00
13	4	remove_restriction	page_restrictions	7	{"type": "restriction_removed", "userId": 55, "pageKey": "market"}	2025-09-04 13:42:54.811746+00
14	4	upsert_restriction	page_restrictions	8	{"type": "restriction_upsert", "scope": "page", "pageKey": "international", "isActive": true, "targetUserId": 55, "accountNumber": "33003003"}	2025-09-04 13:43:17.748844+00
15	4	remove_restriction	page_restrictions	8	{"type": "restriction_removed", "userId": 55, "pageKey": "international"}	2025-09-04 13:44:07.976057+00
16	4	remove_restriction	page_restrictions	5	{"type": "restriction_removed", "userId": 54, "pageKey": "international"}	2025-09-04 13:50:35.6751+00
17	4	upsert_restriction	page_restrictions	10	{"type": "restriction_upsert", "scope": "page", "pageKey": "market", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 13:50:56.024431+00
18	4	upsert_restriction	page_restrictions	11	{"type": "restriction_upsert", "scope": "page", "pageKey": "international", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 13:51:40.356365+00
19	4	remove_restriction	page_restrictions	11	{"type": "restriction_removed", "userId": 54, "pageKey": "international"}	2025-09-04 13:52:02.2565+00
20	4	remove_restriction	page_restrictions	10	{"type": "restriction_removed", "userId": 54, "pageKey": "market"}	2025-09-04 13:52:04.523461+00
21	4	upsert_restriction	page_restrictions	12	{"type": "restriction_upsert", "scope": "page", "pageKey": "market", "isActive": true, "targetUserId": 56, "accountNumber": "44003001"}	2025-09-04 13:52:21.605053+00
22	4	remove_restriction	page_restrictions	12	{"type": "restriction_removed", "userId": 56, "pageKey": "market"}	2025-09-04 13:52:32.102586+00
23	4	upsert_restriction	page_restrictions	13	{"type": "restriction_upsert", "scope": "page", "pageKey": "all", "isActive": true, "targetUserId": 56, "accountNumber": "44003001"}	2025-09-04 13:53:09.380239+00
24	4	remove_restriction	page_restrictions	13	{"type": "restriction_removed", "userId": 56, "pageKey": "all"}	2025-09-04 13:54:40.946708+00
25	4	remove_restriction	page_restrictions	14	{"type": "restriction_removed", "userId": 56, "pageKey": "notifications"}	2025-09-04 13:59:58.622158+00
26	4	upsert_restriction	page_restrictions	15	{"type": "restriction_upsert", "scope": "page", "pageKey": "inter_office", "isActive": true, "targetUserId": 56, "accountNumber": "44003001"}	2025-09-04 14:00:14.28295+00
27	4	remove_restriction	page_restrictions	15	{"type": "restriction_removed", "userId": 56, "pageKey": "inter_office"}	2025-09-04 14:00:40.373087+00
28	4	upsert_restriction	page_restrictions	16	{"type": "restriction_upsert", "scope": "page", "pageKey": "balance", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 14:17:48.162105+00
29	4	upsert_restriction	page_restrictions	17	{"type": "restriction_upsert", "scope": "page", "pageKey": "city_transfers", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 14:18:13.690194+00
30	4	upsert_restriction	page_restrictions	18	{"type": "restriction_upsert", "scope": "page", "pageKey": "international", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 14:18:33.393768+00
31	4	remove_restriction	page_restrictions	16	{"type": "restriction_removed", "userId": 54, "pageKey": "balance"}	2025-09-04 14:19:06.454006+00
32	4	remove_restriction	page_restrictions	17	{"type": "restriction_removed", "userId": 54, "pageKey": "city_transfers"}	2025-09-04 14:19:08.271359+00
33	4	remove_restriction	page_restrictions	18	{"type": "restriction_removed", "userId": 54, "pageKey": "international"}	2025-09-04 14:19:11.073528+00
34	4	upsert_restriction	page_restrictions	19	{"type": "restriction_upsert", "scope": "page", "pageKey": "international", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 14:22:28.109537+00
35	4	remove_restriction	page_restrictions	19	{"type": "restriction_removed", "userId": 54, "pageKey": "international"}	2025-09-04 14:26:11.807804+00
36	4	upsert_restriction	page_restrictions	20	{"type": "restriction_upsert", "scope": "page", "pageKey": "inter_office", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 14:26:27.036708+00
37	4	remove_restriction	page_restrictions	20	{"type": "restriction_removed", "userId": 54, "pageKey": "inter_office"}	2025-09-04 14:30:29.358259+00
38	4	upsert_restriction	page_restrictions	21	{"type": "restriction_upsert", "scope": "global", "pageKey": "international", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 14:31:00.233453+00
39	4	upsert_restriction	page_restrictions	22	{"type": "restriction_upsert", "scope": "global", "pageKey": "inter_office", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 14:31:43.394464+00
40	4	remove_restriction	page_restrictions	22	{"type": "restriction_removed", "userId": 54, "pageKey": "inter_office"}	2025-09-04 14:37:12.362238+00
41	4	remove_restriction	page_restrictions	21	{"type": "restriction_removed", "userId": 54, "pageKey": "international"}	2025-09-04 14:37:14.181553+00
42	4	upsert_restriction	page_restrictions	23	{"type": "restriction_upsert", "scope": "section", "pageKey": "international", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 14:37:43.282495+00
43	4	remove_restriction	page_restrictions	23	{"type": "restriction_removed", "userId": 54, "pageKey": "international"}	2025-09-04 14:38:12.45026+00
44	4	upsert_restriction	page_restrictions	24	{"type": "restriction_upsert", "scope": "page", "pageKey": "inter_office_receive", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 14:38:24.550408+00
45	4	upsert_restriction	page_restrictions	25	{"type": "restriction_upsert", "scope": "page", "pageKey": "office_management", "isActive": true, "targetUserId": 54, "accountNumber": "33003002"}	2025-09-04 14:41:04.110343+00
46	4	remove_restriction	page_restrictions	24	{"type": "restriction_removed", "userId": 54, "pageKey": "inter_office_receive"}	2025-09-04 14:41:08.386703+00
47	4	remove_restriction	page_restrictions	25	{"type": "restriction_removed", "userId": 54, "pageKey": "office_management"}	2025-09-04 14:41:48.672062+00
48	4	create_global_restriction	page_restrictions	32	{"type": "global_restriction_created", "pageKey": "group_chats", "allowedUsersCount": 1}	2025-09-21 12:59:09.065176+00
49	4	create_global_restriction	page_restrictions	36	{"type": "global_restriction_created", "pageKey": "market", "allowedUsersCount": 0}	2025-09-21 13:24:42.312093+00
50	4	create_global_restriction	page_restrictions	38	{"type": "global_restriction_created", "pageKey": "statement", "allowedUsersCount": 0}	2025-09-21 13:32:18.782608+00
51	4	create_global_restriction	page_restrictions	41	{"type": "global_restriction_created", "pageKey": "market", "allowedUsersCount": 0}	2025-09-21 13:54:45.654382+00
52	4	create_global_restriction	page_restrictions	42	{"type": "global_restriction_created", "pageKey": "chat", "allowedUsersCount": 0}	2025-09-21 13:55:37.278734+00
53	4	create_global_restriction	page_restrictions	43	{"type": "global_restriction_created", "pageKey": "notifications", "allowedUsersCount": 0}	2025-09-21 13:56:44.916281+00
54	4	create_global_restriction	page_restrictions	44	{"type": "global_restriction_created", "pageKey": "private_chat", "allowedUsersCount": 0}	2025-09-21 14:00:27.417059+00
55	4	create_global_restriction	page_restrictions	45	{"type": "global_restriction_created", "pageKey": "settings", "allowedUsersCount": 0}	2025-09-21 14:05:24.681975+00
56	4	create_global_restriction	page_restrictions	46	{"type": "global_restriction_created", "pageKey": "transfers", "allowedUsersCount": 0}	2025-09-21 14:10:23.143235+00
57	4	remove_global_restriction	page_restrictions	46	{"type": "global_restriction_removed", "pageKey": "transfers"}	2025-09-21 14:19:35.32917+00
58	4	remove_global_restriction	page_restrictions	45	{"type": "global_restriction_removed", "pageKey": "settings"}	2025-09-21 14:19:38.600158+00
59	4	remove_global_restriction	page_restrictions	44	{"type": "global_restriction_removed", "pageKey": "private_chat"}	2025-09-21 14:19:41.215633+00
60	4	remove_global_restriction	page_restrictions	38	{"type": "global_restriction_removed", "pageKey": "statement"}	2025-09-21 14:19:43.611597+00
61	4	remove_global_restriction	page_restrictions	37	{"type": "global_restriction_removed", "pageKey": "market"}	2025-09-21 14:19:46.744345+00
62	4	remove_global_restriction	page_restrictions	35	{"type": "global_restriction_removed", "pageKey": "chat"}	2025-09-21 14:19:49.500525+00
63	4	create_global_restriction	page_restrictions	47	{"type": "global_restriction_created", "pageKey": "transfers", "allowedUsersCount": 0}	2025-09-21 14:20:35.413768+00
64	4	remove_global_restriction	page_restrictions	47	{"type": "global_restriction_removed", "pageKey": "transfers"}	2025-09-21 14:23:54.233491+00
65	4	create_global_restriction	page_restrictions	48	{"type": "global_restriction_created", "pageKey": "notifications", "allowedUsersCount": 0}	2025-09-21 14:24:08.547054+00
66	4	remove_global_restriction	page_restrictions	48	{"type": "global_restriction_removed", "pageKey": "notifications"}	2025-09-21 14:24:39.198798+00
67	4	create_global_restriction	page_restrictions	49	{"type": "global_restriction_created", "pageKey": "transfers", "allowedUsersCount": 0}	2025-09-21 14:25:12.101316+00
68	4	remove_global_restriction	page_restrictions	49	{"type": "global_restriction_removed", "pageKey": "transfers"}	2025-09-21 14:25:30.397917+00
69	4	create_global_restriction	page_restrictions	50	{"type": "global_restriction_created", "pageKey": "statement", "allowedUsersCount": 1}	2025-09-21 14:26:16.060075+00
70	4	remove_exception	page_restrictions	51	{"type": "exception_removed", "pageKey": "statement", "targetUserId": 90}	2025-09-21 14:28:01.122413+00
71	4	remove_global_restriction	page_restrictions	50	{"type": "global_restriction_removed", "pageKey": "statement"}	2025-09-21 14:28:21.741519+00
72	4	create_global_restriction	page_restrictions	52	{"type": "global_restriction_created", "pageKey": "market", "allowedUsersCount": 1}	2025-09-21 17:46:26.144679+00
73	4	remove_exception	page_restrictions	53	{"type": "exception_removed", "pageKey": "market", "targetUserId": 101}	2025-09-21 17:47:00.232673+00
74	4	remove_global_restriction	page_restrictions	52	{"type": "global_restriction_removed", "pageKey": "market"}	2025-09-21 17:47:03.405112+00
75	4	create_global_restriction	page_restrictions	54	{"type": "global_restriction_created", "pageKey": "transfers", "allowedUsersCount": 1}	2025-09-21 17:47:28.659419+00
76	4	remove_exception	page_restrictions	55	{"type": "exception_removed", "pageKey": "transfers", "targetUserId": 102}	2025-09-21 18:00:21.477565+00
77	4	remove_global_restriction	page_restrictions	54	{"type": "global_restriction_removed", "pageKey": "transfers"}	2025-09-21 18:00:25.012206+00
78	4	create_global_restriction	page_restrictions	56	{"type": "global_restriction_created", "pageKey": "statement", "allowedUsersCount": 1}	2025-09-21 18:00:52.820976+00
79	4	remove_exception	page_restrictions	57	{"type": "exception_removed", "pageKey": "statement", "targetUserId": 102}	2025-09-21 18:20:32.867183+00
80	4	remove_global_restriction	page_restrictions	56	{"type": "global_restriction_removed", "pageKey": "statement"}	2025-09-21 18:20:50.512226+00
81	4	create_global_restriction	page_restrictions	58	{"type": "global_restriction_created", "pageKey": "balance", "allowedUsersCount": 1}	2025-09-21 18:21:53.965329+00
82	4	remove_exception	page_restrictions	59	{"type": "exception_removed", "pageKey": "balance", "targetUserId": 90}	2025-09-21 18:22:25.417565+00
83	4	remove_global_restriction	page_restrictions	58	{"type": "global_restriction_removed", "pageKey": "balance"}	2025-09-21 18:22:33.765889+00
84	4	create_global_restriction	page_restrictions	60	{"type": "global_restriction_created", "pageKey": "market", "allowedUsersCount": 1}	2025-09-22 11:54:05.804966+00
85	4	add_bulk_exceptions	page_restrictions	60	{"type": "bulk_exceptions_added", "pageKey": "market", "results": [{"status": "added", "identifier": "44003002"}], "addedCount": 1, "totalSubmitted": 1, "uniqueSubmitted": 1}	2025-09-22 12:32:18.133369+00
86	4	add_bulk_exceptions	page_restrictions	60	{"type": "bulk_exceptions_added", "pageKey": "market", "results": [{"status": "exists", "identifier": "44003002"}], "addedCount": 0, "totalSubmitted": 1, "uniqueSubmitted": 1}	2025-09-22 12:32:31.920686+00
87	4	remove_exception	page_restrictions	62	{"type": "exception_removed", "pageKey": "market", "targetUserId": 90}	2025-09-22 13:11:46.655841+00
88	4	add_bulk_exceptions	page_restrictions	60	{"type": "bulk_exceptions_added", "pageKey": "market", "results": [{"status": "added", "identifier": "44003002"}], "addedCount": 1, "totalSubmitted": 1, "uniqueSubmitted": 1}	2025-09-22 13:13:27.454344+00
89	4	remove_exception	page_restrictions	61	{"type": "exception_removed", "pageKey": "market", "targetUserId": 102}	2025-09-22 13:16:09.926721+00
90	4	add_bulk_exceptions	page_restrictions	60	{"type": "bulk_exceptions_added", "pageKey": "market", "results": [{"status": "added", "identifier": "33003003"}], "addedCount": 1, "totalSubmitted": 1, "uniqueSubmitted": 1}	2025-09-22 13:17:55.569323+00
91	4	remove_exception	page_restrictions	64	{"type": "exception_removed", "pageKey": "market", "targetUserId": 102}	2025-09-22 13:18:23.881458+00
92	4	remove_exception	page_restrictions	63	{"type": "exception_removed", "pageKey": "market", "targetUserId": 90}	2025-09-22 13:18:25.597358+00
93	4	remove_global_restriction	page_restrictions	60	{"type": "global_restriction_removed", "pageKey": "market"}	2025-09-22 13:18:29.837579+00
94	4	upsert_restriction	page_restrictions	65	{"type": "restriction_upsert", "scope": "page", "pageKey": "chat", "isActive": false, "targetUserId": 102, "accountNumber": "33003003"}	2025-09-22 13:19:09.798268+00
95	4	remove_restriction	page_restrictions	65	{"type": "restriction_removed", "userId": 102, "pageKey": "chat"}	2025-09-22 15:50:06.592954+00
96	4	upsert_restriction	page_restrictions	66	{"type": "restriction_upsert", "scope": "page", "pageKey": "notifications", "isActive": false, "targetUserId": 90, "accountNumber": "44003002"}	2025-09-22 15:50:55.393523+00
97	4	remove_restriction	page_restrictions	33	{"type": "restriction_removed", "userId": 90, "pageKey": "group_chats"}	2025-09-22 15:51:05.72135+00
98	4	remove_restriction	page_restrictions	66	{"type": "restriction_removed", "userId": 90, "pageKey": "notifications"}	2025-09-22 16:11:18.669863+00
99	4	upsert_restriction	page_restrictions	67	{"type": "restriction_upsert", "scope": "page", "pageKey": "city_transfers", "isActive": true, "targetUserId": 90, "accountNumber": "44003002"}	2025-09-22 16:12:04.956265+00
100	4	remove_restriction	page_restrictions	67	{"type": "restriction_removed", "userId": 90, "pageKey": "city_transfers"}	2025-09-22 16:12:17.978689+00
101	4	upsert_restriction	page_restrictions	68	{"type": "restriction_upsert", "scope": "page", "pageKey": "market", "isActive": true, "targetUserId": 90, "accountNumber": "44003002"}	2025-09-22 16:12:41.828508+00
102	4	remove_restriction	page_restrictions	68	{"type": "restriction_removed", "userId": 90, "pageKey": "market"}	2025-09-22 16:13:01.584996+00
103	4	create_global_restriction	page_restrictions	69	{"type": "global_restriction_created", "pageKey": "market", "allowedUsersCount": 0}	2025-09-22 16:13:25.277563+00
104	4	remove_global_restriction	page_restrictions	69	{"type": "global_restriction_removed", "pageKey": "market"}	2025-09-22 16:13:41.030726+00
105	4	delete_transactions	transactions	\N	{"errors": [], "timestamp": "2025-09-22T17:53:56.164Z", "adminEmail": "ss73ss73ss73@gmail.com", "deletedCount": 1, "requestedCount": 1, "transactionIds": ["1611"]}	2025-09-22 17:53:56.175514+00
106	4	delete_transactions	transactions	\N	{"errors": [], "timestamp": "2025-09-22T17:54:02.341Z", "adminEmail": "ss73ss73ss73@gmail.com", "deletedCount": 1, "requestedCount": 1, "transactionIds": ["1610"]}	2025-09-22 17:54:02.352144+00
107	4	delete_transactions	transactions	\N	{"errors": ["المعاملة 183 غير موجودة"], "timestamp": "2025-09-23T12:43:29.554Z", "adminEmail": "ss73ss73ss73@gmail.com", "deletedCount": 1, "requestedCount": 2, "transactionIds": ["1609", "183"]}	2025-09-23 12:43:29.565207+00
108	4	delete_transactions	transactions	\N	{"errors": ["المعاملة 149 غير موجودة", "المعاملة 149 غير موجودة", "المعاملة 148 غير موجودة", "المعاملة 148 غير موجودة", "المعاملة 147 غير موجودة", "المعاملة 147 غير موجودة", "المعاملة 146 غير موجودة", "المعاملة 146 غير موجودة", "المعاملة 182 غير موجودة", "المعاملة 181 غير موجودة", "المعاملة 145 غير موجودة", "المعاملة 145 غير موجودة", "المعاملة 70 غير موجودة", "المعاملة 180 غير موجودة", "المعاملة 179 غير موجودة"], "timestamp": "2025-09-23T12:44:07.395Z", "adminEmail": "ss73ss73ss73@gmail.com", "deletedCount": 32, "requestedCount": 47, "transactionIds": ["149", "149", "1606", "1605", "148", "148", "1604", "1603", "147", "147", "1602", "1601", "146", "146", "1600", "1599", "1598", "182", "1597", "1596", "1595", "181", "1594", "1593", "145", "145", "1592", "70", "1591", "1590", "1589", "1588", "180", "1587", "1586", "1585", "1584", "1583", "1582", "1581", "179", "1580", "1579", "1578", "1577", "1576", "1575"]}	2025-09-23 12:44:07.405811+00
109	4	delete_transfers	transfers	\N	{"errors": [], "timestamp": "2025-09-24T13:51:02.686Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": [150], "deletedCount": 1, "requestedCount": 1}	2025-09-24 13:51:02.697017+00
110	4	delete_transfers	transfers	\N	{"errors": ["خطأ في حذف التحويل city-70: invalid input syntax for type integer: \\"city-70\\""], "timestamp": "2025-09-24T15:26:26.632Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": ["city-70"], "deletedCount": 0, "requestedCount": 1}	2025-09-24 15:26:26.780967+00
111	4	delete_transfers	transfers	\N	{"errors": ["خطأ في حذف التحويل city-70: invalid input syntax for type integer: \\"city-70\\""], "timestamp": "2025-09-24T15:26:44.062Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": ["city-70"], "deletedCount": 0, "requestedCount": 1}	2025-09-24 15:26:44.208514+00
112	4	delete_transfers	transfers	\N	{"errors": ["التحويل city-70 غير موجود"], "timestamp": "2025-09-24T15:30:16.607Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": ["city-70"], "deletedCount": 0, "requestedCount": 1}	2025-09-24 15:30:16.618353+00
113	4	delete_transfers	transfers	\N	{"errors": [], "timestamp": "2025-09-24T15:30:25.635Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": ["internal-149"], "deletedCount": 1, "requestedCount": 1}	2025-09-24 15:30:25.645638+00
114	4	delete_transfers	transfers	\N	{"errors": ["التحويل city-70 غير موجود"], "timestamp": "2025-09-24T15:30:34.632Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": ["city-70"], "deletedCount": 0, "requestedCount": 1}	2025-09-24 15:30:34.643292+00
115	4	delete_transfers	transfers	\N	{"errors": [], "timestamp": "2025-09-24T15:30:42.827Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": ["internal-145"], "deletedCount": 1, "requestedCount": 1}	2025-09-24 15:30:42.838458+00
116	4	delete_transfers	transfers	\N	{"errors": [], "timestamp": "2025-09-24T15:31:05.302Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": ["internal-146"], "deletedCount": 1, "requestedCount": 1}	2025-09-24 15:31:05.313051+00
117	4	delete_transfers	transfers	\N	{"errors": ["التحويل city-70 غير موجود"], "timestamp": "2025-09-24T15:31:12.902Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": ["city-70"], "deletedCount": 0, "requestedCount": 1}	2025-09-24 15:31:12.913221+00
118	4	delete_transfers	transfers	\N	{"errors": [], "timestamp": "2025-09-24T15:35:13.078Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": ["city-70"], "deletedCount": 1, "requestedCount": 1}	2025-09-24 15:35:13.088948+00
119	4	delete_transfers	transfers	\N	{"errors": [], "timestamp": "2025-09-24T15:35:18.707Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": ["internal-147"], "deletedCount": 1, "requestedCount": 1}	2025-09-24 15:35:18.71818+00
120	4	delete_transfers	transfers	\N	{"errors": [], "timestamp": "2025-09-24T15:36:12.622Z", "adminEmail": "ss73ss73ss73@gmail.com", "transferIds": [148], "deletedCount": 1, "requestedCount": 1}	2025-09-24 15:36:12.636181+00
\.


--
-- Data for Name: badge_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.badge_types (id, name, name_ar, description, description_ar, icon, color, rarity, points_required, category, condition, active, created_at) FROM stdin;
1	first_transfer	أول تحويل	Complete your first money transfer	أتمم أول تحويل مالي	🏆	gold	common	0	financial	\N	t	2025-08-30 05:35:33.329963
2	transfer_master	خبير التحويلات	Complete 10 money transfers	أتمم 10 تحويلات مالية	💰	blue	rare	100	financial	\N	t	2025-08-30 05:35:33.329963
3	daily_user	مستخدم يومي	Login for 7 consecutive days	سجل دخول لمدة 7 أيام متتالية	📅	green	common	50	social	\N	t	2025-08-30 05:35:33.329963
4	loyalty_member	عضو مخلص	Login for 30 consecutive days	سجل دخول لمدة 30 يوم متتالي	👑	purple	epic	200	social	\N	t	2025-08-30 05:35:33.329963
5	market_trader	متداول السوق	Make your first market trade	أتمم أول عملية تداول في السوق	📈	orange	rare	75	financial	\N	t	2025-08-30 05:35:33.329963
6	level_up	ترقية المستوى	Reach level 5	وصل للمستوى 5	⭐	yellow	rare	150	achievement	\N	t	2025-08-30 05:35:33.329963
7	early_adopter	مستخدم مبكر	One of the first 100 users	من أول 100 مستخدم	🚀	red	legendary	0	achievement	\N	t	2025-08-30 05:35:33.329963
8	chat_master	خبير المحادثة	Send 100 messages in chat	أرسل 100 رسالة في المحادثة	💬	cyan	common	25	social	\N	t	2025-08-30 05:35:33.329963
\.


--
-- Data for Name: balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.balances (id, user_id, currency, amount) FROM stdin;
95	4	LYD	100039.4
96	4	USD	100032.75
141	90	LYD	25000
143	91	LYD	25000
144	91	USD	25000
142	90	USD	24654.51
140	89	USD	25310.49
139	89	LYD	23994
147	101	LYD	24832.7
145	102	LYD	26133
146	102	USD	24785
148	101	USD	34600.9
\.


--
-- Data for Name: chat_message_reads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_message_reads (message_id, user_id, read_at) FROM stdin;
124	102	2025-09-16 13:15:10.019157
125	102	2025-09-16 13:15:10.046503
107	102	2025-09-16 13:15:10.072952
108	102	2025-09-16 13:15:10.103026
109	102	2025-09-16 13:15:10.126028
113	102	2025-09-16 13:15:10.155187
117	102	2025-09-16 13:15:10.17876
122	102	2025-09-16 13:15:10.202604
107	38	2025-08-27 16:26:55.132745
124	101	2025-09-16 13:18:24.146574
125	101	2025-09-16 13:18:24.168929
107	101	2025-09-16 13:18:24.191046
108	101	2025-09-16 13:18:24.213475
109	101	2025-09-16 13:18:24.235839
113	101	2025-09-16 13:18:24.258049
117	101	2025-09-16 13:18:24.28437
122	101	2025-09-16 13:18:24.311841
107	40	2025-08-30 04:25:43.790731
107	56	2025-09-04 13:53:31.890309
126	4	2025-09-18 14:32:44.798027
127	4	2025-09-18 14:32:44.828243
128	4	2025-09-18 14:32:44.863486
124	90	2025-09-19 18:31:44.41148
125	90	2025-09-19 18:31:44.461468
126	90	2025-09-19 18:31:44.482843
127	90	2025-09-19 18:31:44.504968
128	90	2025-09-19 18:31:44.525887
129	90	2025-09-19 18:31:44.54747
107	90	2025-09-19 18:31:44.568811
108	90	2025-09-19 18:31:44.590501
109	90	2025-09-19 18:31:44.612241
113	90	2025-09-19 18:31:44.633381
117	90	2025-09-19 18:31:44.655312
122	90	2025-09-19 18:31:44.676953
126	102	2025-09-19 18:31:47.632841
127	102	2025-09-19 18:31:47.654844
128	102	2025-09-19 18:31:47.677086
129	102	2025-09-19 18:31:47.699616
130	90	2025-09-19 18:36:29.817261
132	90	2025-09-19 18:36:29.839626
131	102	2025-09-22 13:19:25.486323
129	4	2025-09-22 13:22:57.806748
130	4	2025-09-22 13:22:57.829112
131	4	2025-09-22 13:22:57.85094
132	4	2025-09-22 13:22:57.88825
130	101	2025-09-29 20:10:07.439394
131	101	2025-09-29 20:10:07.470277
132	101	2025-09-29 20:10:07.498158
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, room_id, sender_id, content, created_at, is_edited, edited_at, is_deleted, deleted_by, deleted_at, file_url, file_type, voice_id, voice_duration) FROM stdin;
124	1	4	255	2025-09-12 17:13:51.795771	f	\N	f	\N	\N	\N	\N	\N	\N
125	1	4	1	2025-09-12 18:12:39.962533	f	\N	f	\N	\N	\N	\N	\N	\N
126	1	101	🥒	2025-09-16 13:18:35.950351	f	\N	f	\N	\N	\N	\N	\N	\N
127	1	101	🌍	2025-09-16 13:18:43.24202	f	\N	f	\N	\N	\N	\N	\N	\N
128	1	101		2025-09-16 13:18:52.854891	f	\N	t	101	2025-09-16 13:19:00.042116	/uploads/1758028728614-675569838.png	image/png	\N	\N
129	1	101	1010	2025-09-18 16:14:57.8213	f	\N	f	\N	\N	\N	\N	\N	\N
130	1	102	55	2025-09-19 18:31:51.561475	f	\N	f	\N	\N	\N	\N	\N	\N
131	1	90	222	2025-09-19 18:32:10.773838	f	\N	f	\N	\N	\N	\N	\N	\N
132	1	102	55555	2025-09-19 18:32:16.135551	f	\N	f	\N	\N	\N	\N	\N	\N
133	1	101	77	2025-09-29 20:10:14.681175	f	\N	f	\N	\N	\N	\N	\N	\N
134	1	101	🥒	2025-09-29 20:10:25.797854	f	\N	f	\N	\N	\N	\N	\N	\N
135	1	101		2025-09-29 20:10:32.601597	f	\N	f	\N	\N	/uploads/1759176630403-118247282.png	image/png	\N	\N
107	1	4	1	2025-08-27 14:23:52.337895	f	\N	f	\N	\N	\N	\N	\N	\N
108	1	4	101	2025-09-04 22:50:00.630464	f	\N	f	\N	\N	\N	\N	\N	\N
109	1	4	1001	2025-09-06 13:39:34.771945	f	\N	f	\N	\N	\N	\N	\N	\N
113	1	4	101	2025-09-09 17:26:05.741269	f	\N	f	\N	\N	\N	\N	\N	\N
117	1	4	111	2025-09-09 18:01:00.150562	f	\N	t	4	2025-09-09 18:42:26.058275	\N	\N	\N	\N
122	1	4	10023	2025-09-10 09:55:46.09612	f	\N	f	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_rooms (id, name, description, is_public, created_at) FROM stdin;
1	الغرفة العامة	غرفة دردشة عامة لجميع المستخدمين	t	2025-05-21 19:28:30.449379
\.


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cities (id, country_id, name_ar, name_en, is_active) FROM stdin;
179	1	بنغازي	Benghazi	t
180	1	مصراتة	Misrata	t
181	1	الزاوية	Az Zawiyah	t
182	1	البيضاء	Al Bayda	t
183	1	طبرق	Tobruk	t
184	1	أجدابيا	Ajdabiya	t
185	1	درنة	Derna	t
186	1	زليتن	Zliten	t
187	1	سبها	Sabha	t
188	1	زوارة	Zuwarah	t
189	1	الخمس	Al Khums	t
190	1	سرت	Sirte	t
191	1	غريان	Gharyan	t
192	1	الكفرة	Al Kufrah	t
147	1	طرابلس	Tripoli	t
148	2	واشنطن	Washington D.C.	t
149	24	أنقرة	Ankara	t
150	25	أبوظبي	Abu Dhabi	t
151	26	القاهرة	Cairo	t
152	27	تونس	Tunis	t
153	28	الرياض	Riyadh	t
154	29	عمان	Amman	t
155	30	الدوحة	Doha	t
156	31	الكويت	Kuwait City	t
157	32	مسقط	Muscat	t
158	33	المنامة	Manama	t
159	34	الرباط	Rabat	t
160	35	الجزائر	Algiers	t
161	36	الخرطوم	Khartoum	t
162	37	صنعاء	Sanaa	t
163	38	دمشق	Damascus	t
164	39	بيروت	Beirut	t
165	40	بغداد	Baghdad	t
166	41	القدس	Jerusalem	t
167	42	لندن	London	t
168	43	برلين	Berlin	t
169	44	باريس	Paris	t
170	45	روما	Rome	t
171	46	مدريد	Madrid	t
172	47	أوتاوا	Ottawa	t
173	48	كانبيرا	Canberra	t
174	49	طوكيو	Tokyo	t
175	50	بكين	Beijing	t
176	51	نيودلهي	New Delhi	t
177	52	موسكو	Moscow	t
178	53	برازيليا	Brasília	t
193	1	مرزق	Murzuq	t
194	1	راس لانوف	Ras Lanuf	t
195	1	البريقة	Brega	t
196	1	اوباري	Ubari	t
197	1	الجفرة	Al Jufrah	t
198	1	نالوت	Nalut	t
199	1	يفرن	Yafran	t
200	1	مزدة	Mizda	t
201	1	هون	Hun	t
202	1	بني وليد	Bani Walid	t
203	1	ترهونة	Tarhuna	t
204	1	العزيزية	Al Aziziyah	t
205	1	القره بوللي	Qasr Ahmad	t
206	1	صبراتة	Sabratha	t
207	1	العجيلات	Al Ajaylat	t
208	1	رقدالين	Rikdalin	t
209	231	كابول	Kabul	t
210	231	قندهار	Kandahar	t
211	231	هرات	Herat	t
212	231	مزار شريف	Mazar-i-Sharif	t
213	232	يريفان	Yerevan	t
214	232	غيومري	Gyumri	t
215	232	فانادزور	Vanadzor	t
216	233	باكو	Baku	t
217	233	غانجا	Ganja	t
218	233	سومقايت	Sumqayit	t
219	146	فيينا	Vienna	t
220	146	غراتس	Graz	t
221	146	لينز	Linz	t
222	146	سالزبورغ	Salzburg	t
223	148	بروكسل	Brussels	t
224	148	أنتويرب	Antwerp	t
225	148	غنت	Ghent	t
226	148	شارلروا	Charleroi	t
227	153	كوبنهاغن	Copenhagen	t
228	153	آرهوس	Aarhus	t
229	153	أودنسي	Odense	t
230	155	هلسنكي	Helsinki	t
231	155	إسبو	Espoo	t
232	155	تامبيري	Tampere	t
233	156	أثينا	Athens	t
234	156	ثيسالونيكي	Thessaloniki	t
235	156	باتراس	Patras	t
236	157	بودابست	Budapest	t
237	157	ديبريتسين	Debrecen	t
238	157	سيجد	Szeged	t
239	158	ريكيافيك	Reykjavik	t
240	158	كوبافوغور	Kopavogur	t
241	159	دبلن	Dublin	t
242	159	كورك	Cork	t
243	159	ليمريك	Limerick	t
244	165	أوسلو	Oslo	t
245	165	بيرغن	Bergen	t
246	165	ترونهايم	Trondheim	t
247	173	ستوكهولم	Stockholm	t
248	173	غوتنبرغ	Gothenburg	t
249	173	مالمو	Malmö	t
270	211	بوينس آيرس	Buenos Aires	t
271	211	قرطبة	Córdoba	t
272	211	روساريو	Rosario	t
273	213	سانتياغو	Santiago	t
274	213	فالبارايسو	Valparaíso	t
275	214	بوغوتا	Bogotá	t
276	214	ميديلين	Medellín	t
277	214	كالي	Cali	t
278	224	مكسيكو سيتي	Mexico City	t
279	224	غوادالاخارا	Guadalajara	t
280	224	مونتيري	Monterrey	t
281	228	ليما	Lima	t
282	228	أريكيبا	Arequipa	t
283	230	كاراكاس	Caracas	t
284	230	ماراكايبو	Maracaibo	t
285	230	فالنسيا	Valencia	t
286	178	زيوريخ	Zurich	t
287	178	جنيف	Geneva	t
288	178	بازل	Basel	t
289	178	برن	Bern	t
290	234	دكا	Dhaka	t
291	234	شيتاغونغ	Chittagong	t
292	234	خولنا	Khulna	t
293	239	جاكرتا	Jakarta	t
294	239	سورابايا	Surabaya	t
295	239	باندونغ	Bandung	t
296	239	ميدان	Medan	t
297	247	كوالالمبور	Kuala Lumpur	t
298	247	جورج تاون	George Town	t
299	247	جوهور بهرو	Johor Bahru	t
300	258	بانكوك	Bangkok	t
301	258	شيانغ ماي	Chiang Mai	t
302	258	بوكيت	Phuket	t
303	262	هانوي	Hanoi	t
304	262	هو تشي مين	Ho Chi Minh City	t
305	262	هايفونغ	Haiphong	t
306	262	دا نانغ	Da Nang	t
307	72	أكرا	Accra	t
308	72	كوماسي	Kumasi	t
309	76	نيروبي	Nairobi	t
310	76	مومباسا	Mombasa	t
311	87	لاغوس	Lagos	t
312	87	أبوجا	Abuja	t
313	87	كانو	Kano	t
314	94	كيب تاون	Cape Town	t
315	94	جوهانسبرغ	Johannesburg	t
316	94	ديربان	Durban	t
317	69	أديس أبابا	Addis Ababa	t
318	96	دار السلام	Dar es Salaam	t
319	96	دودوما	Dodoma	t
320	170	وارسو	Warsaw	t
321	170	كراكوف	Krakow	t
322	170	غدانسك	Gdansk	t
323	172	بوخارست	Bucharest	t
324	172	كلوج نابوكا	Cluj-Napoca	t
325	172	تيميشوارا	Timisoara	t
326	171	لشبونة	Lisbon	t
327	171	بورتو	Porto	t
328	171	براغا	Braga	t
329	167	أمستردام	Amsterdam	t
330	167	روتردام	Rotterdam	t
331	167	لاهاي	The Hague	t
332	151	زغرب	Zagreb	t
333	151	سبليت	Split	t
334	151	رييكا	Rijeka	t
335	152	براغ	Prague	t
336	152	برنو	Brno	t
337	152	أوسترافا	Ostrava	t
338	240	طهران	Tehran	t
339	240	مشهد	Mashhad	t
340	240	أصفهان	Isfahan	t
341	240	شيراز	Shiraz	t
342	240	تبريز	Tabriz	t
343	240	كرج	Karaj	t
344	240	أهواز	Ahvaz	t
345	240	قم	Qom	t
346	240	كرمانشاه	Kermanshah	t
347	240	رشت	Rasht	t
348	145	تيرانا	Tirana	t
349	145	دوريس	Durrës	t
350	145	فلورا	Vlorë	t
351	54	لواندا	Luanda	t
352	54	هوامبو	Huambo	t
353	54	لوبانغو	Lubango	t
354	229	مونتيفيديو	Montevideo	t
355	229	سالتو	Salto	t
356	261	طشقند	Tashkent	t
357	261	سمرقند	Samarkand	t
358	261	بخارى	Bukhara	t
359	98	كمبالا	Kampala	t
360	98	جينجا	Jinja	t
361	179	كييف	Kyiv	t
362	179	خاركيف	Kharkiv	t
363	179	أوديسا	Odesa	t
364	179	دنيبرو	Dnipro	t
365	67	أسمرة	Asmara	t
366	67	مصوع	Massawa	t
367	154	تالين	Tallinn	t
368	154	تارتو	Tartu	t
369	218	كيتو	Quito	t
370	218	غواياكيل	Guayaquil	t
371	149	سراييفو	Sarajevo	t
372	149	بانيا لوكا	Banja Luka	t
373	166	بودغوريتسا	Podgorica	t
374	166	نيكشيتش	Nikšić	t
375	219	سان سلفادور	San Salvador	t
376	219	سانتا آنا	Santa Ana	t
377	90	داكار	Dakar	t
378	90	ثييس	Thiès	t
379	93	مقديشو	Mogadishu	t
380	93	هرجيسا	Hargeisa	t
381	70	ليبرفيل	Libreville	t
382	70	بورت جنتيل	Port-Gentil	t
383	253	مانيلا	Manila	t
384	253	كويزون سيتي	Quezon City	t
385	253	دافاو	Davao	t
386	253	سيبو	Cebu	t
387	59	ياوندي	Yaoundé	t
388	59	دوالا	Douala	t
389	59	غاروا	Garoua	t
390	252	إسلام آباد	Islamabad	t
391	252	كراتشي	Karachi	t
392	252	لاهور	Lahore	t
393	252	فيصل آباد	Faisalabad	t
394	242	نور سلطان	Nur-Sultan	t
395	242	ألماتي	Almaty	t
396	244	سيول	Seoul	t
397	244	بوسان	Busan	t
398	244	إنتشون	Incheon	t
399	243	بيونغ يانغ	Pyongyang	t
400	249	أولان باتور	Ulaanbaatar	t
401	250	يانغون	Yangon	t
402	250	نايبيداو	Naypyidaw	t
403	251	كاتماندو	Kathmandu	t
404	251	بوخارا	Pokhara	t
405	97	لومي	Lomé	t
406	259	ديلي	Dili	t
407	223	كينغستون	Kingston	t
408	223	سبانيش تاون	Spanish Town	t
409	63	موروني	Moroni	t
410	248	ماليه	Malé	t
411	61	بانغي	Bangui	t
412	217	سانتو دومينغو	Santo Domingo	t
413	217	سانتياغو	Santiago	t
414	64	كينشاسا	Kinshasa	t
415	64	لوبومباشي	Lubumbashi	t
416	95	جوبا	Juba	t
417	238	تبليسي	Tbilisi	t
418	238	باتومي	Batumi	t
419	150	صوفيا	Sofia	t
420	150	بلوفديف	Plovdiv	t
421	175	براتيسلافا	Bratislava	t
422	175	كوشيتسه	Košice	t
423	176	ليوبليانا	Ljubljana	t
424	176	ماريبور	Maribor	t
425	160	ريغا	Riga	t
426	161	فيلنيوس	Vilnius	t
427	161	كاوناس	Kaunas	t
428	162	لوكسمبورغ	Luxembourg	t
429	163	فاليتا	Valletta	t
430	164	كيشيناو	Chișinău	t
431	235	تيمفو	Thimphu	t
432	236	بندر سري بكاوان	Bandar Seri Begawan	t
433	57	واغادوغو	Ouagadougou	t
434	58	بوجومبورا	Bujumbura	t
435	220	مدينة غواتيمالا	Guatemala City	t
436	221	بورت أو برنس	Port-au-Prince	t
437	222	تيغوسيغالبا	Tegucigalpa	t
438	237	بنوم بنه	Phnom Penh	t
439	237	سيام ريب	Siem Reap	t
440	246	فيانتيان	Vientiane	t
441	245	بيشكيك	Bishkek	t
442	257	دوشانبي	Dushanbe	t
443	260	عشق آباد	Ashgabat	t
444	55	بورتو نوفو	Porto-Novo	t
445	55	كوتونو	Cotonou	t
446	56	غابورون	Gaborone	t
447	60	برايا	Praia	t
448	62	نجامينا	N'Djamena	t
449	65	جيبوتي	Djibouti	t
450	66	مالابو	Malabo	t
451	71	بانجول	Banjul	t
452	73	كوناكري	Conakry	t
453	74	بيساو	Bissau	t
454	75	أبيدجان	Abidjan	t
455	75	ياموسوكرو	Yamoussoukro	t
456	77	ماسيرو	Maseru	t
457	78	مونروفيا	Monrovia	t
458	215	سان خوسيه	San José	t
459	216	هافانا	Havana	t
460	216	سانتياغو دي كوبا	Santiago de Cuba	t
461	225	ماناغوا	Managua	t
462	226	مدينة بنما	Panama City	t
463	227	أسونسيون	Asunción	t
464	212	لا باز	La Paz	t
465	212	سوكري	Sucre	t
466	147	مينسك	Minsk	t
467	168	سكوبيه	Skopje	t
468	174	بلغراد	Belgrade	t
469	174	نوفي ساد	Novi Sad	t
470	165	موناكو	Monaco	t
471	173	سان مارينو	San Marino	t
472	169	أوسلو	Oslo	t
473	169	بيرغن	Bergen	t
474	169	ترونهايم	Trondheim	t
475	169	ستافانغر	Stavanger	t
476	169	كريستيانساند	Kristiansand	t
477	169	فريدريكستاد	Fredrikstad	t
478	169	تروسو	Tromsø	t
\.


--
-- Data for Name: city_transfer_commissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.city_transfer_commissions (id, agent_id, origin_city, destination_city, min_amount, max_amount, commission, currency_code, created_at, updated_at, per_mille_rate) FROM stdin;
32	101	\N	\N	100	1000	2	LYD	2025-09-14 17:01:56.507586	2025-09-14 17:01:56.507586	\N
33	102	\N	\N	100	1000	3	LYD	2025-09-14 17:02:34.186381	2025-09-14 17:02:34.186381	\N
\.


--
-- Data for Name: city_transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.city_transfers (id, sender_id, receiver_office_id, amount, commission_for_receiver, commission_for_system, currency, code, status, created_at, completed_at, recipient_name) FROM stdin;
\.


--
-- Data for Name: commission_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commission_logs (id, user_id, user_name, offer_type, commission_amount, commission_currency, source_id, source_type, action, description, created_at) FROM stdin;
170	102	رمزي ابراهيم	sell	3.00	USD	107	market_offer	transferred	عمولة عرض سوق كامل: USD→LYD, المبلغ الأصلي: 100	2025-09-24 13:04:12.911278
\.


--
-- Data for Name: commission_pool_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commission_pool_transactions (id, source_type, source_id, source_name, currency_code, amount, transaction_type, related_transaction_id, description, created_at) FROM stdin;
252	user	33	المستخدم #33	USD	10	credit	69	عمولة النظام - تحويل بين المكاتب - رمز: 695333	2025-08-24 16:40:49.82097
253	user	33	المستخدم #33	USD	2.5	credit	70	عمولة النظام - تحويل بين المكاتب - رمز: 362962	2025-08-24 17:28:39.894046
254	user	32	المستخدم #32	USD	2.5	credit	71	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 836712	2025-08-25 10:08:01.474503
255	user	37	المستخدم #37	USD	2.5	credit	72	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 375668	2025-08-25 12:54:04.397384
256	user	37	المستخدم #37	USD	2.5	credit	73	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 794721	2025-08-25 15:40:49.774047
257	user	36	المستخدم #36	USD	2.5	credit	74	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 683442	2025-08-25 16:04:56.968832
258	user	37	المستخدم #37	USD	2.5	credit	75	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 404735	2025-08-25 16:30:23.785859
259	user	37	المستخدم #37	USD	2.5	credit	76	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 405530	2025-08-25 16:51:51.588938
260	user	38	المستخدم #38	USD	2.5	credit	77	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 451158	2025-08-25 18:46:51.618413
261	user	38	المستخدم #38	USD	2.5	credit	78	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 820276	2025-08-25 18:54:02.22066
262	user	38	المستخدم #38	USD	2.5	credit	79	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 623591	2025-08-25 19:05:05.941834
263	user	38	المستخدم #38	USD	2.5	credit	80	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 129249	2025-08-25 19:17:23.869764
264	user	38	المستخدم #38	USD	2.5	credit	81	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 121598	2025-08-26 15:54:15.609648
265	user	38	المستخدم #38	USD	2.5	credit	82	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 825892	2025-08-26 15:59:44.384168
267	user	38	سالم صالح	LYD	10	credit	49	عمولة حوالة بين المدن - رقم الحوالة: 233881	2025-08-26 16:21:25.054277
268	user	38	سالم صالح	LYD	10	credit	50	عمولة حوالة بين المدن - رقم الحوالة: 597549	2025-08-26 16:23:34.229322
269	user	38	سالم صالح	LYD	1	credit	51	عمولة حوالة بين المدن - رقم الحوالة: 778017	2025-08-26 16:33:52.325327
270	user	38	سالم صالح	LYD	10	credit	52	عمولة حوالة بين المدن - رقم الحوالة: 948258	2025-08-26 16:34:57.249475
271	user	38	سالم صالح	LYD	10	credit	53	عمولة حوالة بين المدن - رقم الحوالة: 614582	2025-08-26 16:43:40.675773
274	user	38	المستخدم #38	USD	2.5	credit	83	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 219517	2025-08-26 16:48:20.604401
275	user	38	سالم صالح	LYD	10	credit	54	عمولة حوالة بين المدن - رقم الحوالة: 899427	2025-08-26 18:33:18.839109
277	user	38	سالم صالح	LYD	10	credit	55	عمولة حوالة بين المدن - رقم الحوالة: 169865	2025-08-26 18:49:30.091154
279	user	38	سالم صالح	LYD	10	credit	56	عمولة حوالة بين المدن - رقم الحوالة: 966343	2025-08-26 18:54:04.074443
281	user	38	سالم صالح	LYD	10	credit	57	عمولة حوالة بين المدن - رقم الحوالة: 201562	2025-08-26 18:58:59.965088
285	user	38	سالم صالح	LYD	1	credit	58	عمولة حوالة بين المدن - رقم الحوالة: 369067	2025-08-26 19:10:31.044091
272	user	38	استلام حوالة بين المدن	LYD	10	credit	53	عمولة النظام - استلام حوالة مدينية برمز: 614582	2025-08-26 16:44:33.888659
280	user	38	استلام حوالة بين المدن	LYD	10	credit	56	عمولة النظام - استلام حوالة مدينية برمز: 966343	2025-08-26 18:54:43.354909
276	user	38	استلام حوالة بين المدن	LYD	10	credit	54	عمولة النظام - استلام حوالة مدينية برمز: 899427	2025-08-26 18:33:34.7055
282	user	38	استلام حوالة بين المدن	LYD	10	credit	57	عمولة النظام - استلام حوالة مدينية برمز: 201562	2025-08-26 18:59:35.971914
286	user	38	استلام حوالة بين المدن	LYD	1	credit	58	عمولة النظام - استلام حوالة مدينية برمز: 369067	2025-08-26 19:10:58.712528
278	user	38	استلام حوالة بين المدن	LYD	10	credit	55	عمولة النظام - استلام حوالة مدينية برمز: 169865	2025-08-26 18:49:49.742777
283	user	38	سالم صالح	LYD	10	credit	110	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-26 19:04:13.444527
266	user	38	سالم صالح	LYD	10	credit	108	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-26 16:12:52.88529
284	user	38	سالم صالح	LYD	10	credit	111	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-26 19:07:14.725689
273	user	38	سالم صالح	LYD	10	credit	109	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-26 16:47:04.24452
287	user	38	سالم صالح	LYD	10.6	credit	112	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-27 14:31:16.260281
288	user	38	سالم صالح	LYD	10.6	credit	113	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-27 14:36:28.122696
289	user	38	سالم صالح	LYD	10.6	credit	114	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-27 14:41:35.878789
290	user	38	سالم صالح	LYD	10.6	credit	115	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-27 15:32:10.60577
291	user	38	سالم صالح	LYD	10.6	credit	116	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-27 15:40:29.627707
292	user	38	سالم صالح	USD	1	credit	117	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-27 15:49:24.901949
293	user	38	سالم صالح	LYD	10.6	credit	118	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-27 15:59:14.505179
294	user	38	سالم صالح	LYD	10.6	credit	119	عمولة تحويل داخلي من سالم صالح إلى مسعود سالم	2025-08-27 16:04:34.26367
295	user	37	مسعود سالم	LYD	10.6	credit	120	عمولة تحويل داخلي من مسعود سالم إلى سعد خليفة	2025-08-27 16:07:35.777226
296	user	37	مسعود سالم	LYD	10.6	credit	121	عمولة تحويل داخلي من مسعود سالم إلى سعد خليفة	2025-08-27 16:08:03.587296
297	user	37	مسعود سالم	LYD	10.6	credit	122	عمولة تحويل داخلي من مسعود سالم إلى سعد خليفة	2025-08-27 16:08:32.882593
298	user	38	سالم صالح	LYD	1	credit	59	عمولة حوالة بين المدن - رقم الحوالة: 246477	2025-08-27 16:53:03.192343
299	user	38	استلام حوالة مدينية	LYD	1	credit	59	عمولة النظام - استلام حوالة مدينية برمز: 246477	2025-08-27 16:53:25.149802
300	user	37	المستخدم #37	USD	2.5	credit	84	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 553013	2025-08-27 18:52:23.29132
301	user	38	المستخدم #38	USD	2.5	credit	85	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 840417	2025-08-27 19:03:06.473743
302	user	38	المستخدم #38	USD	2.5	credit	86	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 200284	2025-08-27 19:05:33.801853
303	user	38	المستخدم #38	USD	2.5	credit	87	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 355789	2025-08-27 19:11:29.232195
304	user	38	المستخدم #38	USD	2.5	credit	88	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 928945	2025-08-28 08:11:51.543152
305	user	38	المستخدم #38	USD	2.5	credit	89	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 701503	2025-08-28 08:12:20.765162
306	user	38	المستخدم #38	USD	2.5	credit	90	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 631039	2025-08-28 08:17:05.354374
307	user	38	المستخدم #38	USD	2.5	credit	91	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 854123	2025-08-28 08:17:57.973085
308	user	38	المستخدم #38	USD	2.5	credit	92	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 280746	2025-08-28 08:26:22.92721
309	user	38	المستخدم #38	USD	2.5	credit	93	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 784445	2025-08-28 08:26:45.474009
310	user	38	المستخدم #38	USD	2.5	credit	94	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 327223	2025-08-28 08:27:13.766187
311	user	38	المستخدم #38	USD	2.5	credit	95	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 726017	2025-08-28 08:28:15.43653
312	user	38	المستخدم #38	USD	2.5	credit	96	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 474321	2025-08-28 08:28:39.088699
313	user	38	المستخدم #38	USD	2.5	credit	97	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 271814	2025-08-28 09:33:56.168724
314	user	38	المستخدم #38	USD	2.5	credit	98	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 938135	2025-08-28 09:34:24.457006
315	user	38	المستخدم #38	USD	2.5	credit	99	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 410709	2025-08-28 09:34:51.437968
316	user	38	المستخدم #38	USD	2.5	credit	100	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 738873	2025-08-28 09:37:38.4537
317	user	38	المستخدم #38	USD	2.5	credit	101	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 346059	2025-08-28 09:38:07.733016
318	user	38	المستخدم #38	USD	2.5	credit	102	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 818727	2025-08-28 09:38:45.423819
319	user	38	المستخدم #38	USD	2.5	credit	103	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 692399	2025-08-28 09:39:16.446865
320	user	37	المستخدم #37	USD	2.5	credit	104	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 521496	2025-08-28 09:46:09.195107
321	user	37	المستخدم #37	USD	2.5	credit	105	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 870597	2025-08-28 09:47:13.391475
322	user	37	المستخدم #37	LYD	2	credit	106	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 443337	2025-08-28 09:47:38.512819
323	user	37	المستخدم #37	USD	2.5	credit	107	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 410822	2025-08-28 09:50:38.478376
324	user	37	المستخدم #37	USD	2.5	credit	108	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 434952	2025-08-28 09:50:58.955157
325	user	37	المستخدم #37	USD	2.5	credit	109	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 684214	2025-08-28 09:54:54.584831
326	user	37	المستخدم #37	USD	2.5	credit	110	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 370075	2025-08-28 09:55:18.903043
327	user	37	المستخدم #37	USD	2.5	credit	111	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 517547	2025-08-28 09:55:38.470502
328	user	37	المستخدم #37	USD	2.5	credit	112	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 483144	2025-08-28 09:56:13.123212
329	user	37	المستخدم #37	USD	2.5	credit	113	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 204947	2025-08-28 10:07:09.288962
330	user	37	المستخدم #37	USD	2.5	credit	114	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 543552	2025-08-28 10:07:28.510452
331	user	38	المستخدم #38	USD	2.5	credit	115	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 908392	2025-08-28 10:16:29.131123
332	user	38	المستخدم #38	USD	2.5	credit	116	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 764590	2025-08-28 10:16:52.133162
333	user	38	المستخدم #38	USD	2.5	credit	117	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 926839	2025-08-28 10:20:41.992424
334	user	38	المستخدم #38	USD	2.5	credit	118	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 578833	2025-08-28 10:21:04.884186
335	user	37	المستخدم #37	USD	2.5	credit	119	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 666284	2025-08-28 10:25:11.140344
336	user	37	المستخدم #37	USD	2.5	credit	120	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 734895	2025-08-28 10:25:30.262499
337	user	38	المستخدم #38	USD	2.5	credit	121	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 787543	2025-08-28 10:29:19.540636
338	user	38	المستخدم #38	USD	2.5	credit	122	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 198368	2025-08-28 10:29:41.617877
339	user	38	المستخدم #38	USD	2.5	credit	123	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 972242	2025-08-28 10:36:28.299177
340	user	38	المستخدم #38	USD	2.5	credit	124	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 573076	2025-08-28 10:36:50.567453
341	user	38	المستخدم #38	USD	2.5	credit	125	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 659520	2025-08-28 10:40:17.554943
342	user	38	المستخدم #38	USD	2.5	credit	126	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 871301	2025-08-28 10:40:45.342076
343	user	38	المستخدم #38	USD	2.5	credit	127	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 215325	2025-08-28 10:48:33.948043
344	user	38	المستخدم #38	USD	2.5	credit	128	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 442279	2025-08-28 10:50:07.069261
345	user	38	المستخدم #38	USD	2.5	credit	129	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 334890	2025-08-28 10:56:32.140436
346	user	38	المستخدم #38	USD	2.5	credit	130	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 784862	2025-08-28 10:57:22.480494
347	user	38	المستخدم #38	USD	2.5	credit	131	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 677513	2025-08-28 10:58:11.886972
348	user	38	المستخدم #38	USD	2.5	credit	132	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 752350	2025-08-28 10:58:48.377849
349	user	40	المستخدم #40	USD	2.5	credit	133	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 610968	2025-08-30 18:35:48.450662
350	user	51	معتز محمد	LYD	10.6	credit	123	عمولة تحويل داخلي من معتز محمد إلى يونس عمر	2025-08-31 18:33:48.441045
351	user	51	معتز محمد	LYD	10.6	credit	124	عمولة تحويل داخلي من معتز محمد إلى مدير النظام	2025-08-31 18:48:37.103397
352	user	53	عمران صالح	LYD	10.6	credit	125	عمولة تحويل داخلي من عمران صالح إلى يونس عمر	2025-08-31 19:02:45.953946
353	user	52	يونس عمر	LYD	10.6	credit	126	عمولة تحويل داخلي من يونس عمر إلى عمران صالح	2025-08-31 19:09:39.007004
354	user	52	مستخدم اختبار	LYD	1.50	credit	127	عمولة تحويل داخلي	2025-08-31 21:05:45.073696
355	user	52	يونس عمر	LYD	10.6	credit	128	عمولة تحويل داخلي من يونس عمر إلى عمران صالح	2025-08-31 21:39:12.703944
356	user	52	يونس عمر	LYD	10.6	credit	131	عمولة تحويل داخلي من يونس عمر إلى عمران صالح	2025-08-31 21:46:16.738624
357	user	52	يونس عمر	LYD	5	credit	132	عمولة تحويل داخلي من يونس عمر إلى عمران صالح	2025-08-31 21:56:56.823825
358	system	\N	النظام	LYD	353	withdrawal	\N	353	2025-09-01 15:37:15.195075
359	system	\N	النظام	USD	168.50	withdrawal	\N	168.50 	2025-09-01 15:37:36.180253
360	user	55	المستخدم #55	USD	2.5	credit	134	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 637473	2025-09-01 15:50:58.409132
361	user	55	المستخدم #55	USD	2.5	credit	135	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 833558	2025-09-01 15:53:24.846953
362	system	\N	النظام	USD	5	withdrawal	\N	5	2025-09-01 16:11:40.193181
363	user	55	المستخدم #55	USD	2.5	credit	136	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 664815	2025-09-01 16:22:06.015915
364	user	55	المستخدم #55	USD	2.5	credit	137	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 915191	2025-09-01 16:30:18.088149
365	user	55	المستخدم #55	USD	2.5	credit	138	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 587891	2025-09-01 16:47:44.950129
366	system	\N	النظام	USD	7.5	withdrawal	\N	555	2025-09-01 16:48:45.660742
367	user	55	المستخدم #55	USD	2.5	credit	139	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 958447	2025-09-01 16:53:13.973348
368	system	\N	النظام	USD	2.5	withdrawal	\N	222	2025-09-01 17:02:25.42421
369	user	55	المستخدم #55	USD	2.5	credit	140	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 400349	2025-09-01 17:06:31.409007
370	system	\N	النظام	USD	2.5	withdrawal	\N	222	2025-09-01 17:14:20.274854
371	user	55	المستخدم #55	USD	2.5	credit	141	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 688696	2025-09-01 17:14:26.065921
372	system	\N	النظام	USD	2.5	withdrawal	\N	555	2025-09-01 17:19:14.235018
373	user	55	المستخدم #55	USD	2.5	credit	142	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 174348	2025-09-01 17:20:01.895882
374	system	\N	النظام	USD	2.5	withdrawal	\N	555	2025-09-01 17:23:06.022175
375	user	55	المستخدم #55	USD	2.5	credit	143	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 914380	2025-09-01 17:33:50.965248
376	system	\N	النظام	LYD	0.10	withdrawal	\N	88	2025-09-01 17:34:22.153645
377	system	\N	النظام	USD	2.5	withdrawal	\N	888	2025-09-01 18:01:05.735407
378	user	55	المستخدم #55	USD	2.5	credit	144	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 799995	2025-09-01 18:01:35.190747
379	system	\N	النظام	USD	2.5	withdrawal	\N	1236	2025-09-01 18:08:12.136011
380	user	55	المستخدم #55	USD	2.5	credit	145	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 709483	2025-09-01 18:13:06.892456
381	system	\N	النظام	USD	2.5	withdrawal	\N	1235	2025-09-01 18:13:38.9131
383	system	1	حوالة بين المكاتب - 555444	USD	15	credit	\N	عمولة من حوالة بين المكاتب - 555444	2025-09-01 18:48:12.729832
384	system	1	حوالة بين المكاتب - 390384	USD	2.5	credit	\N	عمولة من حوالة بين المكاتب - 390384	2025-09-01 18:49:12.962747
385	system	\N	النظام	USD	17.5	withdrawal	\N	123	2025-09-01 18:49:50.083085
386	system	1	حوالة بين المكاتب - 706272	USD	2.5	credit	\N	عمولة من حوالة بين المكاتب - 706272	2025-09-01 18:53:20.377661
387	system	1	حوالة بين المكاتب - 972620	USD	2.5	credit	\N	عمولة من حوالة بين المكاتب - 972620	2025-09-01 18:57:46.26028
388	system	1	حوالة بين المكاتب - 811393	USD	2.5	credit	\N	عمولة من حوالة بين المكاتب - 811393	2025-09-01 19:05:56.058455
389	system	\N	النظام	USD	7	withdrawal	\N	555	2025-09-01 19:06:26.885259
390	system	\N	النظام	USD	0.50	withdrawal	\N	555	2025-09-01 19:06:38.329689
391	system	1	حوالة بين المكاتب - 422410	USD	2.5	credit	\N	عمولة من حوالة بين المكاتب - 422410	2025-09-01 19:08:04.033962
393	system	8	حوالة دولية - رمز: TEST456	USD	19.5	credit	\N	عمولة نظام (بعد خصم مكافأة إحالة 0.5) - رمز: TEST456	2025-09-02 04:54:40.673014
394	system	\N	النظام	USD	22	withdrawal	\N	غغاا	2025-09-02 05:10:52.455526
395	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.5) - 204878	USD	2	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.5) - 204878	2025-09-02 11:03:20.63568
396	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.5) - 970671	USD	2	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.5) - 970671	2025-09-02 11:06:15.499685
397	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.5) - 838589	USD	2	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.5) - 838589	2025-09-02 11:14:44.127188
398	user	55	صالح عاشور	LYD	9	credit	133	عمولة تحويل داخلي (بعد خصم مكافأة إحالة 1) من صالح عاشور إلى ابراهيم سعد	2025-09-02 11:18:17.292174
399	user	55	استلام حوالة مدينية	LYD	1	credit	61	عمولة النظام (بعد خصم مكافأة إحالة 1) - حوالة مدينية: 720194	2025-09-02 12:40:09.456098
400	user	55	صالح عاشور	LYD	0.5	credit	134	عمولة تحويل داخلي (بعد خصم مكافأة إحالة 1) من صالح عاشور إلى ابراهيم سعد	2025-09-02 15:36:04.344223
401	user	55	صالح عاشور	LYD	1	credit	135	عمولة تحويل داخلي (بعد خصم مكافأة إحالة 1) من صالح عاشور إلى ابراهيم سعد	2025-09-02 15:44:57.396856
402	user	55	عمولة بيع مكتملة: USD→LYD	USD	20.000000	credit	\N	عمولة من معاملة سوق العملة مكتملة - البائع: 55, المشتري: 54 (كانت مخصومة ومعلقة عند النشر)	2025-09-02 16:20:45.7515
403	user	55	عمولة بيع مكتملة: USD→LYD	USD	0.200000	credit	\N	عمولة من معاملة سوق العملة مكتملة - البائع: 55, المشتري: 54 (كانت مخصومة ومعلقة عند النشر)	2025-09-02 16:34:31.63954
404	user	55	عمولة بيع مكتملة: USD→LYD	USD	0.200000	credit	\N	عمولة من معاملة سوق العملة مكتملة - البائع: 55, المشتري: 54 (كانت مخصومة ومعلقة عند النشر)	2025-09-02 16:36:44.504223
405	user	55	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة صفقة سوق - البائع: 55, المشتري: 54, المبلغ: 100	2025-09-02 18:07:12.188
406	system	\N	النظام	LYD	11.5	withdrawal	\N	4444	2025-09-02 18:08:16.659925
407	system	\N	النظام	USD	29.4	withdrawal	\N	4444	2025-09-02 18:08:28.334433
408	user	56	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة صفقة سوق - البائع: 56, المشتري: 55, المبلغ: 200	2025-09-02 18:13:47.81907
409	user	55	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة صفقة سوق - البائع: 55, المشتري: 54, المبلغ: 100	2025-09-02 18:27:05.158779
410	user	55	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة صفقة سوق - البائع: 55, المشتري: 54, المبلغ: 100	2025-09-02 18:30:12.566787
411	user	55	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة صفقة سوق - البائع: 55, المشتري: 54, المبلغ: 200	2025-09-02 18:32:24.759977
412	user	55	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة صفقة سوق - البائع: 55, المشتري: 54, المبلغ: 100	2025-09-02 18:32:43.835293
413	user	55	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة عرض سوق كامل - البائع: 55, المبلغ الأصلي: 400	2025-09-02 18:49:31.035514
414	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 240222	USD	2.05	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 240222	2025-09-03 10:13:18.423671
415	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 233819	USD	2.05	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 233819	2025-09-03 10:21:37.768547
416	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 466417	USD	2.05	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 466417	2025-09-03 10:26:54.660366
417	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 840135	USD	2.05	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 840135	2025-09-03 10:37:45.704349
418	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 548576	USD	2.05	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 548576	2025-09-03 10:40:53.743455
419	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 603211	USD	2.05	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 603211	2025-09-03 10:43:47.73386
420	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 218776	USD	2.05	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 218776	2025-09-03 10:45:56.889348
421	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 510031	USD	2.05	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 510031	2025-09-03 10:50:51.425676
422	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 794131	USD	2.05	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 794131	2025-09-03 10:51:39.076432
423	system	\N	النظام	USD	36.45	withdrawal	\N	36.45 	2025-09-03 12:15:52.354228
424	user	55	صالح عاشور	LYD	5.1	credit	136	عمولة تحويل داخلي (بعد خصم مكافأة إحالة 0.9) من صالح عاشور إلى ابراهيم سعد	2025-09-03 12:27:44.758388
425	user	55	عمولة بيع: USD→LYD	USD	2.000000	credit	\N	عمولة عرض سوق كامل - البائع: 55, المبلغ الأصلي: 1000	2025-09-03 12:41:41.786179
426	user	56	عمولة بيع: USD→LYD	USD	2.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 1000	2025-09-03 12:50:30.438392
427	user	56	عمولة بيع: USD→LYD	USD	2.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 110	2025-09-03 12:52:36.175198
428	user	56	عمولة بيع: USD→LYD	USD	2.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 110	2025-09-03 12:59:14.961346
429	user	56	عمولة بيع: USD→LYD	USD	2.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 150	2025-09-03 13:05:02.198759
430	user	56	عمولة بيع: USD→LYD	USD	2.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 110	2025-09-03 13:10:04.270186
431	user	56	عمولة بيع: USD→LYD	USD	2.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 150	2025-09-03 13:14:22.505816
432	user	56	عمولة بيع: USD→LYD	USD	2.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 100	2025-09-03 13:18:45.454904
433	user	56	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 110	2025-09-03 13:20:20.777631
434	user	56	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 50	2025-09-03 13:25:37.679841
435	user	56	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 100	2025-09-03 13:28:13.733466
441	user	55	صالح عاشور	LYD	0	credit	138	عمولة تحويل داخلي (صافي بعد المكافآت) - مكافأة إحالة خُصمت: 1.0 LYD	2025-09-03 14:33:07.23561
442	system	\N	النظام	USD	25	withdrawal	\N	22\n	2025-09-03 14:34:17.080949
443	system	\N	النظام	LYD	5.10	withdrawal	\N	4444	2025-09-03 14:34:28.729656
444	user	56	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 111	2025-09-03 14:35:26.778748
445	system	\N	النظام	USD	3	withdrawal	\N	1110\n	2025-09-03 14:38:45.142034
446	user	56	عمولة بيع: USD→LYD	USD	2.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 50	2025-09-03 14:39:23.011586
447	user	56	عمولة بيع: USD→LYD	USD	2.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 50	2025-09-03 14:42:51.712835
450	system	\N	النظام	USD	4	withdrawal	\N	222\n	2025-09-03 14:49:12.034893
451	user	56	عمولة بيع: USD→LYD	USD	2.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 50	2025-09-03 14:49:40.286908
455	user	56	عمولة بيع: USD→LYD	USD	1.46	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 100 (صافي بعد خصم مكافأة إحالة 0.54)	2025-09-03 15:36:11.277533
456	system	\N	النظام	USD	3.46	withdrawal	\N	444	2025-09-03 15:36:50.755189
457	user	56	عمولة بيع: USD→LYD	USD	5.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 100	2025-09-03 15:39:18.965548
458	user	55	صالح عاشور	LYD	5.1	credit	139	عمولة تحويل داخلي (بعد خصم مكافأة إحالة 0.9) من صالح عاشور إلى ابراهيم سعد	2025-09-03 15:40:11.907521
459	user	55	استلام حوالة مدينية	LYD	1.1	credit	62	عمولة النظام (بعد خصم مكافأة إحالة 0.9) - حوالة مدينية: 412207	2025-09-03 15:41:33.557011
460	user	54	استلام حوالة مدينية	LYD	10	credit	63	عمولة النظام - استلام حوالة مدينية برمز: 142534	2025-09-03 15:45:09.098018
461	system	\N	النظام	LYD	16.20	withdrawal	\N	55	2025-09-03 15:46:23.961352
462	system	\N	النظام	USD	5	withdrawal	\N	55	2025-09-03 15:46:31.584634
463	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 924216	USD	2.55	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 924216	2025-09-03 15:48:21.577081
464	user	55	استلام حوالة مدينية	LYD	1.1	credit	64	عمولة النظام (بعد خصم مكافأة إحالة 0.9) - حوالة مدينية: 748728	2025-09-03 15:50:20.561789
465	system	\N	النظام	USD	2.55	withdrawal	\N	2.55	2025-09-03 15:55:54.686505
466	system	\N	النظام	LYD	1.10	withdrawal	\N	1.10	2025-09-03 15:56:08.088277
467	user	55	استلام حوالة مدينية	LYD	4.1	credit	65	عمولة النظام (بعد خصم مكافأة إحالة 0.9) - حوالة مدينية: 230850	2025-09-03 15:56:42.550663
468	user	56	عمولة بيع: USD→LYD	USD	5.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 55	2025-09-03 15:58:19.859149
469	user	56	عمولة بيع: USD→LYD	USD	5.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 111	2025-09-03 15:59:45.829686
470	system	\N	النظام	USD	10	withdrawal	\N	10	2025-09-03 16:02:59.846251
471	system	\N	النظام	LYD	4.1	withdrawal	\N	44	2025-09-03 16:03:09.325277
472	user	56	اختبار عمولة سوق	USD	3.00	credit	\N	عمولة عرض سوق - اختبار مكافآت	2025-09-03 16:05:51.966872
473	user	56	اختبار مع لوغات	USD	4.00	credit	\N	عمولة عرض سوق - اختبار مع لوغات مفصلة	2025-09-03 16:07:07.072459
474	user	56	عمولة بيع: USD→LYD	USD	5.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 20	2025-09-03 16:09:21.389489
475	system	\N	النظام	USD	12	withdrawal	\N	12\n	2025-09-03 16:09:52.088836
477	user	56	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 25 (صافي بعد خصم مكافأة إحالة 2.00)	2025-09-03 16:15:48.82014
476	user	56	عمولة بيع: USD→LYD	USD	3.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 100 (صافي بعد خصم مكافأة إحالة 2.00)	2025-09-03 16:12:15.030688
478	system	\N	النظام	USD	6	withdrawal	\N	66	2025-09-03 16:47:25.199205
479	user	56	عمولة بيع: USD→USD	USD	5.000000	credit	\N	عمولة عرض سوق كامل - البائع: 56, المبلغ الأصلي: 1000	2025-09-03 16:48:53.708909
480	system	\N	النظام	USD	5	withdrawal	\N	55	2025-09-03 16:53:50.190667
481	user	56	عمولة بيع: USD→LYD	USD	3.200000	credit	69	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 56, المبلغ الأصلي: 500	2025-09-03 16:54:34.978258
482	system	\N	النظام	USD	3.20	withdrawal	\N	444	2025-09-03 16:57:21.941628
483	user	56	عمولة بيع: USD→LYD	USD	3.200000	credit	70	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 56, المبلغ الأصلي: 55	2025-09-03 16:58:08.78957
484	system	\N	النظام	USD	3.2	withdrawal	\N	55	2025-09-03 17:01:05.726855
485	user	56	عمولة بيع: USD→LYD	USD	1.200000	credit	72	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 56, المبلغ الأصلي: 500	2025-09-03 17:01:24.547041
486	system	\N	النظام	USD	1.2	withdrawal	\N	22	2025-09-03 17:05:22.063583
487	user	56	عمولة بيع: USD→LYD	USD	1.200000	credit	73	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 56, المبلغ الأصلي: 133	2025-09-03 17:06:06.562146
488	system	\N	النظام	USD	1.2	withdrawal	\N	44	2025-09-03 17:12:14.519724
489	user	56	عمولة بيع: USD→LYD	USD	1.200000	credit	74	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 56, المبلغ الأصلي: 10	2025-09-03 17:12:21.869771
490	system	\N	النظام	USD	1.20	withdrawal	\N	655\n	2025-09-03 17:13:11.007952
491	user	55	عمولة بيع: USD→LYD	USD	1.200000	credit	75	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 55, المبلغ الأصلي: 1111	2025-09-03 17:14:01.343251
492	system	\N	النظام	USD	1.2	withdrawal	\N	5454	2025-09-03 17:14:45.195663
493	user	55	عمولة بيع: USD→LYD	USD	2.550000	credit	76	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 55, المبلغ الأصلي: 150	2025-09-03 17:16:24.032197
494	user	55	عمولة بيع: USD→LYD	USD	2.550000	credit	77	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 55, المبلغ الأصلي: 100	2025-09-03 17:19:33.37153
495	system	\N	النظام	USD	5.1	withdrawal	\N	111	2025-09-03 17:26:28.396666
496	user	54	عمولة بيع: USD→LYD	USD	3.000000	credit	78	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 54, المبلغ الأصلي: 20	2025-09-03 17:27:04.342255
497	user	55	عمولة بيع: USD→LYD	USD	2.550000	credit	79	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 55, المبلغ الأصلي: 80	2025-09-03 17:28:29.863123
498	user	54	عمولة بيع: USD→LYD	USD	3.000000	credit	80	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 54, المبلغ الأصلي: 13	2025-09-03 17:30:00.104411
499	user	54	عمولة بيع: USD→LYD	USD	3.000000	credit	81	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 54, المبلغ الأصلي: 13	2025-09-03 17:31:32.864342
500	system	\N	النظام	USD	11.55	withdrawal	\N	44	2025-09-03 17:32:46.678042
501	user	55	عمولة بيع: USD→LYD	USD	2.550000	credit	82	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 55, المبلغ الأصلي: 13	2025-09-03 17:32:51.393825
502	system	\N	النظام	USD	2.55	withdrawal	\N	88	2025-09-03 17:33:51.053099
503	user	56	عمولة بيع: USD→LYD	USD	2.550000	credit	83	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 56, المبلغ الأصلي: 22	2025-09-03 17:34:02.735173
504	system	\N	النظام	USD	2	withdrawal	\N	88	2025-09-06 15:41:50.00658
505	system	\N	النظام	USD	0.55	withdrawal	\N	555	2025-09-06 15:42:43.257751
506	system	1	حوالة بين المكاتب - 706582	USD	9	credit	\N	عمولة من حوالة بين المكاتب - 706582	2025-09-06 15:52:12.187565
507	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 451352	USD	8.55	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 451352	2025-09-06 15:57:48.000409
508	system	\N	النظام	USD	17.55	withdrawal	\N	222\n	2025-09-06 16:02:26.950894
509	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 280778	USD	8.55	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 280778	2025-09-06 16:07:28.119724
510	user	68	استلام حوالة مدينية	LYD	5	credit	66	عمولة النظام - استلام حوالة مدينية برمز: 446038	2025-09-06 16:17:00.923868
511	user	76	استلام حوالة مدينية	LYD	4.1	credit	67	عمولة النظام (بعد خصم مكافأة إحالة 0.9) - حوالة مدينية: 171645	2025-09-06 16:29:38.405849
512	user	80	salem jedi	LYD	6	credit	140	عمولة تحويل داخلي من salem jedi إلى احمد علي	2025-09-10 13:33:12.078618
513	system	\N	النظام	LYD	15.1	withdrawal	\N	222	2025-09-11 16:40:13.93025
514	system	\N	النظام	USD	8.55	withdrawal	\N	8.55 	2025-09-11 16:40:34.174763
515	user	81	اسعد رمضان	LYD	6	credit	141	عمولة تحويل داخلي من اسعد رمضان إلى بلعيد العجمي	2025-09-11 16:59:46.136711
516	user	82	بلعيد العجمي	LYD	5.1	credit	142	عمولة تحويل داخلي (بعد خصم مكافأة إحالة 0.9) من بلعيد العجمي إلى اسعد رمضان	2025-09-11 17:03:47.809311
517	system	\N	النظام	LYD	11.10	withdrawal	\N	11.10 	2025-09-11 17:07:14.035268
518	user	81	عمولة بيع: USD→LYD	USD	3.000000	credit	88	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 81, المبلغ الأصلي: 200	2025-09-11 17:11:51.300099
519	user	81	عمولة بيع: USD→LYD	USD	3.000000	credit	89	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 81, المبلغ الأصلي: 500	2025-09-11 17:22:45.567575
520	system	\N	النظام	USD	6	withdrawal	\N	111	2025-09-11 18:04:41.555891
521	user	81	عمولة بيع: USD→LYD	USD	3.000000	credit	90	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 81, المبلغ الأصلي: 200	2025-09-11 18:08:45.046059
522	system	\N	النظام	USD	3	withdrawal	\N	333	2025-09-12 16:25:09.380365
523	user	81	عمولة بيع: USD→LYD	USD	3.000000	credit	100	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 81, المبلغ الأصلي: 200	2025-09-12 16:25:34.001677
524	user	81	اسعد رمضان	LYD	6	credit	143	عمولة تحويل داخلي من اسعد رمضان إلى بلعيد العجمي	2025-09-12 16:33:20.350755
525	user	81	عمولة بيع: USD→LYD	USD	3.000000	credit	101	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 81, المبلغ الأصلي: 200	2025-09-12 16:47:23.886113
526	user	81	عمولة بيع: USD→LYD	USD	3.000000	credit	103	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 81, المبلغ الأصلي: 200	2025-09-12 18:03:46.046286
527	user	81	عمولة بيع: USD→LYD	USD	3.000000	credit	104	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 81, المبلغ الأصلي: 200	2025-09-12 18:13:04.921327
528	system	\N	النظام	USD	12	withdrawal	\N	12	2025-09-13 18:07:10.100946
529	system	\N	النظام	LYD	6	withdrawal	\N	6	2025-09-13 18:07:19.580393
530	user	84	Salem	LYD	5.1	credit	144	عمولة تحويل داخلي (بعد خصم مكافأة إحالة 0.9) من Salem إلى سعيد محمود	2025-09-13 18:08:55.916027
531	user	84	عمولة بيع: USD→LYD	USD	2.550000	credit	105	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 84, المبلغ الأصلي: 300	2025-09-13 18:12:25.506473
532	user	84	استلام حوالة مدينية	LYD	6.1	credit	69	عمولة النظام (بعد خصم مكافأة إحالة 0.9) - حوالة مدينية: 873156	2025-09-13 18:22:09.538649
533	system	\N	النظام	LYD	11.20	withdrawal	\N	222	2025-09-14 16:31:04.24645
534	system	\N	النظام	USD	2.55	withdrawal	\N	2.55 	2025-09-14 16:31:25.22751
535	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 633735	USD	8.55	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 633735	2025-09-14 16:42:32.465253
536	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 623974	USD	8.55	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 623974	2025-09-14 16:59:23.452838
537	user	102	استلام حوالة مدينية	LYD	6.1	credit	70	عمولة النظام (بعد خصم مكافأة إحالة 0.9) - حوالة مدينية: 209782	2025-09-14 17:04:02.331411
538	user	101	رمزي ابراهيم	LYD	6	credit	145	عمولة تحويل داخلي من رمزي ابراهيم إلى سعد مسعود	2025-09-14 17:05:31.689124
539	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 771494	USD	6.55	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 771494	2025-09-15 14:06:30.821199
540	system	1	حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 205273	USD	6.55	credit	\N	عمولة من حوالة بين المكاتب (بعد خصم مكافأة إحالة 0.45) - 205273	2025-09-15 14:13:29.466684
541	user	89	محمد الدمنهوري	LYD	6	credit	146	عمولة تحويل داخلي من محمد الدمنهوري إلى سعد مسعود	2025-09-15 14:25:31.191715
542	user	102	سعد مسعود	LYD	5.1	credit	147	عمولة تحويل داخلي (بعد خصم مكافأة إحالة 0.9) من سعد مسعود إلى رمزي ابراهيم	2025-09-15 15:37:36.260498
543	user	101	رمزي ابراهيم	LYD	6	credit	148	عمولة تحويل داخلي من رمزي ابراهيم إلى سعد مسعود	2025-09-15 16:50:15.689712
544	user	102	سعد مسعود	LYD	5.1	credit	149	عمولة تحويل داخلي (بعد خصم مكافأة إحالة 0.9) من سعد مسعود إلى رمزي ابراهيم	2025-09-15 20:05:54.034215
545	user	102	سعد مسعود	LYD	5.1	credit	150	عمولة تحويل داخلي (بعد خصم مكافأة إحالة 0.9) من سعد مسعود إلى رمزي ابراهيم	2025-09-24 12:58:59.276868
546	user	102	عمولة بيع: USD→LYD	USD	2.550000	credit	107	عمولة عرض سوق (صافي بعد المكافآت) - البائع: 102, المبلغ الأصلي: 100	2025-09-24 13:04:12.888372
547	system	\N	النظام	USD	32.75	withdrawal	\N	222	2025-09-25 13:21:44.193594
548	system	\N	النظام	LYD	39.40	withdrawal	\N	22201	2025-09-25 13:22:22.54586
\.


--
-- Data for Name: countries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.countries (id, name, code, currency, is_active, created_at, phone_code) FROM stdin;
59	الكاميرون	CM	XAF	t	2025-08-30 18:49:20.167416	+1
60	الرأس الأخضر	CV	CVE	t	2025-08-30 18:49:20.167416	+1
61	جمهورية أفريقيا الوسطى	CF	XAF	t	2025-08-30 18:49:20.167416	+1
62	تشاد	TD	XAF	t	2025-08-30 18:49:20.167416	+1
63	جزر القمر	KM	KMF	t	2025-08-30 18:49:20.167416	+1
64	جمهورية الكونغو الديمقراطية	CD	CDF	t	2025-08-30 18:49:20.167416	+1
65	جيبوتي	DJ	DJF	t	2025-08-30 18:49:20.167416	+1
66	غينيا الاستوائية	GQ	XAF	t	2025-08-30 18:49:20.167416	+1
67	إريتريا	ER	ERN	t	2025-08-30 18:49:20.167416	+1
68	إسواتيني	SZ	SZL	t	2025-08-30 18:49:20.167416	+1
69	إثيوبيا	ET	ETB	t	2025-08-30 18:49:20.167416	+251
70	الغابون	GA	XAF	t	2025-08-30 18:49:20.167416	+1
71	غامبيا	GM	GMD	t	2025-08-30 18:49:20.167416	+1
72	غانا	GH	GHS	t	2025-08-30 18:49:20.167416	+233
73	غينيا	GN	GNF	t	2025-08-30 18:49:20.167416	+1
74	غينيا بيساو	GW	XOF	t	2025-08-30 18:49:20.167416	+1
75	ساحل العاج	CI	XOF	t	2025-08-30 18:49:20.167416	+1
76	كينيا	KE	KES	t	2025-08-30 18:49:20.167416	+254
77	ليسوتو	LS	LSL	t	2025-08-30 18:49:20.167416	+1
78	ليبيريا	LR	LRD	t	2025-08-30 18:49:20.167416	+1
79	مدغشقر	MG	MGA	t	2025-08-30 18:49:20.167416	+1
80	مالاوي	MW	MWK	t	2025-08-30 18:49:20.167416	+1
81	مالي	ML	XOF	t	2025-08-30 18:49:20.167416	+1
82	موريتانيا	MR	MRU	t	2025-08-30 18:49:20.167416	+1
83	موريشيوس	MU	MUR	t	2025-08-30 18:49:20.167416	+1
84	موزمبيق	MZ	MZN	t	2025-08-30 18:49:20.167416	+1
85	ناميبيا	NA	NAD	t	2025-08-30 18:49:20.167416	+1
86	النيجر	NE	XOF	t	2025-08-30 18:49:20.167416	+1
87	نيجيريا	NG	NGN	t	2025-08-30 18:49:20.167416	+234
88	رواندا	RW	RWF	t	2025-08-30 18:49:20.167416	+1
89	ساو تومي وبرينسيبي	ST	STN	t	2025-08-30 18:49:20.167416	+1
90	السنغال	SN	XOF	t	2025-08-30 18:49:20.167416	+1
91	سيشل	SC	SCR	t	2025-08-30 18:49:20.167416	+1
92	سيراليون	SL	SLL	t	2025-08-30 18:49:20.167416	+1
93	الصومال	SO	SOS	t	2025-08-30 18:49:20.167416	+1
94	جنوب أفريقيا	ZA	ZAR	t	2025-08-30 18:49:20.167416	+27
95	جنوب السودان	SS	SSP	t	2025-08-30 18:49:20.167416	+1
96	تنزانيا	TZ	TZS	t	2025-08-30 18:49:20.167416	+1
97	توغو	TG	XOF	t	2025-08-30 18:49:20.167416	+1
98	أوغندا	UG	UGX	t	2025-08-30 18:49:20.167416	+1
99	زامبيا	ZM	ZMW	t	2025-08-30 18:49:20.167416	+1
100	زيمبابوي	ZW	ZWL	t	2025-08-30 18:49:20.167416	+1
231	أفغانستان	AF	AFN	t	2025-08-30 18:50:37.890151	+93
232	أرمينيا	AM	AMD	t	2025-08-30 18:50:37.890151	+374
233	أذربيجان	AZ	AZN	t	2025-08-30 18:50:37.890151	+994
234	بنغلاديش	BD	BDT	t	2025-08-30 18:50:37.890151	+880
235	بوتان	BT	BTN	t	2025-08-30 18:50:37.890151	+975
236	بروناي	BN	BND	t	2025-08-30 18:50:37.890151	+1
237	كمبوديا	KH	KHR	t	2025-08-30 18:50:37.890151	+855
238	جورجيا	GE	GEL	t	2025-08-30 18:50:37.890151	+995
239	إندونيسيا	ID	IDR	t	2025-08-30 18:50:37.890151	+62
240	إيران	IR	IRR	t	2025-08-30 18:50:37.890151	+98
212	بوليفيا	BO	BOB	t	2025-08-30 18:50:27.232799	+1
213	شيلي	CL	CLP	t	2025-08-30 18:50:27.232799	+1
214	كولومبيا	CO	COP	t	2025-08-30 18:50:27.232799	+57
215	كوستاريكا	CR	CRC	t	2025-08-30 18:50:27.232799	+1
145	ألبانيا	AL	ALL	t	2025-08-30 18:50:02.970367	+355
146	النمسا	AT	EUR	t	2025-08-30 18:50:02.970367	+43
147	بيلاروسيا	BY	BYN	t	2025-08-30 18:50:02.970367	+375
148	بلجيكا	BE	EUR	t	2025-08-30 18:50:02.970367	+32
149	البوسنة والهرسك	BA	BAM	t	2025-08-30 18:50:02.970367	+387
150	بلغاريا	BG	BGN	t	2025-08-30 18:50:02.970367	+359
151	كرواتيا	HR	EUR	t	2025-08-30 18:50:02.970367	+385
152	التشيك	CZ	CZK	t	2025-08-30 18:50:02.970367	+420
153	الدنمارك	DK	DKK	t	2025-08-30 18:50:02.970367	+45
154	إستونيا	EE	EUR	t	2025-08-30 18:50:02.970367	+372
155	فنلندا	FI	EUR	t	2025-08-30 18:50:02.970367	+358
156	اليونان	GR	EUR	t	2025-08-30 18:50:02.970367	+30
157	المجر	HU	HUF	t	2025-08-30 18:50:02.970367	+36
158	آيسلندا	IS	ISK	t	2025-08-30 18:50:02.970367	+1
159	أيرلندا	IE	EUR	t	2025-08-30 18:50:02.970367	+1
160	لاتفيا	LV	EUR	t	2025-08-30 18:50:02.970367	+371
161	ليتوانيا	LT	EUR	t	2025-08-30 18:50:02.970367	+370
162	لوكسمبورغ	LU	EUR	t	2025-08-30 18:50:02.970367	+352
163	مالطا	MT	EUR	t	2025-08-30 18:50:02.970367	+356
164	مولدوفا	MD	MDL	t	2025-08-30 18:50:02.970367	+373
165	موناكو	MC	EUR	t	2025-08-30 18:50:02.970367	+377
166	الجبل الأسود	ME	EUR	t	2025-08-30 18:50:02.970367	+382
167	هولندا	NL	EUR	t	2025-08-30 18:50:02.970367	+31
168	شمال مقدونيا	MK	MKD	t	2025-08-30 18:50:02.970367	+389
169	النرويج	NO	NOK	t	2025-08-30 18:50:02.970367	+47
170	بولندا	PL	PLN	t	2025-08-30 18:50:02.970367	+48
171	البرتغال	PT	EUR	t	2025-08-30 18:50:02.970367	+351
172	رومانيا	RO	RON	t	2025-08-30 18:50:02.970367	+40
173	سان مارينو	SM	EUR	t	2025-08-30 18:50:02.970367	+378
174	صربيا	RS	RSD	t	2025-08-30 18:50:02.970367	+381
175	سلوفاكيا	SK	EUR	t	2025-08-30 18:50:02.970367	+421
176	سلوفينيا	SI	EUR	t	2025-08-30 18:50:02.970367	+386
177	السويد	SE	SEK	t	2025-08-30 18:50:02.970367	+46
178	سويسرا	CH	CHF	t	2025-08-30 18:50:02.970367	+41
179	أوكرانيا	UA	UAH	t	2025-08-30 18:50:02.970367	+380
180	مدينة الفاتيكان	VA	EUR	t	2025-08-30 18:50:02.970367	+1
216	كوبا	CU	CUP	t	2025-08-30 18:50:27.232799	+1
217	جمهورية الدومينيكان	DO	DOP	t	2025-08-30 18:50:27.232799	+1
218	الإكوادور	EC	USD	t	2025-08-30 18:50:27.232799	+593
219	السلفادور	SV	USD	t	2025-08-30 18:50:27.232799	+1
220	غواتيمالا	GT	GTQ	t	2025-08-30 18:50:27.232799	+1
221	هايتي	HT	HTG	t	2025-08-30 18:50:27.232799	+1
222	هندوراس	HN	HNL	t	2025-08-30 18:50:27.232799	+1
223	جامايكا	JM	JMD	t	2025-08-30 18:50:27.232799	+1
224	المكسيك	MX	MXN	t	2025-08-30 18:50:27.232799	+52
225	نيكاراغوا	NI	NIO	t	2025-08-30 18:50:27.232799	+1
226	بنما	PA	PAB	t	2025-08-30 18:50:27.232799	+1
227	باراغواي	PY	PYG	t	2025-08-30 18:50:27.232799	+1
228	بيرو	PE	PEN	t	2025-08-30 18:50:27.232799	+51
229	أوروغواي	UY	UYU	t	2025-08-30 18:50:27.232799	+1
1	ليبيا	LY	LYD	t	2025-06-24 17:00:12.985243	+218
2	الولايات المتحدة الأمريكية	US	USD	t	2025-06-24 17:00:12.985243	+1
24	تركيا	TR	TRY	t	2025-08-23 21:24:56.444885	+90
25	الإمارات العربية المتحدة	AE	AED	t	2025-08-23 21:24:56.444885	+1
26	مصر	EG	EGP	t	2025-08-23 21:24:56.444885	+20
27	تونس	TN	TND	t	2025-08-23 21:24:56.444885	+216
28	المملكة العربية السعودية	SA	SAR	t	2025-08-23 21:24:56.444885	+1
29	الأردن	JO	JOD	t	2025-08-23 21:24:56.444885	+962
30	قطر	QA	QAR	t	2025-08-23 21:24:56.444885	+974
31	الكويت	KW	KWD	t	2025-08-23 21:24:56.444885	+965
32	عُمان	OM	OMR	t	2025-08-23 21:24:56.444885	+1
33	البحرين	BH	BHD	t	2025-08-23 21:24:56.444885	+973
34	المغرب	MA	MAD	t	2025-08-23 21:24:56.444885	+212
35	الجزائر	DZ	DZD	t	2025-08-23 21:24:56.444885	+213
36	السودان	SD	SDG	t	2025-08-23 21:24:56.444885	+249
37	اليمن	YE	YER	t	2025-08-23 21:24:56.444885	+967
38	سوريا	SY	SYP	t	2025-08-23 21:24:56.444885	+963
39	لبنان	LB	LBP	t	2025-08-23 21:24:56.444885	+961
40	العراق	IQ	IQD	t	2025-08-23 21:24:56.444885	+964
41	فلسطين	PS	ILS	t	2025-08-23 21:24:56.444885	+970
42	المملكة المتحدة	GB	GBP	t	2025-08-23 21:24:56.444885	+44
43	ألمانيا	DE	EUR	t	2025-08-23 21:24:56.444885	+49
44	فرنسا	FR	EUR	t	2025-08-23 21:24:56.444885	+33
45	إيطاليا	IT	EUR	t	2025-08-23 21:24:56.444885	+39
46	إسبانيا	ES	EUR	t	2025-08-23 21:24:56.444885	+34
47	كندا	CA	CAD	t	2025-08-23 21:24:56.444885	+1
48	أستراليا	AU	AUD	t	2025-08-23 21:24:56.444885	+61
49	اليابان	JP	JPY	t	2025-08-23 21:24:56.444885	+81
50	الصين	CN	CNY	t	2025-08-23 21:24:56.444885	+86
51	الهند	IN	INR	t	2025-08-23 21:24:56.444885	+91
52	روسيا	RU	RUB	t	2025-08-23 21:24:56.444885	+7
53	البرازيل	BR	BRL	t	2025-08-23 21:24:56.444885	+55
54	أنغولا	AO	AOA	t	2025-08-30 18:49:20.167416	+1
55	بنين	BJ	XOF	t	2025-08-30 18:49:20.167416	+1
56	بوتسوانا	BW	BWP	t	2025-08-30 18:49:20.167416	+1
57	بوركينا فاسو	BF	XOF	t	2025-08-30 18:49:20.167416	+1
58	بوروندي	BI	BIF	t	2025-08-30 18:49:20.167416	+1
211	الأرجنتين	AR	ARS	t	2025-08-30 18:50:27.232799	+54
230	فنزويلا	VE	VED	t	2025-08-30 18:50:27.232799	+58
242	كازاخستان	KZ	KZT	t	2025-08-30 18:50:37.890151	+7
243	كوريا الشمالية	KP	KPW	t	2025-08-30 18:50:37.890151	+850
244	كوريا الجنوبية	KR	KRW	t	2025-08-30 18:50:37.890151	+82
245	قيرغيزستان	KG	KGS	t	2025-08-30 18:50:37.890151	+996
246	لاوس	LA	LAK	t	2025-08-30 18:50:37.890151	+856
247	ماليزيا	MY	MYR	t	2025-08-30 18:50:37.890151	+60
248	جزر المالديف	MV	MVR	t	2025-08-30 18:50:37.890151	+1
249	منغوليا	MN	MNT	t	2025-08-30 18:50:37.890151	+976
250	ميانمار	MM	MMK	t	2025-08-30 18:50:37.890151	+1
251	نيبال	NP	NPR	t	2025-08-30 18:50:37.890151	+977
252	باكستان	PK	PKR	t	2025-08-30 18:50:37.890151	+92
253	الفلبين	PH	PHP	t	2025-08-30 18:50:37.890151	+63
254	سنغافورة	SG	SGD	t	2025-08-30 18:50:37.890151	+65
255	سريلانكا	LK	LKR	t	2025-08-30 18:50:37.890151	+1
256	تايوان	TW	TWD	t	2025-08-30 18:50:37.890151	+886
257	طاجيكستان	TJ	TJS	t	2025-08-30 18:50:37.890151	+992
258	تايلاند	TH	THB	t	2025-08-30 18:50:37.890151	+66
259	تيمور الشرقية	TL	USD	t	2025-08-30 18:50:37.890151	+1
260	تركمانستان	TM	TMT	t	2025-08-30 18:50:37.890151	+993
261	أوزبكستان	UZ	UZS	t	2025-08-30 18:50:37.890151	+998
262	فيتنام	VN	VND	t	2025-08-30 18:50:37.890151	+84
\.


--
-- Data for Name: crypto_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.crypto_keys (id, key_type, public_key, encrypted_private_key, kid, active, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: dev_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dev_audit_logs (id, actor_email, action, entity, entity_id, data, created_at) FROM stdin;
19dea212-47cc-4b77-bcf7-4f81a2cafbd2	ss73ss73ss73@gmail.com	create	theme	1d7fcc7a-715f-44b4-a8ed-4022b252f451	{"name": "سمة مخصصة - 4‏/9‏/2025", "tokens": {"colors": {"muted": "#f8fafc", "accent": "#f59e0b", "border": "#e2e8f0", "primary": "#f59e0b", "success": "#10b981", "warning": "#f59e0b", "secondary": "#64748b", "background": "#ffffff", "foreground": "#0f172a", "destructive": "#ef4444"}, "spacing": {"lg": "1.5rem", "md": "1rem", "sm": "0.5rem", "xl": "2rem", "xs": "0.25rem"}, "typography": {"fontSize": {"lg": "1.125rem", "sm": "0.875rem", "xl": "1.25rem", "xs": "0.75rem", "2xl": "1.5rem", "base": "1rem"}, "fontFamily": "'Tajawal', sans-serif"}, "borderRadius": {"lg": "0.5rem", "md": "0.375rem", "sm": "0.25rem", "xl": "0.75rem"}}}	2025-09-04 10:50:06.110494+00
45926fa2-1028-438c-bb0e-5168300a723d	ss73ss73ss73@gmail.com	create	theme	35007c6e-1807-448d-8dcd-fd1a45492e9b	{"name": "سمة مخصصة - ١٢‏/٠٣‏/١٤٤٧ هـ ٠١:٠٣:٥٤ م", "tokens": {"colors": {"muted": "#f8fafc", "accent": "#f59e0b", "border": "#e2e8f0", "primary": "#3b82f6", "success": "#10b981", "warning": "#f59e0b", "secondary": "#64748b", "background": "#f59e0b", "foreground": "#0f172a", "destructive": "#ef4444"}, "spacing": {"lg": "1.5rem", "md": "1rem", "sm": "0.5rem", "xl": "2rem", "xs": "0.25rem"}, "typography": {"fontSize": {"lg": "1.125rem", "sm": "0.875rem", "xl": "1.25rem", "xs": "0.75rem", "2xl": "1.5rem", "base": "1rem"}, "fontFamily": "'Tajawal', sans-serif"}, "borderRadius": {"lg": "0.5rem", "md": "0.375rem", "sm": "0.25rem", "xl": "0.75rem"}}}	2025-09-04 11:02:48.112+00
22adbea3-31a7-43c3-a820-d729a0998da9	ss73ss73ss73@gmail.com	create	theme	4651dfaa-90de-4fe4-af1e-8554306440f9	{"name": "سمة مخصصة - ١٢‏/٠٣‏/١٤٤٧ هـ ٠١:٠٩:٣٦ م", "tokens": {"colors": {"muted": "#f8fafc", "accent": "#f59e0b", "border": "#e2e8f0", "primary": "#f59e0b", "success": "#10b981", "warning": "#f59e0b", "secondary": "#64748b", "background": "#ffffff", "foreground": "#0f172a", "destructive": "#ef4444"}, "spacing": {"lg": "1.5rem", "md": "1rem", "sm": "0.5rem", "xl": "2rem", "xs": "0.25rem"}, "typography": {"fontSize": {"lg": "1.125rem", "sm": "0.875rem", "xl": "1.25rem", "xs": "0.75rem", "2xl": "1.5rem", "base": "1rem"}, "fontFamily": "'Tajawal', sans-serif"}, "borderRadius": {"lg": "0.5rem", "md": "0.375rem", "sm": "0.25rem", "xl": "0.75rem"}}}	2025-09-04 11:08:30.184022+00
861c748d-d631-4051-b29b-1bd8d5b6dc69	ss73ss73ss73@gmail.com	create	theme	50e5b845-067a-4e04-a499-c3e1d92165d7	{"name": "سمة مخصصة - ١٢‏/٠٣‏/١٤٤٧ هـ ٠١:١٢:٢٥ م", "tokens": {"colors": {"muted": "#f8fafc", "accent": "#f59e0b", "border": "#e2e8f0", "primary": "#f59e0b", "success": "#10b981", "warning": "#f59e0b", "secondary": "#64748b", "background": "#ffffff", "foreground": "#0f172a", "destructive": "#ef4444"}, "spacing": {"lg": "1.5rem", "md": "1rem", "sm": "0.5rem", "xl": "2rem", "xs": "0.25rem"}, "typography": {"fontSize": {"lg": "1.125rem", "sm": "0.875rem", "xl": "1.25rem", "xs": "0.75rem", "2xl": "1.5rem", "base": "1rem"}, "fontFamily": "'Tajawal', sans-serif"}, "borderRadius": {"lg": "0.5rem", "md": "0.375rem", "sm": "0.25rem", "xl": "0.75rem"}}}	2025-09-04 11:11:19.82023+00
\.


--
-- Data for Name: dev_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dev_blocks (id, page_id, slot, component_key, props, order_index, created_at) FROM stdin;
\.


--
-- Data for Name: dev_components; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dev_components (key, display_name, schema, category, is_core, created_at) FROM stdin;
\.


--
-- Data for Name: dev_feature_flags; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dev_feature_flags (key, description, enabled, per_account, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dev_pages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dev_pages (id, route, title_ar, layout, status, visibility, allowed_roles, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: dev_themes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dev_themes (id, name, tokens, is_active, created_at) FROM stdin;
1d7fcc7a-715f-44b4-a8ed-4022b252f451	سمة مخصصة - 4‏/9‏/2025	{"colors": {"muted": "#f8fafc", "accent": "#f59e0b", "border": "#e2e8f0", "primary": "#f59e0b", "success": "#10b981", "warning": "#f59e0b", "secondary": "#64748b", "background": "#ffffff", "foreground": "#0f172a", "destructive": "#ef4444"}, "spacing": {"lg": "1.5rem", "md": "1rem", "sm": "0.5rem", "xl": "2rem", "xs": "0.25rem"}, "typography": {"fontSize": {"lg": "1.125rem", "sm": "0.875rem", "xl": "1.25rem", "xs": "0.75rem", "2xl": "1.5rem", "base": "1rem"}, "fontFamily": "'Tajawal', sans-serif"}, "borderRadius": {"lg": "0.5rem", "md": "0.375rem", "sm": "0.25rem", "xl": "0.75rem"}}	f	2025-09-04 10:50:06.079272+00
35007c6e-1807-448d-8dcd-fd1a45492e9b	سمة مخصصة - ١٢‏/٠٣‏/١٤٤٧ هـ ٠١:٠٣:٥٤ م	{"colors": {"muted": "#f8fafc", "accent": "#f59e0b", "border": "#e2e8f0", "primary": "#3b82f6", "success": "#10b981", "warning": "#f59e0b", "secondary": "#64748b", "background": "#f59e0b", "foreground": "#0f172a", "destructive": "#ef4444"}, "spacing": {"lg": "1.5rem", "md": "1rem", "sm": "0.5rem", "xl": "2rem", "xs": "0.25rem"}, "typography": {"fontSize": {"lg": "1.125rem", "sm": "0.875rem", "xl": "1.25rem", "xs": "0.75rem", "2xl": "1.5rem", "base": "1rem"}, "fontFamily": "'Tajawal', sans-serif"}, "borderRadius": {"lg": "0.5rem", "md": "0.375rem", "sm": "0.25rem", "xl": "0.75rem"}}	f	2025-09-04 11:02:48.061475+00
4651dfaa-90de-4fe4-af1e-8554306440f9	سمة مخصصة - ١٢‏/٠٣‏/١٤٤٧ هـ ٠١:٠٩:٣٦ م	{"colors": {"muted": "#f8fafc", "accent": "#f59e0b", "border": "#e2e8f0", "primary": "#f59e0b", "success": "#10b981", "warning": "#f59e0b", "secondary": "#64748b", "background": "#ffffff", "foreground": "#0f172a", "destructive": "#ef4444"}, "spacing": {"lg": "1.5rem", "md": "1rem", "sm": "0.5rem", "xl": "2rem", "xs": "0.25rem"}, "typography": {"fontSize": {"lg": "1.125rem", "sm": "0.875rem", "xl": "1.25rem", "xs": "0.75rem", "2xl": "1.5rem", "base": "1rem"}, "fontFamily": "'Tajawal', sans-serif"}, "borderRadius": {"lg": "0.5rem", "md": "0.375rem", "sm": "0.25rem", "xl": "0.75rem"}}	f	2025-09-04 11:08:30.156128+00
50e5b845-067a-4e04-a499-c3e1d92165d7	سمة مخصصة - ١٢‏/٠٣‏/١٤٤٧ هـ ٠١:١٢:٢٥ م	{"colors": {"muted": "#f8fafc", "accent": "#f59e0b", "border": "#e2e8f0", "primary": "#f59e0b", "success": "#10b981", "warning": "#f59e0b", "secondary": "#64748b", "background": "#ffffff", "foreground": "#0f172a", "destructive": "#ef4444"}, "spacing": {"lg": "1.5rem", "md": "1rem", "sm": "0.5rem", "xl": "2rem", "xs": "0.25rem"}, "typography": {"fontSize": {"lg": "1.125rem", "sm": "0.875rem", "xl": "1.25rem", "xs": "0.75rem", "2xl": "1.5rem", "base": "1rem"}, "fontFamily": "'Tajawal', sans-serif"}, "borderRadius": {"lg": "0.5rem", "md": "0.375rem", "sm": "0.25rem", "xl": "0.75rem"}}	t	2025-09-04 11:11:19.791437+00
\.


--
-- Data for Name: exchange_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.exchange_rates (id, from_currency, to_currency, rate, fetched_at) FROM stdin;
\.


--
-- Data for Name: export_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.export_jobs (id, user_id, type, status, params, file_path, download_url, expires_at, created_at, completed_at, error_message) FROM stdin;
\.


--
-- Data for Name: group_chats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_chats (id, name, creator_id, is_private, description, created_at) FROM stdin;
5	s1	4	t		2025-05-25 13:46:45.108987
8	بيع العملة	101	t		2025-09-19 15:57:43.620963
10	102	101	t		2025-09-19 16:28:08.673534
11	1020	90	t		2025-09-20 13:05:36.405112
14	250	102	t		2025-09-21 13:00:03.974969
\.


--
-- Data for Name: group_members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_members (id, group_id, user_id, role, joined_at, muted_until, is_banned, banned_by, banned_at, ban_reason) FROM stdin;
14	8	4	member	2025-09-19 16:28:40.688819	\N	f	\N	\N	\N
69	14	102	owner	2025-09-21 13:00:04.024837	\N	f	\N	\N	\N
7	5	4	owner	2025-05-25 13:46:45.143621	\N	f	\N	\N	\N
\.


--
-- Data for Name: group_message_reads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_message_reads (message_id, user_id, read_at) FROM stdin;
\.


--
-- Data for Name: group_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.group_messages (id, group_id, sender_id, content, created_at, edited_at, is_edited, is_deleted, deleted_by, deleted_at, file_url, file_type, deleted_for_users) FROM stdin;
108	11	102	33	2025-09-20 13:06:17.140605	\N	f	f	\N	\N	\N	\N	{}
109	11	90	صصص	2025-09-20 13:06:22.552308	\N	f	f	\N	\N	\N	\N	{}
110	11	102	33	2025-09-20 13:07:21.305412	\N	f	f	\N	2025-09-20 13:07:40.339937	\N	\N	{102}
\.


--
-- Data for Name: hidden_transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hidden_transfers (id, user_id, transfer_id, hidden_at) FROM stdin;
\.


--
-- Data for Name: internal_transfer_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.internal_transfer_logs (id, transfer_id, sender_name, sender_account_number, receiver_name, receiver_account_number, amount, commission, currency, note, status, ip_address, user_agent, created_at, reference_number) FROM stdin;
\.


--
-- Data for Name: international_transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.international_transfers (id, agent_id, currency_code, amount, origin_country, destination_country, receiving_office_id, sender_name, sender_phone, receiver_name, receiver_phone, receiver_code, transfer_code, commission_amount, status, notes, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: international_transfers_new; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.international_transfers_new (id, sender_agent_id, receiver_office_id, currency_code, amount_original, commission_system, commission_recipient, amount_pending, status, transfer_code, note, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: market_bids; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.market_bids (id, offer_id, user_id, amount, price, message, status, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: market_channels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.market_channels (id, name, description, is_active, created_at) FROM stdin;
1	دردشة السوق العامة	قناة الدردشة الرئيسية لسوق العملات	t	2025-08-30 05:59:01.134714
\.


--
-- Data for Name: market_deals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.market_deals (id, offer_id, bid_id, seller_id, buyer_id, amount, price, total_value, base_currency, quote_currency, status, escrow_released, created_at, completed_at) FROM stdin;
\.


--
-- Data for Name: market_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.market_messages (id, channel_id, user_id, type, content, offer_id, bid_id, deal_id, created_at) FROM stdin;
88	1	4	MESSAGE	100	\N	\N	\N	2025-09-09 16:14:59.825973
111	1	102	MESSAGE	Uuu	\N	\N	\N	2025-09-18 13:14:07.329452
112	1	101	MESSAGE	🚀 عرض جديد في السوق!\n\n📊 النوع: بيع\n💰 USD → LYD\n📈 السعر: 2 LYD\n📦 الكمية: 100 - 150 USD\n\n✨ متاح الآن للتداول المباشر!	\N	\N	\N	2025-09-18 16:15:53.09639
113	1	102	MESSAGE	🚀 عرض جديد في السوق!\n\n📊 النوع: بيع\n💰 USD → LYD\n📈 السعر: 2 LYD\n📦 الكمية: 50 - 100 USD\n\n✨ متاح الآن للتداول المباشر!	\N	\N	\N	2025-09-24 13:03:14.518833
28	1	4	MESSAGE	20	\N	\N	\N	2025-08-31 12:20:13.131564
114	1	101	MESSAGE	🚀 عرض جديد في السوق!\n\n📊 النوع: بيع\n💰 USD → LYD\n📈 السعر: 3 LYD\n📦 الكمية: 100 - 500 USD\n\n✨ متاح الآن للتداول المباشر!	\N	\N	\N	2025-09-29 20:14:40.25434
\.


--
-- Data for Name: market_offers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.market_offers (id, user_id, side, base_currency, quote_currency, price, min_amount, max_amount, remaining_amount, city, deliver_type, terms, status, created_at, updated_at, allow_counter_price, expires_at, commission_deducted) FROM stdin;
106	101	sell	USD	LYD	2.000000	100.00	150.00	150.00	\N	internal_transfer	\N	cancelled	2025-09-18 16:15:52.33526	2025-09-18 16:15:52.33526	f	2025-09-18 16:20:52.324	f
107	102	sell	USD	LYD	2.000000	50.00	100.00	0.00	\N	internal_transfer	\N	cancelled	2025-09-24 13:03:13.78966	2025-09-24 13:03:13.78966	f	2025-09-24 13:08:13.777	t
108	101	sell	USD	LYD	3.000000	100.00	500.00	500.00	\N	internal_transfer	\N	open	2025-09-29 20:14:39.550573	2025-09-29 20:14:39.550573	f	2025-09-29 20:19:39.539	f
\.


--
-- Data for Name: market_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.market_transactions (id, buyer_id, offer_id, amount, total_cost, commission, created_at) FROM stdin;
138	4	100	100	200	0	2025-09-12 16:25:34.093953
139	4	101	100	100	0	2025-09-12 16:47:23.98791
140	4	103	100	100	0	2025-09-12 18:03:46.163079
141	4	104	100	200	0	2025-09-12 18:13:05.01049
142	4	104	100.00	200	0	2025-09-12 18:13:34.271685
144	101	107	100.00	200	0	2025-09-24 13:04:12.989902
\.


--
-- Data for Name: message_likes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_likes (id, message_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: message_voices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.message_voices (id, message_id, private_message_id, sender_id, room_id, private_room_id, storage_key, mime_type, duration_seconds, file_size_bytes, waveform_peaks, transcript, transcript_lang, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: office_commissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.office_commissions (id, office_id, city, commission_rate) FROM stdin;
\.


--
-- Data for Name: office_country_commissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.office_country_commissions (id, office_id, country, commission_rate) FROM stdin;
\.


--
-- Data for Name: page_restrictions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.page_restrictions (id, user_id, account_number, page_key, scope, reason, is_active, expires_at, created_by, created_at) FROM stdin;
32	4	GLOBAL	group_chats	global	101	t	\N	4	2025-09-21 12:59:08.989333+00
41	4	GLOBAL	market	global	2000	f	\N	4	2025-09-21 13:54:45.629589+00
42	4	GLOBAL	chat	global	قيد شامل على صفحة chat	f	\N	4	2025-09-21 13:55:37.255645+00
43	4	GLOBAL	notifications	global	قيد شامل على صفحة notifications	f	\N	4	2025-09-21 13:56:44.892769+00
\.


--
-- Data for Name: password_reset_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_requests (id, user_id, email, token, expires_at, created_at, used) FROM stdin;
\.


--
-- Data for Name: points_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.points_history (id, user_id, points, action, description, description_ar, reference_id, reference_type, created_at) FROM stdin;
1	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:39:19.977484
2	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:40:30.626287
3	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:47:04.145443
4	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:47:28.843091
5	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:47:30.979313
6	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:47:33.619353
7	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:47:41.991004
8	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:47:44.865822
9	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:53:29.337776
10	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:53:43.797119
11	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:53:50.753673
12	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:53:57.822123
13	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:54:01.865375
14	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 16:57:41.804152
166	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 09:55:19.581651
16	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 17:16:47.79879
17	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 17:16:54.193658
2056	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 14:29:01.865105
2057	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 14:29:19.247708
186	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:28:56.762183
1793	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 18:04:44.733415
1794	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 18:05:05.988969
199	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:44:52.597028
206	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:52:54.8658
25	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 17:27:48.369571
26	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 17:28:00.282396
27	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 17:31:16.694279
207	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:53:00.240228
2058	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 14:29:29.943192
2210	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:24:32.095281
215	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 11:55:48.887246
216	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 12:05:55.823117
34	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 17:38:14.838842
35	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:05:39.940711
218	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 12:10:59.605169
219	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 12:19:25.348763
39	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:08:22.6426
40	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:08:27.222108
41	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:08:33.653037
220	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 12:24:38.231091
221	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 12:24:46.742645
2212	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:25:37.502223
45	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:12:53.475436
46	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:13:22.035327
232	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 12:46:33.845039
48	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:15:37.192308
49	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:17:40.759711
239	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:01:22.862844
242	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:01:31.228711
244	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:05:06.253976
55	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:47:52.789693
2215	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:25:56.355904
167	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 09:55:26.075165
176	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:16:34.846347
58	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:48:51.043333
178	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:16:55.95896
1253	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:57:23.907417
181	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:22:12.256522
1254	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:57:37.698765
2059	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 16:35:10.125956
1336	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:07:52.238357
193	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:41:34.978716
1454	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:40:54.565133
1535	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:41:28.002597
1582	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 18:52:44.489518
1626	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-10 13:30:35.268101
209	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:54:27.88088
210	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:54:46.289244
222	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 12:25:03.037221
2064	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 17:47:49.944667
2065	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 17:54:29.76445
2216	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:26:38.080743
256	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:20:23.012791
257	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:20:24.427745
258	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:20:26.941746
259	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:20:27.632407
260	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:20:29.164925
261	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:20:30.095737
262	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:20:31.00859
263	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:20:31.872219
264	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:20:33.01163
265	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:20:34.615394
266	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:20:37.948777
274	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:51:51.231006
2358	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:02:18.429971
279	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:04:01.942092
280	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:04:16.790441
282	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:05:55.672294
2360	101	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:04:32.514689
2361	101	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:04:52.473313
2363	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:05:13.919624
2364	101	10	internal_transfer	Internal transfer: 100 LYD	تحويل داخلي: 100 LYD	145	internal_transfer	2025-09-14 17:05:31.910634
2366	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:06:19.203692
290	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:13:05.600574
291	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:17:24.550875
292	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:18:17.430285
293	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:24:48.827939
294	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:25:45.442786
295	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:26:59.242256
296	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:27:54.912941
297	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:32:45.523473
2367	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:06:25.116793
2060	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 16:35:21.548073
1204	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 21:40:48.202286
170	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:10:15.709976
1206	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:10:30.589606
1207	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:10:33.961922
65	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:52:16.475801
66	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:52:30.662645
67	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:52:39.858406
68	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:53:04.254253
1208	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:20:13.680746
1209	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:20:22.330867
1210	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:24:24.512185
1212	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:33:36.580276
73	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 18:59:49.422426
195	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:43:50.051811
75	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 19:00:20.480678
196	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:44:04.64482
1214	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:38:01.705622
1215	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:48:29.767208
223	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 12:27:38.805804
1221	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:08:46.558369
229	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 12:41:38.748412
230	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 12:41:50.91308
234	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 12:56:05.28208
84	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 19:08:53.096321
85	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 19:08:58.001922
89	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 19:12:26.807559
1287	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:35:44.997882
2138	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:43:51.693639
267	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:48:40.779127
2217	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:27:03.596616
2303	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:28:41.496184
95	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 20:50:32.607613
96	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 20:50:35.628992
97	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:07:18.1197
98	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:07:20.746688
99	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:07:30.550847
100	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:08:03.642947
101	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:08:14.976057
102	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:08:28.201513
103	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:08:35.020467
104	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:08:40.420342
105	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:08:49.675441
106	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:08:52.918428
107	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:09:19.023856
108	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:09:25.636798
109	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:11:57.913065
110	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:12:16.801472
111	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:13:04.681587
112	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:13:18.638551
113	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:13:19.659162
114	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:13:28.803828
1455	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:41:52.236794
1536	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:41:56.955115
115	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:13:38.640375
116	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:13:42.477441
117	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:16:57.965316
118	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:17:05.400691
119	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:17:17.574188
120	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:19:08.959942
121	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:19:18.796608
122	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:19:22.237269
123	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:19:35.872678
124	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:19:41.76488
125	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:19:56.677805
126	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:22:08.228399
127	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:22:18.104322
128	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:22:29.211535
129	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:24:25.135621
130	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:28:17.898336
131	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:28:55.13827
132	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:30:50.333947
133	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:30:51.851159
134	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:30:53.51098
135	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:31:21.773155
172	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:10:41.651037
2061	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 16:38:26.330623
185	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:25:46.803291
191	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:33:59.736956
1179	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 16:15:38.409153
1723	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:34:22.35325
2068	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 17:56:25.011924
205	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 10:50:58.680485
144	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:50:43.610457
145	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:54:29.168324
146	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:55:40.184192
147	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 21:55:41.442572
212	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 11:12:42.363961
1205	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 21:41:02.21344
1211	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:24:28.963253
1213	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:33:47.469899
1216	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:49:37.889834
1222	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:12:22.202744
1256	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:57:57.163007
1288	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:36:25.161841
1293	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:39:06.071744
268	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:49:34.373663
1294	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:40:27.973428
273	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 13:51:00.256028
162	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-08-31 22:33:04.3276
163	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 09:43:12.700094
2141	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:46:02.580398
165	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 09:46:11.496903
1297	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:40:41.891935
281	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:05:01.970626
1298	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:41:31.433261
288	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 14:12:11.675431
2062	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 16:38:44.648247
300	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 15:20:37.806931
1183	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 16:16:24.481634
1217	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:52:17.748058
1218	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:52:20.653552
304	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 15:23:34.00148
2063	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 16:38:54.99385
1802	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 18:09:28.295821
1289	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:37:43.595306
1299	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:42:47.212124
1301	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:42:54.448746
1456	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:42:14.580988
1537	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:44:41.14004
1538	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:44:50.144594
2218	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:35:55.465025
2219	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:35:56.155116
2220	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:36:05.67208
321	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 15:36:40.025546
322	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 15:37:39.179027
1958	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 18:12:52.836564
2022	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 11:14:22.922652
2040	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 14:01:06.754131
2304	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:28:49.456067
2359	102	10	city_transfer	City transfer: 100 LYD to رمزي ابراهيم	حوالة بين المدن: 100 LYD إلى رمزي ابراهيم	209782	city_transfer	2025-09-14 17:02:49.372331
2413	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:52:50.527731
2417	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:08:49.139572
2424	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:54:46.573373
2426	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:55:00.357253
2432	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:56:02.803929
2433	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:56:06.116303
2440	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:17:12.530849
2441	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:17:57.248279
2442	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:18:16.821382
2443	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:18:23.473973
2444	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:18:27.2401
2447	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:31:47.430663
340	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:11:17.230779
341	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:11:43.446019
342	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:12:12.370857
2454	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:43:41.20932
2461	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:57:37.564205
2502	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:25:03.763028
2503	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:25:14.056501
2507	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:34:02.155122
2510	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:42:27.826968
2518	102	10	create_offer	Create market offer: sell 100 USD	إنشاء عرض: بيع 100 USD	107	market_offer	2025-09-24 13:03:13.916286
2521	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	2025-09-29	daily_login	2025-09-29 15:24:10.08612
1219	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:55:38.493744
1220	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 22:55:47.766851
1760	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:58:42.666043
2073	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 17:57:59.198136
2221	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:37:53.185378
1539	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:44:53.356201
2307	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:29:15.517183
2362	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:05:07.799365
2368	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:06:28.712002
1698	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 10:54:00.276555
2369	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:06:35.310381
2427	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:55:11.761623
2428	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:55:15.407577
2429	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:55:33.189369
2435	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:56:32.629774
2445	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:20:43.048578
2448	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:32:26.135101
2449	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:32:44.941705
2455	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:45:01.275602
2456	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:45:16.907554
1963	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 18:14:54.227862
1972	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 19:03:04.115243
1973	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 19:26:18.92594
2023	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 11:15:06.92708
2041	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 14:05:01.9142
2462	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:57:45.107243
2508	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:36:02.768935
2519	101	10	market_trade	Market trade: bought 100.00 USD	تداول السوق: شراء 100.00 USD	144	market_transaction	2025-09-24 13:04:13.455218
2520	102	10	market_trade	Market trade: sold 100.00 USD	تداول السوق: بيع 100.00 USD	144	market_transaction	2025-09-24 13:04:13.846379
2522	101	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	2025-09-29	daily_login	2025-09-29 15:25:48.53013
1728	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:38:03.321278
2075	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:00:33.630939
1227	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:30:19.124127
359	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:26:54.496276
1261	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 14:03:28.869103
361	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:28:08.907199
365	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:31:32.828497
2144	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:46:15.79267
1459	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:45:24.848153
1460	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:45:37.146799
1540	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:50:12.653362
2222	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:41:01.053776
2224	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:41:47.783295
2327	101	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:46:50.712472
2365	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:06:05.020057
2434	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:56:10.958407
377	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:46:15.209116
1650	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-10 16:11:22.756454
2436	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:57:03.006666
2437	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:57:07.586933
2450	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:33:55.265184
1654	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-10 18:19:43.074354
383	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:50:05.318163
384	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:51:50.522169
2452	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:34:24.102009
386	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:52:36.404256
387	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:52:39.816965
2457	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:45:57.741789
389	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 16:53:43.763888
390	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 17:02:06.011669
391	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 17:02:11.319823
392	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 17:02:28.282828
393	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 17:02:46.859255
394	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 17:04:38.09859
2458	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:46:18.958423
2463	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:01:01.313219
2464	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:01:29.163618
398	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 17:20:23.85053
399	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 17:20:42.849004
2523	101	10	create_offer	Create market offer: sell 500 USD	إنشاء عرض: بيع 500 USD	108	market_offer	2025-09-29 20:14:39.642547
2524	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	2025-09-30	daily_login	2025-09-30 13:01:20.438312
406	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:07:50.086357
407	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:07:57.405908
408	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:08:15.469674
409	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:13:17.426437
1228	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:30:37.312036
1734	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:40:36.871699
1305	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:44:48.524046
1344	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:13:16.687439
1735	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:40:44.947735
1374	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 15:27:42.831031
2145	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:46:48.477922
2223	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:41:01.877117
2310	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:30:41.644843
1899	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 16:24:38.857959
2311	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:30:48.809533
2328	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:47:33.172713
2329	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:47:41.558723
2335	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:49:02.454033
2370	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:07:09.874436
2371	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:07:25.604753
1492	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 15:47:32.069149
1498	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:00:27.875491
1500	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:08:54.324961
1501	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:14:19.716898
1541	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:51:35.678148
1542	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:51:51.539329
1544	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:58:49.920543
1545	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:59:20.496198
1548	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 17:06:37.177098
1549	4	100	level_up	Level up to 4	ترقية للمستوى 4	4	level	2025-09-09 17:06:37.656954
2372	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:07:59.217368
1565	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 18:00:13.9757
1584	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 19:05:32.847661
1586	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-10 09:44:46.917336
1591	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-10 10:53:16.135356
2438	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:57:28.619367
2451	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:34:20.310352
2465	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:02:11.181968
2466	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:02:20.132563
2467	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:02:50.560364
2468	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:03:11.857852
1649	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-10 16:10:54.722003
1964	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 18:15:27.419447
1974	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 19:27:47.240393
2024	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 11:57:09.137117
2026	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 12:49:48.016064
2042	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 14:06:06.542653
2055	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 14:28:18.479627
1732	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:39:06.224932
1229	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:31:44.233016
1733	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:39:54.896704
1306	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:46:59.641811
1764	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 17:01:28.430896
2081	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:03:45.763678
1355	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:24:39.999719
1356	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:24:48.901409
1375	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 15:29:08.701522
424	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:34:00.071906
425	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:36:34.738366
1881	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 21:21:05.826208
1900	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 16:25:11.929739
2147	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:47:43.157051
430	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:39:17.699989
431	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:43:28.950072
432	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:45:17.17205
1933	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 17:10:13.31557
434	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:48:24.142243
2148	4	100	level_up	Level up to 5	ترقية للمستوى 5	5	level	2025-09-13 18:47:43.574441
1965	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 18:16:35.415898
1431	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:25:16.631516
438	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:49:34.991477
439	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:49:54.508189
440	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-01 18:50:14.495944
1975	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 19:30:30.422981
2027	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 12:50:41.492363
2043	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 14:07:55.417066
1491	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 15:45:29.292774
1493	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 15:47:48.399148
1499	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:01:11.476989
1502	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:15:17.110152
1503	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:16:59.619999
1504	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:17:04.434979
1505	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:17:07.103623
2312	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:31:40.547135
1543	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:52:40.233575
1546	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 17:03:12.191657
1550	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 17:06:53.734513
2313	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:31:46.014414
2330	101	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:47:43.931904
1587	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-10 09:45:03.957252
2331	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:47:57.329425
2338	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:53:19.846205
2373	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:08:07.651792
2376	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:09:56.896691
2377	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:10:08.293822
2469	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:03:37.079492
465	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 05:08:42.368646
2472	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:04:35.165607
2474	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:05:50.000502
2477	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:06:09.100472
466	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 05:09:02.269401
467	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 05:10:24.401685
468	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 05:11:02.19405
1736	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:41:53.275038
1737	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:42:00.057321
1376	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 15:29:36.345586
477	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 10:51:03.153436
478	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 11:00:50.718377
1404	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:12:19.266149
1882	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 21:21:27.079067
483	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 11:02:29.840946
1901	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 16:25:47.490463
486	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 11:03:53.811396
2168	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:41:59.333633
1494	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 15:52:35.936053
1495	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 15:52:39.116383
1506	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:17:23.394811
1509	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:18:15.066359
2187	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:21:27.736269
1547	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 17:04:34.941796
1551	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 17:07:07.382988
1566	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 18:05:55.675172
2188	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:21:44.852737
2191	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:37:02.882253
2226	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:42:27.026398
2245	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 14:21:34.189867
2255	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 15:33:53.879025
2270	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 15:55:58.512216
2278	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:09:51.752145
2314	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:33:31.106498
2315	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:33:35.359117
1976	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 20:06:36.982456
1978	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 20:23:20.42198
2316	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:33:43.059089
1988	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 22:12:33.090492
1989	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 22:34:50.846898
1990	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 22:35:52.223666
1991	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 22:38:01.183278
2332	101	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:48:11.894785
2374	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:09:29.378021
2003	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:31:57.448062
2028	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 13:02:58.93072
2375	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:09:46.909742
2470	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:03:45.077266
2471	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:03:59.135792
1738	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:42:05.253395
1265	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 14:11:28.412473
2086	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:04:56.934997
1348	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:16:09.438548
1883	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 21:22:15.64692
1910	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 16:37:38.137978
1362	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:27:26.686813
1363	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:27:32.186335
1364	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:27:40.591048
1377	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 15:30:06.414346
535	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 12:45:00.284997
536	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 12:45:05.731289
537	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 12:45:27.691828
538	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 12:45:34.524329
539	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 15:30:23.25989
1977	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 20:14:30.854061
1985	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 21:59:43.132292
1986	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 22:01:00.789724
1987	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 22:01:34.821185
546	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 15:32:10.700606
547	4	100	level_up	Level up to 2	ترقية للمستوى 2	2	level	2025-09-02 15:32:11.178986
548	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 15:33:30.413805
1992	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 22:38:49.364529
2169	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:42:05.876079
1496	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 15:53:00.114558
1507	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:17:27.183554
553	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 15:43:14.36191
554	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 15:44:06.616644
2189	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:22:06.402157
1512	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:19:11.482963
557	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 15:45:04.940046
1515	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:19:31.328758
2192	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:37:03.16116
1552	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 17:07:18.994785
2227	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:45:01.690386
562	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 15:47:25.949512
563	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 15:47:51.701285
1589	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-10 09:53:28.53906
2228	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:45:04.619206
2247	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 14:26:09.927745
2248	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 14:26:15.265165
2256	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 15:37:38.436181
571	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 15:55:30.643428
572	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 15:55:35.305432
573	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 15:56:00.201767
2001	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:21:55.734426
2002	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:22:08.385162
2317	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:36:21.99237
2318	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:36:30.403246
2333	101	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:48:21.13094
2378	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:13:30.111262
2379	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:13:40.347541
2382	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:15:46.666303
2383	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:20:14.663622
2385	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:32:51.635616
1739	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:43:08.208957
2087	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:06:57.926365
579	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 16:01:20.245119
1232	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:37:10.362423
2128	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:34:59.840456
1349	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:16:20.42362
1360	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:26:36.106663
586	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 16:12:31.624033
587	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 16:15:07.591414
1969	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 18:37:31.768839
592	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 16:21:48.765978
593	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 16:23:27.665945
594	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 16:28:43.858397
1437	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:28:54.646713
1465	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:47:21.968646
1466	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:47:31.901779
1468	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:47:32.689845
1497	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 15:53:08.935487
1513	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:19:21.707892
1514	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:19:27.040951
1553	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 17:07:28.576382
1590	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-10 10:05:10.272638
2166	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:29:48.140632
2170	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:48:32.486747
2190	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:22:15.781952
2193	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:39:44.150039
1993	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 22:39:29.064841
2004	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:32:34.329234
613	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 17:12:03.976834
614	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 17:12:20.500781
615	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 17:15:25.269141
616	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 17:21:42.179656
617	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 17:23:22.841901
2029	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 13:05:21.671953
2229	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:45:06.051916
620	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 17:33:11.425577
621	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:04:10.484725
623	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:04:56.663606
624	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:07:36.878248
625	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:08:37.423275
627	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:09:22.16735
628	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:12:22.31229
2257	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 15:42:02.568499
630	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:14:57.145329
2272	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 15:58:11.834318
2280	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:10:50.333019
2319	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:38:12.86117
2334	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:48:53.965225
2336	101	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:49:03.643714
2340	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:53:55.30182
2341	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:54:49.067596
2342	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:55:02.814482
1740	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:43:16.229319
1196	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 16:30:05.022723
1197	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 16:30:10.448181
2088	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:07:23.076243
1201	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 16:33:36.885584
1773	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 17:06:00.443723
2089	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:07:46.513623
1384	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 15:54:15.134963
1981	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 20:29:10.190318
1982	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 20:29:22.767096
1994	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 22:39:57.304124
1439	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:30:03.035538
1470	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:47:39.786692
1995	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 22:40:20.54123
1518	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:20:15.971161
2171	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:56:43.707495
1569	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 18:19:52.41642
2194	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:44:09.483199
2195	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:44:10.682015
2230	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:45:45.512748
2251	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 14:26:34.088148
1679	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 10:07:46.370866
2258	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 15:42:52.757318
1699	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 15:32:18.046061
2005	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:38:06.289111
2010	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:57:02.849697
2011	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:57:14.303881
2030	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 13:07:06.838539
2282	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:12:22.371798
2320	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:38:43.376598
2337	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:52:18.482353
2339	101	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:53:32.043934
2380	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:16:07.29547
2381	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:17:08.589146
2384	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:25:18.095274
2386	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:33:13.74455
2387	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:33:22.51313
2388	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:37:05.106237
2473	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:04:45.242392
2475	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:05:56.15621
2476	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:06:03.667339
2478	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:06:52.893817
2479	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:06:58.543481
1199	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 16:33:20.783793
1200	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 16:33:26.923795
1741	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:43:31.182666
637	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:20:20.300402
1777	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 17:07:16.595888
1778	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 17:07:26.407046
640	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:25:44.946254
1385	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 15:55:11.232738
1779	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 17:07:41.181445
1780	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 17:07:50.684271
2092	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:10:41.702416
647	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:50:42.110278
648	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:51:10.13925
1471	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:48:16.21424
650	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:53:02.702728
651	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:55:36.653642
652	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:56:52.378797
653	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:57:00.36112
1519	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:22:28.157306
655	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:58:22.821776
656	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:58:33.220136
657	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:58:37.142997
658	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:58:45.593263
659	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:58:59.563689
660	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:59:01.694076
661	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:59:11.786064
662	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:59:21.286069
663	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:59:27.946237
664	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:59:36.591728
665	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:59:43.811789
666	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-02 18:59:50.301991
1520	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:23:27.778122
2172	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:57:14.134092
2196	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:44:19.862684
2231	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:46:06.138698
2252	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 14:34:08.736896
672	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 10:10:21.276179
673	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 10:11:52.016444
675	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 10:12:46.030355
676	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 10:13:38.310212
677	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 10:35:58.469342
678	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 10:36:19.368156
679	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 10:38:27.079343
680	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 10:42:14.647061
681	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 10:44:31.562247
1701	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 15:36:28.854381
684	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 10:52:06.589202
685	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 10:52:21.210246
2264	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 15:46:34.484317
2173	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:57:23.662531
2174	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:58:04.751343
2175	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:58:09.244785
1914	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 16:42:54.752631
1416	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:16:35.91976
696	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 12:15:32.528294
697	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 12:15:56.299843
698	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 12:16:31.541834
2178	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:59:30.057817
700	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 12:17:48.945757
1472	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:48:27.709139
1473	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:48:29.737873
1475	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:48:34.646779
1971	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 18:50:03.527328
1983	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 20:31:41.016362
706	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 12:29:04.366324
707	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 12:29:11.42681
708	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 12:29:15.735994
2180	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:59:45.42058
2181	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:59:52.476068
1572	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 18:27:09.231319
712	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 12:31:00.514001
713	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 12:31:10.688877
2197	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:49:14.395409
2199	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:49:25.002677
2232	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:51:31.271213
2253	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 14:35:41.93106
1702	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 15:42:20.142869
720	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 12:33:34.228814
2006	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:44:34.862195
2012	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:57:35.111582
2276	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 15:58:54.440792
2283	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:12:31.941499
2321	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:41:05.147928
2343	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:55:06.860773
2346	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:55:43.059992
2348	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:56:25.848359
2389	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:41:04.683559
2390	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:41:41.86433
2391	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:47:07.228981
2393	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:47:59.854127
2394	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:08.06338
2480	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:07:24.631811
2481	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:07:38.268742
740	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 13:06:04.000302
741	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 13:06:15.137535
742	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 13:19:12.286681
743	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 13:20:38.226612
744	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 13:33:49.860041
1203	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 16:48:48.066992
1236	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:40:41.726717
1270	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 14:18:33.647771
1776	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 17:06:53.468294
1320	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:53:40.073346
1819	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 18:22:07.3052
752	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 13:36:57.079377
755	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:01:06.811055
756	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:01:27.049542
757	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:02:15.198673
758	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:02:26.82405
759	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:02:40.938897
760	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:03:05.939613
761	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:09:14.572463
762	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:09:52.209384
763	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:10:06.607248
764	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:10:31.138565
765	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:10:43.441846
1442	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:31:51.449435
767	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:22:10.393314
768	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:28:11.066191
769	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:28:18.70973
770	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:28:37.179638
771	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:35:49.179556
772	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:36:24.077782
1474	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:48:32.287033
2176	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:59:12.213723
775	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:42:20.999805
776	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 14:42:39.306229
1944	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 18:03:33.013828
778	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:37:18.099654
779	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:38:10.967212
780	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:38:38.464282
1558	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 17:12:31.541028
2177	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:59:17.04609
2198	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:49:18.446499
2233	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:51:34.983998
785	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:42:15.516277
786	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:43:09.288943
2254	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 14:39:33.105345
789	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:45:03.298961
790	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:46:36.315368
2267	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 15:47:05.284401
793	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:48:55.79425
794	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:49:15.536793
2007	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:47:29.729479
2322	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:41:10.20668
2344	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:55:12.681996
2347	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:56:16.252553
2392	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:47:23.953206
2482	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:08:43.236203
798	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:51:05.825247
799	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:55:10.883964
1237	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:41:18.477263
802	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:58:42.483456
803	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 15:58:51.530602
804	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:02:08.503004
805	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:02:46.333488
806	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:10:23.277855
807	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:10:33.980237
808	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:12:31.268754
809	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:12:39.838945
810	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:46:17.058703
811	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:47:09.662074
812	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:48:10.736515
813	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:55:07.027835
814	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:55:22.80021
815	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:56:44.893321
816	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:58:35.573413
817	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:58:50.549471
818	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:59:06.266683
819	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 16:59:59.79451
820	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:00:24.011348
821	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:04:10.364737
822	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:04:15.018754
823	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:05:09.69094
824	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:07:17.656053
825	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:08:18.34094
826	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:12:00.044834
827	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:15:02.365666
828	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:15:23.395763
829	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:16:03.937914
830	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:16:16.947867
1243	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:43:02.625684
1244	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:43:20.70332
1245	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:43:29.685433
834	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:26:03.401426
835	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 17:26:13.191439
2179	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 10:59:44.909114
2182	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 11:00:07.962098
2183	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 11:00:19.039489
2184	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 11:00:20.117711
2200	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:50:20.312593
1321	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:56:07.075688
1322	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 15:56:27.762097
2234	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:53:28.817531
1388	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:00:40.855737
2268	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 15:47:37.008773
1443	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:35:41.59405
1476	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:48:39.411268
2290	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:18:30.576644
2323	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:42:04.108967
1559	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 17:15:31.322919
2345	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:55:27.309258
2395	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:29.558373
1704	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 15:54:37.994544
1238	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:41:31.77104
1272	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 14:23:24.945312
1273	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 14:23:31.282316
2101	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 18:13:35.02051
2185	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 11:04:19.152215
2201	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:57:32.46414
1444	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:35:50.448643
864	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 18:16:46.553131
865	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 18:17:03.279883
1445	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:36:07.886929
2008	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:48:14.815772
1526	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:28:13.083255
2235	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:56:23.759372
2237	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:57:41.165248
1616	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-10 12:51:27.564266
1617	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-10 12:51:35.67169
2269	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 15:47:49.417799
2009	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:48:52.700425
2013	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:58:50.681247
2014	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 10:59:38.97321
2032	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 13:20:18.116416
2291	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:18:37.697801
2294	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:19:35.974784
2324	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:42:38.93106
2326	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:43:01.550168
885	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 18:33:05.258938
886	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 18:33:14.325529
2349	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:56:27.997745
888	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 18:33:40.73834
889	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 18:33:52.113944
2396	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:30.427954
2483	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:09:16.333928
2484	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:09:25.244408
2485	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:09:31.040214
2486	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:09:40.202347
2487	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:09:47.704371
900	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 18:50:20.615777
901	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 18:50:29.288826
902	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 18:51:09.638299
907	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 23:04:45.608084
908	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 23:04:52.959424
909	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-03 23:04:57.136976
1785	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 17:12:46.01802
1823	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 18:29:15.725421
2186	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 11:07:54.91778
2202	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:57:34.032571
2238	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:57:47.483799
2015	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 11:02:52.628899
2034	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 13:30:34.243026
2050	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 14:14:52.727436
2293	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:19:00.31341
1528	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:29:28.328413
1562	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 17:28:15.014212
923	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:04:34.505334
924	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:22:27.553208
925	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:22:29.919641
926	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:22:53.3016
927	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:24:17.491261
928	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:24:45.233248
929	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:25:07.518711
930	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:26:20.549019
931	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:26:32.569945
932	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:27:21.853516
933	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:27:27.51749
934	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:28:05.279495
935	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:30:17.287584
936	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:30:24.961716
937	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:31:11.13469
938	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:31:12.499241
939	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:31:25.112908
940	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:33:16.457407
941	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:33:23.636114
942	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 05:39:06.043392
943	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:14:27.965275
944	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:14:34.220685
945	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:14:47.534281
946	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:15:02.222938
947	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:28:55.591245
948	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:28:57.835161
949	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:29:18.1259
950	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:39:57.361697
1576	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 18:33:31.434268
2325	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:42:54.827834
2350	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:57:38.568019
2397	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:34.679122
955	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:42:13.273015
956	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:43:45.978057
957	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:43:56.048861
958	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:44:10.380174
959	4	100	level_up	Level up to 3	ترقية للمستوى 3	3	level	2025-09-04 10:44:10.813747
2488	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:10:28.465961
2489	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:10:38.917536
2490	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:10:53.301243
963	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:50:18.773496
964	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:50:28.175268
965	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 10:50:39.820886
1242	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:42:54.819032
2203	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 12:57:40.591202
2241	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:58:06.249528
2295	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:22:20.770409
2296	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:22:31.370972
972	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 11:03:02.326641
973	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 11:03:12.672521
974	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 11:03:23.552502
975	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 11:05:38.917735
1920	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 16:46:49.679956
1921	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 16:47:05.215196
2351	101	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:57:43.325023
2016	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 11:05:39.445418
2017	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 11:07:12.899492
1530	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:31:49.985412
1577	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 18:41:58.084031
2353	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:00:31.518482
2398	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:37.914461
985	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 11:11:32.288457
986	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 11:11:41.786659
987	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 11:11:57.755519
2403	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:53.933904
2410	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:49:49.388793
1708	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:22:52.839363
2035	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 13:31:57.312306
2411	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:50:27.962919
2491	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:11:23.754812
2495	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:13:12.172895
1248	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 13:44:34.046884
1277	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 14:28:19.272359
1328	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:01:06.928845
1448	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:38:37.988819
1531	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:33:13.863868
2204	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:01:56.306951
2352	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:59:27.434758
2399	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:40.348547
1710	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:23:20.849863
2400	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:42.66158
2401	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:45.931051
2492	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:12:20.157567
2493	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:12:39.806734
2494	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:12:42.973326
2497	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:14:30.151214
2018	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 11:08:46.570472
2036	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 13:35:20.351344
1064	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 13:11:53.592414
1066	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 13:38:56.393292
1068	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 13:39:25.137777
1069	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 13:41:00.17694
2205	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:17:54.033711
1279	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 14:33:51.486228
2243	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:58:22.170392
1329	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:01:31.881677
1449	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:39:12.585502
2298	91	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:23:26.445739
1532	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:33:30.692072
1579	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 18:44:24.841247
2354	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:00:39.173353
2356	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:01:12.993996
2402	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:48.901397
2404	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:57.203335
2405	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:48:59.749938
2406	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:49:04.300439
2407	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:49:07.322614
2408	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:49:11.722801
2496	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:13:44.136027
2498	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:15:54.343038
2019	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 11:08:56.390738
2037	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 13:56:49.711642
2206	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:18:06.105955
2207	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:18:07.03365
1872	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 21:12:11.841797
1924	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 16:48:41.021241
1332	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:03:05.364326
1951	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 18:09:53.01028
1453	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:40:04.570764
1533	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:35:21.85929
1580	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 18:45:12.209259
2299	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:24:38.391846
2300	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:24:44.325271
2355	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:00:41.036101
1953	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 18:10:09.776749
2020	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 11:09:25.07059
2038	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 13:57:44.162838
2409	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:49:28.097516
2499	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:16:50.046772
2208	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:20:14.018994
1333	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-06 16:05:23.020822
2209	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 13:20:20.262834
2301	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 16:24:55.439956
1452	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-07 16:39:48.652653
1534	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-09 16:38:37.681758
2357	101	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 17:01:29.369458
2412	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-14 18:52:33.165972
1139	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 14:27:55.749977
1695	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 10:51:22.265796
2414	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 11:59:08.231028
1715	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 16:27:23.848942
2415	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 11:59:31.311805
1873	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 21:12:37.642108
1874	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-11 21:13:25.902984
1925	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 16:48:58.042968
1952	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 18:09:58.903136
1954	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-12 18:10:19.054359
2021	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 11:11:31.608712
2039	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-13 14:00:21.585063
2416	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:08:18.487208
2418	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:10:56.55663
2419	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:33:19.500533
2420	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:40:52.447012
2421	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:45:52.700384
2422	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:45:59.635045
2423	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:54:26.409334
2425	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:54:55.465114
2430	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:55:46.320763
2431	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 12:55:50.008478
2439	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:16:41.370176
2446	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:26:21.420987
2453	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:43:39.011939
2459	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:52:59.072382
2460	102	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 13:57:24.353171
1166	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 14:42:13.208244
1167	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 14:43:11.990427
1168	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 15:35:19.92491
2500	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:24:51.298219
2501	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:24:59.88414
2504	89	10	internal_transfer	Internal transfer: 1000 LYD	تحويل داخلي: 1000 LYD	146	internal_transfer	2025-09-15 14:25:31.406248
1172	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 15:40:20.121034
1173	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 15:41:51.29965
1174	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 15:42:40.53496
1175	4	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-04 15:42:54.242754
2505	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:25:35.199399
2506	89	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:33:53.883145
2509	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:42:06.177051
2511	90	5	daily_login	Daily login bonus	مكافأة تسجيل الدخول اليومي	\N	login	2025-09-15 14:42:37.432077
2512	102	10	internal_transfer	Internal transfer: 100 LYD	تحويل داخلي: 100 LYD	147	internal_transfer	2025-09-15 15:37:36.520008
2513	101	10	internal_transfer	Internal transfer: 1000 LYD	تحويل داخلي: 1000 LYD	148	internal_transfer	2025-09-15 16:50:15.912753
2514	102	10	internal_transfer	Internal transfer: 885 LYD	تحويل داخلي: 885 LYD	149	internal_transfer	2025-09-15 20:05:54.255966
2515	102	10	inter_office_transfer	Inter-office transfer: 100 USD	تحويل بين المكاتب: 100 USD	183	inter_office_transfer	2025-09-17 20:43:06.963766
2516	101	10	create_offer	Create market offer: sell 150 USD	إنشاء عرض: بيع 150 USD	106	market_offer	2025-09-18 16:15:52.460234
2517	102	10	internal_transfer	Internal transfer: 55 LYD	تحويل داخلي: 55 LYD	150	internal_transfer	2025-09-24 12:58:59.486739
\.


--
-- Data for Name: private_chats; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.private_chats (id, user1_id, user2_id, last_message_at, created_at) FROM stdin;
\.


--
-- Data for Name: private_message_reads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.private_message_reads (message_id, user_id, read_at) FROM stdin;
\.


--
-- Data for Name: private_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.private_messages (id, chat_id, sender_id, content, is_read, created_at, is_edited, edited_at, is_deleted, deleted_by, deleted_at, file_url, file_type, deleted_for_users, voice_id, voice_duration, is_forwarded, original_sender_id, forwarded_from_sender) FROM stdin;
\.


--
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.push_subscriptions (id, user_id, endpoint, keys_p256dh, keys_auth, created_at) FROM stdin;
\.


--
-- Data for Name: receipt_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.receipt_audit_log (id, receipt_id, action, user_id, metadata, ip_address, user_agent, "timestamp") FROM stdin;
1	f3f44dcd-b018-465e-9dd2-4e37593bee07	generate	system	"{\\"txnId\\":\\"520\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-520-v1\\"}"	\N	\N	2025-08-17 09:51:09.501345+00
2	e0879e02-c161-4bdb-9d04-b380b9def244	generate	system	"{\\"txnId\\":\\"527\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-527-v1\\"}"	\N	\N	2025-08-17 10:25:34.829451+00
3	3ddde5d9-2ff7-4d29-a856-2a18603d97fe	generate	system	"{\\"txnId\\":\\"528\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-528-v1\\"}"	\N	\N	2025-08-17 10:26:39.896544+00
4	bb345e83-1b25-42d7-8a38-a0385a910c4c	generate	system	"{\\"txnId\\":\\"529\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-529-v1\\"}"	\N	\N	2025-08-17 10:28:06.018282+00
5	6d35ee43-6828-4ee1-af4f-4e0dc5f529be	generate	system	"{\\"txnId\\":\\"531\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-531-v1\\"}"	\N	\N	2025-08-17 10:31:37.238582+00
6	bef3f8f8-4b87-4dcb-8e91-3036a0def504	generate	system	"{\\"txnId\\":\\"532\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-532-v1\\"}"	\N	\N	2025-08-17 10:31:57.948664+00
7	a16569a3-f2b5-489b-ac65-ee1d49083dca	generate	system	"{\\"txnId\\":\\"530\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-530-v1\\"}"	\N	\N	2025-08-17 10:43:14.530531+00
8	1454f538-d190-433c-a26e-24bd3b0e6eb1	generate	system	"{\\"txnId\\":\\"533\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-533-v1\\"}"	\N	\N	2025-08-17 10:44:56.086169+00
9	b21ed0ec-0d62-4dda-85da-371d0dc69151	generate	system	"{\\"txnId\\":\\"535\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-535-v1\\"}"	\N	\N	2025-08-17 10:47:28.369601+00
10	1ff06bb6-4265-4ce2-9323-4fee39c55968	generate	system	"{\\"txnId\\":\\"537\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-537-v1\\"}"	\N	\N	2025-08-17 10:50:29.785989+00
11	941e12e4-6c5b-4fc3-8715-50236a488358	generate	system	"{\\"txnId\\":\\"540\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-540-v1\\"}"	\N	\N	2025-08-17 10:55:28.877333+00
12	dab15fdd-a1b0-4d64-a855-445e05669b87	generate	system	"{\\"txnId\\":\\"542\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-542-v1\\"}"	\N	\N	2025-08-17 11:01:34.070195+00
13	10690aa5-c796-4468-a893-b1170a041cb2	generate	system	"{\\"txnId\\":\\"543\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-543-v1\\"}"	\N	\N	2025-08-17 11:01:56.010818+00
14	78318211-18b6-4a01-adcb-bd2bfeb6b430	generate	system	"{\\"txnId\\":\\"555\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-555-v1\\"}"	\N	\N	2025-08-17 11:22:17.525944+00
15	a0551ec6-a731-4361-ae84-ac522748d679	generate	system	"{\\"txnId\\":\\"561\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-561-v1\\"}"	\N	\N	2025-08-17 15:56:00.525069+00
16	f78f4b68-8501-4d77-8c68-3ef1d1ad7f0d	generate	system	"{\\"txnId\\":\\"566\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-566-v1\\"}"	\N	\N	2025-08-17 16:15:37.15473+00
18	f5fe6f90-b970-4e66-89e5-205df0348278	generate	system	"{\\"txnId\\":\\"573\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-573-v1\\"}"	\N	\N	2025-08-17 16:30:07.832004+00
19	941ebe18-f9e7-4c64-b350-c3b2a06071cd	generate	system	"{\\"txnId\\":\\"576\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-576-v1\\"}"	\N	\N	2025-08-17 16:35:30.369629+00
20	c885a488-302c-4a02-b68f-0ea195cb950a	generate	system	"{\\"txnId\\":\\"584\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-584-v1\\"}"	\N	\N	2025-08-17 17:22:27.961586+00
21	0539494f-8160-4b1e-8aa9-60b54ca617e3	generate	system	"{\\"txnId\\":\\"583\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250817-583-v1\\"}"	\N	\N	2025-08-17 19:26:37.690359+00
22	82242f1e-7d01-41a1-b685-f0ed018429ae	generate	system	"{\\"txnId\\":\\"608\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250818-608-v1\\"}"	\N	\N	2025-08-18 16:49:26.114332+00
23	de744547-39bf-466f-ad47-310e3cc301c9	generate	system	"{\\"txnId\\":\\"772\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250825-772-v1\\"}"	\N	\N	2025-08-25 10:27:12.133732+00
24	82a8feb4-6a97-4f50-8d3b-0c6ed004c795	generate	system	"{\\"txnId\\":\\"75\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756140158428-404735\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"404735\\"}"	\N	\N	2025-08-25 16:42:47.375+00
25	a7620e85-dffd-4dbb-b0f9-1f1f5dc30d9c	generate	system	"{\\"txnId\\":\\"75\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756140174605-404735\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"404735\\"}"	\N	\N	2025-08-25 16:42:57.228+00
26	05af29c6-7f96-45cc-b798-22ad7358ef9c	generate	system	"{\\"txnId\\":\\"75\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756140356709-404735\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"404735\\"}"	\N	\N	2025-08-25 16:45:59.283+00
27	34fd5f21-ca5c-4de2-b1cd-1a3a6cd280f6	generate	system	"{\\"txnId\\":\\"75\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756140480535-404735\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"404735\\"}"	\N	\N	2025-08-25 16:48:03.187+00
28	19a34edb-f354-47f9-ab33-a66ecec5e49d	generate	system	"{\\"txnId\\":\\"72\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756140484594-375668\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"375668\\"}"	\N	\N	2025-08-25 16:48:07.231+00
29	38f6e61d-7f61-4b4d-9062-e0068399ef80	generate	system	"{\\"txnId\\":\\"75\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756140670832-404735\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"404735\\"}"	\N	\N	2025-08-25 16:51:13.536+00
30	1aac45b6-59ed-4e67-99be-77822f25d529	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756140717384-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 16:51:59.995+00
31	3b795014-5436-4354-a190-9d675f65bfcc	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756140827289-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 16:53:49.922+00
32	fc6e1251-04d0-4853-a123-30c0b83957c3	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756141007029-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 16:56:51.917+00
33	6556d97a-105a-4109-96d8-01b35a4db670	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756141062170-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 16:57:44.857+00
34	60bb4f1d-90b3-4e36-ad7e-4c6b29b61a80	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756141156472-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 16:59:19.083+00
35	8988a5fd-abf4-444c-b270-83e0d8b05ab1	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756141443358-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 17:04:06.282+00
36	58d15771-f354-4d67-aa76-8a625c313b4b	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756141519863-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 17:05:22.381+00
37	5f2db011-0ba5-4ed0-8d95-1b7980ca79ac	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756141622009-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 17:07:04.575+00
38	fed823fb-ac6a-42e5-8cc9-8d5f73f2d27d	generate	system	"{\\"txnId\\":\\"75\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756141705788-404735\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"404735\\"}"	\N	\N	2025-08-25 17:08:28.307+00
39	653a867f-a518-48d5-9a4e-56728f306f60	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756141847555-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 17:10:50.58+00
40	93c29c59-9297-4254-a094-1fc1feb7cc2d	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756141994891-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 17:13:17.421+00
41	f83c53f2-0cdd-4427-b86f-f82a4c1cd184	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756142146830-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 17:15:49.413+00
42	5155b85b-510c-41fe-bd86-0db2227525d0	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756146229574-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 18:23:52.224+00
43	bc238c55-3412-497b-a465-7b387ee26b40	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756146493154-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 18:28:15.803+00
44	cdd78930-afe7-45b0-b9a3-6397d1e87bdf	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756146632881-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 18:30:35.435+00
45	11070507-fd76-44f4-a2bc-5edbf7c93788	generate	system	"{\\"txnId\\":\\"76\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756146829044-405530\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"405530\\"}"	\N	\N	2025-08-25 18:33:51.594+00
46	50a72bfe-fabe-4b13-94a5-a308ba93beac	generate	system	"{\\"txnId\\":\\"77\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756147666476-451158\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"451158\\"}"	\N	\N	2025-08-25 18:47:49.054+00
47	2cda7a62-c642-4a59-9080-961d250a0229	generate	system	"{\\"txnId\\":\\"78\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756148211880-820276\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"820276\\"}"	\N	\N	2025-08-25 18:56:54.446+00
48	49ca5114-4d0a-44f6-bf08-0e786cd08cfc	generate	system	"{\\"txnId\\":\\"79\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756148718159-623591\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"623591\\"}"	\N	\N	2025-08-25 19:05:20.759+00
49	cc582f90-f098-477e-a905-cc4346f73801	generate	system	"{\\"txnId\\":\\"79\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756148757872-623591\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"623591\\"}"	\N	\N	2025-08-25 19:06:00.398+00
50	b710287b-64fb-4ed7-b433-f9eb2e04aabc	generate	system	"{\\"txnId\\":\\"79\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756148770378-623591\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"623591\\"}"	\N	\N	2025-08-25 19:06:12.872+00
51	403d874c-0303-4eaf-98ad-adb2b923774a	generate	system	"{\\"txnId\\":\\"79\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756148993630-623591\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"623591\\"}"	\N	\N	2025-08-25 19:09:56.464+00
52	2f6eb7b2-9f76-408f-8d79-c30e57f24806	generate	system	"{\\"txnId\\":\\"79\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756149011119-623591\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"623591\\"}"	\N	\N	2025-08-25 19:10:13.977+00
53	cb24d4c3-0405-443c-8b82-ef3e178f8e27	generate	system	"{\\"txnId\\":\\"82\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756224141746-825892\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"825892\\"}"	\N	\N	2025-08-26 16:02:28.524+00
54	5f8364d1-b13a-4844-b619-6f6612f90877	generate	system	"{\\"txnId\\":\\"82\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756224172609-825892\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"825892\\"}"	\N	\N	2025-08-26 16:02:55.233+00
55	6e6246b0-b6ec-49d2-b77d-44509669169d	generate	system	"{\\"txnId\\":\\"83\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756227024965-219517\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"219517\\"}"	\N	\N	2025-08-26 16:50:27.67+00
56	e340b8a7-252f-4253-a198-0e7500184cb5	generate	system	"{\\"txnId\\":\\"786\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"R-20250826-786-v1\\"}"	\N	\N	2025-08-26 16:57:22.958488+00
57	81ab3e9e-c081-433d-9b6d-857151784217	generate	system	"{\\"txnId\\":\\"83\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756313454671-219517\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"219517\\"}"	\N	\N	2025-08-27 16:50:57.325+00
58	d045a56f-b150-40c6-a72e-87fdac7a8c34	generate	system	"{\\"txnId\\":\\"83\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756314225410-219517\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"219517\\"}"	\N	\N	2025-08-27 17:03:48.134+00
59	5a54f218-9510-4215-9ede-c71a6b00e38a	generate	system	"{\\"txnId\\":\\"83\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756314310832-219517\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"219517\\"}"	\N	\N	2025-08-27 17:05:13.422+00
60	195c0e71-3568-4c17-9a76-d9bb2e58e73a	generate	system	"{\\"txnId\\":\\"83\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756314364855-219517\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"219517\\"}"	\N	\N	2025-08-27 17:06:07.385+00
61	ae7f14de-4c3c-4a93-8961-964930c2cb32	generate	system	"{\\"txnId\\":\\"91\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756369297153-854123\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"854123\\"}"	\N	\N	2025-08-28 08:21:49.073+00
62	49d8e626-9d0b-4295-882f-d364576fb141	generate	system	"{\\"txnId\\":\\"132\\",\\"locale\\":\\"ar\\",\\"receiptNumber\\":\\"INT-1756400891770-752350\\",\\"type\\":\\"international_transfer\\",\\"receiverCode\\":\\"752350\\"}"	\N	\N	2025-08-28 17:08:14.587+00
\.


--
-- Data for Name: receipt_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.receipt_settings (id, key, value, description, updated_at, updated_by) FROM stdin;
1	system_version	1.0	إصدار نظام الإيصالات الرقمية	2025-08-14 23:35:14.454111+00	system
2	receipt_template_header	منصة الصرافة - الإيصال الرقمي	عنوان رأس الإيصالات	2025-08-14 23:35:14.454111+00	system
3	signature_algorithm	RS256	خوارزمية التوقيع الرقمي	2025-08-14 23:35:14.454111+00	system
4	hash_algorithm	SHA-256	خوارزمية التجميع	2025-08-14 23:35:14.454111+00	system
5	timezone	Africa/Tripoli	المنطقة الزمنية للنظام	2025-08-14 23:35:14.454111+00	system
\.


--
-- Data for Name: receipts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.receipts (id, txn_id, version, locale, storage_path, sha256_base64url, jws_token, pdf_signed, pdf_sign_algo, pdf_cert_serial, revoked, created_at, created_by, verified_at, public_copy) FROM stdin;
f3f44dcd-b018-465e-9dd2-4e37593bee07	520	1	ar	public/receipts/520/receipt_ar_1755424269456.pdf	mFLlDiumdin9yQ5GiSjZGF6Bf4N1svKdYmNOX2DZZtA	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1MjAiLCJoYXNoIjoibUZMbERpdW1kaW45eVE1R2lTalpHRjZCZjROMXN2S2RZbU5PWDJEWlp0QSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1MjAiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX2luIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTE3VDA5OjUxOjA5LjA4MloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjEwMDAuMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IkxZRCIsInZhbHVlIjoiMTAwMC4wMCJ9LCJzZW5kZXJfcmVmIjoiMjgiLCJiZW5lZmljaWFyeV9yZWYiOiJOL0EiLCJvZmZpY2VfcmVmIjoiTWFpbi1PZmZpY2UiLCJ2ZXJzaW9uIjoxfSwidGltZXN0YW1wIjoiMjAyNS0wOC0xN1QwOTo1MTowOS4wODNaIiwiaWF0IjoxNzU1NDI0MjY5LCJleHAiOjE3ODY5ODE4NjksImlzcyI6ImV4Y2hhbmdlLXBsYXRmb3JtIiwiYXVkIjoicmVjZWlwdC12ZXJpZmljYXRpb24ifQ.ONhwabsOrQj-ZyG8qDHDBaYNCr2S0bFz4aXT-RFqmviFw4alLkiHIl9Hpifw0r96JL_PSEPBO_sGwSXBrx5MZrOzHjuyeLBwzxY_s2zMMKgqX2yfNoVX15rhjDzTE5XhPAwNQH_53ZgKLoCETM_hkQ3MZ1FyZkjqQvtc5s_vtxHRIJCtLoIYYkJOXfYM1k9VD6vjwccj42WykfN8AJaacuamz6mLamRi5C_3YlUg_ZtlrJ2N0ZIcG2irvssxAvlf-prC406XDBA098ja4YDb55f76KnuK4wzZZn3ttuk-I-lk7lh3QNiz-F9HywjZP77aistY9Lskeh6wx7Nszg-Ug	f	\N	\N	f	2025-08-17 09:51:09.469958+00	system	\N	t
e0879e02-c161-4bdb-9d04-b380b9def244	527	1	ar	public/receipts/527/receipt_ar_1755426334787.pdf	AHUBACjcbtiFGSbLdPIRToNUa5eGfnnfKk7hz99uVA0	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1MjciLCJoYXNoIjoiQUhVQkFDamNidGlGR1NiTGRQSVJUb05VYTVlR2ZubmZLazdoejk5dVZBMCIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1MjciLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX291dCIsImV4ZWN1dGVkX2F0IjoiMjAyNS0wOC0xN1QxMDoyNTozNC40NzhaIiwidGltZXpvbmUiOiJBZnJpY2EvVHJpcG9saSIsImFtb3VudF9zcmMiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItMTAwMy41MCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IkxZRCIsInZhbHVlIjoiMC4wMCJ9XSwidGF4ZXMiOltdLCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItMTAwMy41MCJ9LCJzZW5kZXJfcmVmIjoiMjciLCJiZW5lZmljaWFyeV9yZWYiOiJOL0EiLCJvZmZpY2VfcmVmIjoiTWFpbi1PZmZpY2UiLCJ2ZXJzaW9uIjoxfSwidGltZXN0YW1wIjoiMjAyNS0wOC0xN1QxMDoyNTozNC40NzlaIiwiaWF0IjoxNzU1NDI2MzM0LCJleHAiOjE3ODY5ODM5MzQsImlzcyI6ImV4Y2hhbmdlLXBsYXRmb3JtIiwiYXVkIjoicmVjZWlwdC12ZXJpZmljYXRpb24ifQ.x3mxO4X1eyLAMSAh6q2QSAGkfPajP6UL2ygl0H5STVACIppo-KcBAwYqQgDIuTWsMUhdN3LILI_fRbQKtur5jl0_twdZQDjVz7ij0sXnGJHTHZCWQC4Cj8F8dWl1HD8LfLRS4xcUyVgulkTLoLo7qu3jpZ-Csj_wAYA9eMjE7Bfa70IrD7JH9t27u73h48esF4W6a4BwOuRfvAkzq0mAc68wRz8K_0XwKd1B4xqIfli3qIyHX1rvqDVdocUrNmCPKKNnL5Q9w0N80jslFnnrsi3DlPTOj9X9eO2tNTrFWcDOSWCkFX32Yg6dLSzyEIcKD_peEESZZedKt02cP0NG2A	f	\N	\N	f	2025-08-17 10:25:34.800793+00	system	\N	t
3ddde5d9-2ff7-4d29-a856-2a18603d97fe	528	1	ar	public/receipts/528/receipt_ar_1755426399859.pdf	8yWtS7qalKWpYtMInDUytrgVhovEHxKzRXXZnzWLIhM	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1MjgiLCJoYXNoIjoiOHlXdFM3cWFsS1dwWXRNSW5EVXl0cmdWaG92RUh4S3pSWFhabnpXTEloTSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1MjgiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX2luIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTE3VDEwOjI2OjM5LjY3OFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjEwMDAuMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IkxZRCIsInZhbHVlIjoiMTAwMC4wMCJ9LCJzZW5kZXJfcmVmIjoiMjgiLCJiZW5lZmljaWFyeV9yZWYiOiJOL0EiLCJvZmZpY2VfcmVmIjoiTWFpbi1PZmZpY2UiLCJ2ZXJzaW9uIjoxfSwidGltZXN0YW1wIjoiMjAyNS0wOC0xN1QxMDoyNjozOS42NzhaIiwiaWF0IjoxNzU1NDI2Mzk5LCJleHAiOjE3ODY5ODM5OTksImlzcyI6ImV4Y2hhbmdlLXBsYXRmb3JtIiwiYXVkIjoicmVjZWlwdC12ZXJpZmljYXRpb24ifQ.EFmCoF5YrpkW61PmIWlZSpe6aNlM_lAVL_d8hlk86QaWJ6GVgrmR6PyWMwp92Wqc5v9LgP_7LxX0XjpQRIRaA7ldSfa1tZPTDYlKMrZ095L9H_T7dh4xsaMTyMqit-dIRejpA7-68LnSqyrXSaZWetCULN2LP4npegVvuxxq3FnXKvaZ6cWXZDfouEets_zJnB5xxgZVN1VDdD_adEiSO2WbsUim6sZessFDjPKnHzp538SOkr7CzKwgOpYCMEIL8ecHITzh-k4orR7Gfflf_7we2wSc0AbDdMjtT12UnAUVMwmAQLq9iRCSRjDZ6JTQsaVTKegyZPe5LPJWG7IexA	f	\N	\N	f	2025-08-17 10:26:39.871477+00	system	\N	t
bb345e83-1b25-42d7-8a38-a0385a910c4c	529	1	ar	public/receipts/529/receipt_ar_1755426485978.pdf	C-nDKwP2mwXazLfoQRpXJ9_XyV8R7-5OxZ6fsfrP_9U	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1MjkiLCJoYXNoIjoiQy1uREt3UDJtd1hhekxmb1FScFhKOV9YeVY4UjctNU94WjZmc2ZyUF85VSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1MjkiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX291dCIsImV4ZWN1dGVkX2F0IjoiMjAyNS0wOC0xN1QxMDoyODowNS42ODJaIiwidGltZXpvbmUiOiJBZnJpY2EvVHJpcG9saSIsImFtb3VudF9zcmMiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItMjAzLjQ4In0sImZlZXMiOlt7Im5hbWUiOiJjb21taXNzaW9uIiwiY2N5IjoiTFlEIiwidmFsdWUiOiIwLjAwIn1dLCJ0YXhlcyI6W10sIm5ldF90b19iZW5lZmljaWFyeSI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6Ii0yMDMuNDgifSwic2VuZGVyX3JlZiI6IjI3IiwiYmVuZWZpY2lhcnlfcmVmIjoiTi9BIiwib2ZmaWNlX3JlZiI6Ik1haW4tT2ZmaWNlIiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMTdUMTA6Mjg6MDUuNjgyWiIsImlhdCI6MTc1NTQyNjQ4NSwiZXhwIjoxNzg2OTg0MDg1LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.VzNKueguPDJOaZNEAf5f-EqjmWgnbMBpQHkrAvIw5nh66A0iNi5JuYs16CY168rvMhhtsi9g2Zc6rntYQVuxws9NEmdHXXz1huXQ6jTqW8jWCm8WKYMhb9OQtO-QRA9GBeMlFuGYYlu0_IF9gEfO7ke4svQZmlbVjU__wD3_P1MzInZjbFraHRRnf1CJMXNPxE3gRRx8FNpchEg--E7-0LOpyUAOZRCYbpcYEiy5TCWHNtMGvyOTjY6fOy-DsEDIGzrmrezKK7-3mx05aYGtyIxonK7W_IOMxNx0n41P2M5grcoeRMae7KyJFiDHwt6HvIvRyvQBAP2xUXH9o9k2lQ	f	\N	\N	f	2025-08-17 10:28:05.990838+00	system	\N	t
6d35ee43-6828-4ee1-af4f-4e0dc5f529be	531	1	ar	public/receipts/531/receipt_ar_1755426697194.pdf	TKFL7zFiMaw93s4012ZsV_4q5dbdZrblNs9kDXe2WHI	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1MzEiLCJoYXNoIjoiVEtGTDd6RmlNYXc5M3M0MDEyWnNWXzRxNWRiZFpyYmxOczlrRFhlMldISSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1MzEiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX291dCIsImV4ZWN1dGVkX2F0IjoiMjAyNS0wOC0xN1QxMDozMTozNi45MDFaIiwidGltZXpvbmUiOiJBZnJpY2EvVHJpcG9saSIsImFtb3VudF9zcmMiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItNTMuNTAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IkxZRCIsInZhbHVlIjoiLTUzLjUwIn0sInNlbmRlcl9yZWYiOiIyNyIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDEwOjMxOjM2LjkwMloiLCJpYXQiOjE3NTU0MjY2OTYsImV4cCI6MTc4Njk4NDI5NiwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.VMmp3uK0Y9D6S-AjWuqGQjbeee7WiZ4FlAFTNfRWcZvd73SKMDcpy0cJFdKzIjFH8WUq_p5J-Q9Xzm9UomGEvy5FilUXkOAEuh2Hr040H7kb7D-6iz4Lyk-4I3UV0GB3TZffuD03ZJEbVaU4kFZoz6Knz-_7EgRAaYZuc9qpgbC8RBvvfFv_6uRYlVeJjR7b_LFL04QB_A0ra7w0QqwMFQVNnKbhQkyT87pU2ckU_NjaEJfj_5isCY4pyyVWQ62MboEQyv07_eJ4TJUJezo0_gPqpxfbAh5N_ctTcnRsMJjf9Yw2H8W0ILpgeUaOr_mH8tgDvTgMkMq_hQ_sodLBMg	f	\N	\N	f	2025-08-17 10:31:37.207993+00	system	\N	t
bef3f8f8-4b87-4dcb-8e91-3036a0def504	532	1	ar	public/receipts/532/receipt_ar_1755426717902.pdf	9nfNs9iaEzRptl9mloHIpibo6PLp7q8xU7mEBSfq2z0	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1MzIiLCJoYXNoIjoiOW5mTnM5aWFFelJwdGw5bWxvSElwaWJvNlBMcDdxOHhVN21FQlNmcTJ6MCIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1MzIiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX2luIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTE3VDEwOjMxOjU3Ljc1M1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjUwLjAwIn0sImZlZXMiOlt7Im5hbWUiOiJjb21taXNzaW9uIiwiY2N5IjoiTFlEIiwidmFsdWUiOiIwLjAwIn1dLCJ0YXhlcyI6W10sIm5ldF90b19iZW5lZmljaWFyeSI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjUwLjAwIn0sInNlbmRlcl9yZWYiOiIyOCIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDEwOjMxOjU3Ljc1M1oiLCJpYXQiOjE3NTU0MjY3MTcsImV4cCI6MTc4Njk4NDMxNywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.uP1qCoY3DXvObl4i21XQA4L4bRdR-bpxhSfsrTwnocJCgi4lACYY8ncHMXYqfSINxBGEIEiZAJMW5EoCfoLiFPeT0NrhuLL2E3ifm4M3h3Pew_aHR0cASvwsmScX1rWSZATv45CbvIXN7K0bmcHaCtItH8oAB21-A3OErB2ovQ6-GdMXCwqkdgrmJLrlNpRbyjukJ9GzZpOt9ISzR0HyXehPrUiobAWjY4GrnSwOC2OqPRkVLeVdy8YL1wzwn3fWdNMUmCPcqfLEDyBScU0JwQ7Gk1X4jnfoI_pZVSU9v-uQuvruU_PVBNjV7vbWozHyraCs1pJlLGaQI4fmt7i4FQ	f	\N	\N	f	2025-08-17 10:31:57.916445+00	system	\N	t
a16569a3-f2b5-489b-ac65-ee1d49083dca	530	1	ar	public/receipts/530/receipt_ar_1755427394493.pdf	WrO6G6yGW9bjYtMK5qGvyTp8tBMbCgQZ8yo5Y6GWAlY	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1MzAiLCJoYXNoIjoiV3JPNkc2eUdXOWJqWXRNSzVxR3Z5VHA4dEJNYkNnUVo4eW81WTZHV0FsWSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1MzAiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX2luIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTE3VDEwOjQzOjE0LjE4MVoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjE5OS45OCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IkxZRCIsInZhbHVlIjoiMC4wMCJ9XSwidGF4ZXMiOltdLCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiIxOTkuOTgifSwic2VuZGVyX3JlZiI6IjI4IiwiYmVuZWZpY2lhcnlfcmVmIjoiTi9BIiwib2ZmaWNlX3JlZiI6Ik1haW4tT2ZmaWNlIiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMTdUMTA6NDM6MTQuMTgyWiIsImlhdCI6MTc1NTQyNzM5NCwiZXhwIjoxNzg2OTg0OTk0LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.QJYexQCltPZAXGnnUj9QxeqbpkGMSumtGCKwc9uamtAhqalKuuhj_HPaoTLV_kcX3JzKMNMSe6vuORmhhdsvyuhAtsHEytKg7-bkYjEB0lSlJq2VzPEkxD2kTvqwcAbhTvYMyxwnh6CQUsh2GPkY5cWQ1gc1XT093LHwS45kULfxy1fcoHhAJFMl4ncW2WJqm8gWRchP1N7V9pVjMkp_DpRzKbLSdAqO2d4rByD3tJmmF-MN7hzlPzdLeHXMJpAoYwnKU0Mjnd2xoe9mfl8IWFt0YRub0uoiV91l7hGhNcj9lzTudOb3n78V4DiWtmufNmXRLDp8uVk7UP4keaUkYQ	f	\N	\N	f	2025-08-17 10:43:14.508648+00	system	\N	t
1454f538-d190-433c-a26e-24bd3b0e6eb1	533	1	ar	public/receipts/533/receipt_ar_1755427496051.pdf	8RpDAMHBaC72iSuojYABlc5hyk4LXCPPM_Q1isxd9PM	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1MzMiLCJoYXNoIjoiOFJwREFNSEJhQzcyaVN1b2pZQUJsYzVoeWs0TFhDUFBNX1ExaXN4ZDlQTSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1MzMiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX291dCIsImV4ZWN1dGVkX2F0IjoiMjAyNS0wOC0xN1QxMDo0NDo1NS45MDZaIiwidGltZXpvbmUiOiJBZnJpY2EvVHJpcG9saSIsImFtb3VudF9zcmMiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItNTMuNTAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IkxZRCIsInZhbHVlIjoiLTUzLjUwIn0sInNlbmRlcl9yZWYiOiIyNyIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDEwOjQ0OjU1LjkwN1oiLCJpYXQiOjE3NTU0Mjc0OTUsImV4cCI6MTc4Njk4NTA5NSwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.cZ8CYM6MUMxfmd0jQDNwglxcOd-lEpEAGn8KynFa2iIskkPVbOB8Au8935Cajlib6zb9Q-n9PZxsocnnBwz0T6r6bJUjaLrD3pwHyVqcehnlrsGhZz_dhtqNKcyQhrbrsNP2F0mp1qJ5ssc7jclulqK3ABk-qaNF5VBBYOJ5OnpJljiie5cv0-R3y2aZ7s_HfIasypUnRI9T8-RlKfXI9zd8yXVW6uJ9AYHABbLdOJvJ7mfofGFY-Y0E4y2k2Zr3XKkOkCRbCzM3qh6wV5GYl8qbQPb_IBvsSFma42F7Ax63YzmS6ItyDbOmMcrj7s8x5S6kOI_YGjqcqhWVm9o8Fg	f	\N	\N	f	2025-08-17 10:44:56.063663+00	system	\N	t
b21ed0ec-0d62-4dda-85da-371d0dc69151	535	1	ar	public/receipts/535/receipt_ar_1755427648332.pdf	Y-5Yt5IVttv27eJGGpQtzsxbqcr_4GDns-Memt1TXe8	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1MzUiLCJoYXNoIjoiWS01WXQ1SVZ0dHYyN2VKR0dwUXR6c3hicWNyXzRHRG5zLU1lbXQxVFhlOCIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1MzUiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX291dCIsImV4ZWN1dGVkX2F0IjoiMjAyNS0wOC0xN1QxMDo0NzoyOC4wMzRaIiwidGltZXpvbmUiOiJBZnJpY2EvVHJpcG9saSIsImFtb3VudF9zcmMiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItNTMuNTAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IkxZRCIsInZhbHVlIjoiLTUzLjUwIn0sInNlbmRlcl9yZWYiOiIyNyIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDEwOjQ3OjI4LjAzNFoiLCJpYXQiOjE3NTU0Mjc2NDgsImV4cCI6MTc4Njk4NTI0OCwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.tzHTpTIyPzDBQQJi2V0-Uf7U5cqnjjOZ7SfKg3fa7KbNyJHTADim8x9IzqmAKr1CoG3XImT6TOgyN4gpVd6HtrAUo43OOFLZs8OrSl_6fjJu_XJPIaQWoaAeufIQ1ajGa9_Ub_u1YLwt1EGRhVf_Fxe_r2ZQQcRdWTyQH_ty9fMVGhecRUytMB6dGJ4Vei4uTrgqENLO4e31hSpa8C0kn95dFy8hIO4oF7AGd6IjiXny4u7DIP4UaikcrGJATak1jhNRY1yVBidMH-AvM2DpNMl6q4DOJlRo9VxdiqJ6paZyzOEGGQFPXo1x-Ht_-6jGu6I4PxS8ds00FvNjgph2og	f	\N	\N	f	2025-08-17 10:47:28.346043+00	system	\N	t
1ff06bb6-4265-4ce2-9323-4fee39c55968	537	1	ar	public/receipts/537/receipt_ar_1755427829751.pdf	odyUZitCinJN5jrymft0i-zTeuSHYqNvtG1Re6F-d30	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1MzciLCJoYXNoIjoib2R5VVppdENpbkpONWpyeW1mdDBpLXpUZXVTSFlxTnZ0RzFSZTZGLWQzMCIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1MzciLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX291dCIsImV4ZWN1dGVkX2F0IjoiMjAyNS0wOC0xN1QxMDo1MDoyOS41NjhaIiwidGltZXpvbmUiOiJBZnJpY2EvVHJpcG9saSIsImFtb3VudF9zcmMiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItNTMuNTAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IkxZRCIsInZhbHVlIjoiLTUzLjUwIn0sInNlbmRlcl9yZWYiOiIyNyIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDEwOjUwOjI5LjU2OFoiLCJpYXQiOjE3NTU0Mjc4MjksImV4cCI6MTc4Njk4NTQyOSwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.MLz6KdP0pAmgvqknBzwEI-ykPM_YJsUjtgGWuFftZItow4TITFhAHZ1l_WuW0C56DrYg78XsJy0LGlpnw7AyTkH8NEHNWC-Yre6PvvsveGjZB7e3HpDMZ7ofAgf4cZChumqTltSodnRpDCjkc701bNCvHa-n70kBzhATAxYr3D6p-wOopupuOHyKP1DdAgNIP3CXAY4cDnG4J6lw1eUOPSR_o6k0yvK3BxzIrdWPkpQmi9ytuHnpiWH9gggfyV6ZGFGANiotvf1c1oaEd0FW_DIhW-rSFqBsM0GwtMuT1dOttQiJpBvAAkYA5yOhnA8hq6OFT948x2ywnYqrcHXjhQ	f	\N	\N	f	2025-08-17 10:50:29.762947+00	system	\N	t
941e12e4-6c5b-4fc3-8715-50236a488358	540	1	ar	public/receipts/540/receipt_ar_1755428128839.pdf	34nHzjkkA-nmd0SJmtgdvOIPBn0-801FF0z06vJUT3w	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1NDAiLCJoYXNoIjoiMzRuSHpqa2tBLW5tZDBTSm10Z2R2T0lQQm4wLTgwMUZGMHowNnZKVVQzdyIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1NDAiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX2luIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTE3VDEwOjU1OjI4LjUzOFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjUwLjAwIn0sImZlZXMiOlt7Im5hbWUiOiJjb21taXNzaW9uIiwiY2N5IjoiTFlEIiwidmFsdWUiOiIwLjAwIn1dLCJ0YXhlcyI6W10sIm5ldF90b19iZW5lZmljaWFyeSI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjUwLjAwIn0sInNlbmRlcl9yZWYiOiIyOCIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDEwOjU1OjI4LjUzOVoiLCJpYXQiOjE3NTU0MjgxMjgsImV4cCI6MTc4Njk4NTcyOCwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.RyAg7yRg7rCYJWZZVrmJZsc--nkEiPGucvcuV2hxhuJJ_DZz7bjV6mTouxVHlo5tNuP9diYbDvRsmf5E0jb_i1yA1B6b2XFN7ty2yJCPei-7fOiaBOJnBwG_95eeyk49V9C9lCxDYTABrpV5GcV7VeJYCTCFhDFiis6L30W4bFlTBZ8ZlNeTtJVAQs22-tzTn16uf1tQ0AKy4mc_EHrt8FJ_5wN5_jewqvOGZLlC_FcdDn-I-f7Y-cz8WzAlzj2UHINusSAEhAWq1S01vgXRn8hsQqHCpfJ1V2xCCmQEJe3iCnD7wOvY6OTehYNT030P3V3pEsPuVD_6ToyG6gMC3Q	f	\N	\N	f	2025-08-17 10:55:28.853069+00	system	\N	t
dab15fdd-a1b0-4d64-a855-445e05669b87	542	1	ar	public/receipts/542/receipt_ar_1755428494029.pdf	Zk2Lu1nNSCd7TI0vCLEjuzKihGtGMEDfAIvjGhYeSOI	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1NDIiLCJoYXNoIjoiWmsyTHUxbk5TQ2Q3VEkwdkNMRWp1ektpaEd0R01FRGZBSXZqR2hZZVNPSSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1NDIiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX2luIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTE3VDExOjAxOjMzLjcxNFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjUwLjAwIn0sImZlZXMiOlt7Im5hbWUiOiJjb21taXNzaW9uIiwiY2N5IjoiTFlEIiwidmFsdWUiOiIwLjAwIn1dLCJ0YXhlcyI6W10sIm5ldF90b19iZW5lZmljaWFyeSI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjUwLjAwIn0sInNlbmRlcl9yZWYiOiIyOCIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDExOjAxOjMzLjcxNVoiLCJpYXQiOjE3NTU0Mjg0OTMsImV4cCI6MTc4Njk4NjA5MywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.cKrP4qb9PhSGOYSFvlE8eUAnAh5ufSxl20CQhjIWNO91yFKlfdjj2_RP5BheWTb5Yctxb7o_LaVUmJryEBpeeZCId1WjlH73Ev_2_XfVIjc9BIFlw-F236epd4JQ8amlEnJ9DpkubzGumvKVWxyr_HNJ8bHniqtcYZqCKxtEDL3Jiw0uXGbgBtrXWgU_V9WgFE3ETAh49hxX-SgFUq11z-bmj-ep9xAM1fGXDmmGJtkKo60gfKyC-Nyt-EQq1jCYwNzYAwV_oJVS-iTma9dZp_vrPJqO2-wzU4WC1zRzCT3nxpF58Vw_PBSS5lhVhc4TSS3NSnDtnVcsAhk6KX7Vgg	f	\N	\N	f	2025-08-17 11:01:34.045892+00	system	\N	t
10690aa5-c796-4468-a893-b1170a041cb2	543	1	ar	public/receipts/543/receipt_ar_1755428515976.pdf	YQR6KJ2IV296DgAfa67ohFQE7o27F-LhB7HXY4cnLtU	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1NDMiLCJoYXNoIjoiWVFSNktKMklWMjk2RGdBZmE2N29oRlFFN28yN0YtTGhCN0hYWTRjbkx0VSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1NDMiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX291dCIsImV4ZWN1dGVkX2F0IjoiMjAyNS0wOC0xN1QxMTowMTo1NS43NzFaIiwidGltZXpvbmUiOiJBZnJpY2EvVHJpcG9saSIsImFtb3VudF9zcmMiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItNTMuNTAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IkxZRCIsInZhbHVlIjoiLTUzLjUwIn0sInNlbmRlcl9yZWYiOiIyNyIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDExOjAxOjU1Ljc3MVoiLCJpYXQiOjE3NTU0Mjg1MTUsImV4cCI6MTc4Njk4NjExNSwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.PeckGkjC0ULzMUGwKcqZ_eW6CHPWLSwIptn7eU5hpqJ7TOo49tWRweTseGGrC5Betr0_tZ4Grj1mhO_V2A74ahKB3BwEZJ3c2zonUc1989Cf8mAfAGj6JUARVxwPQqmw-dz07HQ6xwqjFkbDHaoTCMuwBh7Cat9Drw9cLNxPPLwbHMfw3jN1bBpD1Hilw6nLCF-k6UAEd1vdkt6LIFn_0H9R9S8rEPOhXusunMuegqTiV8suwHn87fR7u4OkZZX1s-MopvQDMql4Fqv-3Y6e0cOeM_HQlWv22mZ918cEuiNI83lz9nAuKNXiwiAgivRXkV_SEOEgv9WtOVKcnfjhgA	f	\N	\N	f	2025-08-17 11:01:55.98793+00	system	\N	t
78318211-18b6-4a01-adcb-bd2bfeb6b430	555	1	ar	555/receipt_ar_1755429737489.png	OgzNmKmoLRtVHKvnZ_7O4BsXkQl26QD7RW2ikM-lYAA	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1NTUiLCJoYXNoIjoiT2d6Tm1LbW9MUnRWSEt2blpfN080QnNYa1FsMjZRRDdSVzJpa00tbFlBQSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1NTUiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX291dCIsImV4ZWN1dGVkX2F0IjoiMjAyNS0wOC0xN1QxMToyMjoxNy40NDFaIiwidGltZXpvbmUiOiJBZnJpY2EvVHJpcG9saSIsImFtb3VudF9zcmMiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItMTAzLjUwIn0sImZlZXMiOlt7Im5hbWUiOiJjb21taXNzaW9uIiwiY2N5IjoiTFlEIiwidmFsdWUiOiIwLjAwIn1dLCJ0YXhlcyI6W10sIm5ldF90b19iZW5lZmljaWFyeSI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6Ii0xMDMuNTAifSwic2VuZGVyX3JlZiI6IjQiLCJiZW5lZmljaWFyeV9yZWYiOiJOL0EiLCJvZmZpY2VfcmVmIjoiTWFpbi1PZmZpY2UiLCJ2ZXJzaW9uIjoxfSwidGltZXN0YW1wIjoiMjAyNS0wOC0xN1QxMToyMjoxNy40NDFaIiwiaWF0IjoxNzU1NDI5NzM3LCJleHAiOjE3ODY5ODczMzcsImlzcyI6ImV4Y2hhbmdlLXBsYXRmb3JtIiwiYXVkIjoicmVjZWlwdC12ZXJpZmljYXRpb24ifQ.iK5Yqe5KkQD2gVc0FngGs8eHTGyfGQBr3v73AwxEw1C1GzMjFj2N3xvdBkmyvHA8aHfjn4_V65c6a7428aF5KDVKwRC1auagy5v1EcEEr1wL8cG7TTU2CiXBJ6OUBTZsTe_fM43FzydDXcv5_BcdWsprFcFt9jr3uPOJVofrs6IHo22gf2SbiTu1zRSjf8rqkQWjpTwFVKvJewgV67yQa7T5oJXVja67u205CcAV8boEsxqOMW153rXFPS_TQHSaSuymvAgcxx91o6GgWOzYm7esdmDcxhmvXRE7kPrO3RYObbr75vtFdCxyr5GhIopwRixpr7STMtLGazOgTThulw	f	\N	\N	f	2025-08-17 11:22:17.502446+00	system	\N	t
a0551ec6-a731-4361-ae84-ac522748d679	561	1	ar	561/receipt_ar_1755446160487.png	qYy6vcAe6L-svPOR35nLA2AXk3WAEa96H1wYjZD0-Fg	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1NjEiLCJoYXNoIjoicVl5NnZjQWU2TC1zdlBPUjM1bkxBMkFYazNXQUVhOTZIMXdZalpEMC1GZyIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1NjEiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX291dCIsImV4ZWN1dGVkX2F0IjoiMjAyNS0wOC0xN1QxNTo1NjowMC40MzBaIiwidGltZXpvbmUiOiJBZnJpY2EvVHJpcG9saSIsImFtb3VudF9zcmMiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItNTMuNTAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IkxZRCIsInZhbHVlIjoiLTUzLjUwIn0sInNlbmRlcl9yZWYiOiIyNyIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDE1OjU2OjAwLjQzMVoiLCJpYXQiOjE3NTU0NDYxNjAsImV4cCI6MTc4NzAwMzc2MCwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.ru1kAMZgRvqNDkMsX6iAhT0x8mlXksoGABgW3BiTQlXNSmaqSl6vfNLBeR98l0fDVKIOlX3RIy0YCVW8bdGML9Gf0UeVKPpAl4sn1DLzhLb84zt-Dw6mdeyUeOZSp9igF8WSGov7YrGh4c05WKvaWmCKSIxF3cMDoZpz4EHcvO4QO3bL18y2MI_UyU87s_kDbNLANHiJHORZOcnli0224dZ34IVP5HTb5JYTlb3yqkZft2cSx6DJPJR9yg5UjqXUxLoF_5OTLfjr000MOeP_iuH5OHxXckKMoPN3UQS9hyUiCdUTsevGsFl7TDwW3ZfyR_xKAbzcCJOfiE1EDIRxqw	f	\N	\N	f	2025-08-17 15:56:00.499932+00	system	\N	t
f78f4b68-8501-4d77-8c68-3ef1d1ad7f0d	566	1	ar	566/receipt_ar_1755447337115.png	S_bO59ywa_MVmgR4ixpd3rbWTfxKxd4RVGVpR6TBZPk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1NjYiLCJoYXNoIjoiU19iTzU5eXdhX01WbWdSNGl4cGQzcmJXVGZ4S3hkNFJWR1ZwUjZUQlpQayIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1NjYiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX2luIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTE3VDE2OjE1OjM3LjAyOFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjMwMC4wMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IkxZRCIsInZhbHVlIjoiMC4wMCJ9XSwidGF4ZXMiOltdLCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiIzMDAuMDAifSwic2VuZGVyX3JlZiI6IjI3IiwiYmVuZWZpY2lhcnlfcmVmIjoiTi9BIiwib2ZmaWNlX3JlZiI6Ik1haW4tT2ZmaWNlIiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMTdUMTY6MTU6MzcuMDI5WiIsImlhdCI6MTc1NTQ0NzMzNywiZXhwIjoxNzg3MDA0OTM3LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.iVqkxaN-BitZE_H08kct9saqGZ8yLVZvN8Ah7-anJqgqVqnDov1SPWCXaSP6Kmd-RVg3ZaWk4tfhxRbdTxq7RmZKqtqk2xg2GFOFcUP1krR9MFByNcDsc5Mx4zMWQDEwf3TR5PIcycx2FZt0lmeLdx2F8WvEz9RrGBmZAMGhtyaemIMI8BvRyEJAiJylpQ537FEUElNg6a6nxGP4lqM3xaoB-53cEMUcpc5xfk3m54T5geH-xRtxXxQfyzICqlsuafOSscS-e1J60WbppDckdrSRRG2iDuqJemf72FJZprgfHINEoiwsXp4qQhd_FFe_ghDdBj5EoHbEKMtexzN0eQ	f	\N	\N	f	2025-08-17 16:15:37.128647+00	system	\N	t
f5fe6f90-b970-4e66-89e5-205df0348278	573	1	ar	573/receipt_ar_1755448207794.png	B_G9j0cqhoJq2E5HgAhNAbN5ZOn-a3jyJtCqjQXs9lA	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1NzMiLCJoYXNoIjoiQl9HOWowY3Fob0pxMkU1SGdBaE5BYk41Wk9uLWEzanlKdENxalFYczlsQSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1NzMiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX291dCIsImV4ZWN1dGVkX2F0IjoiMjAyNS0wOC0xN1QxNjozMDowNC45NzdaIiwidGltZXpvbmUiOiJBZnJpY2EvVHJpcG9saSIsImFtb3VudF9zcmMiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItMTAzLjUwIn0sImZlZXMiOlt7Im5hbWUiOiJjb21taXNzaW9uIiwiY2N5IjoiTFlEIiwidmFsdWUiOiIwLjAwIn1dLCJ0YXhlcyI6W10sIm5ldF90b19iZW5lZmljaWFyeSI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6Ii0xMDMuNTAifSwic2VuZGVyX3JlZiI6IjQiLCJiZW5lZmljaWFyeV9yZWYiOiJOL0EiLCJvZmZpY2VfcmVmIjoiTWFpbi1PZmZpY2UiLCJ2ZXJzaW9uIjoxfSwidGltZXN0YW1wIjoiMjAyNS0wOC0xN1QxNjozMDowNC45NzhaIiwiaWF0IjoxNzU1NDQ4MjA1LCJleHAiOjE3ODcwMDU4MDUsImlzcyI6ImV4Y2hhbmdlLXBsYXRmb3JtIiwiYXVkIjoicmVjZWlwdC12ZXJpZmljYXRpb24ifQ.MbV3mhWXLmHMMg7GtuesGg6yZuqYWogSxOkmLmt5dTgwC97X3sHQUtmFKDM9-fCo07vzGfPOkO9Wv0obFJxkFj9UmTR-Qh3tMk-Zvj1PBIX0P_bN7foRXPSw-UKlX0fNHE-5IiWlNDeJEXwyTpt3fFeoUbTeh778TT1php7wLXNHOGLwm9cVxhbEe5v7wyW7Be0bhOADgU7my7x6O0xsqEe60TBeINvlo5caH62AZXn-YMjYjRQwXlR60Z_gcHfvduVPPfZa2ETYJvPVIk3Sc3K21WKx8GZYsQyGMgU_JACNNQSNKaw9ZY2SRyH_toY19eTBvQYiNyvMlroiivMpgg	f	\N	\N	f	2025-08-17 16:30:07.807965+00	system	\N	t
941ebe18-f9e7-4c64-b350-c3b2a06071cd	576	1	ar	576/receipt_ar_1755448530325.png	L3ySniMVxecs8mzvPUWKMEHNRJSMCWHPPjwuUd1330Q	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1NzYiLCJoYXNoIjoiTDN5U25pTVZ4ZWNzOG16dlBVV0tNRUhOUkpTTUNXSFBQand1VWQxMzMwUSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1NzYiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX2luIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTE3VDE2OjM1OjI3LjYxMFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjEwLjAwIn0sImZlZXMiOlt7Im5hbWUiOiJjb21taXNzaW9uIiwiY2N5IjoiTFlEIiwidmFsdWUiOiIwLjAwIn1dLCJ0YXhlcyI6W10sIm5ldF90b19iZW5lZmljaWFyeSI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjEwLjAwIn0sInNlbmRlcl9yZWYiOiIyNyIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDE2OjM1OjI3LjYxMVoiLCJpYXQiOjE3NTU0NDg1MjcsImV4cCI6MTc4NzAwNjEyNywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.QXHx5XWCitNZm8IG4lu8hlycqHOQx03HslVtVXJdvQ0yYgWTjVfTxjMSHSv4uorCAuzwYQnUiPFx3Zi7qacA0ImhziuANZsJryPcWN4qJIEoxz6P8djJsHKAaOL2rQNQ_H4HGQEZuBJqcPEgDCuKpinh3qvLFVg3646cHUKZ2p68z4wauCA34PnY4y349WbhDSQkSTQHLwGzHY0D6HwZU0wmS2JpxlboErIcszzC9_gNnUoBSWxu18HK-XJ3mbvh9zIA5mCoD6cTkIrjiygjegk7PCU0_TlXoRValHtdiY4H0GwuERGWyRr4xPVVQyqPRoXu2L3UK_nXoGvo5WyOOA	f	\N	\N	f	2025-08-17 16:35:30.341737+00	system	\N	t
c885a488-302c-4a02-b68f-0ea195cb950a	584	1	ar	584/receipt_ar_1755451347023.png	BbnvxrvVzYoWpztlvjim_XfXSlULZsodghnFr3tnggY	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1ODQiLCJoYXNoIjoiQmJudnhydlZ6WW9XcHp0bHZqaW1fWGZYU2xVTFpzb2RnaG5GcjN0bmdnWSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1ODQiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX2luIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTE3VDE3OjIyOjI0LjUxMFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjExLjAwIn0sImZlZXMiOlt7Im5hbWUiOiJjb21taXNzaW9uIiwiY2N5IjoiTFlEIiwidmFsdWUiOiIwLjAwIn1dLCJ0YXhlcyI6W10sIm5ldF90b19iZW5lZmljaWFyeSI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjExLjAwIn0sInNlbmRlcl9yZWYiOiIyOCIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDE3OjIyOjI0LjUxMVoiLCJpYXQiOjE3NTU0NTEzNDQsImV4cCI6MTc4NzAwODk0NCwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.bdkglvs_PKriVoT9mJ8HI6dcyv1bTFgFDOHULhdJPKjDjO32_JWJZ_yY5LdKekIHRK_Cr76IinoLx7FLEmxib0TBVP4Vp1Kv6d3D0Kng_Yh5U-eFjMjRyS4Sih9h3IqfCyFd_3nkPwji9WTl2y-EcJmkWfBTtvqbvkyXCfB_fBKCEAWt7uOYrDhc1p6s1Vh8jlym3Gav9TSh2iWcayf_31XoGFNKMQYfRPMRoQdD3SFZkNcTRCE4DToE7IoFiRgljpwMQAsVNgD6KEoslBmP1wVhe4XOCCT28ORDsgYdI4s6_K73LCnRc4HBUxbLv5w6aef61CDPOcUfIjBA2jOEzg	f	\N	\N	f	2025-08-17 17:22:27.038169+00	system	\N	t
0539494f-8160-4b1e-8aa9-60b54ca617e3	583	1	ar	583/receipt_ar_1755458797645.png	NtYdKpX2gKzyzcOEZCnJC91r4Jt9o7PHEaKadr8XOCo	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI1ODMiLCJoYXNoIjoiTnRZZEtwWDJnS3p5emNPRVpDbkpDOTFyNEp0OW83UEhFYUthZHI4WE9DbyIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI1ODMiLCJ0eG5fdHlwZSI6ImludGVybmFsX3RyYW5zZmVyX291dCIsImV4ZWN1dGVkX2F0IjoiMjAyNS0wOC0xN1QxNjo1MDowMC45NjhaIiwidGltZXpvbmUiOiJBZnJpY2EvVHJpcG9saSIsImFtb3VudF9zcmMiOnsiY2N5IjoiTFlEIiwidmFsdWUiOiItMTQuNTAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IkxZRCIsInZhbHVlIjoiLTE0LjUwIn0sInNlbmRlcl9yZWYiOiI0IiwiYmVuZWZpY2lhcnlfcmVmIjoiTi9BIiwib2ZmaWNlX3JlZiI6Ik1haW4tT2ZmaWNlIiwidmVyc2lvbiI6MSwicmVmZXJlbmNlTnVtYmVyIjoiUkVGLTU4MyJ9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTE3VDE5OjI2OjM0Ljc3NFoiLCJpYXQiOjE3NTU0NTg3OTQsImV4cCI6MTc4NzAxNjM5NCwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.nHYMAVLew_VTxLWk9TXNSaZBWCH53QCIz4nCdbre96Bx4Mxv00aunFCy23EIEQqijCkqRedU7Z7IWvFrgUBs5P9sOsJoAxiyP5SuWJKzmRFnqeeSNUCFgWeHLuWsucIYt1yhegVR32tfa1nB5H7TXtz3ZE1LFoNcB6_34qxe-fyDjTIVelsE9IdOxKPHo8kzZUygVz3Uqag8WqYqj5-W8HZuJ60IMAGgaRV5TFXbnizPWEmSohmFkmC5AougWss4vqYhWgzfunnH1o3cPsCDxncceh_UkuXJjq-eNkN9V7aq3A8wNWJO0LcfTWC5Y3mz_tXtrbGOGxnoYs-VqMuaaQ	f	\N	\N	f	2025-08-17 19:26:37.661732+00	system	\N	t
82242f1e-7d01-41a1-b685-f0ed018429ae	608	1	ar	608/receipt_ar_1755535766083.png	c2fPNIi1mn1lFEh3ellBV7SAYBmbRwL-OORCCrV730M	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI2MDgiLCJoYXNoIjoiYzJmUE5JaTFtbjFsRkVoM2VsbEJWN1NBWUJtYlJ3TC1PT1JDQ3JWNzMwTSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI2MDgiLCJ0eG5fdHlwZSI6ImV4Y2hhbmdlIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTE4VDE2OjQ2OjMyLjM0MloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjIwMDAuMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJMWUQiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IkxZRCIsInZhbHVlIjoiMjAwMC4wMCJ9LCJzZW5kZXJfcmVmIjoiMjgiLCJiZW5lZmljaWFyeV9yZWYiOiJOL0EiLCJvZmZpY2VfcmVmIjoiTWFpbi1PZmZpY2UiLCJ2ZXJzaW9uIjoxLCJyZWZlcmVuY2VOdW1iZXIiOiJSRUYtMTc1NTUzNTU5MjM0MC04OVhVSkcifSwidGltZXN0YW1wIjoiMjAyNS0wOC0xOFQxNjo0OToxNy4yMTJaIiwiaWF0IjoxNzU1NTM1NzU3LCJleHAiOjE3ODcwOTMzNTcsImlzcyI6ImV4Y2hhbmdlLXBsYXRmb3JtIiwiYXVkIjoicmVjZWlwdC12ZXJpZmljYXRpb24ifQ.T2o_PLbnkNiVWrHU9AeXwjS0iFmCdEBZ1I0S77k6I_-raLkmCkoFF5fvqCGIYm5JbXhI_PLYk4blIyoKoMjOuEwhK0UEnCp9UgE9yBVoRQpI0kUBEiw1JogiWclxOYtiY0zKpEN37FFsrNjnApiJBz6uRSO-mk01NrXdqyW-Y9SvCo-uIfBH4jgivKe6Zeb--Mz1VMmqE_rz0kL_b9rnxo2Q3nZ6NGP-OIFsThJEriROSew6qyCghLt0AWLY1GGDdrLFVIKRK_UHc7DXf4gKkrRQ9c0nDLbnwPzhzcH-FUVK_ylCoCjscVrY6eAf3FzDVF7nBd1ZIq8d5r7Mtuk1UQ	f	\N	\N	f	2025-08-18 16:49:26.088118+00	system	\N	t
de744547-39bf-466f-ad47-310e3cc301c9	772	1	ar	772/receipt_ar_1756117632092.png	xNZeWj4HlHQgpqypmH90IxsW8bBZ8e_a5SwhoDV7f4o	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NzIiLCJoYXNoIjoieE5aZVdqNEhsSFFncHF5cG1IOTBJeHNXOGJCWjhlX2E1U3dob0RWN2Y0byIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI3NzIiLCJ0eG5fdHlwZSI6InN5c3RlbV9jb21taXNzaW9uIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDEwOjA4OjAxLjQ1MVoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNTAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMi41MCJ9LCJzZW5kZXJfcmVmIjoiNCIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjEsInJlZmVyZW5jZU51bWJlciI6IlJFRi0xNzU2MTE2NDgxNDQwLVJMWTZIVSJ9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDEwOjI3OjAyLjMzM1oiLCJpYXQiOjE3NTYxMTc2MjIsImV4cCI6MTc4NzY3NTIyMiwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.ySD6LBrgT614No_uWck37ElXWFoL_OWZ3dtsEG1CvJqH_JmqpViZmiY9r7b-nF8QGug2dIYtUscyW32TIGPwQxxeB8OsaI9oJlZGfFXfujMxREcdwru3ixpt7LRyw13F1TncN2larkq1Mmcn4bm52QGdmTTGOocf4EQ22dHRxgQdU6fc2G2W3GDhoiqUcM1c7JRgWg3tag5q2KqhWT5VAcY6wiu2lJ0MzDS_fkFj9C9lMCEcOL-H8mWK7ZABtlCAAYgQhjsO_0oufFVVelc7AvlO9HNHWTx6ckUmQJ5w1Ju7D0Vq2f1VxulD8CBIGFKAHzUeW2MwlpTuOnUovVvIDQ	f	\N	\N	f	2025-08-25 10:27:12.106391+00	system	\N	t
82a8feb4-6a97-4f50-8d3b-0c6ed004c795	75	1	ar	public/receipts/2025-08-25/international-75-ar-1756140167334.png	-yicPhr5g5tj3SbLXuu6Hs77mTii0XY-XK71pQ7M-TI	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NSIsImhhc2giOiIteWljUGhyNWc1dGozU2JMWHV1NkhzNzdtVGlpMFhZLVhLNzFwUTdNLVRJIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc1IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjMwOjIzLjY2N1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiI0MDQ3MzUiLCJiZW5lZmljaWFyeV9yZWYiOiI0MDQ3MzUiLCJvZmZpY2VfcmVmIjoiNDA0NzM1IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjVUMTY6NDI6MzguMzc5WiIsImlhdCI6MTc1NjE0MDE1OCwiZXhwIjoxNzg3Njk3NzU4LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.QfEHcuUpSfd_tP14Hf9m8eMy4gfkXDFkZk3L8TSlkTYFl3yMZJ-gKjeym-BcU1WhI5DvZt1C6g5FxcEFXpwH_HXWKG_LcFFQqcpC0zENIUSpUcHOjLOXMtlZEN6WLXgRntwT5SZrVeiVuF5t14qBL0sEZbejCjhnpi-Oh5IvKodHqxOYskQS-sK1dylNAKEt4KdjWVgrDTzhLSqOcH9Gxe2BanawvI2-2AbbY2JtPmQynmGa5XZix8ZBpQS1IR_kvNvf9H59lE-vPU4RO7GlG6ED7JOEFXldXsPSTkz1xXUBSxSVozs9XNTHfdVgpeZtkHT1iFzu2KkQLTxlqxdYsA	f	\N	\N	f	2025-08-25 16:42:47.348837+00	system	\N	t
a7620e85-dffd-4dbb-b0f9-1f1f5dc30d9c	75	1	ar	public/receipts/2025-08-25/international-75-ar-1756140177203.png	-yicPhr5g5tj3SbLXuu6Hs77mTii0XY-XK71pQ7M-TI	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NSIsImhhc2giOiIteWljUGhyNWc1dGozU2JMWHV1NkhzNzdtVGlpMFhZLVhLNzFwUTdNLVRJIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc1IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjMwOjIzLjY2N1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiI0MDQ3MzUiLCJiZW5lZmljaWFyeV9yZWYiOiI0MDQ3MzUiLCJvZmZpY2VfcmVmIjoiNDA0NzM1IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjVUMTY6NDI6NTQuNTgxWiIsImlhdCI6MTc1NjE0MDE3NCwiZXhwIjoxNzg3Njk3Nzc0LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.s-BnAn_I9SdxP36_49VMdSQFBXjAssZfQTih3rPNtpVK8TSdWUSM2rSdkJCiOmxf6KifTzxRSETPwHyjft4grOs4T5Yvgk2xxGkpx4P6O7BT7M76HDKzVu9KXjqwByOLde63Bi0MLkpfaOrirBoC8VfZprOXARL5M_ilx09qX1D6nVHUtfkX670vKi8Ph1MbL_smKlQK58ZMtntuExvAIitBEazUXBSPiNvyJ0XFuvrXKRRp8iUwiU29gjh9EGetmJ2J263MeoFK7HcdLV0is-x2x9SJ7Vbb1MAHcImxnKsxj4Dqc1nG3oP2KXIGynjxlCz2DFf6qf5YDLsVLPce6A	f	\N	\N	f	2025-08-25 16:42:57.217719+00	system	\N	t
05af29c6-7f96-45cc-b798-22ad7358ef9c	75	1	ar	public/receipts/2025-08-25/international-75-ar-1756140359253.png	-yicPhr5g5tj3SbLXuu6Hs77mTii0XY-XK71pQ7M-TI	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NSIsImhhc2giOiIteWljUGhyNWc1dGozU2JMWHV1NkhzNzdtVGlpMFhZLVhLNzFwUTdNLVRJIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc1IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjMwOjIzLjY2N1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiI0MDQ3MzUiLCJiZW5lZmljaWFyeV9yZWYiOiI0MDQ3MzUiLCJvZmZpY2VfcmVmIjoiNDA0NzM1IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjVUMTY6NDU6NTYuNjc5WiIsImlhdCI6MTc1NjE0MDM1NiwiZXhwIjoxNzg3Njk3OTU2LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.woCdsCmxsmUvPp0ghCZIEfbxibXmfGHtHlCyI3Nnt6up1-Fx5oCZawqi6sbM8fyHqtWb7a51iKIxZVhuQfhxaSCeP4sFBrswFgmDRfuAKN4PYHmr-88_oidsxcS7aLsMPSid74ZdNY-3obPHWF13H0H6PXCowNJ0A5dCOpkK1iFp1l42CVlDcShInhxy12x9iCGDl_ARo_Q2Be9sO3PqrlK94a7hd5mytC9cYnW_rJ-hBw7KnYVILrQhOkzywIBs3aa_TqmzsFkek5AHFoG6aPXCiLhh_wMOJF5agQhTOVcbIj3L85kLuduuNeP20PQ9FSFnStqBAfslsevrvMjVxw	f	\N	\N	f	2025-08-25 16:45:59.265715+00	system	\N	t
34fd5f21-ca5c-4de2-b1cd-1a3a6cd280f6	75	1	ar	public/receipts/2025-08-25/international-75-ar-1756140483143.png	-yicPhr5g5tj3SbLXuu6Hs77mTii0XY-XK71pQ7M-TI	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NSIsImhhc2giOiIteWljUGhyNWc1dGozU2JMWHV1NkhzNzdtVGlpMFhZLVhLNzFwUTdNLVRJIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc1IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjMwOjIzLjY2N1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiI0MDQ3MzUiLCJiZW5lZmljaWFyeV9yZWYiOiI0MDQ3MzUiLCJvZmZpY2VfcmVmIjoiNDA0NzM1IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjVUMTY6NDg6MDAuNDkwWiIsImlhdCI6MTc1NjE0MDQ4MCwiZXhwIjoxNzg3Njk4MDgwLCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.WoCmbBNXmSpWpNhaSunR3VIAKkw_SWUOm_3zF-Bvj360HJzbmxvMUuwcVg9HtEPlHhIFIRROtoZidon4p5a_8_1AAMpwWRnicJsbrDXjgkMgS6KARTPwYhmhx5bvEmSyP7Qr3dbtdLDV9vWqx1LU1JPbL2bHzVps6-9Ys6zKyxxpnMI8lvjVzX88_MSotn_HQGvCSRUOtW3PrRYOoKbJNEuwLp_LFEXwS4MOvaqaQ2OAbZYinfnH5j600V6205c2gttZFW33kVO8BI46afzWi3WpRniHmJBGVra7VIk74KOh58RWYJdvt6ImHofK6izEy9ICZLsd3tptvfVaKjvQxQ	f	\N	\N	f	2025-08-25 16:48:03.159163+00	system	\N	t
19a34edb-f354-47f9-ab33-a66ecec5e49d	72	1	ar	public/receipts/2025-08-25/international-72-ar-1756140487203.png	_X3YJ2T7rMIecEPOgry-v3JhpD8r9fYZ3S-or6VT3ng	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3MiIsImhhc2giOiJfWDNZSjJUN3JNSWVjRVBPZ3J5LXYzSmhwRDhyOWZZWjNTLW9yNlZUM25nIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6IjcyIiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDEyOjU0OjA0LjE5OFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiIzNzU2NjgiLCJiZW5lZmljaWFyeV9yZWYiOiIzNzU2NjgiLCJvZmZpY2VfcmVmIjoiMzc1NjY4IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjVUMTY6NDg6MDQuNTY1WiIsImlhdCI6MTc1NjE0MDQ4NCwiZXhwIjoxNzg3Njk4MDg0LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.qHHh7HsO2O1PtEnrQVaaehRQ-Xmw2ensioLbR0p_JGJHCCzBGqek7Qu5myl2JemjSquGyN4cBhg1J_P_Cg-PP8zlsvBb3SS9X55Y_IRDSmS9qWsxouj0IRCAlJlRT3nqCSutYlumZMJBTO-A1QrjtIy1heliOok6FNfii6AObdAaga3PVB3Mzg2PCWaWelMmK7KV_myxlnHc5CEQWKA69IbyaGYieUgdNRVBL4jaHXd2HRFH_loybf-85cNXl-ZDKIXwG5DxwBTlnYkYy93ozo4pH3duMH07YUSxH0QyZZ_m0FfLaDygHUo4wATvCqO4SJ7xPly2uoKiBJgtzvBeMA	f	\N	\N	f	2025-08-25 16:48:07.219306+00	system	\N	t
38f6e61d-7f61-4b4d-9062-e0068399ef80	75	1	ar	public/receipts/2025-08-25/international-75-ar-1756140673509.png	-yicPhr5g5tj3SbLXuu6Hs77mTii0XY-XK71pQ7M-TI	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NSIsImhhc2giOiIteWljUGhyNWc1dGozU2JMWHV1NkhzNzdtVGlpMFhZLVhLNzFwUTdNLVRJIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc1IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjMwOjIzLjY2N1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiI0MDQ3MzUiLCJiZW5lZmljaWFyeV9yZWYiOiI0MDQ3MzUiLCJvZmZpY2VfcmVmIjoiNDA0NzM1IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjVUMTY6NTE6MTAuNzg5WiIsImlhdCI6MTc1NjE0MDY3MCwiZXhwIjoxNzg3Njk4MjcwLCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.rSEisGGYgRUabJIpw5YzWs2IhGwlyMjfgD421V8w8V0i8_hn_lqZfwARH-za3e4vF4jnDpDMdAoWNGXG-67nq7TLPQg9fXTL6oxG33Fhw6Xo_dU5sJRQUN9VD2YVC6zgzcDrL3Zmlw11Z-qKTdqczB6X_7LolFU-49y4I8LtHg1NI3mtGakjaOSOqVquKwoRrduMXJXEulXYXwBhwrqn7hQKankISomeRLmZEzKRt7MuCRklPUo8RU7c4f3KN655O_HwygTZlYPY7KI1VhTt6iamYG4wT4Xh6luYelOfyiMCPZRe5KNP1_10BAkTOZpqFQANMXIEp9Mk41QsrNnh3A	f	\N	\N	f	2025-08-25 16:51:13.523142+00	system	\N	t
1aac45b6-59ed-4e67-99be-77822f25d529	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756140719970.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE2OjUxOjU3LjM1N1oiLCJpYXQiOjE3NTYxNDA3MTcsImV4cCI6MTc4NzY5ODMxNywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.IlWZ_FEz2YQYWdD57Z5D0csX36TAWDbktRFlL8YZfbvDWZtgo26NV_3IixshLCWSf1QhUggV3ME_8cqfmLvjnH97p0MNoimFdIBo3q7egyEaAerFjzEDInRyvfjLMBR0u3lO5q6OSQrYLINkR2JgubTjcK5lBZdf-ykfBa_EfZo0IN4cM9WtYLv6Yo8BWsbHPXKMqpYoQkoVkk97jtYYA9cMJLUu7V4Fum18kPuKoKHe0mMnJh5jGJpgOWWDUxwlWw_tR9OM8bw0sjcVjmhDwK6pZM11SjYR-OtwxvRk9Htrbq6F3GfFPymyfmvLuxiPVq3vbuDvr0uVjd7pDXuovA	f	\N	\N	f	2025-08-25 16:51:59.984073+00	system	\N	t
3b795014-5436-4354-a190-9d675f65bfcc	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756140829894.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE2OjUzOjQ3LjI1OFoiLCJpYXQiOjE3NTYxNDA4MjcsImV4cCI6MTc4NzY5ODQyNywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.HexLKlOoaItfRHH8uuTN7gP1fWPZR36v-GUi8MRrDJvP32aHL4JYXYPXR57sWi4YYtDNJvdH7sddYzCiPmy0V3qihf3ULfZRpt_8RV5S-iOpID1awPvnpRM327Wkb8sgWhwMgKmlmPVJnN42bHkMZchRs_AzqZzs477xsdbDhQJbMHiwCj6BGG7sQEKpQw2i0y9ouDH71InCM3DcZ-E9keL0VER_Gd4dp2HX8k66eQVWqBUeeWWzrZF1CyeFeOvJO9i0We141H-GTvoTct7F7VHFXvA7rJsjMttUBaK7g1viZFZOFLLxFqA3N0z4kseBCuwY1TUIiWZjaDJI_CV-Nw	f	\N	\N	f	2025-08-25 16:53:49.90916+00	system	\N	t
fc6e1251-04d0-4853-a123-30c0b83957c3	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756141011878.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE2OjU2OjQ2Ljk4NVoiLCJpYXQiOjE3NTYxNDEwMDcsImV4cCI6MTc4NzY5ODYwNywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.BTPX3LIW47we869SV-L9GjarBwFirakoQM8Wuo8TZKJo1pJ1sxGpoparpe9O6R86uXMtIpf4HDp5Zb8GHu8kMpWiVs5PLBUQ1ocBi99t-iwqPIoGLI5rbeJYCNdxLs7iZ0cKI54VRyF6XbohukoMlV8aGHBcCVvE_NssBbg33G2AVeUerFEqjKGOpMykS7wb-EHgPBimZeoAieL_3oL8DFSIdUBsoIUlvFPsbhoNGSwYbFw26hAfq1vMEaxt3bR8ONUeVf16QgiubIXY6BdrU9uHpqs_HG7_L_dD9MvKYFLb6AAfPKju_DzSoTiomdKtdpyg_KEAB4OYSscnZuW7eg	f	\N	\N	f	2025-08-25 16:56:51.894972+00	system	\N	t
6556d97a-105a-4109-96d8-01b35a4db670	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756141064831.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE2OjU3OjQyLjE0M1oiLCJpYXQiOjE3NTYxNDEwNjIsImV4cCI6MTc4NzY5ODY2MiwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.nU5Uw9smHVO94N_TuK8S9bClYjQB3BvgbPhDQAEha5ylHIOzex2455u3dVNmRP3odK5KGlo9AezEQdwm-zEyyIkwyurVdM7XhVxgyGzxd-sqrppFZ43QkhCvDWGn9VMjefmfaJL3ey0xX-4MQKXKj4HmOawvIBqhc84B8oyPpJ3AV1BFmlu24B2wG2uFSRWdRWKYHy2pTixewrWiT6jEVxsCg8IiDE1dNxrSvsV4P1XqdtSUFhek7G022KJX8ZS1H04gZmjVOUNiv5VMUlXGByeWLe1HmQWyoD2XUMH7Y9jvumlXIbbLaolxTxWgVHuJfxfHEB2tHEUvK06Lhk146Q	f	\N	\N	f	2025-08-25 16:57:44.845758+00	system	\N	t
60bb4f1d-90b3-4e36-ad7e-4c6b29b61a80	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756141159058.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE2OjU5OjE2LjQ0M1oiLCJpYXQiOjE3NTYxNDExNTYsImV4cCI6MTc4NzY5ODc1NiwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.bNnohYmWoKLW52ZiQX4U_F6vcF3_iKwMoagyAwQmOw4wS6bnCPLCog3MsV6ZZ7YCiY9Qb2LsWfPbv_zNEBynfA-vnEjsJvsJOfi5oTjWFHh2ZYY8APOiUJ0NeGHYlbOtSJwsQBp76r-WAnlA4uVxGX1DHkjnaAVukbXXAYtMCLLanHKPEZgmgoPm0A6uO7TfRbY_NFO0iY86LuB7ltUUsZn9bptMMN8CTCkB0tcU1zivJBJjuh1hTyFI5Se7Oox93_SgKsDRs6__whu3Dl5KMkhKmzEESjETEvx7f7HH9gZY6oaSp3s6e5Qc1_91PS9S9U_ose3V_2t-rdNoMYOa2Q	f	\N	\N	f	2025-08-25 16:59:19.071354+00	system	\N	t
8988a5fd-abf4-444c-b270-83e0d8b05ab1	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756141446237.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE3OjA0OjAzLjMyOFoiLCJpYXQiOjE3NTYxNDE0NDMsImV4cCI6MTc4NzY5OTA0MywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.w4SVIP_bmB8vsAGXmrhcIiDEIcAqo7jax-J3x4SVecI4iJSZ4B9t7xMga2pgpQVDPolsLk4YRIoLosGyDrnzaYMf0SrCwq1HwhuwOecNdoNgtvXleryf14OEbyyLR5HZ5ZVdFAGJgwHBAA-IUJaM2PFmeQYHmKKkOoeHhLsUwaeTR4Anw3MA0aOF0MtZGHREyDfqfu5j3GXyDl9kbO8b8PBJh69jw0XjPL4epPBgA-PGGM3B1ni-LXttvLkFrjrCwvxCNpMvFylqtfgP_ChtRnJISvp9uT0KLP8MieJ4VCPIWYuFP81LfvoEUph1Fc_NRGXN8Qdd4vD4IHWqoTnnUQ	f	\N	\N	f	2025-08-25 17:04:06.267541+00	system	\N	t
58d15771-f354-4d67-aa76-8a625c313b4b	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756141522351.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE3OjA1OjE5LjgyN1oiLCJpYXQiOjE3NTYxNDE1MTksImV4cCI6MTc4NzY5OTExOSwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.U33AGiqFu0rHZJHmytCtS0tsVxGQTMVD9GMzTePriTB1URDC9p0Ut58d20ybfW5oyKzXR5MalOW4jODSgZt9HE4an3aloFScK9m0M5t9y6sM0zYx2oJHm7LYyBJBLez1SbbGKnl9x4g25A2tdP0xqUhFx8L9iyg393e6TkYHDRLpuMuVVuqLc4ScvxUDbCx1odqlzbEPiRUc9mAM09sh1iyqlYhp8rZP9DhulaU70ANBz_G8Fe0rEqATQlE5IqajcLjzOcHw7uV6VtlG63rjQUG8RgD6kYWkm0KdC8Ddegt7dsn_9n3vZBwdxc2thLI5px6lMcH5vl-B-l-hdGWMGg	f	\N	\N	f	2025-08-25 17:05:22.36867+00	system	\N	t
5f2db011-0ba5-4ed0-8d95-1b7980ca79ac	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756141624550.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE3OjA3OjAxLjk3OFoiLCJpYXQiOjE3NTYxNDE2MjIsImV4cCI6MTc4NzY5OTIyMiwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.giIPH4Z0MeQEm-6lFzVkrzuarnLz6Me3nsCE70Oq7jm9WeJae1jA2eIsqL6OvcE8SWoKswDTL48eq9-PLVRmFAJUrezD0B-Xayyhpw0TBb2A4DdWrV8pcO6yEbuiojmnShDSiX6EJG2uRyUCaWhZFKYYeOY7hUSgJUgcnjuUetPwTUOjGj1wi4qaA_5Zh9smQ-NmB7wZW240pDz45w8Hlhz1NpmiJtQB32Sdtpv9iKVA1eVhex_ZKAHDITp0Z7DecGVbl_lFisirOWMPd2I0AgdQbK_MphSt9gwbb1GlxdTU-71H785aF7NNl0_bHkHFztzNaYhMtdNtCbCmsYuewA	f	\N	\N	f	2025-08-25 17:07:04.56422+00	system	\N	t
fed823fb-ac6a-42e5-8cc9-8d5f73f2d27d	75	1	ar	public/receipts/2025-08-25/international-75-ar-1756141708282.png	-yicPhr5g5tj3SbLXuu6Hs77mTii0XY-XK71pQ7M-TI	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NSIsImhhc2giOiIteWljUGhyNWc1dGozU2JMWHV1NkhzNzdtVGlpMFhZLVhLNzFwUTdNLVRJIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc1IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjMwOjIzLjY2N1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiI0MDQ3MzUiLCJiZW5lZmljaWFyeV9yZWYiOiI0MDQ3MzUiLCJvZmZpY2VfcmVmIjoiNDA0NzM1IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjVUMTc6MDg6MjUuNzYxWiIsImlhdCI6MTc1NjE0MTcwNSwiZXhwIjoxNzg3Njk5MzA1LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.PrEdGxAI2MVrqIrvD5wXtJek4X_-TIqth05lQWqwzgaessda-wId7Tn09P7tgyl2OuDaL5NLPSMBv1UyLsD7ls-nMkq2dNJW9AsNGZ_ojNcTGHKIHxRiG2LY2LcaYEeVYtyIlsqIG8ijvSikUYXXUcKzQACmpPCAWMXwSxqJyStXJol0jEDIiuG_42newpo1Op6K21nr4f-gCxq5UyIkZ43agTiMQv3849A548agjzgoBzn-WEywtOBCvbv6emfQhE2zA9lJLUQ5NlDUyOMxxIswJCRBxmpHhXx8f23nYl4imp8g4XMXhkfnx0KesPi3ZTY4_pSGT7POmuDr6DnA8w	f	\N	\N	f	2025-08-25 17:08:28.296022+00	system	\N	t
653a867f-a518-48d5-9a4e-56728f306f60	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756141850554.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE3OjEwOjQ3LjUyOFoiLCJpYXQiOjE3NTYxNDE4NDcsImV4cCI6MTc4NzY5OTQ0NywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.NUz5lx3m_rUd-muDiAGPMeKRYlU34nx8bz5Lni5BavDA8MN8MEu1sX5FjuQp0ji1Gz8YixMDZsyBsGNV2oSnAZDgr31ZMw5_n_KCGTuXsM5TAmQl9INdlPCiGvZ4hsbjc6gTHDVHsXqd-DXeWSBp38kJ3IEKsSYpHyfZfCxraPLuPxBdjKf9hDE0BUjGl3ySMkZJlNtEpdftd49ELfpwd-dJBzQSB8j2yD2HDjrUAGxRIEGhh8-wY_NvuTQGmQmWRHQKgGCrSkogtaPyznDBB9eVAndBpuJuta68PLomJDuTZ8hG5Rkz6TWvtIcMa-jwNmgc_684Mylp8FxwA0j0iA	f	\N	\N	f	2025-08-25 17:10:50.569529+00	system	\N	t
93c29c59-9297-4254-a094-1fc1feb7cc2d	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756141997392.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE3OjEzOjE0Ljg1OVoiLCJpYXQiOjE3NTYxNDE5OTQsImV4cCI6MTc4NzY5OTU5NCwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.p6JPEumqk19poNhDYSb1JGXJ3CrBB9c-4JEvr6fGFCEwubJ4xC7BMHsg0wbQp2uLk2dxbnyPaeVhbKwnOM_PuGdbj8JQeV7cHVLkqCHtyfwe4vFoIzUmM1skRxAbPt-LqApzUd1r5KVoKzoy7bHan2bgYf9bKQNqIUboCKrOAKA8p8FnO01w1_DasPNbTE5b7XTsa-kbfHHyRzixdo5HsRxjikZb9Cj1_VmyjyW2RCNoF_KYoscSLbt1QVtuxYjjnHirRIJjorHC8QPa0YzTn999eM4aCXHcDKHkXXHV_aVA9AxoQAhfT1lhnf2j3rKK1dixhm8weL9J0jm5RIHyRw	f	\N	\N	f	2025-08-25 17:13:17.408977+00	system	\N	t
f83c53f2-0cdd-4427-b86f-f82a4c1cd184	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756142149380.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE3OjE1OjQ2Ljc5NFoiLCJpYXQiOjE3NTYxNDIxNDYsImV4cCI6MTc4NzY5OTc0NiwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.iNo8fmHB3i0hnw252m74bgBwHu6ywZRn6dtx6VY0Yn_CuBtDTBZ5e0jYqW-opoxsh4QuH4MYZEDnWVOKqCOoW8JR4RVSxhHEgqtDgdujYoUaEwdgpCMXmSzAX5vykTDhoNP5Lal_WVSv2GwnJZcjYMbVjyuNF94l0uoYjOCpTez2ZNP1zLqqPoijKGwbB2zj_DPUE4A1gbbiZEiwNrA8JF0zcd2fIJIBM6ozrXIhOwQ5KNP0RnC0oya56X4icRConU6FphpW1lLlUlfexcLplWDkocFag0D_WxaeDyA8KW28gQZTgvDhgPl1NKKEVqF4kH1LrZQ2JtP0qdG1I3c67w	f	\N	\N	f	2025-08-25 17:15:49.40027+00	system	\N	t
5155b85b-510c-41fe-bd86-0db2227525d0	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756146232184.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE4OjIzOjQ5LjUwOVoiLCJpYXQiOjE3NTYxNDYyMjksImV4cCI6MTc4NzcwMzgyOSwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.f8bMiJ0RDADPQzuRHGuPyOhj9HCKU4hxSVz-GEuurbEHsiCvpkTLS4tFNeFYBPnK5YYx6vNVAm9Xgq7ECP5QtW9XASYDK8RENinoOFPVF2lmWuZJneRuOCrhHwnllO6XNcd9ktWSNG8NE8EZ5NRoYzMEfTNBkspEjgoycxFDI92REONgfhjDVWYeWImsudocixdU0t3kANAftsMeBKHFYykmBf6J_IurGgj8VQK9qF5IS7XfSFSgZJB_8W-wnooFZxwa6PtADoKvDF9PKHUAu4NJubHKuKDfGXpju9emGdKoSurMGN9B6eEdHBm1ZGZuKhI1ronQwB3sy1BRoIUxZg	f	\N	\N	f	2025-08-25 18:23:52.197815+00	system	\N	t
bc238c55-3412-497b-a465-7b387ee26b40	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756146495774.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE4OjI4OjEzLjExN1oiLCJpYXQiOjE3NTYxNDY0OTMsImV4cCI6MTc4NzcwNDA5MywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.CgNl8btq_1zi5JetYoRPXy-HsueMmPs8kkclqZQ1HtSM_V3VjfO8Yl5zAQhXOQlCgsPj-up2NULWyViP2g7BhomCJ2iNSopI54W8ZgxGySfoObuS61wOIEvrvk_8QWfT08VLHdR8CHAzTjqgfEwdvoyjd72Hyvq5AeEkmoc-hkMMXiI-ntMuPh3IWaoA8G4TNkDMEpwcIxga-d5osu49LGK060PlROAsH3Xb1HMbevT6vSyvjsf4J4IyhiDKljAgkReqZAahQJdI5SDrxmMyWlqamkZrFLsjPNi3130SEq-7FZmicRMtgkuAEOJn587S1Fsjf9n8yCTvK1Yxgta8Wg	f	\N	\N	f	2025-08-25 18:28:15.790742+00	system	\N	t
cdd78930-afe7-45b0-b9a3-6397d1e87bdf	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756146635408.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE4OjMwOjMyLjg0OFoiLCJpYXQiOjE3NTYxNDY2MzIsImV4cCI6MTc4NzcwNDIzMiwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.boBhqxRBDMVzzNERwvV12tUOu7DQ7Cxh0qLtG3qhJAUBNrCc_rODJ0h7GPhk_kMy7IucIo9N3PVMNIBChIavlM48OwaxcNm_1RfV27T3E45N1to6zthAYBWEhLQVOXZezR03O3SdV7EjhHvQY9r6Vg9T-Lays88c2YKdFztQqf8bmo0OxVINnG0iIQzMn-1hqPbUz3aF9mIf9f3f8pE_SNBeOCU0ZvvTPNnKyR5aTutQozgTpak6-ZSKSX9IQhN0tfo4hsrb1vpO8oefsWzP7HCzJ_9RD1tlA3cP1gKfFpnBfS68yuQeAMzo8LhE33NMYuEm5vCrP59w0n7y7xaBog	f	\N	\N	f	2025-08-25 18:30:35.42225+00	system	\N	t
11070507-fd76-44f4-a2bc-5edbf7c93788	76	1	ar	public/receipts/2025-08-25/international-76-ar-1756146831560.png	ZhNCMjcgexMhDdWP1kZUSlqlEoUhL_mNnlbVwWiGFJk	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NiIsImhhc2giOiJaaE5DTWpjZ2V4TWhEZFdQMWtaVVNscWxFb1VoTF9tTm5sYlZ3V2lHRkprIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc2IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjUxOjUxLjQ3NloiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIyMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNDA1NTMwIiwiYmVuZWZpY2lhcnlfcmVmIjoiNDA1NTMwIiwib2ZmaWNlX3JlZiI6IjQwNTUzMCIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE4OjMzOjQ5LjAxMFoiLCJpYXQiOjE3NTYxNDY4MjksImV4cCI6MTc4NzcwNDQyOSwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.nE1wHOr0c1jxk4A7-V9WXbPCb2MgDel6cgdH4W8Prx1cPvpygWPf7USxxz8mUWkbhb0ofUYc7trMFiaHd5mg8yJ1c_Jw4UiSjPr0xXfL2LNmk_JAcGSlQEke1R_kM-wFE_rFmepPpHf-6UrOIV6tgCmwfiKsixCNvK73srnVDxWB8z92P1YOK2j9lDVRGLm1WMDrBkU-qaXwtGnX-LKGf_aa-CyKD7wVMZbaIfGKj_ExwI9CfF2uLL-XFE0Dt4dgwc_ZPy7-a5zK3_sGTuhG6Ts0UD-8dH8OELT49gR8ShCMqvJcFzMJQg5ZARhhdUmZFOT70XuPGI2Y1xmVGzGAww	f	\N	\N	f	2025-08-25 18:33:51.58205+00	system	\N	t
50a72bfe-fabe-4b13-94a5-a308ba93beac	77	1	ar	public/receipts/2025-08-25/international-77-ar-1756147669022.png	Nakxx3cFwxa-ABM6T8Mw1pPIBdz0JVTlwSFAZP_6nn8	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3NyIsImhhc2giOiJOYWt4eDNjRnd4YS1BQk02VDhNdzFwUElCZHowSlZUbHdTRkFaUF82bm44IiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc3IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE4OjQ2OjUxLjUwNVoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiI0NTExNTgiLCJiZW5lZmljaWFyeV9yZWYiOiI0NTExNTgiLCJvZmZpY2VfcmVmIjoiNDUxMTU4IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjVUMTg6NDc6NDYuNDM2WiIsImlhdCI6MTc1NjE0NzY2NiwiZXhwIjoxNzg3NzA1MjY2LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.gIH_p8JiGlHPV20VVPHEIV-8Hsh-yuosuPZ_HWqf7YrmRSsu2TOnP0xdk2kvmUhpOCO4hrsJlRqaI10jf204DUq0xRxqb1fDkBWkpnbx_dBFnfJZ-t7-GD4qXl41LdYKTSKPRYKYmMPcqhtpntkkHySeFywsynRHKp7VgkBHirCPB3DH45gP0_sZGkE1npjfH9X73eyFrDW_BC6eCB7Z7PnOI2334yjHwp1dZ5u8e1-c6WWA-Kj5PHn_5vQjnrMAOWfq9GBOdkDVpb9cHtCZNUWZBQn56j1T4oI2dAzmqj2ZpOrIS_hMcnj2PiyGGfnTahXB89htyNRpZr8jebMylg	f	\N	\N	f	2025-08-25 18:47:49.03547+00	system	\N	t
2cda7a62-c642-4a59-9080-961d250a0229	78	1	ar	public/receipts/2025-08-25/international-78-ar-1756148214410.png	dDCrcu24mnqVTMj6uwtCmgXqvz-VjoPt6XaNzHwHYYU	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3OCIsImhhc2giOiJkRENyY3UyNG1ucVZUTWo2dXd0Q21nWHF2ei1Wam9QdDZYYU56SHdIWVlVIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc4IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE4OjU0OjAyLjEwOFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIxMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiODIwMjc2IiwiYmVuZWZpY2lhcnlfcmVmIjoiODIwMjc2Iiwib2ZmaWNlX3JlZiI6IjgyMDI3NiIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE4OjU2OjUxLjgzMFoiLCJpYXQiOjE3NTYxNDgyMTEsImV4cCI6MTc4NzcwNTgxMSwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.Vnl_SQNcRD4DqaC5ZXEy8g77SWiC-ENYyHcIMofzFAc5IueIQZxjhEB2uLkjaYNGSDaZnoX6f1tVVtvv4V_cd63lWEBNubZJMLx4irle9FIl_WtsW3P3LtE6x_DgedEyuHHqUlIluTRin6QSFX63gClFRaA9dPnlCKbGBsUwEcycSU1M29K9TmgfnStDhEYcZ6NVdWUQRBGaqnP6qkrGefIID1cqJT_Gmgja4kE33arb0R4rYOTMvxkcH5cwn_xuZ2yF_03Wmn1IUzn2myUg8a6NUcKAACUS2mAEDOPEtn0nFlzxWd_nftEdmxlmg6wO9XVjRPLIQTxYWPf3m8AA3g	f	\N	\N	f	2025-08-25 18:56:54.424375+00	system	\N	t
49ca5114-4d0a-44f6-bf08-0e786cd08cfc	79	1	ar	public/receipts/2025-08-25/international-79-ar-1756148720733.png	VRzhjLG1V2DbHfyPR7iG_pGvXsvu77aRFmV1JB0znl8	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3OSIsImhhc2giOiJWUnpoakxHMVYyRGJIZnlQUjdpR19wR3ZYc3Z1NzdhUkZtVjFKQjB6bmw4IiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc5IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE5OjA1OjA1LjgzM1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIxMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNjIzNTkxIiwiYmVuZWZpY2lhcnlfcmVmIjoiNjIzNTkxIiwib2ZmaWNlX3JlZiI6IjYyMzU5MSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE5OjA1OjE4LjEyNFoiLCJpYXQiOjE3NTYxNDg3MTgsImV4cCI6MTc4NzcwNjMxOCwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.Yi2uA6ODaShjr3tv0D2Zk1qFzdntYHnCUgWUsRj5D-_4P69sRcLzy__CCssjyMDPNix2fCb2HIbr23vCVtoSSzQFO-ydh7pPvi0SHSFTYo-1fLuGmkPArKJ7Dtl0ftlTQx4yh64sGXmbM6dlXvSGuXmr7gH1TxWGec3xKe8o297NRSlPhv1Qbs-KAGNwhK8QfBCnpIIPovzJYbNCQR7f7VIlTwqgXKpoZtKAqG5bMvhDM1asb6RiDjnhKgl8I-wuhDSpyAYqF1teL7TbUOF3KnCgSkb4VF44GfJt6C8i82Q_uNJn_uq4IjrJrUl2NyotMG5zxcsSTGqgRMdYUMfX6w	f	\N	\N	f	2025-08-25 19:05:20.747395+00	system	\N	t
cc582f90-f098-477e-a905-cc4346f73801	79	1	ar	public/receipts/2025-08-25/international-79-ar-1756148760369.png	VRzhjLG1V2DbHfyPR7iG_pGvXsvu77aRFmV1JB0znl8	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3OSIsImhhc2giOiJWUnpoakxHMVYyRGJIZnlQUjdpR19wR3ZYc3Z1NzdhUkZtVjFKQjB6bmw4IiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc5IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE5OjA1OjA1LjgzM1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIxMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNjIzNTkxIiwiYmVuZWZpY2lhcnlfcmVmIjoiNjIzNTkxIiwib2ZmaWNlX3JlZiI6IjYyMzU5MSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE5OjA1OjU3Ljg0OFoiLCJpYXQiOjE3NTYxNDg3NTcsImV4cCI6MTc4NzcwNjM1NywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.B1qObLcOt_EEe4qSaqCRqXOJFz2R8DkH4RC0isTpWRMMaxtKCIaFsMOEK_mM6dI9ItDxNxAlsQuvofCrLzxKW-nIrA0goWLoKsy2UsF7WcDCjOcGYjd4ssoCBUbYPVfySRDzOf6gInQbjsxYU19K5GRxdGdHAM2V6o_VckdpS_pGE7VwoUNuVERe-vkGfV2yYAXNkudHOK4Ojn0__QmmYs2b9doNFtPjQK-XFsEcpcR8Aoc-qxllJ_AeJekb5v5BjsQqKNDM4wPBP9XPLWtNjgY2eAsoyPwqFd6CzPms56PeD3jtQB9pwsLkc7_jJgxYJEi-tVp5GW-jD3WHe6KI9w	f	\N	\N	f	2025-08-25 19:06:00.386142+00	system	\N	t
b710287b-64fb-4ed7-b433-f9eb2e04aabc	79	1	ar	public/receipts/2025-08-25/international-79-ar-1756148772848.png	VRzhjLG1V2DbHfyPR7iG_pGvXsvu77aRFmV1JB0znl8	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3OSIsImhhc2giOiJWUnpoakxHMVYyRGJIZnlQUjdpR19wR3ZYc3Z1NzdhUkZtVjFKQjB6bmw4IiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc5IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE5OjA1OjA1LjgzM1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIxMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNjIzNTkxIiwiYmVuZWZpY2lhcnlfcmVmIjoiNjIzNTkxIiwib2ZmaWNlX3JlZiI6IjYyMzU5MSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE5OjA2OjEwLjM1MloiLCJpYXQiOjE3NTYxNDg3NzAsImV4cCI6MTc4NzcwNjM3MCwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.nlCGiR3wvL3EAAz3IOK6Z5kmGgqq5ANQGjLYfY9jOfe3sRCEPf-qQnDK2JqLe4HJ_FZWEgGoYhnKJjpyITv8cVgomnrOdT4acl0ZwjcTVsYK2mAnwOK0toH2UehqN_E6zGzdUyLuV4XBGT0ZpFIBMQL-myxSgcgInO0bcziXxBZMcphhaGbO_8R6f0FpFoZdf9yPP9q5eaXjfV1_0xqVYxy83gB82nyxdN3IepK64yHES1jVFntKRkl-YpTw6Nn8_5AyznA-tMY_zQsoo42XulqK7jqAIcbqJzzKSsuCNvDmQVVSls1KAEisDE9_MABrA2z0-dAYhA8nW1SaoSKbyA	f	\N	\N	f	2025-08-25 19:06:12.859672+00	system	\N	t
403d874c-0303-4eaf-98ad-adb2b923774a	79	1	ar	public/receipts/2025-08-25/international-79-ar-1756148996433.png	VRzhjLG1V2DbHfyPR7iG_pGvXsvu77aRFmV1JB0znl8	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3OSIsImhhc2giOiJWUnpoakxHMVYyRGJIZnlQUjdpR19wR3ZYc3Z1NzdhUkZtVjFKQjB6bmw4IiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc5IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE5OjA1OjA1LjgzM1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIxMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNjIzNTkxIiwiYmVuZWZpY2lhcnlfcmVmIjoiNjIzNTkxIiwib2ZmaWNlX3JlZiI6IjYyMzU5MSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE5OjA5OjUzLjYwMFoiLCJpYXQiOjE3NTYxNDg5OTMsImV4cCI6MTc4NzcwNjU5MywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.xjLRkcT_bdoJhiducwXSgTIgyGmqp6SDRH98RsNH4Wq3iTyqNMMt82wfUs3_Eqpk88tWZ7xnRVtRkAzNAWAUutVPtH2hPFiiA3kxHFQYRSQhL8d3oiSYkwv7oXWinnwtxWP9KxXMay2DFS0YSA7_1WdhO0TSMf7_OQTacuOnMNWBPN839eMybk94K_K_Ey3K8y5U_5_wR7ZKRTA2qcNhjdw5e5h7wVKa6xmUjQi89_MhY0QLV0hPy3IeIinen9FEjhvJANT9JmPipIFOjjchQTjvgWe4aFwSm2PmXc6TzWcbS6XrUoyr75rLuEC5S1sDpByO11awLGh_nNggHfBh8A	f	\N	\N	f	2025-08-25 19:09:56.451866+00	system	\N	t
2f6eb7b2-9f76-408f-8d79-c30e57f24806	79	1	ar	public/receipts/2025-08-25/international-79-ar-1756149013950.png	VRzhjLG1V2DbHfyPR7iG_pGvXsvu77aRFmV1JB0znl8	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3OSIsImhhc2giOiJWUnpoakxHMVYyRGJIZnlQUjdpR19wR3ZYc3Z1NzdhUkZtVjFKQjB6bmw4IiwiY2Fub25pY2FsIjp7InR4bl9pZCI6Ijc5IiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE5OjA1OjA1LjgzM1oiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiIxMDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiNjIzNTkxIiwiYmVuZWZpY2lhcnlfcmVmIjoiNjIzNTkxIiwib2ZmaWNlX3JlZiI6IjYyMzU5MSIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI1VDE5OjEwOjExLjA5M1oiLCJpYXQiOjE3NTYxNDkwMTEsImV4cCI6MTc4NzcwNjYxMSwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.bFT2b_M6TEtSv8_RR4D5eWrJDWeCWB1Ka_13gXS8OguKePhpEaBqNkTjtXeZI6YRWqr78K98t_mHQNfaNU8W1c5V5izzxZykFvfh0xJMjDJGpptH1_C3e819-jceWeF5LeRlx1ZWfsfh1n0vh4XlSZ2JHmYgDM0j0nJRx4WGaFfluACX29Q5MGAwGhR3giTMxWRmv26P_g__In72S8YFXuMAYvPYva7PqfInQdundd64Y5yDG_GJ5q8drRDNSDubCIxlDEtmTr1PVLUhEuKcwq06B46lvcI9Rk0Boeqae6Zql0jdzM_lwwK4w3OUqYJ22mlBbiCsH5I8sOsTeLSqJg	f	\N	\N	f	2025-08-25 19:10:13.966417+00	system	\N	t
cb24d4c3-0405-443c-8b82-ef3e178f8e27	82	1	ar	public/receipts/2025-08-26/international-82-ar-1756224148485.png	0ELko-JWxbOeyIxX0ObJS18WP29ITlWypED1-eGCxTo	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI4MiIsImhhc2giOiIwRUxrby1KV3hiT2V5SXhYME9iSlMxOFdQMjlJVGxXeXBFRDEtZUdDeFRvIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6IjgyIiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI2VDE1OjU5OjQ0LjI3OVoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiI4MjU4OTIiLCJiZW5lZmljaWFyeV9yZWYiOiI4MjU4OTIiLCJvZmZpY2VfcmVmIjoiODI1ODkyIiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjZUMTY6MDI6MjEuNjc4WiIsImlhdCI6MTc1NjIyNDE0MSwiZXhwIjoxNzg3NzgxNzQxLCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.uC-IDiZusfoFWrqtohBQCtmMwrYts2Y0Gg-wHFfSnBPMoHunQ7MMi-cyKjk_268aKF665HKmFFXCjsvDnGvFW2rzBnMCS6_wpiZ_bw8l_xYlzSgEyarNpYZVixfcSqLQr3UMcFyGcEdeounsdarYu4MqQO8P3x1xDLVYI2GqyjLJ90Hbya3VdTVzl8XF6LsudFKhgvjnLsxDEHz5cvneF50kPTqxqQGWpnMdDQXYLWZet8taPCNgOykMsGj26d0L8WotJivbST2XQLLK_u1GC2VnY49mK8gioVVInzP87uxJOkY1EUEo5XTGnaOGqTrDgZalkwyerwMWtI2cqCJqMQ	f	\N	\N	f	2025-08-26 16:02:28.500486+00	system	\N	t
5f8364d1-b13a-4844-b619-6f6612f90877	82	1	ar	public/receipts/2025-08-26/international-82-ar-1756224175204.png	0ELko-JWxbOeyIxX0ObJS18WP29ITlWypED1-eGCxTo	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI4MiIsImhhc2giOiIwRUxrby1KV3hiT2V5SXhYME9iSlMxOFdQMjlJVGxXeXBFRDEtZUdDeFRvIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6IjgyIiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI2VDE1OjU5OjQ0LjI3OVoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiI4MjU4OTIiLCJiZW5lZmljaWFyeV9yZWYiOiI4MjU4OTIiLCJvZmZpY2VfcmVmIjoiODI1ODkyIiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjZUMTY6MDI6NTIuNTgwWiIsImlhdCI6MTc1NjIyNDE3MiwiZXhwIjoxNzg3NzgxNzcyLCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.CHVU7ChuwShAPA8nuyzZy7cLfsiV7Tn6O9SJWFaS4SHb3-H5qw1wNXM142DYVl4W1jdRYxPISIMaIXg-PeDSrMAb1kVzTJLBHeaU5yilT4_1n6O_54pKzZW0drWnnIFiaGdjnMp-xoqj0x8Hj1kqL1dg01YMdVd2_OmcGvrA9KDIvfFmvYwN47vBKGQQfFyRh3pL4fVxzKHoNYrC4AWEz2gRIhm1ZEV4BHe_lYOhVRpE53PEecbhRkmNeEEIZfUFUppIfQSy1N_HA73LHs5SkaKcPV1KPrE2bAPuQH3qiM4QmAN3drCCP2MKXwcpWTKkR9BHNIRh-4CMcarC_lOVBg	f	\N	\N	f	2025-08-26 16:02:55.217126+00	system	\N	t
6e6246b0-b6ec-49d2-b77d-44509669169d	83	1	ar	public/receipts/2025-08-26/international-83-ar-1756227027635.png	h8vqo_UTcVyXthorIpsQy8BPBS3iN4mT_T16pGzXe40	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI4MyIsImhhc2giOiJoOHZxb19VVGNWeVh0aG9ySXBzUXk4QlBCUzNpTjRtVF9UMTZwR3pYZTQwIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6IjgzIiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI2VDE2OjQ4OjIwLjUwNFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiIyMTk1MTciLCJiZW5lZmljaWFyeV9yZWYiOiIyMTk1MTciLCJvZmZpY2VfcmVmIjoiMjE5NTE3IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjZUMTY6NTA6MjQuOTIyWiIsImlhdCI6MTc1NjIyNzAyNCwiZXhwIjoxNzg3Nzg0NjI0LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.vWcUqgifBPK5GSlVhv9zsX3YNiUremO0Wy54gNZD4pNe2cRE1RV47EyARlzAJv8DYw6PTn14egYC678EZoPZqLTwPMYY86npkU0dIcWbeFlqKnOcZutVt2X34R_JP8eFKGYzok5DAAS-TZaBiDkH6pMcgQpR2VRDclQzTNu9ZEx7V73nPhqq4aM-AX72LtOuUeLlZ5XXz1PAGK35omAjl-eOLoWmoGD1K8cJrfz7c9Ae43OpwU_hOREDVX1yWmeCp7uyegnLQAwgSCiB67q0MPg78XgLpdMNpkNOafR9nQ-AixsARJ2v0OKYtu5USOdBwKE1vF2_KWz7SixvWXHfLw	f	\N	\N	f	2025-08-26 16:50:27.648855+00	system	\N	t
e340b8a7-252f-4253-a198-0e7500184cb5	786	1	ar	786/receipt_ar_1756227442920.png	g2dJRXoapdlWEYOwPUN7MTuw8THvBpb26iEv6Xgmobc	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI3ODYiLCJoYXNoIjoiZzJkSlJYb2FwZGxXRVlPd1BVTjdNVHV3OFRIdkJwYjI2aUV2NlhnbW9iYyIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiI3ODYiLCJ0eG5fdHlwZSI6InN5c3RlbV9jb21taXNzaW9uIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI1VDE2OjA0OjU2Ljk0NVoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNTAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjAuMDAifV0sInRheGVzIjpbXSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMi41MCJ9LCJzZW5kZXJfcmVmIjoiNCIsImJlbmVmaWNpYXJ5X3JlZiI6Ik4vQSIsIm9mZmljZV9yZWYiOiJNYWluLU9mZmljZSIsInZlcnNpb24iOjEsInJlZmVyZW5jZU51bWJlciI6IlJFRi0xNzU2MTM3ODk2OTM0LUk4NDBGSyJ9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI2VDE2OjU3OjIwLjE2NloiLCJpYXQiOjE3NTYyMjc0NDAsImV4cCI6MTc4Nzc4NTA0MCwiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.UmJI-WkQ_8utHcoBguWA2ajzF64VePX2gXftoGHlysObxIJ4Jz1acpUsyAolW1jNiooi_NHlZKXw33OZHHw40mnICJTFhj22tXThkElHgCXW4TvBG8fBdnya7Aj4aYFwXJ6_ap7Np73KIR_eIBwCQsoUz4wwKEZSGXFP2xHyst62GCoqmiulkmFmTSarukQP_yOTLkcw3wNTf1-RImxhaSmyEgKRe7xBlOAXhWRuECIO3HLSf1dApfk168qyRWy9xHrwTDK5OmFzMy02gWiYTUGJ5X1LOL7FiNNBQlASW5L8GnYs0_Tg96dQw9xgtiI1cLZF-YtJjVyoi5vI3A74qw	f	\N	\N	f	2025-08-26 16:57:22.932757+00	system	\N	t
81ab3e9e-c081-433d-9b6d-857151784217	83	1	ar	public/receipts/2025-08-27/international-83-ar-1756313457289.png	h8vqo_UTcVyXthorIpsQy8BPBS3iN4mT_T16pGzXe40	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI4MyIsImhhc2giOiJoOHZxb19VVGNWeVh0aG9ySXBzUXk4QlBCUzNpTjRtVF9UMTZwR3pYZTQwIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6IjgzIiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI2VDE2OjQ4OjIwLjUwNFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiIyMTk1MTciLCJiZW5lZmljaWFyeV9yZWYiOiIyMTk1MTciLCJvZmZpY2VfcmVmIjoiMjE5NTE3IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjdUMTY6NTA6NTQuNjEyWiIsImlhdCI6MTc1NjMxMzQ1NCwiZXhwIjoxNzg3ODcxMDU0LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.bjpGF3EdzehjHUOF7IOEm7OJd-h78BmVnVxHrkKXOroU5bmAKPZklyI9K70Xox6L2tVmF5NBC-ZF8i-dLpMyFCw8UihteInmdQV5RJhSql4RLg6rKXTtzUkrC-9IkZSrg3TOnqzZB9-uBJgL9msvU-GEeUsNyhl6JXzb78y8izPO6-mYKuNhtc9tjXK9B1fIRzeQV99CCweiie_9SfqmsT7gXFUzjZa9yDn8jIzA224iAZfkR2_zGOJl05wp8gvdAySDE9A-ZLmOVvvRxu_7-uYRbR9kJ9tXeKasp6fgH4u_k41m07U0Jl3php6H1TAHgwenwT6Bb3L-WIARZA9oMQ	f	\N	\N	f	2025-08-27 16:50:57.302247+00	system	\N	t
d045a56f-b150-40c6-a72e-87fdac7a8c34	83	1	ar	public/receipts/2025-08-27/international-83-ar-1756314228110.png	h8vqo_UTcVyXthorIpsQy8BPBS3iN4mT_T16pGzXe40	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI4MyIsImhhc2giOiJoOHZxb19VVGNWeVh0aG9ySXBzUXk4QlBCUzNpTjRtVF9UMTZwR3pYZTQwIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6IjgzIiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI2VDE2OjQ4OjIwLjUwNFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiIyMTk1MTciLCJiZW5lZmljaWFyeV9yZWYiOiIyMTk1MTciLCJvZmZpY2VfcmVmIjoiMjE5NTE3IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjdUMTc6MDM6NDUuMzgzWiIsImlhdCI6MTc1NjMxNDIyNSwiZXhwIjoxNzg3ODcxODI1LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.i1FC2AMOWkYY7fA7vX_2AV5UQDACyGS8nzCSqSJBi855wVwemoetLeExt9fvqWdE-fDxgWejNKwkhpFwtUTopHRARiFFRwayuS51EAS6nAGewaf5tqS4BM5HzZaijLeHHFhmo6vmXyAG_-FhBnWfGCoZdK803ZBgEGWjI3hBAAshIgOvlfzYoL79NiwyZtDqABT4Se1uLN8wQiHrUKYbrijSXY_vqEQQjszOR0HRlaC5nw7uP4_pCol5KfHFDj4MZnsyr7ExN7Qd1fB28Ia5MpK2XBk39uuXD-nurNHi9u-nbmnGQOZ6yelUhAGu8scR0JCDmr8HAS2Ap9jszQkSuQ	f	\N	\N	f	2025-08-27 17:03:48.121748+00	system	\N	t
5a54f218-9510-4215-9ede-c71a6b00e38a	83	1	ar	public/receipts/2025-08-27/international-83-ar-1756314313396.png	h8vqo_UTcVyXthorIpsQy8BPBS3iN4mT_T16pGzXe40	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI4MyIsImhhc2giOiJoOHZxb19VVGNWeVh0aG9ySXBzUXk4QlBCUzNpTjRtVF9UMTZwR3pYZTQwIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6IjgzIiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI2VDE2OjQ4OjIwLjUwNFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiIyMTk1MTciLCJiZW5lZmljaWFyeV9yZWYiOiIyMTk1MTciLCJvZmZpY2VfcmVmIjoiMjE5NTE3IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjdUMTc6MDU6MTAuODA5WiIsImlhdCI6MTc1NjMxNDMxMCwiZXhwIjoxNzg3ODcxOTEwLCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.oM5EqWYhNHxkXekhLodvf7vZHF7cq42bC9-F4yyQ_ykGc8M0Z6iXDP6CoQfD6l3fhY3eoQwfLxXqE6v8ZHdCWlXvpW52PmyCorzFcKGZ-mdC0KbNcT4j9qeWOJIPFyGuPbRtQouiykSaveqDtojbdp-hHHNfTU2KsGwT-0QlDk2oH_eG2AlAq4L0iBeDMzW08xs55pky3Jh0_7nmInwrtEGx7s3TJJszWxwumGkWGibu5X8V8KHb0yr5YNYzFkdLpNYayKT7XfRIS35Xcmwd4IjqUBr56fJqmIttVFyi-aAHeXikuP2BEcHYiO7tAajzz-QhW-9UkoebT4iTDMupow	f	\N	\N	f	2025-08-27 17:05:13.409107+00	system	\N	t
195c0e71-3568-4c17-9a76-d9bb2e58e73a	83	1	ar	public/receipts/2025-08-27/international-83-ar-1756314367363.png	h8vqo_UTcVyXthorIpsQy8BPBS3iN4mT_T16pGzXe40	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI4MyIsImhhc2giOiJoOHZxb19VVGNWeVh0aG9ySXBzUXk4QlBCUzNpTjRtVF9UMTZwR3pYZTQwIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6IjgzIiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI2VDE2OjQ4OjIwLjUwNFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjEwMDAifSwibmV0X3RvX2JlbmVmaWNpYXJ5Ijp7ImNjeSI6IlVTRCIsInZhbHVlIjoiMTAwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiIyMTk1MTciLCJiZW5lZmljaWFyeV9yZWYiOiIyMTk1MTciLCJvZmZpY2VfcmVmIjoiMjE5NTE3IiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjdUMTc6MDY6MDQuODMxWiIsImlhdCI6MTc1NjMxNDM2NCwiZXhwIjoxNzg3ODcxOTY0LCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.K0NvrDyfaoXhx1mMg4W9-VEa1ry450iEXMrWVbC1IBid3ceXWuKkw-KbFkdHoCQd-8WWN-NePuMtFW1bDrOAHNWy_G7DlDmA1yY146NX0lJbdCPobPufUpb5UvzyHWOocUijjEOLGbROHtDCJXbaTQ0vqhCyq8LAdlUfsb8K4gdaaY-kay4QakTqOPL_RPi-_H-DTdWFNEDUpKOhpzHMpKFI74LWGU73nHULB7DZ06RCViI55_KkHXKfpZyrFhIkHDcRf4TJ2St_csj146gnIAr2DBMHQiTYSLFvZf3qa36Qq6k5xoGiKlqwB1GHp_fLdkeZb9MYOr-7O6Cj4O-HKQ	f	\N	\N	f	2025-08-27 17:06:07.37422+00	system	\N	t
ae7f14de-4c3c-4a93-8961-964930c2cb32	91	1	ar	public/receipts/2025-08-28/international-91-ar-1756369309035.png	Y5H7JDRW3LXm3BZVhofgmLSI0SpHx2iXdobR4yAVeMY	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiI5MSIsImhhc2giOiJZNUg3SkRSVzNMWG0zQlpWaG9mZ21MU0kwU3BIeDJpWGRvYlI0eUFWZU1ZIiwiY2Fub25pY2FsIjp7InR4bl9pZCI6IjkxIiwidHhuX3R5cGUiOiJpbnRlcm5hdGlvbmFsX3RyYW5zZmVyIiwiZXhlY3V0ZWRfYXQiOiIyMDI1LTA4LTI4VDA4OjE3OjU3Ljg4MFoiLCJ0aW1lem9uZSI6IkFmcmljYS9Ucmlwb2xpIiwiYW1vdW50X3NyYyI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjUwMCJ9LCJuZXRfdG9fYmVuZWZpY2lhcnkiOnsiY2N5IjoiVVNEIiwidmFsdWUiOiI1MDAifSwiZmVlcyI6W3sibmFtZSI6ImNvbW1pc3Npb24iLCJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjIuNSJ9XSwidGF4ZXMiOltdLCJzZW5kZXJfcmVmIjoiODU0MTIzIiwiYmVuZWZpY2lhcnlfcmVmIjoiODU0MTIzIiwib2ZmaWNlX3JlZiI6Ijg1NDEyMyIsInZlcnNpb24iOjF9LCJ0aW1lc3RhbXAiOiIyMDI1LTA4LTI4VDA4OjIxOjM3LjA3OFoiLCJpYXQiOjE3NTYzNjkyOTcsImV4cCI6MTc4NzkyNjg5NywiaXNzIjoiZXhjaGFuZ2UtcGxhdGZvcm0iLCJhdWQiOiJyZWNlaXB0LXZlcmlmaWNhdGlvbiJ9.cAWGrtrUPun0NGkZL5QlwVmhIKXWtBNsokysbSHAanGw1tUDtVYg0ZpwgfCxp50RuC1_6FCwG8i160zx20ufyxmMON5d8jYV9VSN8FGMREUiKTq_-IX_CZqTw96z6k1iJf5cPoIWNfBAHrgEs9QLL6gLsjqXWU9J4zC6EQYSSFhY-630vjEnwNvCEWxwz1PKRiQdWhxLRZACoPswYswciT1dZJhrod29LDGADUzEsv2Z-AXWUJm_SMsJ8rUNW2hDmiJHkIh2YUPdNhJE6mWVd4vQa1ss2YLLP9viOyqdCn9wnYcbv2V7MhPoCDvpFAW9gE4gMO8kQIVev2h991qLzQ	f	\N	\N	f	2025-08-28 08:21:49.050106+00	system	\N	t
49d8e626-9d0b-4295-882f-d364576fb141	132	1	ar	public/receipts/2025-08-28/international-132-ar-1756400894546.png	MGsRnT8Sec0TK7ETn2uE0cHrg5rf-R2VVBwjjBktMLM	eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleV8xNzU1MzQ5ODI3OTc2X3NjeHJqZyIsInR5cCI6IkpXVCJ9.eyJ0eG5faWQiOiIxMzIiLCJoYXNoIjoiTUdzUm5UOFNlYzBUSzdFVG4ydUUwY0hyZzVyZi1SMlZWQndqakJrdE1MTSIsImNhbm9uaWNhbCI6eyJ0eG5faWQiOiIxMzIiLCJ0eG5fdHlwZSI6ImludGVybmF0aW9uYWxfdHJhbnNmZXIiLCJleGVjdXRlZF9hdCI6IjIwMjUtMDgtMjhUMTA6NTg6NDguMjY2WiIsInRpbWV6b25lIjoiQWZyaWNhL1RyaXBvbGkiLCJhbW91bnRfc3JjIjp7ImNjeSI6IlVTRCIsInZhbHVlIjoiODAwIn0sIm5ldF90b19iZW5lZmljaWFyeSI6eyJjY3kiOiJVU0QiLCJ2YWx1ZSI6IjgwMCJ9LCJmZWVzIjpbeyJuYW1lIjoiY29tbWlzc2lvbiIsImNjeSI6IlVTRCIsInZhbHVlIjoiMi41In1dLCJ0YXhlcyI6W10sInNlbmRlcl9yZWYiOiI3NTIzNTAiLCJiZW5lZmljaWFyeV9yZWYiOiI3NTIzNTAiLCJvZmZpY2VfcmVmIjoiNzUyMzUwIiwidmVyc2lvbiI6MX0sInRpbWVzdGFtcCI6IjIwMjUtMDgtMjhUMTc6MDg6MTEuNzA0WiIsImlhdCI6MTc1NjQwMDg5MSwiZXhwIjoxNzg3OTU4NDkxLCJpc3MiOiJleGNoYW5nZS1wbGF0Zm9ybSIsImF1ZCI6InJlY2VpcHQtdmVyaWZpY2F0aW9uIn0.fnFfRX3jbc4mOuKUq6ytG-uNs8Js_RxKXiuY6xvic8YhnFkkoIKlqySotmRumtKvH-SRqJYQArmDml5fuO4kuWxpOpNpPFPLBYSGn8AXKCMYP66wYSZhRY9J4WKhK7DP5wpzs0T7oyDpMUYoln2q-2lNinNVceTZ3RoECbak6SxFx5zv78MTnG2JisyVlqizank7ww9xRWdd-GMY2Kfg30eb-fg1mFkCMuH2YWiSY7LuMqrUHiEzbTQBT2Bb1O4DGUWVM8jQc-d_WzByKzyf1qpwVWgwXLBxgGu2akactWHSvoFnJeoZGzcRtNbM121V8aAPCkoNfYUAiZDIdxsNNg	f	\N	\N	f	2025-08-28 17:08:14.563734+00	system	\N	t
\.


--
-- Data for Name: referral_balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referral_balances (id, user_id, currency, amount) FROM stdin;
67	89	USD	1.350000
69	101	LYD	0.900000
70	101	USD	0.450000
\.


--
-- Data for Name: referral_rewards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.referral_rewards (id, tx_id, referrer_id, referred_user_id, commission_base, reward_amount, currency, status, created_at, paid_at, operation_type, deducted_from_commission, exchange_rate, original_currency) FROM stdin;
66	179	89	90	9.000000	0.450000	USD	paid	2025-09-14 16:42:32.335146	2025-09-14 16:42:32.325	transfer_usd	0.500000	\N	\N
67	180	89	90	9.000000	0.450000	USD	paid	2025-09-14 16:59:23.304199	2025-09-14 16:59:23.294	transfer_usd	0.500000	\N	\N
68	70	101	102	7.000000	0.900000	LYD	paid	2025-09-14 17:04:02.184397	2025-09-14 17:04:02.172	transfer_lyd	1.000000	\N	\N
69	181	101	102	7.000000	0.450000	USD	paid	2025-09-15 14:06:30.670541	2025-09-15 14:06:30.66	transfer_usd	0.500000	\N	\N
70	182	89	90	7.000000	0.450000	USD	paid	2025-09-15 14:13:29.329955	2025-09-15 14:13:29.318	transfer_usd	0.500000	\N	\N
71	147	101	102	6.000000	0.900000	LYD	paid	2025-09-15 15:37:36.080357	2025-09-15 15:37:36.069	transfer_lyd	1.000000	\N	\N
72	149	101	102	6.000000	0.900000	LYD	paid	2025-09-15 20:05:53.885843	2025-09-15 20:05:53.875	transfer_lyd	1.000000	\N	\N
73	183	101	102	7.000000	0.450000	USD	paid	2025-09-17 20:43:07.44352	2025-09-17 20:43:07.433	transfer_usd	0.500000	\N	\N
74	150	101	102	6.000000	0.900000	LYD	paid	2025-09-24 12:58:59.10341	2025-09-24 12:58:59.092	transfer_lyd	1.000000	\N	\N
75	107	101	102	3.000000	0.450000	USD	paid	2025-09-24 13:04:12.751204	2025-09-24 13:04:12.737	market_sell	0.500000	\N	\N
\.


--
-- Data for Name: reward_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reward_settings (id, transfer_points, login_points, streak_bonus_points, level_up_bonus, points_per_level, max_streak_days, system_active, created_at, updated_at) FROM stdin;
1	10	5	15	100	1000	30	t	2025-08-30 05:35:33.329963	2025-08-30 05:35:33.329963
\.


--
-- Data for Name: rewards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rewards (id, name, name_ar, description, description_ar, icon, points_cost, reward_type, reward_value, max_redemptions, current_redemptions, valid_until, active, created_at) FROM stdin;
1	free_transfer	تحويل مجاني	Get one free transfer	احصل على تحويل مجاني واحد	🎁	100	feature_unlock	free_transfer_1	\N	0	\N	t	2025-08-30 05:35:46.96471
2	5_percent_discount	خصم 5%	5% discount on next transfer	خصم 5% على التحويل التالي	💵	200	discount	5	\N	0	\N	t	2025-08-30 05:35:46.96471
3	cash_bonus_50	مكافأة نقدية 50	50 LYD cash bonus	مكافأة نقدية 50 دينار ليبي	💰	500	cash_bonus	50	\N	0	\N	t	2025-08-30 05:35:46.96471
4	vip_badge	شارة VIP	Unlock exclusive VIP badge	احصل على شارة VIP الحصرية	👑	1000	badge	vip_member	\N	0	\N	t	2025-08-30 05:35:46.96471
5	10_percent_discount	خصم 10%	10% discount on next transfer	خصم 10% على التحويل التالي	🏷️	300	discount	10	\N	0	\N	t	2025-08-30 05:35:46.96471
6	priority_support	دعم أولوية	Get priority customer support for 30 days	احصل على دعم عملاء أولوية لمدة 30 يوم	⚡	750	feature_unlock	priority_support_30d	\N	0	\N	t	2025-08-30 05:35:46.96471
\.


--
-- Data for Name: security_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.security_logs (id, email, username, event_type, fingerprint, ip_address, user_agent, country, city, platform, language, screen, timezone, attempts, image_filename, blocked, report_type, metadata, created_at, updated_at) FROM stdin;
3b865707-ad75-48de-849a-c81418a8aa7a	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 14:14:50.859362	2025-09-13 14:14:50.859362
93e38c23-46c9-4475-96e7-d8772406767f	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 14:28:17.031091	2025-09-13 14:28:17.031091
8f2c87cc-10ad-4013-8511-afeeabb8656b	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 16:35:09.221091	2025-09-13 16:35:09.221091
988de9fd-23e6-4601-b0c9-8bca3a1cbd67	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 16:56:56.375874	2025-09-13 16:56:56.375874
4a1459c9-83ef-4c75-85e8-7884a73e91ec	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 17:00:58.195403	2025-09-13 17:00:58.195403
a0d7338a-a26d-475c-a794-64de71eb1689	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 17:47:49.285621	2025-09-13 17:47:49.285621
25f60c15-518a-46d2-a3b1-6f0942eab113	s11@s.com	s11@s.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 17:55:34.945549	2025-09-13 17:55:34.945549
5e7f5ebd-6336-4215-8bc7-6ea7a54fe633	s22@s.com	s22@s.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 18:43:22.882719	2025-09-13 18:43:22.882719
58e9f31c-6b53-454c-84d7-aa2215766214	s11@s.com	s11@s.com	SUSPICIOUS_ACTIVITY	6d395d00d9fdd5546c1b811868184672	41.254.84.81	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 21:28:45.95232	2025-09-13 21:28:45.95232
d9dd61f7-0cd9-4e71-b1f4-de83824b8cb2	s11@s.com	s11@s.com	SUSPICIOUS_ACTIVITY	6d395d00d9fdd5546c1b811868184672	41.254.84.81	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 21:43:29.362172	2025-09-13 21:43:29.362172
a535116e-0b04-4b10-b08b-87ad2cf3dfdd	mm3@mm3.com	mm3@mm3.com	SUSPICIOUS_ACTIVITY	6d395d00d9fdd5546c1b811868184672	41.254.84.81	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 21:58:59.262896	2025-09-13 21:58:59.262896
724210c9-7901-4dd7-8eff-4950ee791375	s11@s.com	s11@s.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 10:28:56.598715	2025-09-14 10:28:56.598715
98b78c5d-ddfe-424a-9dca-2e4bf13f9ba4	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:21:26.810759	2025-09-14 12:21:26.810759
c755f2a6-1b8d-43db-a463-d9f4860ac39c	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	ee735e124afff971589349a048bd4e05	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-AE	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:21:44.003955	2025-09-14 12:21:44.003955
444b8df1-60b9-4673-becc-1c9b818f56eb	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:37:01.813844	2025-09-14 12:37:01.813844
f02ecd4e-33ce-48e4-87ee-ac502fd80e44	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	ee735e124afff971589349a048bd4e05	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-AE	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:37:02.304873	2025-09-14 12:37:02.304873
0c2b52a1-b7d5-404d-b20a-b822d10c7b2a	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:49:24.391722	2025-09-14 12:49:24.391722
afec54b9-8ded-4826-9cde-ce96a2f6bad8	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:20:19.640539	2025-09-14 13:20:19.640539
6e4322d1-c274-428c-8e59-6e9a3ab7a865	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	ee735e124afff971589349a048bd4e05	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-AE	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:41:01.29645	2025-09-14 13:41:01.29645
405cafea-1131-4a29-9049-e55d00a7cf34	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:45:04.055995	2025-09-14 13:45:04.055995
48b63ef4-9796-40ac-ae8c-6872819924e4	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	ee735e124afff971589349a048bd4e05	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-AE	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:45:05.461075	2025-09-14 13:45:05.461075
e1c00970-69af-4d25-ac79-3eac678fde93	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 14:21:33.07613	2025-09-14 14:21:33.07613
47413ec2-ef97-45f9-bc9d-305bf5b31f00	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 13:56:49.084188	2025-09-13 13:56:49.084188
f2031f07-1f9d-432b-b7d9-6517d9c37cb0	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 16:38:25.753849	2025-09-13 16:38:25.753849
fb0a5929-faaf-42c2-b678-dde8a671ea52	k1@k1.com	k1@k1.com	FAILED_LOGIN	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	security_b37a2693_2025-09-13T16-57-42-267Z.jpg	f	failed_login	{}	2025-09-13 16:57:42.296428	2025-09-13 16:57:42.296428
c9ef0cbc-fee4-4156-b1b9-d3200bea5953	k1@k1.com	k1@k1.com	FAILED_LOGIN	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	2	security_b37a2693_2025-09-13T16-57-52-037Z.jpg	f	failed_login	{}	2025-09-13 16:57:52.067451	2025-09-13 16:57:52.067451
548a7e4d-0051-4a49-9a6c-a27b812f6c93	s22@s.com	s22@s.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 18:34:33.488911	2025-09-13 18:34:33.488911
d43b4be4-c893-4725-bbdc-94ae17d2af91	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 18:43:51.082324	2025-09-13 18:43:51.082324
8ef754d5-d7a5-4d05-95fe-d7bd27c4208f	ss22@s.com	ss22@s.com	FAILED_LOGIN	6d395d00d9fdd5546c1b811868184672	41.254.84.81	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	security_6d395d00_2025-09-13T21-44-39-631Z.jpg	f	failed_login	{}	2025-09-13 21:44:39.655063	2025-09-13 21:44:39.655063
f7921d3c-fc6e-426b-bceb-d7a43dedf32c	s22@s.com	s22@s.com	SUSPICIOUS_ACTIVITY	6d395d00d9fdd5546c1b811868184672	41.254.84.81	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 21:44:48.829176	2025-09-13 21:44:48.829176
117687ee-a85c-45a3-b80a-4085e2f2655e	mm3@mm3.com	mm3@mm3.com	SUSPICIOUS_ACTIVITY	6d395d00d9fdd5546c1b811868184672	41.254.84.81	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 21:45:28.936938	2025-09-13 21:45:28.936938
4d33f7f0-2d51-43eb-adb5-be3671458499	s22@s.com	s22@s.com	SUSPICIOUS_ACTIVITY	6d395d00d9fdd5546c1b811868184672	41.254.84.81	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 22:00:12.62127	2025-09-13 22:00:12.62127
c1e6eaf8-00ee-463a-b805-8846540715a1	s22@s.com	s22@s.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 10:29:12.238335	2025-09-14 10:29:12.238335
1328d72d-4cb4-42ed-86a2-a25566fadf27	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:39:43.576873	2025-09-14 12:39:43.576873
83dfa2e7-3464-405d-a714-4b35e3b0db1b	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:57:31.85986	2025-09-14 12:57:31.85986
4ed13f7d-ef7b-4414-ab5e-db45b7f70c6e	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:35:54.694795	2025-09-14 13:35:54.694795
c9a38420-944c-4029-8677-3eb08c270e8f	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:41:47.220343	2025-09-14 13:41:47.220343
3de49070-eb2a-4e47-8b02-e4d84a2723f3	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:51:30.69509	2025-09-14 13:51:30.69509
699e5196-b831-4f1d-b7d0-4f54e1348246	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	ee735e124afff971589349a048bd4e05	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-AE	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:51:34.373099	2025-09-14 13:51:34.373099
e67eae6b-4645-41ea-a44a-0174a9de5896	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 14:26:09.079188	2025-09-14 14:26:09.079188
0ba7496c-8295-4df2-96eb-329230c9a5de	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 15:33:53.192371	2025-09-14 15:33:53.192371
1b51a274-b239-47f4-905f-356dcd72ef50	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 15:47:48.536868	2025-09-14 15:47:48.536868
03445f50-c7ef-435b-b91e-59cf2e19ce67	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 16:12:21.470887	2025-09-14 16:12:21.470887
34459c09-e44d-4937-abf3-19d1b72169c5	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	ee735e124afff971589349a048bd4e05	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-AE	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 16:22:30.506284	2025-09-14 16:22:30.506284
77472b16-1ef8-45e1-a4cf-ab045aae5528	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 13:57:43.520441	2025-09-13 13:57:43.520441
6cee5d65-f194-403e-89ca-50c80086f9a8	s11@s.com	s11@s.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 18:34:47.118883	2025-09-13 18:34:47.118883
7a9e429f-f4f8-4db9-bf78-08cd55d7baa0	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 18:34:59.490125	2025-09-13 18:34:59.490125
3c34886d-4213-402a-8562-21b8dd3826e8	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 10:29:47.74307	2025-09-14 10:29:47.74307
cc55a0e0-d1ec-4645-bbb2-2ec26e86d937	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:44:08.710223	2025-09-14 12:44:08.710223
760d0781-3cdd-4db9-84cc-885c5b611c4e	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	ee735e124afff971589349a048bd4e05	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-AE	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:57:33.384809	2025-09-14 12:57:33.384809
30fa7a44-8d51-49bb-933c-a4a942fd02a3	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:57:39.848585	2025-09-14 12:57:39.848585
6936617d-d937-4ed7-8de9-83053add1412	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	ee735e124afff971589349a048bd4e05	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-AE	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:35:55.534643	2025-09-14 13:35:55.534643
67a5e855-681f-4d52-ba37-004b1167924e	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:41:53.6887	2025-09-14 13:41:53.6887
0cc66ed4-4951-46fd-a813-b5392784c380	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:53:28.051116	2025-09-14 13:53:28.051116
abb27ba3-9f3c-4727-b6a5-3c88e13eeeff	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 14:39:32.462261	2025-09-14 14:39:32.462261
2b6e670e-a049-4327-b6bc-9bc3605967e7	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 15:37:37.71011	2025-09-14 15:37:37.71011
c913e249-7fc5-473f-b657-65820aa30fb1	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 16:18:29.972743	2025-09-14 16:18:29.972743
1ef3c866-14ac-459d-b1db-af3bdf420d80	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 16:22:42.160735	2025-09-14 16:22:42.160735
c64155c2-0bbe-4043-b648-466baaa8a4c8	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 16:24:55.067481	2025-09-14 16:24:55.067481
52aa8a33-7103-48d0-9c40-64ddde85bd6e	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 17:13:39.94615	2025-09-14 17:13:39.94615
320b7582-050d-4ab1-b2af-474f3607cc2a	z11@z11.com	z11@z11.com	FAILED_LOGIN	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	security_b37a2693_2025-09-14T18-52-23-509Z.jpg	f	failed_login	{}	2025-09-14 18:52:23.545665	2025-09-14 18:52:23.545665
15cc2c91-1d0f-4c9b-ae1d-255f26ab99da	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 18:52:32.797551	2025-09-14 18:52:32.797551
79ebd2cd-2486-40e9-9db4-75351ca2d932	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 12:33:18.602621	2025-09-15 12:33:18.602621
b060b4d6-b65c-48fd-855b-9470bdb1fe47	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 12:40:51.816116	2025-09-15 12:40:51.816116
619f5a0d-c175-4751-a34a-f358e876da09	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 12:45:58.778825	2025-09-15 12:45:58.778825
546f66d8-1bd7-43bf-8373-6940c1360f8b	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 12:54:25.748733	2025-09-15 12:54:25.748733
b641bf18-ed5d-42e2-972f-04426b4a71de	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 14:07:54.286991	2025-09-13 14:07:54.286991
6390ae51-f042-4a9a-80d2-95b3315305d3	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	ee735e124afff971589349a048bd4e05	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-AE	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:44:10.091229	2025-09-14 12:44:10.091229
ce11448a-f89b-4944-8606-538e6b9a4b5f	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Unknown	Unknown	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:44:19.282145	2025-09-14 12:44:19.282145
a2bcb6a0-5a5d-4e79-8233-312f77a55020	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	ee735e124afff971589349a048bd4e05	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-AE	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:17:53.420672	2025-09-14 13:17:53.420672
bb478ac2-6841-4488-ba8a-be15348ec4e9	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:18:06.456134	2025-09-14 13:18:06.456134
2f812ff0-5d57-4c05-8601-eb397c109574	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:36:05.093971	2025-09-14 13:36:05.093971
9f5c9373-40f5-4531-8130-f2b494eac87c	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:42:26.34942	2025-09-14 13:42:26.34942
368f0981-994c-403a-93cb-0d2c036aff20	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:57:40.304571	2025-09-14 13:57:40.304571
7cca4676-52b3-41f0-bd74-186f78b326e1	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 15:42:01.953795	2025-09-14 15:42:01.953795
400d40ad-a311-473f-bceb-45ad814ad0fc	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 15:55:57.883509	2025-09-14 15:55:57.883509
263666a4-06cf-456a-93c9-89bea26e9d22	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 16:09:48.980137	2025-09-14 16:09:48.980137
69a95b25-4202-4363-bd24-88b7454b69d4	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 16:18:59.757336	2025-09-14 16:18:59.757336
dc0c8c80-9131-4466-81d5-d41f33b88936	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 16:23:26.110118	2025-09-14 16:23:26.110118
e47d7557-704a-482e-a91f-15249dd86ea8	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 17:08:07.252822	2025-09-14 17:08:07.252822
6c3621d2-60ef-483a-b035-cd97d3bc24c1	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 17:16:06.523708	2025-09-14 17:16:06.523708
d1bd8630-3852-4a8c-918d-5dcd9931ff6b	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 18:15:45.998787	2025-09-14 18:15:45.998787
ebaead24-271a-4388-a734-4a717c726813	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 18:20:14.016233	2025-09-14 18:20:14.016233
042eee96-f563-46c0-81e3-fc931dcb62fb	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 18:32:50.983468	2025-09-14 18:32:50.983468
949453ea-91d6-491c-9fad-4a1f679ad22b	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 18:47:06.629535	2025-09-14 18:47:06.629535
12442016-1759-4adc-8f57-9a78cbc1d19d	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 18:48:07.69733	2025-09-14 18:48:07.69733
82eda7a2-bf2c-47e4-804a-06f277b1e409	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 11:59:07.245137	2025-09-15 11:59:07.245137
a391fb13-8f2a-4713-aca1-dcc94e5b5b20	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 12:08:17.808728	2025-09-15 12:08:17.808728
d2053883-e3ef-4bf1-85f1-67187e9e5fdf	k1@k1.com	k1@k1.com	SUSPICIOUS_ACTIVITY	7cd3e46346048eb877d95f2da12f7894	41.254.64.202	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-13 14:09:51.950026	2025-09-13 14:09:51.950026
8aedb7d9-6582-4d30-937d-d7c630d8ec40	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:49:13.813688	2025-09-14 12:49:13.813688
34f7351d-842a-4d57-9fed-0b2d026b1dc4	z7@z7.com	z7@z7.com	SUSPICIOUS_ACTIVITY	ee735e124afff971589349a048bd4e05	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-AE	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 12:49:17.883718	2025-09-14 12:49:17.883718
a0eaa86a-4cd3-48df-909a-fb512c6eb29b	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:18:05.38178	2025-09-14 13:18:05.38178
48abbda1-3a89-48e8-9248-0fffd826a462	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:41:00.342099	2025-09-14 13:41:00.342099
06404739-94ca-4d45-a6d2-42d529029003	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 13:45:00.93393	2025-09-14 13:45:00.93393
7a8b87c2-ab55-463c-b176-24f05d227544	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 15:46:33.910959	2025-09-14 15:46:33.910959
66cc96f1-af3b-4bac-9746-2301111a111e	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 15:58:10.988265	2025-09-14 15:58:10.988265
9bc5efda-0e14-4824-8da1-c05e29f6d9fb	ss223@gmail.com	ss223@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 16:10:08.244272	2025-09-14 16:10:08.244272
a7c06e4e-69ea-4350-8104-c4fe525d0e68	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 16:22:20.178884	2025-09-14 16:22:20.178884
2e20ecd7-01e9-4cde-b6a5-de154a231923	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	5c668dc5675708d2e0d913f8425513a3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 16:24:38.030953	2025-09-14 16:24:38.030953
4a0e92a8-5017-4ed1-9386-d36e11cc6824	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 17:09:46.548219	2025-09-14 17:09:46.548219
830f8079-ef2b-4164-98fe-a109cf62bb58	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 17:17:07.986953	2025-09-14 17:17:07.986953
a5d2b5f8-3fed-4ebb-9c60-9d5de6f69186	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 18:25:17.472857	2025-09-14 18:25:17.472857
447ec563-c601-403b-967a-480422f58a81	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 18:33:22.126131	2025-09-14 18:33:22.126131
b409281a-ecea-4bba-ad0b-eae18c32d4b8	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-14 18:48:29.826601	2025-09-14 18:48:29.826601
37a07a98-0e7c-4a3c-9cb0-372bf27fdc3b	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 12:10:55.934515	2025-09-15 12:10:55.934515
3c4fafc5-a7be-4707-9211-9edf270b28f1	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 12:56:05.533488	2025-09-15 12:56:05.533488
a0ab8fa6-09ad-49d7-8b7c-db6c8c082c62	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 13:16:40.698978	2025-09-15 13:16:40.698978
36acb950-1fd1-43a1-a1b3-d0b78c6b9b98	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 13:17:56.380469	2025-09-15 13:17:56.380469
b712f250-162a-4a27-82b6-c29079a7f14d	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 13:26:20.78497	2025-09-15 13:26:20.78497
3a6c36ac-aef6-43a9-9aa7-fe9f0caf30aa	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 13:31:46.847567	2025-09-15 13:31:46.847567
cee66d58-5ae7-4290-b436-9ec347d13de7	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 13:32:44.359849	2025-09-15 13:32:44.359849
3fc8eee5-6268-453d-990c-9468a76dae7a	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 13:43:38.349504	2025-09-15 13:43:38.349504
2040a7ec-a4e3-47d7-a8c1-d96196901506	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 13:43:40.608961	2025-09-15 13:43:40.608961
72e5023a-3f1b-4489-8c90-b72168f04a43	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 13:45:16.541441	2025-09-15 13:45:16.541441
1275854c-acb2-49a0-b7c1-4887c690734d	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 13:46:18.584382	2025-09-15 13:46:18.584382
bccfa248-c199-453a-960a-9f9cfc79bbcd	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 13:52:58.468712	2025-09-15 13:52:58.468712
a43988e2-096b-423c-b528-e477dd1c2c13	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 13:57:23.732228	2025-09-15 13:57:23.732228
d91b7c18-8050-4005-a452-3db7579f9e9a	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 14:01:00.563284	2025-09-15 14:01:00.563284
1ec4731c-585c-454c-8105-8a6e4b4e50aa	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 14:01:28.563756	2025-09-15 14:01:28.563756
72bc0e69-ea67-43cc-8d0f-89c33becfff2	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	web-1757945063636	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	ar	unknown	unknown	1	\N	f	suspicious_activity	{}	2025-09-15 14:03:11.259515	2025-09-15 14:03:11.259515
7cf2dc9d-c299-448d-9006-120687510bbc	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 14:10:28.081906	2025-09-15 14:10:28.081906
0122de47-c206-4ffc-8724-8bb63fe564fc	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 14:33:53.244052	2025-09-15 14:33:53.244052
d6d8649c-3ff6-4ff9-8348-48680f7813f4	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 14:36:02.185688	2025-09-15 14:36:02.185688
550d7cbf-4857-4957-be9a-0c00a511aa05	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 14:42:05.307837	2025-09-15 14:42:05.307837
11ce2f42-50d5-4d61-834b-34af90a72c03	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 15:30:43.420973	2025-09-15 15:30:43.420973
d3b6b17a-83d3-452e-acc2-b1da06eacf61	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 15:31:29.108318	2025-09-15 15:31:29.108318
0d267d1b-4084-4144-8ee0-37f7f9b6dbb1	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 15:32:26.807805	2025-09-15 15:32:26.807805
ec81a292-2e66-4995-824c-d3b044756d92	z10@z10.com	z10@z10.com	FAILED_LOGIN	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	security_618bface_2025-09-15T15-34-11-938Z.jpg	f	failed_login	{}	2025-09-15 15:34:11.968146	2025-09-15 15:34:11.968146
e37c9f00-bf62-4bde-91e8-c585f637cafe	z10@z10.com	z10@z10.com	FAILED_LOGIN	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	2	security_618bface_2025-09-15T15-34-41-373Z.jpg	f	failed_login	{}	2025-09-15 15:34:41.395672	2025-09-15 15:34:41.395672
527e3475-9ba9-4319-8f68-54a36a480f06	z10@z10.com	z10@z10.com	FAILED_LOGIN	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	3	security_618bface_2025-09-15T15-34-45-464Z.jpg	t	failed_login	{}	2025-09-15 15:34:45.492293	2025-09-15 15:34:45.492293
4981d53e-e694-4738-b69f-2a7808d61938	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	t	suspicious_activity	{}	2025-09-15 15:35:00.473366	2025-09-15 15:35:00.473366
ed6f6dc3-9bf4-44c8-97c3-a311bb7fa3f8	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 15:35:05.581423	2025-09-15 15:35:05.581423
52e071c7-2a5a-4645-a145-b7a1084e6df3	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	cc0233f2a52a1c3ede17d323afae1db3	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 18:23:02.878555	2025-09-16 18:23:02.878555
d5b6a7da-8306-4a79-92a8-0aba1fe13c67	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	t	suspicious_activity	{}	2025-09-15 15:35:32.678061	2025-09-15 15:35:32.678061
a29482be-5505-4a61-9833-cf982d493f5d	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	t	suspicious_activity	{}	2025-09-15 15:35:39.724928	2025-09-15 15:35:39.724928
0f497a52-b85c-4514-b130-a813ea765cc5	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	t	suspicious_activity	{}	2025-09-15 15:36:06.928331	2025-09-15 15:36:06.928331
e77029b9-ccc6-40e8-93e5-104920ad51ce	\N	\N	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Admin Action	Manual Unblock	Admin Panel	ar	N/A	N/A	1	\N	f	manual_report	{}	2025-09-15 15:36:24.41652	2025-09-15 15:36:24.41652
b7dbe6a4-2be1-402e-852a-46d0ec485e6b	\N	\N	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Admin Action	Manual Unblock	Admin Panel	ar	N/A	N/A	1	\N	f	manual_report	{}	2025-09-15 15:36:28.432994	2025-09-15 15:36:28.432994
845461d1-ad7b-4414-801d-41f3d67d33c9	\N	\N	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Admin Action	Manual Unblock	Admin Panel	ar	N/A	N/A	1	\N	f	manual_report	{}	2025-09-15 15:36:32.520649	2025-09-15 15:36:32.520649
62bd1675-f26f-4273-a995-0174c83edc51	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 15:36:39.701892	2025-09-15 15:36:39.701892
bb0940a1-4bcc-4ee9-acc1-ebeeefd323a1	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 15:37:11.568723	2025-09-15 15:37:11.568723
09e0e988-56c6-4a06-9ded-fe18b4f7621a	z5@z5.com	z5@z5.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:16:21.007295	2025-09-15 16:16:21.007295
b49a5d26-8ecb-4bc4-8297-719ac0fb66c9	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:16:23.612236	2025-09-15 16:16:23.612236
59b06078-c257-442e-966c-4fcb1225a8d6	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:19:59.169009	2025-09-15 16:19:59.169009
b2439fd6-e793-4b42-b4b5-850e5af8e8e5	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:23:32.51355	2025-09-15 16:23:32.51355
f53b91a0-4198-4290-bbd1-4be07e5ca043	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:25:13.211151	2025-09-15 16:25:13.211151
b6eba7a8-46aa-403c-b4a2-6ff85e396fda	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:26:53.387313	2025-09-15 16:26:53.387313
f8351ec3-8627-459c-8c83-1478502e8cd0	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:28:04.137297	2025-09-15 16:28:04.137297
2e1d016c-fa61-412f-a09b-7351e2f07df3	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:29:30.529125	2025-09-15 16:29:30.529125
8f09d20d-4f2d-4524-a7f4-ec4ffcc8f6b1	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:29:46.08697	2025-09-15 16:29:46.08697
9139249e-da2f-44a8-ae15-6cc451aec1c0	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:30:01.678036	2025-09-15 16:30:01.678036
acb3b0f3-6aad-4bf4-8767-ceb2678030ca	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:33:44.497369	2025-09-15 16:33:44.497369
884ca463-20c6-4caa-be39-24cb9df0e0c2	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:43:32.721283	2025-09-15 16:43:32.721283
fb2800a1-ec5f-4681-804c-5d85783bf5dc	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:49:19.191919	2025-09-15 16:49:19.191919
0c6e7486-a19d-4476-8b5c-b1f4793e964a	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 16:55:25.060422	2025-09-15 16:55:25.060422
dda08351-0ee0-4925-955e-a42bf5f32b0f	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 17:06:41.458202	2025-09-15 17:06:41.458202
010febf5-1920-44b5-a696-97ead1dd383c	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 17:08:48.069519	2025-09-15 17:08:48.069519
9349500d-4a78-402a-90ae-f2000c5b59c6	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 17:55:26.213058	2025-09-15 17:55:26.213058
983e5e68-858f-4f87-94f4-1e1a69be87df	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 18:10:55.373308	2025-09-15 18:10:55.373308
191be79f-c7e5-4fd4-9dc4-8b2fded4a47c	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 18:11:06.550174	2025-09-15 18:11:06.550174
51bd1dcd-28ae-46bd-81b5-1bd444cba2e0	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	e61ae397a135d5f60125398d2af90279	41.254.82.91	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 20:03:00.256307	2025-09-15 20:03:00.256307
6a7ca0f6-4b48-49f9-b829-21eb45d8ef60	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	6d395d00d9fdd5546c1b811868184672	41.254.82.91	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-15 20:16:17.023251	2025-09-15 20:16:17.023251
dcdf1681-46ff-4801-a1d0-3967abbe49f0	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 13:09:52.539363	2025-09-16 13:09:52.539363
e11e003d-5d31-4e38-996d-9327ba38492f	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 13:13:36.72698	2025-09-16 13:13:36.72698
abd94fcd-9684-4ec9-b5a9-a5cda94073b0	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 13:14:12.4734	2025-09-16 13:14:12.4734
5239affe-6b30-4493-b1d8-4f9ff78d3745	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 13:14:43.706183	2025-09-16 13:14:43.706183
b5422d9c-9827-4ed3-8023-948377f850cf	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 13:35:34.855951	2025-09-16 13:35:34.855951
30acc4b4-556d-4f4f-b066-4bd634d50d8a	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 13:43:20.063529	2025-09-16 13:43:20.063529
cb1cd074-663a-4011-b5b4-aa9f0dc45e45	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 13:43:28.822639	2025-09-16 13:43:28.822639
6b4de9f6-b5ac-48b6-87b5-e535354af20a	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 13:53:31.006054	2025-09-16 13:53:31.006054
8985361a-e94c-4dcf-b3ef-2b71b7482b56	z8@z8.com	z8@z8.com	FAILED_LOGIN	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	security_b37a2693_2025-09-16T14-12-20-678Z.jpg	f	failed_login	{}	2025-09-16 14:12:20.706701	2025-09-16 14:12:20.706701
e08a04c0-e562-4e97-8cb7-89da6f33959d	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 14:12:28.387123	2025-09-16 14:12:28.387123
c3cb6858-3948-4b74-93c0-5b15cef29c77	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 14:16:24.87864	2025-09-16 14:16:24.87864
555e673c-f737-4ac7-8004-a7fc38971bcc	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 14:27:02.173933	2025-09-16 14:27:02.173933
d1b656d9-e9f4-48c5-9adb-b22f46d403dd	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 14:33:13.771546	2025-09-16 14:33:13.771546
43f1157b-2812-4064-9e1b-f70a6401006c	z8@z8.com	z8@z8.com	FAILED_LOGIN	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	security_b37a2693_2025-09-16T14-33-48-163Z.jpg	f	failed_login	{}	2025-09-16 14:33:48.197934	2025-09-16 14:33:48.197934
ffcc57a0-016f-4eb0-830b-4a8a40e7991a	z8@z8.com	z8@z8.com	FAILED_LOGIN	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	2	security_b37a2693_2025-09-16T14-33-54-734Z.jpg	f	failed_login	{}	2025-09-16 14:33:54.78462	2025-09-16 14:33:54.78462
1b03a48e-70c7-4903-ac57-0f673245468d	z8@z8.com	z8@z8.com	FAILED_LOGIN	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	3	security_b37a2693_2025-09-16T14-33-58-169Z.jpg	t	failed_login	{}	2025-09-16 14:33:58.192809	2025-09-16 14:33:58.192809
472bfadf-5d48-4c6f-8255-4ef7a22ed113	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	t	suspicious_activity	{}	2025-09-16 14:34:00.29567	2025-09-16 14:34:00.29567
cb11cdd3-aa72-40dc-9f89-b96cec08b2de	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	t	suspicious_activity	{}	2025-09-16 14:34:11.627137	2025-09-16 14:34:11.627137
2cc5303d-cf8e-4987-b7c5-630b539cd734	\N	\N	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Admin Action	Manual Unblock	Admin Panel	ar	N/A	N/A	1	\N	f	manual_report	{}	2025-09-16 14:34:24.945948	2025-09-16 14:34:24.945948
5c537e3e-db95-4b44-9fd9-f31e31f304e2	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 14:34:33.651262	2025-09-16 14:34:33.651262
b44b3b99-a48a-4368-853c-d529a9576443	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	6d395d00d9fdd5546c1b811868184672	41.254.64.76	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 14:35:29.389429	2025-09-16 14:35:29.389429
f6154f99-03ee-40b7-af30-971a977fe184	z8@z8.com	z8@z8.com	FAILED_LOGIN	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	security_b37a2693_2025-09-16T14-36-27-885Z.jpg	f	failed_login	{}	2025-09-16 14:36:27.912197	2025-09-16 14:36:27.912197
a011cd61-8395-4471-ae50-48b69d0b5d2f	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 14:36:34.304526	2025-09-16 14:36:34.304526
919684a2-4dfc-493a-9fff-22a57379dab7	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 14:38:33.713369	2025-09-16 14:38:33.713369
19fb8582-996c-4016-b59b-470a7888bf32	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 14:39:00.533976	2025-09-16 14:39:00.533976
164bc4ff-55e7-4dc7-bd62-b8701f042668	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 15:25:43.496874	2025-09-16 15:25:43.496874
c88d248e-d479-4d0f-915c-872d6d00f25c	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 16:27:32.954011	2025-09-16 16:27:32.954011
47e32303-c9d4-4fd4-b4c0-b93c5954d9b4	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 16:52:23.581091	2025-09-16 16:52:23.581091
5ec481d4-5120-49bc-9752-d610d318b731	z9@z9.com	z9@z9.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 16:53:59.10598	2025-09-16 16:53:59.10598
9b367ec5-9267-4636-a670-083b834a4852	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 17:59:32.630392	2025-09-16 17:59:32.630392
e68a9fbe-90a7-41a3-8074-20df1099d88d	z8@z8.com	z8@z8.com	FAILED_LOGIN	b37a2693f64553fc52a4f4d6041aa1ae	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	security_b37a2693_2025-09-16T18-00-31-050Z.jpg	f	failed_login	{}	2025-09-16 18:00:31.084956	2025-09-16 18:00:31.084956
a561eb57-35c5-4dd5-b5db-7b3bbabec8f4	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.64.202	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-16 18:10:10.361377	2025-09-16 18:10:10.361377
4dd7c8eb-7f77-4905-8bef-c40043a81c6d	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-17 09:55:22.966833	2025-09-17 09:55:22.966833
7e45ce2f-9f92-45ea-bde5-3b8078927476	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-17 10:57:28.484585	2025-09-17 10:57:28.484585
5bd6142e-b8b9-401d-8ff5-aab837949df1	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	6d395d00d9fdd5546c1b811868184672	41.254.81.131	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-17 10:59:51.636418	2025-09-17 10:59:51.636418
a4cc5370-8681-4ab8-afff-62f79c8ec725	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-17 17:45:27.043138	2025-09-17 17:45:27.043138
70cbc49a-a36b-4a69-83d9-97ccc4166a9c	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	e61ae397a135d5f60125398d2af90279	41.254.85.219	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-17 21:49:51.039436	2025-09-17 21:49:51.039436
f3263d6b-5a27-42d3-9edc-b1ee3765bb0e	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-18 12:39:44.259593	2025-09-18 12:39:44.259593
30e4a2f7-7635-4610-8212-4255ec0ce548	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-18 12:58:22.894817	2025-09-18 12:58:22.894817
2b8f04f2-b8d1-4f41-8b7e-6be24a1575dd	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-18 14:07:33.75472	2025-09-18 14:07:33.75472
eabcc538-4673-4a60-a806-3cfaae78cc72	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-18 16:17:47.593179	2025-09-18 16:17:47.593179
d27a9e46-4390-4ffc-bc5a-d9377d9c23b2	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-19 15:57:22.885525	2025-09-19 15:57:22.885525
3f63c7ac-69f6-45f3-b579-f9a904746aba	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-19 15:58:53.270731	2025-09-19 15:58:53.270731
baca117f-9e00-4030-b1c9-d0197cb23c0e	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-19 16:20:56.158476	2025-09-19 16:20:56.158476
32c24c8d-7f00-4aa5-8614-2e7417d240b3	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-19 16:36:49.225631	2025-09-19 16:36:49.225631
9522acf7-1316-4ac3-bb5d-ac545431e33b	z6@z65.com	z6@z65.com	FAILED_LOGIN	5c668dc5675708d2e0d913f8425513a3	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar	2560x1440	Africa/Tripoli	1	security_5c668dc5_2025-09-19T16-58-00-624Z.jpg	f	failed_login	{}	2025-09-19 16:58:00.645435	2025-09-19 16:58:00.645435
c8c21517-78d7-4d24-9de7-7ae094cec384	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-19 17:54:31.457864	2025-09-19 17:54:31.457864
30fb4756-0011-4c56-856f-a8e3bf715d51	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-19 17:56:09.89177	2025-09-19 17:56:09.89177
b738d53b-688b-4eb1-b220-d0ab48c2fa41	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-19 17:56:56.254611	2025-09-19 17:56:56.254611
07759614-ffcb-4363-a76f-29ba37c5f189	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.80.216	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-20 14:12:32.346627	2025-09-20 14:12:32.346627
e9a6f033-dea7-4e5e-a42f-7e590d440a3f	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-21 11:58:08.531679	2025-09-21 11:58:08.531679
9a2817b0-38cf-41c7-aaeb-8543617f2994	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-21 11:59:33.552227	2025-09-21 11:59:33.552227
06492586-aa91-4c7f-8cad-a7f70e87d508	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-21 12:37:04.428976	2025-09-21 12:37:04.428976
1dcf800f-7411-4a60-87bd-8eb330499596	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-22 12:04:18.016462	2025-09-22 12:04:18.016462
0378af2d-267b-4b0c-8678-5f075c8e2648	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-22 13:11:33.590269	2025-09-22 13:11:33.590269
4846a06d-a926-4142-80ae-09f1cd91420b	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-23 17:57:53.465482	2025-09-23 17:57:53.465482
c524a3a8-3561-47b7-abd9-11d23fa8c85d	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-23 17:58:21.673542	2025-09-23 17:58:21.673542
fe92230b-9ffe-447c-806a-09a0c1043f8d	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-23 17:58:44.997942	2025-09-23 17:58:44.997942
a03eb130-85f5-417b-924e-e6975a979721	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	618bfaceba345b3c5d5c27d1c80aff1a	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-24 12:40:24.129046	2025-09-24 12:40:24.129046
0ea2e5fb-887d-4a70-bfc8-851abe48f1a7	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-24 12:49:58.415006	2025-09-24 12:49:58.415006
5271c791-5960-4b7a-a76b-ed3228d871b1	z6@z6.com	z6@z6.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-24 13:03:39.535301	2025-09-24 13:03:39.535301
317f1ddb-2a4a-49ed-ae94-ca6ae932ef08	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	ca90de0a1bae898e9bedfaa3e668a482	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-24 13:04:01.914516	2025-09-24 13:04:01.914516
d9805e1f-ccc6-4215-b4cf-df0314a02205	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.74.139	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-25 13:45:50.383037	2025-09-25 13:45:50.383037
2e5c0230-2314-4427-9eb8-14a24350331b	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	e61ae397a135d5f60125398d2af90279	41.254.86.73	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-27 05:07:13.190063	2025-09-27 05:07:13.190063
31868b9f-6c8f-4d64-80f6-5c15fb52ea4a	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	6d395d00d9fdd5546c1b811868184672	41.254.65.138	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36	Libya	Tripoli	Web	ar-LY	412x892	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-29 12:30:19.758896	2025-09-29 12:30:19.758896
c0d972d1-d6de-4912-94ce-6a2cec079509	ss73ss73ss73@gmail.com	ss73ss73ss73@gmail.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.81.173	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-29 15:24:09.516973	2025-09-29 15:24:09.516973
189ab267-583c-4b97-8eae-e55807e7faa4	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	30fac3474f00e1d75075d8613997b1ae	41.254.81.173	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 OPR/122.0.0.0	Libya	Tripoli	Web	en-US	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-29 15:25:47.957593	2025-09-29 15:25:47.957593
95197e41-f51c-4755-9292-1e0c1161cb37	z8@z8.com	z8@z8.com	SUSPICIOUS_ACTIVITY	b37a2693f64553fc52a4f4d6041aa1ae	41.254.81.173	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	Libya	Tripoli	Web	ar-LY	2560x1440	Africa/Tripoli	1	\N	f	suspicious_activity	{}	2025-09-29 19:52:55.43122	2025-09-29 19:52:55.43122
\.


--
-- Data for Name: signing_keys; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.signing_keys (id, kid, algorithm, public_key, private_key, active, created_at, expires_at) FROM stdin;
1	key_1755349827976_scxrjg	RS256	-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAztzxy2aJuUsr7hXsOpuj\n2RZdu2qlWEsq+YIPK2LSY6D/ff4VlOthhrEE5l16vZisXS0MGDKExMe4IE52bUpQ\n3KLa0AzlOu5+dFYN9yMdDBOORb/BXrFInQf6/MytWau0lYKLqGN2K0zk2tM5hmJX\npBIWUOj0F3dF5hq+YJNrK3XpUK++jowQDUVm64xdktlCQpkyId9CG9BTB2e9rMOm\nn34/itsioFlIPW3yDsdollExBO6j7rkXFk7jl5VbMuPUx6PLDFkmNin10D1BAxMH\nrH+cKgnE5fjkgEc3wlRhl6Cu7xYC6ZwD8Aw5iyu7mstJ8MOMlKy4pRX4pAQp1yHR\nnQIDAQAB\n-----END PUBLIC KEY-----\n	-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDO3PHLZom5Syvu\nFew6m6PZFl27aqVYSyr5gg8rYtJjoP99/hWU62GGsQTmXXq9mKxdLQwYMoTEx7gg\nTnZtSlDcotrQDOU67n50Vg33Ix0ME45Fv8FesUidB/r8zK1Zq7SVgouoY3YrTOTa\n0zmGYlekEhZQ6PQXd0XmGr5gk2srdelQr76OjBANRWbrjF2S2UJCmTIh30Ib0FMH\nZ72sw6affj+K2yKgWUg9bfIOx2iWUTEE7qPuuRcWTuOXlVsy49THo8sMWSY2KfXQ\nPUEDEwesf5wqCcTl+OSARzfCVGGXoK7vFgLpnAPwDDmLK7uay0nww4yUrLilFfik\nBCnXIdGdAgMBAAECggEAEWJQ8ZJy5X7zOKVf/kbhHJe8FclvDr32ZRRweOlrm9LG\nVcy5/JNRVVPgAQn/DBrd9VCZURlBvhW4nAJsAmA57mjDMbO7udmcB+PJdajeQosM\nLEFimzYTz5qBlagPs1byLJRVbze4kQf7vYX9shTmn5Oji3YgOS6dUaqSsCQDYBn4\nZ2zjnC7sRpzUS2H3FqwsFyK6hV5s82BcMXKJWQMoXuJDS5L7sZ8ZOMj3QCWY0YtY\nhnYxQIK2JK1SCNSrb7JBl9Z40fB0wpnJKZseynV/ukRvF6+Iu1weAzpA1jt193SL\n71fzQeJ+zLrTEnb5MnLvu+fzI5ZFYgC9upEnD/qj4wKBgQDuPtrWskF4jtdiKi+q\ny04jF/3SbtC9JrtulbBidZJoaxZEDsIBsLusKFjZqm+ILcsVYNdJhBxvormtTg0Y\n4rXwoown+0mGUTcBJAmddDJUDb1EZVEN6xIwTX40qfXG7vnFjj8FXwmOVARRlmC+\nAkMbhY0ogX32xis/nhSfzU/nawKBgQDeR2N84PAjuoa0cpwCHjJ33PeQUK4N4SZL\n8grk5KnGxGDQ2FQx5aeoODbQ/YI/IdcZiPV1NDTUSePfhXwRfXGgFzzWqnZXN4up\nDSZxWpJqyypOd2p9QRibu5fC53TiDyTz71AMWn92gWQQ5Lsz0h32FwBsUuP4FFGr\ndZdVXjjVFwKBgQCJUMb3CaS8pK+1T5VLvoQZrAFKoT5EVyeelD4mcZdiAZ7CuTLO\noJt6nYKgaiCAf8xWVQugvrlZCpQ0NBFOb5Tnzfg0LxxwgyzNxoSYMNm1InodCrxN\n5lgEaRW9qtwSvbhOSi8+nEk4tGoM0DyQJ2OgYDg8yW3dpthUgXtno4FTYwKBgQC6\nUg70A71nxZfatGNPZy6YyNF/2BE+Myed64L0QTSLF9ur1FonBUGXQZ+5aXb/Ioei\nsOpH134dIN7xY3wPUR6oujHWI0dVbosUJqC9zdUDzc9lvLW3zpQpHoNk7g1M3LL2\nAvkPkeBcXrOZcZH2Kz/QI5HIO2c6cRXQap5zAasT+wKBgAJAZxJIrgakuhev3bFy\nSEuN+W34MjTMoXVAFyaUAD9SXdvbAKLytjoKaq/Q8w0QWwMb9hjE9aZgRmxy+zPv\n4lQDZg0GCRPPBaFSsnX+EJ2PMaPyJME0FXxBUjEgWXi9IPga07xAqcg1qN4eQw9p\nYswSpWl2iq1YXBoSThYG4Esq\n-----END PRIVATE KEY-----\n	t	2025-08-16 13:10:28.038926+00	2026-02-12 13:10:28.026+00
\.


--
-- Data for Name: system_commission_rates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_commission_rates (id, transfer_type, currency, commission_rate, is_active, created_at, updated_at, per_mille_rate, fixed_amount) FROM stdin;
68	city	LYD	0.0000	t	2025-09-11 16:45:00.594932	2025-09-11 16:45:00.594932	\N	7.00
52	international	USD	0.0000	t	2025-08-24 16:43:02.218054	2025-09-15 13:45:45.402	\N	7.00
55	internal	LYD	0.0000	t	2025-09-02 15:32:39.288303	2025-09-03 12:25:16.879	\N	6.00
67	market	USD	0.0000	t	2025-09-03 17:11:53.392208	2025-09-03 17:11:53.392208	\N	3.00
\.


--
-- Data for Name: system_commission_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_commission_settings (id, type, value, currency, created_at, updated_at, updated_by) FROM stdin;
18	percentage	2.000000	USD	2025-09-02 17:13:17.266216	2025-09-02 17:13:17.251	4
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (key, value, updated_at) FROM stdin;
referral.reward_rate	{"rate": 0.20}	2025-08-31 12:27:50.900848
test_key	{"test": "value"}	2025-08-31 15:58:36.604593
referral_commission_percentage	5	2025-08-31 15:59:11.686523
referral_signup_bonus	10	2025-08-31 15:59:11.686523
max_referral_levels	2	2025-08-31 15:59:11.686523
min_referral_amount	1	2025-08-31 15:59:11.686523
referral.enabled	{"enabled": true}	2025-08-31 19:07:18.587247
referral.fixed_reward_lyd	{"amount": 1}	2025-09-25 13:45:18.138
referral.fixed_reward_usd	{"amount": 0.5}	2025-09-25 13:45:18.161
referral.fixed_reward_market_sell	{"amount": 0.5}	2025-09-25 13:45:18.185
referral.system_fee_rate	{"rate": 0.1}	2025-09-25 13:45:18.208
\.


--
-- Data for Name: transaction_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transaction_logs (id, user_id, ts, type, currency, amount, commission, direction, counterparty, ref, status, note, transfer_id, city_transfer_id, agent_transfer_id, market_transaction_id, international_transfer_id, metadata, created_at, reference_number) FROM stdin;
141	89	2025-09-14 16:42:32.420707	referral_reward_received	USD	0.4500	0.0000	credit	عدي العراقي	REF-179	completed	مكافأة إحالة بعد خصم رسوم النظام (10.0%) - transfer_usd	\N	\N	\N	\N	\N	{"operationType":"transfer_usd","referredUserId":90,"commissionBase":9,"originalRewardAmount":0.5,"systemFeeRate":0.1,"systemFeeAmount":0.05,"finalRewardAmount":0.45,"txId":179,"deductedFromCommission":true}	2025-09-14 16:42:32.420707	\N
142	89	2025-09-14 16:59:23.397211	referral_reward_received	USD	0.4500	0.0000	credit	عدي العراقي	REF-180	completed	مكافأة إحالة بعد خصم رسوم النظام (10.0%) - transfer_usd	\N	\N	\N	\N	\N	{"operationType":"transfer_usd","referredUserId":90,"commissionBase":9,"originalRewardAmount":0.5,"systemFeeRate":0.1,"systemFeeAmount":0.05,"finalRewardAmount":0.45,"txId":180,"deductedFromCommission":true}	2025-09-14 16:59:23.397211	\N
143	101	2025-09-14 17:04:02.281667	referral_reward_received	LYD	0.9000	0.0000	credit	سعد مسعود	REF-70	completed	مكافأة إحالة بعد خصم رسوم النظام (10.0%) - transfer_lyd	\N	\N	\N	\N	\N	{"operationType":"transfer_lyd","referredUserId":102,"commissionBase":7,"originalRewardAmount":1,"systemFeeRate":0.1,"systemFeeAmount":0.1,"finalRewardAmount":0.9,"txId":70,"deductedFromCommission":true}	2025-09-14 17:04:02.281667	\N
144	101	2025-09-15 14:06:30.760473	referral_reward_received	USD	0.4500	0.0000	credit	سعد مسعود	REF-181	completed	مكافأة إحالة بعد خصم رسوم النظام (10.0%) - transfer_usd	\N	\N	\N	\N	\N	{"operationType":"transfer_usd","referredUserId":102,"commissionBase":7,"originalRewardAmount":0.5,"systemFeeRate":0.1,"systemFeeAmount":0.05,"finalRewardAmount":0.45,"txId":181,"deductedFromCommission":true}	2025-09-15 14:06:30.760473	\N
145	89	2025-09-15 14:13:29.420487	referral_reward_received	USD	0.4500	0.0000	credit	عدي العراقي	REF-182	completed	مكافأة إحالة بعد خصم رسوم النظام (10.0%) - transfer_usd	\N	\N	\N	\N	\N	{"operationType":"transfer_usd","referredUserId":90,"commissionBase":7,"originalRewardAmount":0.5,"systemFeeRate":0.1,"systemFeeAmount":0.05,"finalRewardAmount":0.45,"txId":182,"deductedFromCommission":true}	2025-09-15 14:13:29.420487	\N
146	101	2025-09-15 15:37:36.189262	referral_reward_received	LYD	0.9000	0.0000	credit	سعد مسعود	REF-147	completed	مكافأة إحالة بعد خصم رسوم النظام (10.0%) - transfer_lyd	\N	\N	\N	\N	\N	{"operationType":"transfer_lyd","referredUserId":102,"commissionBase":6,"originalRewardAmount":1,"systemFeeRate":0.1,"systemFeeAmount":0.1,"finalRewardAmount":0.9,"txId":147,"deductedFromCommission":true}	2025-09-15 15:37:36.189262	\N
147	101	2025-09-15 20:05:53.977335	referral_reward_received	LYD	0.9000	0.0000	credit	سعد مسعود	REF-149	completed	مكافأة إحالة بعد خصم رسوم النظام (10.0%) - transfer_lyd	\N	\N	\N	\N	\N	{"operationType":"transfer_lyd","referredUserId":102,"commissionBase":6,"originalRewardAmount":1,"systemFeeRate":0.1,"systemFeeAmount":0.1,"finalRewardAmount":0.9,"txId":149,"deductedFromCommission":true}	2025-09-15 20:05:53.977335	\N
148	101	2025-09-16 13:19:25.670807	referral_balance_withdrawal	LYD	2.7000	0.0000	debit	نظام المكافآت	RW-1758028765659	completed	سحب رصيد مكافآت إحالة	\N	\N	\N	\N	\N	{"withdrawalType":"referral_balance","originalBalance":2.7}	2025-09-16 13:19:25.670807	\N
149	101	2025-09-16 13:19:25.75306	referral_balance_deposit	LYD	2.7000	0.0000	credit	نظام المكافآت	RD-1758028765741	completed	إيداع مكافآت إحالة للرصيد الرئيسي	\N	\N	\N	\N	\N	{"depositType":"referral_balance_transfer","originalBalance":2.7}	2025-09-16 13:19:25.75306	\N
150	101	2025-09-16 13:19:26.804797	referral_balance_withdrawal	USD	0.4500	0.0000	debit	نظام المكافآت	RW-1758028766792	completed	سحب رصيد مكافآت إحالة	\N	\N	\N	\N	\N	{"withdrawalType":"referral_balance","originalBalance":0.45}	2025-09-16 13:19:26.804797	\N
151	101	2025-09-16 13:19:26.877289	referral_balance_deposit	USD	0.4500	0.0000	credit	نظام المكافآت	RD-1758028766865	completed	إيداع مكافآت إحالة للرصيد الرئيسي	\N	\N	\N	\N	\N	{"depositType":"referral_balance_transfer","originalBalance":0.45}	2025-09-16 13:19:26.877289	\N
152	101	2025-09-17 20:43:07.536066	referral_reward_received	USD	0.4500	0.0000	credit	سعد مسعود	REF-183	completed	مكافأة إحالة بعد خصم رسوم النظام (10.0%) - transfer_usd	\N	\N	\N	\N	\N	{"operationType":"transfer_usd","referredUserId":102,"commissionBase":7,"originalRewardAmount":0.5,"systemFeeRate":0.1,"systemFeeAmount":0.05,"finalRewardAmount":0.45,"txId":183,"deductedFromCommission":true}	2025-09-17 20:43:07.536066	\N
153	101	2025-09-18 14:17:24.548203	referral_balance_withdrawal	USD	0.4500	0.0000	debit	نظام المكافآت	RW-1758205044537	completed	سحب رصيد مكافآت إحالة	\N	\N	\N	\N	\N	{"withdrawalType":"referral_balance","originalBalance":0.45}	2025-09-18 14:17:24.548203	\N
154	101	2025-09-18 14:17:24.641746	referral_balance_deposit	USD	0.4500	0.0000	credit	نظام المكافآت	RD-1758205044632	completed	إيداع مكافآت إحالة للرصيد الرئيسي	\N	\N	\N	\N	\N	{"depositType":"referral_balance_transfer","originalBalance":0.45}	2025-09-18 14:17:24.641746	\N
155	101	2025-09-24 12:58:59.21915	referral_reward_received	LYD	0.9000	0.0000	credit	سعد مسعود	REF-150	completed	مكافأة إحالة بعد خصم رسوم النظام (10.0%) - transfer_lyd	\N	\N	\N	\N	\N	{"operationType":"transfer_lyd","referredUserId":102,"commissionBase":6,"originalRewardAmount":1,"systemFeeRate":0.1,"systemFeeAmount":0.1,"finalRewardAmount":0.9,"txId":150,"deductedFromCommission":true}	2025-09-24 12:58:59.21915	\N
156	101	2025-09-24 13:04:12.840695	referral_reward_received	USD	0.4500	0.0000	credit	سعد مسعود	REF-107	completed	مكافأة إحالة بعد خصم رسوم النظام (10.0%) - market_sell	\N	\N	\N	\N	\N	{"operationType":"market_sell","referredUserId":102,"commissionBase":3,"originalRewardAmount":0.5,"systemFeeRate":0.1,"systemFeeAmount":0.05,"finalRewardAmount":0.45,"txId":107,"deductedFromCommission":true}	2025-09-24 13:04:12.840695	\N
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions (id, user_id, type, amount, currency, description, date, reference_number) FROM stdin;
1555	4	withdraw	409	USD	سحب بواسطة الإدارة	2025-09-13 14:28:57.840158	REF-1757773737828-OGP5ZP
1428	4	withdraw	26.5	LYD	سحب بواسطة الإدارة	2025-09-06 15:41:28.6265	REF-1757173288615-409LB7
934	4	deposit	500	LYD	إيداع بواسطة الإدارة	2025-08-31 11:59:59.850766	REF-1756641599838-FLIY2M
1440	4	withdraw	17.55	USD	سحب بواسطة الإدارة	2025-09-06 16:03:20.705972	REF-1757174600694-UHOTUV
772	4	system_commission	2.5	USD	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 836712	2025-08-25 10:08:01.451607	REF-1756116481440-RLY6HU
780	4	system_commission	2.5	USD	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 375668	2025-08-25 12:54:04.376064	REF-1756126444364-16PNXM
782	4	system_commission	2.5	USD	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 794721	2025-08-25 15:40:49.749988	REF-1756136449737-4V9XN2
1466	4	commission_withdrawal	15.1	LYD	سحب من حساب العمولات: 222	2025-09-11 16:40:14.07864	REF-1757608814067-DP6R6Y
955	4	withdraw	100050	LYD	سحب بواسطة الإدارة	2025-09-01 09:46:48.239637	REF-1756720008226-QZ5I0Q
956	4	withdraw	99000	LYD	سحب بواسطة الإدارة	2025-09-01 09:47:05.805212	REF-1756720025793-VZSJ4Q
1479	4	withdraw	11.1	LYD	سحب بواسطة الإدارة	2025-09-11 17:07:37.399314	REF-1757610457388-IHH5DF
966	4	commission_withdrawal	353	LYD	سحب من حساب العمولات: 353	2025-09-01 15:37:15.322852	REF-1756741035311-HD8H6O
967	4	commission_withdrawal	168.5	USD	سحب من حساب العمولات: 168.50 	2025-09-01 15:37:36.29321	REF-1756741056281-7SNTFE
970	4	commission_withdrawal	5	USD	سحب من حساب العمولات: 5	2025-09-01 16:11:40.321326	REF-1756743100300-XN4XN9
976	4	commission_withdrawal	2.5	USD	سحب من حساب العمولات: 222	2025-09-01 17:02:25.543239	REF-1756746145532-2QMU50
978	4	commission_withdrawal	2.5	USD	سحب من حساب العمولات: 222	2025-09-01 17:14:20.405598	REF-1756746860393-PUI8P2
980	4	commission_withdrawal	2.5	USD	سحب من حساب العمولات: 555	2025-09-01 17:19:14.350018	REF-1756747154339-5FZ28Q
984	4	commission_withdrawal	0.1	LYD	سحب من حساب العمولات: 88	2025-09-01 17:34:22.266911	REF-1756748062254-QIDGTY
987	4	commission_withdrawal	2.5	USD	سحب من حساب العمولات: 1236	2025-09-01 18:08:12.258308	REF-1756750092246-MP2MT4
1012	4	withdraw	223.5	USD	سحب بواسطة الإدارة	2025-09-02 05:09:42.357669	REF-1756789782345-5P44FT
1014	4	withdraw	2	LYD	سحب بواسطة الإدارة	2025-09-02 05:10:11.10484	REF-1756789811092-A8NAOE
1016	4	withdraw	22	USD	سحب بواسطة الإدارة	2025-09-02 05:11:40.106135	REF-1756789900095-KEHZ2I
1554	4	withdraw	9200	LYD	سحب بواسطة الإدارة	2025-09-13 14:28:45.900047	REF-1757773725887-XUY2VO
1571	4	commission_withdrawal	11.2	LYD	سحب من حساب العمولات: 222	2025-09-14 16:31:04.409309	REF-1757867464399-KOTYOG
942	4	internal_transfer_in	500	LYD	تحويل داخلي من معتز محمد	2025-08-31 18:48:37.189007	REF-INT-1756666116965-INT-IN
957	4	withdraw	80000	LYD	سحب بواسطة الإدارة	2025-09-01 09:47:30.794672	REF-1756720050782-3ZNDMK
958	4	withdraw	811950	LYD	سحب بواسطة الإدارة	2025-09-01 09:47:50.654227	REF-1756720070641-T5TOSO
959	4	withdraw	100050	USD	سحب بواسطة الإدارة	2025-09-01 09:48:38.064167	REF-1756720118051-P627W4
1467	4	commission_withdrawal	8.55	USD	سحب من حساب العمولات: 8.55 	2025-09-11 16:40:34.314903	REF-1757608834303-MMY0RO
974	4	commission_withdrawal	7.5	USD	سحب من حساب العمولات: 555	2025-09-01 16:48:45.769443	REF-1756745325759-DJSAZQ
1524	4	commission_withdrawal	3	USD	سحب من حساب العمولات: 333	2025-09-12 16:25:09.646814	REF-1757694309639-RVPDST
985	4	commission_withdrawal	2.5	USD	سحب من حساب العمولات: 888	2025-09-01 18:01:05.847916	REF-1756749665836-4DQQ3G
1607	102	internal_transfer_out	-891	LYD	تحويل داخلي إلى رمزي ابراهيم (885 + 6.00 عمولة)	2025-09-15 20:05:54.062778	REF-INT-1757966753643-INT-OUT
989	4	commission_withdrawal	2.5	USD	سحب من حساب العمولات: 1235	2025-09-01 18:13:39.033418	REF-1756750419020-9750W4
1608	101	internal_transfer_in	885	LYD	تحويل داخلي من سعد مسعود	2025-09-15 20:05:54.089538	REF-INT-1757966753643-INT-IN
1612	102	internal_transfer_out	-61	LYD	تحويل داخلي إلى رمزي ابراهيم (55 + 6.00 عمولة)	2025-09-24 12:58:59.302285	REF-INT-1758718738797-INT-OUT
1013	4	withdraw	351.1	LYD	سحب بواسطة الإدارة	2025-09-02 05:09:57.871762	REF-1756789797861-GCAPJ3
1613	101	internal_transfer_in	55	LYD	تحويل داخلي من سعد مسعود	2025-09-24 12:58:59.330804	REF-INT-1758718738797-INT-IN
1618	4	commission_withdrawal	32.75	USD	سحب من حساب العمولات: 222	2025-09-25 13:21:44.504095	REF-1758806504493-FUIP6X
1620	101	deposit	10000	USD	إيداع بواسطة الإدارة	2025-09-29 20:11:35.909092	REF-1759176695898-STUO8B
1622	4	deposit	100000	LYD	إيداع بواسطة الإدارة	2025-09-30 13:01:41.072139	REF-1759237301061-VL9BW6
1427	4	withdraw	106.41	USD	سحب بواسطة الإدارة	2025-09-06 15:41:17.839421	REF-1757173277829-K5GRKD
1429	4	commission_withdrawal	2	USD	سحب من حساب العمولات: 88	2025-09-06 15:41:50.209061	REF-1757173310198-B73CZH
786	4	system_commission	2.5	USD	عمولة النظام - تحويل بين المكاتب - رمز الاستلام: 683442	2025-08-25 16:04:56.94554	REF-1756137896934-I840FK
1572	4	commission_withdrawal	2.55	USD	سحب من حساب العمولات: 2.55 	2025-09-14 16:31:25.356977	REF-1757867485341-D73IYD
930	4	deposit	1000000	LYD	إيداع بواسطة الإدارة	2025-08-30 18:47:29.105071	REF-1756579649092-UBGMTM
931	4	deposit	50	USD	إيداع بواسطة الإدارة	2025-08-30 18:47:41.592624	REF-1756579661580-951WFJ
1468	4	withdraw	15.1	LYD	سحب بواسطة الإدارة	2025-09-11 16:41:02.591985	REF-1757608862581-C59R38
1614	102	exchange	-100	USD	تعليق 100 USD لعرض بيع بسعر 2 LYD - الرقم المرجعي: 107	2025-09-24 13:03:13.846173	OFFER-107
982	4	commission_withdrawal	2.5	USD	سحب من حساب العمولات: 555	2025-09-01 17:23:06.133206	REF-1756747386122-KD5767
1521	4	deposit	10000	LYD	إيداع بواسطة الإدارة	2025-09-11 21:22:05.147514	REF-1757625725136-2OFSC1
1525	4	exchange	-200	LYD	شراء 100 USD بسعر 2.000000 LYD	2025-09-12 16:25:34.120025	REF-1757694334112-D04GXW
1526	4	exchange	100	USD	استلام 100 USD من عملية الشراء	2025-09-12 16:25:34.142088	REF-1757694334134-8QLULJ
997	4	commission_withdrawal	17.5	USD	سحب من حساب العمولات: 123	2025-09-01 18:49:50.192332	REF-1756752590181-8GHVGN
1619	4	commission_withdrawal	39.4	LYD	سحب من حساب العمولات: 22201	2025-09-25 13:22:22.796227	REF-1758806542786-UN44E4
1621	101	exchange	-500	USD	تعليق 500 USD لعرض بيع بسعر 3 LYD - الرقم المرجعي: 108	2025-09-29 20:14:39.576371	OFFER-108
1539	4	exchange	-100	LYD	شراء 100 USD بسعر 1.000000 LYD	2025-09-12 18:03:46.188622	REF-1757700226178-IEZW5G
1007	4	commission_withdrawal	7	USD	سحب من حساب العمولات: 555	2025-09-01 19:06:27.008806	REF-1756753586996-QHPMDC
1008	4	commission_withdrawal	0.5	USD	سحب من حساب العمولات: 555	2025-09-01 19:06:38.451754	REF-1756753598439-QXT65Z
1540	4	exchange	100	USD	استلام 100 USD من عملية الشراء	2025-09-12 18:03:46.211003	REF-1757700226201-WB1AJ5
1623	4	deposit	100000	USD	إيداع بواسطة الإدارة	2025-09-30 13:01:51.697263	REF-1759237311685-D4NTBY
1015	4	commission_withdrawal	22	USD	سحب من حساب العمولات: غغاا	2025-09-02 05:10:52.572367	REF-1756789852561-XZ0Q30
1430	4	commission_withdrawal	0.55	USD	سحب من حساب العمولات: 555	2025-09-06 15:42:43.385897	REF-1757173363374-ROF5M5
1560	4	commission_withdrawal	12	USD	سحب من حساب العمولات: 12	2025-09-13 18:07:10.290867	REF-1757786830279-7L3K73
1469	4	withdraw	8.55	USD	سحب بواسطة الإدارة	2025-09-11 16:41:16.543841	REF-1757608876531-6LCZQ5
1573	4	withdraw	17.2	LYD	سحب بواسطة الإدارة	2025-09-14 16:32:05.296562	REF-1757867525286-9PX8L1
1532	4	exchange	-100	LYD	شراء 100 USD بسعر 1.000000 LYD	2025-09-12 16:47:24.012943	REF-1757695644003-8ASN1R
1533	4	exchange	100	USD	استلام 100 USD من عملية الشراء	2025-09-12 16:47:24.035406	REF-1757695644026-AEJEBA
1615	101	exchange	-200	LYD	شراء 100.00 USD بسعر 2.000000 LYD	2025-09-24 13:04:13.014412	REF-1758719053003-PQNR3D
1616	101	exchange	100.00	USD	استلام 100.00 USD من عملية الشراء	2025-09-24 13:04:13.03683	REF-1758719053025-PDCG0H
1617	102	exchange	200	LYD	استلام 200 LYD من بيع 100.00 USD (العمولة مخصومة مسبقاً)	2025-09-24 13:04:13.059175	REF-1758719053047-VUT1AN
1561	4	commission_withdrawal	6	LYD	سحب من حساب العمولات: 6	2025-09-13 18:07:19.855583	REF-1757786839844-ULRNJL
1574	4	withdraw	14.55	USD	سحب بواسطة الإدارة	2025-09-14 16:32:19.678324	REF-1757867539668-UBG5KA
1112	4	commission_withdrawal	11.5	LYD	سحب من حساب العمولات: 4444	2025-09-02 18:08:16.777526	REF-1756836496765-W29QAD
1113	4	commission_withdrawal	29.4	USD	سحب من حساب العمولات: 4444	2025-09-02 18:08:28.453184	REF-1756836508441-I9NY2L
1544	4	exchange	-200	LYD	شراء 100 USD بسعر 2.000000 LYD	2025-09-12 18:13:05.034478	REF-1757700785023-QVNTV8
1545	4	exchange	100	USD	استلام 100 USD من عملية الشراء	2025-09-12 18:13:05.056346	REF-1757700785046-M2LLTL
1547	4	exchange	-200	LYD	شراء 100.00 USD بسعر 2.000000 LYD	2025-09-12 18:13:34.294558	REF-1757700814283-0G0PCK
1548	4	exchange	100.00	USD	استلام 100.00 USD من عملية الشراء	2025-09-12 18:13:34.31621	REF-1757700814305-IJ8VVK
1189	4	withdraw	11.5	LYD	سحب بواسطة الإدارة	2025-09-03 12:14:18.298779	REF-1756901658287-EZ9OM0
1190	4	withdraw	29.4	USD	سحب بواسطة الإدارة	2025-09-03 12:14:29.039029	REF-1756901669028-KKWFIE
1191	4	commission_withdrawal	36.45	USD	سحب من حساب العمولات: 36.45 	2025-09-03 12:15:52.575876	REF-1756901752563-ZPLAL8
1192	4	withdraw	36.45	USD	سحب بواسطة الإدارة	2025-09-03 12:16:23.131104	REF-1756901783119-G3BV8U
1435	4	withdraw	2.55	USD	سحب بواسطة الإدارة	2025-09-06 15:56:24.105003	REF-1757174184095-KAQY75
1266	4	commission_withdrawal	25	USD	سحب من حساب العمولات: 22\n	2025-09-03 14:34:17.247188	REF-1756910057235-GPN95O
1267	4	commission_withdrawal	5.1	LYD	سحب من حساب العمولات: 4444	2025-09-03 14:34:28.859249	REF-1756910068848-0B1F27
1272	4	commission_withdrawal	3	USD	سحب من حساب العمولات: 1110\n	2025-09-03 14:38:45.301728	REF-1756910325290-7I70BU
1282	4	commission_withdrawal	4	USD	سحب من حساب العمولات: 222\n	2025-09-03 14:49:12.239951	REF-1756910952229-F8IWXZ
1291	4	commission_withdrawal	3.46	USD	سحب من حساب العمولات: 444	2025-09-03 15:36:50.890974	REF-1756913810880-IE120Z
1302	4	commission_withdrawal	16.2	LYD	سحب من حساب العمولات: 55	2025-09-03 15:46:24.094182	REF-1756914384083-WTL99F
1303	4	commission_withdrawal	5	USD	سحب من حساب العمولات: 55	2025-09-03 15:46:31.826413	REF-1756914391812-N8WN1N
1309	4	commission_withdrawal	2.55	USD	سحب من حساب العمولات: 2.55	2025-09-03 15:55:54.960023	REF-1756914954947-F7UWUO
1310	4	commission_withdrawal	1.1	LYD	سحب من حساب العمولات: 1.10	2025-09-03 15:56:08.319602	REF-1756914968309-75YJMV
1321	4	commission_withdrawal	10	USD	سحب من حساب العمولات: 10	2025-09-03 16:02:59.991989	REF-1756915379972-O0SGVG
1322	4	commission_withdrawal	4.1	LYD	سحب من حساب العمولات: 44	2025-09-03 16:03:09.569344	REF-1756915389558-BJIVMW
1329	4	commission_withdrawal	12	USD	سحب من حساب العمولات: 12\n	2025-09-03 16:09:52.226981	REF-1756915792216-HB453H
1338	4	commission_withdrawal	6	USD	سحب من حساب العمولات: 66	2025-09-03 16:47:25.530436	REF-1756918045519-A07WXC
1500	4	commission_withdrawal	6	USD	سحب من حساب العمولات: 111	2025-09-11 18:04:41.7046	REF-1757613881692-FJCKY9
1343	4	commission_withdrawal	5	USD	سحب من حساب العمولات: 55	2025-09-03 16:53:50.354339	REF-1756918430341-5OA6BF
1348	4	commission_withdrawal	3.2	USD	سحب من حساب العمولات: 444	2025-09-03 16:57:22.068234	REF-1756918642056-LESZ6W
1358	4	commission_withdrawal	3.2	USD	سحب من حساب العمولات: 55	2025-09-03 17:01:05.862614	REF-1756918865851-72CIRW
1362	4	commission_withdrawal	1.2	USD	سحب من حساب العمولات: 22	2025-09-03 17:05:22.309009	REF-1756919122297-1UEHDK
1367	4	commission_withdrawal	1.2	USD	سحب من حساب العمولات: 44	2025-09-03 17:12:14.706214	REF-1756919534694-LCD2SP
1371	4	commission_withdrawal	1.2	USD	سحب من حساب العمولات: 655\n	2025-09-03 17:13:11.152461	REF-1756919591141-UVVG77
1376	4	commission_withdrawal	1.2	USD	سحب من حساب العمولات: 5454	2025-09-03 17:14:45.325062	REF-1756919685314-XPT4XD
1439	4	commission_withdrawal	17.55	USD	سحب من حساب العمولات: 222\n	2025-09-06 16:02:27.085015	REF-1757174547073-2Y739V
1478	4	commission_withdrawal	11.1	LYD	سحب من حساب العمولات: 11.10 	2025-09-11 17:07:14.18844	REF-1757610434176-K1NT2C
1388	4	commission_withdrawal	5.1	USD	سحب من حساب العمولات: 111	2025-09-03 17:26:28.528102	REF-1756920388516-VWR8FC
1405	4	commission_withdrawal	11.55	USD	سحب من حساب العمولات: 44	2025-09-03 17:32:46.831552	REF-1756920766819-JMW2JY
1410	4	commission_withdrawal	2.55	USD	سحب من حساب العمولات: 88	2025-09-03 17:33:51.185381	REF-1756920831174-RZEDNL
\.


--
-- Data for Name: transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transfers (id, sender_id, receiver_id, amount, commission, currency, note, created_at, reference_number, transfer_kind, destination_country) FROM stdin;
\.


--
-- Data for Name: upgrade_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.upgrade_requests (id, user_id, full_name, phone, city, commission_rate, message, status, created_at, reviewed_at, review_notes, request_type, requested_limits, documents, decided_at, decided_by, country_id, city_id, city_name_manual) FROM stdin;
78	91	اشرف المحمودي	+1 90000000	المملكة العربية السعودية - الرياض	\N		approved	2025-09-14 10:59:52.12704	\N	تمت الموافقة على الطلب	external_transfer	{"daily": 5000, "monthly": 50000, "currencies": ["USD"]}	\N	2025-09-14 11:00:02.634	4	\N	\N	\N
77	90	عدي العراقي	+964 990000000	العراق - بغداد	\N		approved	2025-09-14 10:59:45.068355	\N	تمت الموافقة على الطلب	external_transfer	{"daily": 5000, "monthly": 50000, "currencies": ["USD"]}	\N	2025-09-14 11:00:05.154	4	\N	\N	\N
79	89	محمد الدمنهوري	+20 990000000	مصر - القاهرة	\N		approved	2025-09-14 13:20:13.6347	\N	تمت الموافقة على الطلب	external_transfer	{"daily": 5000, "monthly": 50000, "currencies": ["USD"]}	\N	2025-09-14 13:20:27.529	4	\N	\N	\N
88	101	رمزي ابراهيم	+218 920000001	أجدابيا	\N		approved	2025-09-14 16:47:48.139789	\N	\N	agent_upgrade	\N	\N	\N	\N	\N	\N	\N
89	101	رمزي ابراهيم	+218 920000001	ليبيا - أجدابيا	\N		approved	2025-09-14 16:48:20.748072	\N	تمت الموافقة على الطلب	external_transfer	{"daily": 5000, "monthly": 50000, "currencies": ["USD"]}	\N	2025-09-14 16:48:48.907	4	\N	\N	\N
90	102	سعد مسعود	+218 920002315	البريقة	\N		approved	2025-09-14 16:55:04.829723	\N	\N	agent_upgrade	\N	\N	\N	\N	\N	\N	\N
91	102	سعد مسعود	+218 920002315	ليبيا - البريقة	\N		approved	2025-09-14 16:55:12.317316	\N	تمت الموافقة على الطلب	external_transfer	{"daily": 5000, "monthly": 50000, "currencies": ["USD"]}	\N	2025-09-14 16:55:24.804	4	\N	\N	\N
51	4	محمد إبراهيم	123456789	تونس	\N	طلب تفعيل التحويل الخارجي لتونس	approved	2025-09-03 18:31:11.333493	\N	\N	external_transfer	\N	\N	2025-09-03 18:39:22.544556	4	2	\N	تونس العاصمة
\.


--
-- Data for Name: user_2fa; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_2fa (id, user_id, is_enabled, secret, backup_codes, last_used_at, created_at, updated_at) FROM stdin;
1	101	f	FBHTS5JEF43FASLENE6CIZ2SNNCEGQKX	{A6K6SW6A,9X5IZ326,L5TVB2B6,5L1HGLBA,VZ0W5EM5,KLXWZH0T,9U0APDCL,6OLCOCEH,92CSH4IY,GDT45TIA}	2025-09-16 18:00:49.353	2025-09-16 14:30:24.70649	2025-09-17 11:51:21.711
2	102	t	OJZE6Y33GBTCQSKVPJXG6VKGMYXDGOJI	{26UXRKRW,9K38FBCU,5VIHGD82,W9CZB07H,JY3OL8VI,PG4IZGP4,OG9S8FXU,3JKIO7VV,FFX7RZQ3,VN385N8Z}	2025-09-20 11:57:51.035	2025-09-16 16:54:07.651254	2025-09-16 16:54:37.386
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_badges (id, user_id, badge_type_id, earned_at, is_visible, notification_sent) FROM stdin;
1	4	7	2025-08-31 16:39:20.382	t	f
2	4	8	2025-08-31 16:47:31.319	t	f
4	4	5	2025-08-31 17:16:48.076	t	f
81	4	6	2025-09-13 18:47:43.852	t	f
83	89	7	2025-09-14 10:41:59.663	t	f
84	90	7	2025-09-14 10:48:32.779	t	f
85	91	7	2025-09-14 10:56:44.04	t	f
86	90	8	2025-09-14 11:00:19.34	t	f
87	89	8	2025-09-14 11:04:19.477	t	f
88	91	8	2025-09-14 11:07:55.264	t	f
90	91	5	2025-09-14 13:37:53.409	t	f
91	90	5	2025-09-14 13:41:01.287	t	f
92	89	5	2025-09-14 13:42:27.259	t	f
105	101	7	2025-09-14 16:46:51.058	t	f
106	101	8	2025-09-14 16:49:03.947	t	f
107	102	7	2025-09-14 16:53:55.618	t	f
108	102	8	2025-09-14 16:55:43.382	t	f
109	101	1	2025-09-14 17:05:32.086	t	f
110	102	5	2025-09-15 11:59:08.532	t	f
111	89	1	2025-09-15 14:25:31.565	t	f
112	102	1	2025-09-15 15:37:36.733	t	f
113	101	5	2025-09-18 16:15:52.703	t	f
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_notifications (id, user_id, title, body, type, is_read, created_at) FROM stdin;
989	102	تمت الموافقة على طلب التحويل الخارجي	تم تفعيل صلاحية التحويل الخارجي وإنشاء مكتبك التلقائي	success	t	2025-09-14 16:55:25.037733
1001	102	استلام تحويل داخلي	تم استلام 1000 LYD من محمد الدمنهوري	success	t	2025-09-15 14:25:31.318501
1003	102	تم إرسال التحويل بنجاح	تم تحويل 100 LYD إلى رمزي ابراهيم بنجاح	success	t	2025-09-15 15:37:36.356956
983	101	تمت الموافقة على طلب توثيق الحساب	تهانينا! تمت الموافقة على طلب توثيق حسابك وأصبح حسابك موثقًا الآن.	success	t	2025-09-14 16:47:38.945274
986	101	🎉 إحالة جديدة مُسجلة	تم تسجيل سعد مسعود عبر رمز الإحالة الخاص بك. ستحصل على مكافآت عند إجراء أول معاملة.	info	t	2025-09-14 16:53:54.315
998	101	🎁 مكافأة إحالة من عمولة النظام	حصلت على 0.45 USD بعد خصم رسوم النظام (10.0%) عبر سعد مسعود	success	t	2025-09-15 14:06:30.792367
1002	101	🎁 مكافأة إحالة من عمولة النظام	حصلت على 0.90 LYD بعد خصم رسوم النظام (10.0%) عبر سعد مسعود	success	t	2025-09-15 15:37:36.229526
1004	101	استلام تحويل داخلي	تم استلام 100 LYD من سعد مسعود	success	t	2025-09-15 15:37:36.414394
1010	101	🎁 مكافأة إحالة من عمولة النظام	حصلت على 0.45 USD بعد خصم رسوم النظام (10.0%) عبر سعد مسعود	success	f	2025-09-17 20:43:07.570523
1011	90	إضافة إلى مجموعة محادثة	تمت إضافتك إلى مجموعة 101	info	t	2025-09-19 16:22:54.710831
1015	90	إضافة إلى مجموعة محادثة	تمت إضافتك إلى مجموعة 101	info	t	2025-09-19 18:27:36.262829
1016	90	إضافة إلى مجموعة محادثة	تمت إضافتك إلى مجموعة 101	info	t	2025-09-20 12:09:23.404864
1021	101	🎁 مكافأة إحالة من عمولة النظام	حصلت على 0.90 LYD بعد خصم رسوم النظام (10.0%) عبر سعد مسعود	success	f	2025-09-24 12:58:59.250609
1022	102	تم إرسال التحويل بنجاح	تم تحويل 55 LYD إلى رمزي ابراهيم بنجاح	success	f	2025-09-24 12:58:59.353351
1023	101	استلام تحويل داخلي	تم استلام 55 LYD من سعد مسعود	success	f	2025-09-24 12:58:59.400021
1025	101	اندار	تنبيه على الحظر	info	f	2025-09-24 15:37:17.952304
1026	101	تم شحن رصيدك	تم إضافة 10000 USD إلى رصيدك بواسطة الإدارة	success	f	2025-09-29 20:11:35.970569
1027	4	تم شحن رصيدك	تم إضافة 100000 LYD إلى رصيدك بواسطة الإدارة	success	f	2025-09-30 13:01:41.137502
956	91	تمت الموافقة على طلب التحويل الخارجي	تم تفعيل صلاحية التحويل الخارجي وإنشاء مكتبك التلقائي	success	f	2025-09-14 11:00:02.878659
980	91	تم شحن رصيدك	تم إضافة 25000 LYD إلى رصيدك بواسطة الإدارة	success	f	2025-09-14 16:33:04.645818
951	89	🎉 إحالة جديدة مُسجلة	تم تسجيل عدي العراقي عبر رمز الإحالة الخاص بك. ستحصل على مكافآت عند إجراء أول معاملة.	info	t	2025-09-14 10:48:31.886029
958	89	تمت الموافقة على طلب التحويل الخارجي	تم تفعيل صلاحية التحويل الخارجي وإنشاء مكتبك التلقائي	success	t	2025-09-14 13:20:27.769214
962	89	🎉 إحالة جديدة مُسجلة	تم تسجيل محمد فتحي عبر رمز الإحالة الخاص بك. ستحصل على مكافآت عند إجراء أول معاملة.	info	t	2025-09-14 13:56:56.276434
994	89	🎁 مكافأة إحالة من عمولة النظام	حصلت على 0.45 USD بعد خصم رسوم النظام (10.0%) عبر عدي العراقي	success	t	2025-09-14 16:59:23.431686
1000	89	تم إرسال التحويل بنجاح	تم تحويل 1000 LYD إلى سعد مسعود بنجاح	success	f	2025-09-15 14:25:31.269072
712	4	تم سحب رصيد من حسابك	تم سحب 80000 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-01 09:47:30.866015
713	4	تم سحب رصيد من حسابك	تم سحب 811950 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-01 09:47:50.730267
714	4	تم سحب رصيد من حسابك	تم سحب 100050 USD من رصيدك بواسطة الإدارة	error	t	2025-09-01 09:48:38.134422
731	4	تم سحب رصيد من حسابك	تم سحب 223.5 USD من رصيدك بواسطة الإدارة	error	t	2025-09-02 05:09:42.441701
732	4	تم سحب رصيد من حسابك	تم سحب 351.1 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-02 05:09:57.941224
733	4	تم سحب رصيد من حسابك	تم سحب 2 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-02 05:10:11.173709
734	4	تم سحب رصيد من حسابك	تم سحب 22 USD من رصيدك بواسطة الإدارة	error	t	2025-09-02 05:11:40.177786
652	4	تحديث بيانات الحساب	تم تحديث بيانات حسابك بواسطة المسؤول	info	t	2025-08-29 17:22:32.267152
670	4	تم شحن رصيدك	تم إضافة 1000000 LYD إلى رصيدك بواسطة الإدارة	success	t	2025-08-30 18:47:29.160827
1012	4	إضافة إلى مجموعة محادثة	تمت إضافتك إلى مجموعة بيع العملة	info	f	2025-09-19 16:28:40.709074
952	90	🎉 إحالة جديدة مُسجلة	تم تسجيل اشرف المحمودي عبر رمز الإحالة الخاص بك. ستحصل على مكافآت عند إجراء أول معاملة.	info	t	2025-09-14 10:56:43.102813
955	90	تمت الموافقة على طلب توثيق الحساب	تهانينا! تمت الموافقة على طلب توثيق حسابك وأصبح حسابك موثقًا الآن.	success	t	2025-09-14 10:59:27.011291
957	90	تمت الموافقة على طلب التحويل الخارجي	تم تفعيل صلاحية التحويل الخارجي وإنشاء مكتبك التلقائي	success	t	2025-09-14 11:00:05.389014
893	4	رسالة خاصة جديدة	لديك رسالة جديدة من salem jedi	info	t	2025-09-11 11:18:08.822939
896	4	رسالة خاصة جديدة	لديك رسالة جديدة من salem jedi	info	t	2025-09-11 15:48:16.876055
978	90	تم شحن رصيدك	تم إضافة 25000 LYD إلى رصيدك بواسطة الإدارة	success	t	2025-09-14 16:32:47.016845
959	91	🎉 إحالة جديدة مُسجلة	تم تسجيل مراد الكويتين عبر رمز الإحالة الخاص بك. ستحصل على مكافآت عند إجراء أول معاملة.	info	f	2025-09-14 13:24:53.558675
979	90	تم شحن رصيدك	تم إضافة 25000 USD إلى رصيدك بواسطة الإدارة	success	t	2025-09-14 16:32:56.128038
1017	101	إضافة إلى مجموعة محادثة	تمت إضافتك إلى مجموعة 1020	info	f	2025-09-20 13:05:45.59954
1018	102	إضافة إلى مجموعة محادثة	تمت إضافتك إلى مجموعة 1020	info	f	2025-09-20 13:05:53.31547
1024	101	🎁 مكافأة إحالة من عمولة النظام	حصلت على 0.45 USD بعد خصم رسوم النظام (10.0%) عبر سعد مسعود	success	f	2025-09-24 13:04:12.86394
1028	4	تم شحن رصيدك	تم إضافة 100000 USD إلى رصيدك بواسطة الإدارة	success	f	2025-09-30 13:01:51.745244
953	89	تمت الموافقة على طلب توثيق الحساب	تهانينا! تمت الموافقة على طلب توثيق حسابك وأصبح حسابك موثقًا الآن.	success	t	2025-09-14 10:57:58.89462
976	89	تم شحن رصيدك	تم إضافة 25000 LYD إلى رصيدك بواسطة الإدارة	success	t	2025-09-14 16:32:29.385904
999	89	🎁 مكافأة إحالة من عمولة النظام	حصلت على 0.45 USD بعد خصم رسوم النظام (10.0%) عبر عدي العراقي	success	f	2025-09-15 14:13:29.443224
671	4	تم شحن رصيدك	تم إضافة 50 USD إلى رصيدك بواسطة الإدارة	success	t	2025-08-30 18:47:41.639487
672	4	تم تعطيل حسابك	تم تعطيل حسابك من قبل الإدارة، يرجى التواصل مع الدعم الفني	error	t	2025-08-30 21:32:48.717395
679	4	تم شحن رصيدك	تم إضافة 500 LYD إلى رصيدك بواسطة الإدارة	success	t	2025-08-31 11:59:59.901467
691	4	استلام تحويل داخلي	تم استلام 500 LYD من معتز محمد	success	t	2025-08-31 18:48:37.261154
710	4	تم سحب رصيد من حسابك	تم سحب 100050 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-01 09:46:48.326746
711	4	تم سحب رصيد من حسابك	تم سحب 99000 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-01 09:47:05.875982
975	4	تم سحب رصيد من حسابك	تم سحب 14.55 USD من رصيدك بواسطة الإدارة	error	t	2025-09-14 16:32:19.740827
918	4	تم سحب رصيد من حسابك	تم سحب 11.1 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-11 17:07:37.471965
987	102	تمت الموافقة على طلب توثيق الحساب	تهانينا! تمت الموافقة على طلب توثيق حسابك وأصبح حسابك موثقًا الآن.	success	t	2025-09-14 16:55:01.005283
990	102	تم شحن رصيدك	تم إضافة 25000 LYD إلى رصيدك بواسطة الإدارة	success	t	2025-09-14 16:55:49.921852
991	102	تم شحن رصيدك	تم إضافة 25000 USD إلى رصيدك بواسطة الإدارة	success	t	2025-09-14 16:55:58.087861
997	102	استلام تحويل داخلي	تم استلام 100 LYD من رمزي ابراهيم	success	t	2025-09-14 17:05:31.817601
984	101	تمت الموافقة على طلب الترقية	تهانينا! تمت الموافقة على طلب ترقية حسابك إلى مكتب صرافة وتم إنشاء مكتبك تلقائياً. يمكنك الآن استخدام ميزات مكاتب الصرافة والتحويل بين المدن.	success	t	2025-09-14 16:48:06.53325
993	101	تم شحن رصيدك	تم إضافة 25000 USD إلى رصيدك بواسطة الإدارة	success	t	2025-09-14 16:56:13.423011
995	101	🎁 مكافأة إحالة من عمولة النظام	حصلت على 0.90 LYD بعد خصم رسوم النظام (10.0%) عبر سعد مسعود	success	t	2025-09-14 17:04:02.306785
996	101	تم إرسال التحويل بنجاح	تم تحويل 100 LYD إلى سعد مسعود بنجاح	success	t	2025-09-14 17:05:31.768064
1013	102	إضافة إلى مجموعة محادثة	تمت إضافتك إلى مجموعة 101	info	f	2025-09-19 16:58:54.351238
1019	101	إضافة إلى مجموعة محادثة	تمت إضافتك إلى مجموعة 303	info	f	2025-09-20 13:08:28.838603
1020	102	إضافة إلى مجموعة محادثة	تمت إضافتك إلى مجموعة 303	info	f	2025-09-20 13:08:35.18526
988	102	تمت الموافقة على طلب الترقية	تهانينا! تمت الموافقة على طلب ترقية حسابك إلى مكتب صرافة وتم إنشاء مكتبك تلقائياً. يمكنك الآن استخدام ميزات مكاتب الصرافة والتحويل بين المدن.	success	t	2025-09-14 16:55:21.729409
985	101	تمت الموافقة على طلب التحويل الخارجي	تم تفعيل صلاحية التحويل الخارجي وإنشاء مكتبك التلقائي	success	t	2025-09-14 16:48:49.146633
954	91	تمت الموافقة على طلب توثيق الحساب	تهانينا! تمت الموافقة على طلب توثيق حسابك وأصبح حسابك موثقًا الآن.	success	f	2025-09-14 10:59:24.662997
981	91	تم شحن رصيدك	تم إضافة 25000 USD إلى رصيدك بواسطة الإدارة	success	f	2025-09-14 16:33:12.504682
977	89	تم شحن رصيدك	تم إضافة 25000 USD إلى رصيدك بواسطة الإدارة	success	t	2025-09-14 16:32:39.812558
982	89	🎁 مكافأة إحالة من عمولة النظام	حصلت على 0.45 USD بعد خصم رسوم النظام (10.0%) عبر عدي العراقي	success	t	2025-09-14 16:42:32.445434
894	4	رسالة خاصة جديدة	لديك رسالة جديدة من salem jedi	info	t	2025-09-11 15:47:40.187086
895	4	رسالة خاصة جديدة	لديك رسالة جديدة من salem jedi	info	t	2025-09-11 15:47:55.902334
898	4	رسالة خاصة جديدة	لديك رسالة جديدة من salem jedi	info	t	2025-09-11 16:00:15.134185
908	4	تم سحب رصيد من حسابك	تم سحب 8.55 USD من رصيدك بواسطة الإدارة	error	t	2025-09-11 16:41:16.615007
931	4	تم سحب رصيد من حسابك	تم سحب 9200 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-13 14:28:45.974169
932	4	تم سحب رصيد من حسابك	تم سحب 409 USD من رصيدك بواسطة الإدارة	error	t	2025-09-13 14:28:57.906605
922	4	تم شحن رصيدك	تم إضافة 10000 LYD إلى رصيدك بواسطة الإدارة	success	t	2025-09-11 21:22:05.20092
891	4	رسالة خاصة جديدة	لديك رسالة جديدة من salem jedi	info	t	2025-09-11 11:07:14.379301
907	4	تم سحب رصيد من حسابك	تم سحب 15.1 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-11 16:41:02.660177
974	4	تم سحب رصيد من حسابك	تم سحب 17.2 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-14 16:32:05.374632
775	4	تم سحب رصيد من حسابك	تم سحب 11.5 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-03 12:14:18.367971
776	4	تم سحب رصيد من حسابك	تم سحب 29.4 USD من رصيدك بواسطة الإدارة	error	t	2025-09-03 12:14:29.108781
777	4	تم سحب رصيد من حسابك	تم سحب 36.45 USD من رصيدك بواسطة الإدارة	error	t	2025-09-03 12:16:23.20171
850	4	تم سحب رصيد من حسابك	تم سحب 106.41 USD من رصيدك بواسطة الإدارة	error	t	2025-09-06 15:41:17.9026
851	4	تم سحب رصيد من حسابك	تم سحب 26.5 LYD من رصيدك بواسطة الإدارة	error	t	2025-09-06 15:41:28.69385
852	4	تم سحب رصيد من حسابك	تم سحب 2.55 USD من رصيدك بواسطة الإدارة	error	t	2025-09-06 15:56:24.167128
992	101	تم شحن رصيدك	تم إضافة 25000 LYD إلى رصيدك بواسطة الإدارة	success	t	2025-09-14 16:56:05.734848
854	4	تم سحب رصيد من حسابك	تم سحب 17.55 USD من رصيدك بواسطة الإدارة	error	t	2025-09-06 16:03:20.782682
1006	102	استلام تحويل داخلي	تم استلام 1000 LYD من رمزي ابراهيم	success	t	2025-09-15 16:50:15.819621
1008	102	تم إرسال التحويل بنجاح	تم تحويل 885 LYD إلى رمزي ابراهيم بنجاح	success	t	2025-09-15 20:05:54.112739
1005	101	تم إرسال التحويل بنجاح	تم تحويل 1000 LYD إلى سعد مسعود بنجاح	success	t	2025-09-15 16:50:15.769214
1007	101	🎁 مكافأة إحالة من عمولة النظام	حصلت على 0.90 LYD بعد خصم رسوم النظام (10.0%) عبر سعد مسعود	success	t	2025-09-15 20:05:54.009007
1009	101	استلام تحويل داخلي	تم استلام 885 LYD من سعد مسعود	success	t	2025-09-15 20:05:54.162435
1014	4	إضافة إلى مجموعة محادثة	تمت إضافتك إلى مجموعة 101	info	f	2025-09-19 17:53:53.990807
\.


--
-- Data for Name: user_points; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_points (id, user_id, total_points, available_points, level, streak_days, last_activity_date, created_at, updated_at) FROM stdin;
33	91	140	140	1	0	2025-09-14 17:06:28.637	2025-09-14 10:56:43.599181	2025-09-14 17:06:28.722
31	89	640	640	1	0	2025-09-15 14:36:02.689	2025-09-14 10:41:59.221285	2025-09-15 14:36:02.779
32	90	185	185	1	0	2025-09-15 14:42:37.358	2025-09-14 10:48:32.382839	2025-09-15 14:42:37.442
44	102	215	215	1	0	2025-09-15 14:09:30.971	2025-09-14 16:53:55.193727	2025-09-24 13:04:13.856
43	101	105	105	1	1	2025-09-29 15:25:48.765	2025-09-14 16:46:50.59483	2025-09-29 20:14:39.651
2	4	4475	4475	5	1	2025-09-30 13:01:20.698	2025-08-30 20:57:44.664135	2025-09-30 13:01:20.726
\.


--
-- Data for Name: user_receive_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_receive_settings (id, user_id, country_id, commission_rate, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_rewards; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_rewards (id, user_id, reward_id, points_spent, status, redemption_code, used_at, expires_at, redeemed_at) FROM stdin;
\.


--
-- Data for Name: user_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_settings (id, user_id, language, theme, timezone, base_currency, created_at, updated_at, notifications) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, full_name, email, phone, password, type, created_at, city, commission_rate, countries_supported, verified, active, account_number, avatar_url, ext_transfer_enabled, ext_daily_limit, ext_monthly_limit, ext_allowed_currencies, ext_allowed_countries, country_id, city_id, country_name, city_name, admin_level, can_manage_users, can_manage_market, can_manage_chat, can_manage_internal_transfers, can_manage_external_transfers, can_manage_new_accounts, can_manage_security, can_manage_support, can_manage_reports, can_manage_settings, referral_code, referred_by, referred_at, office_name, office_address) FROM stdin;
4	مدير النظام	ss73ss73ss73@gmail.com	0910000000	$2b$05$B7uIqUJL.KPRwaKDt6um6u4fRuRe9b3sa6fyvG2ep41pZq9MdA6.W	admin	2025-05-19 14:39:54.649	طرابلس	1	\N	f	t	33003001	\N	f	0.0000	0.0000	{}	{}	1	\N	غير محدد	غير محدد	2	t	t	t	t	t	t	t	t	t	t	23B1527F	\N	\N	مدير النظام	\N
89	محمد الدمنهوري	z5@z5.com	+20 990000000	738661240a93d47c2a230b186b37c4f593fe8068b1de3e8f288e4674557a76da99c62c5437136dca9e17e0cea61abaf15106eb83047f123259f76c125f68701b.f1d88449e2274d1400b57aa857909202	agent	2025-09-14 10:41:58.696983	\N	1	\N	t	t	44003001	\N	t	5000.0000	50000.0000	{USD}	{CM,CV,CF,TD,KM,CD,DJ,GQ,ER,SZ,ET,GA,GM,GH,GN,GW,CI,KE,LS,LR,MG,MW,ML,MR,MU,MZ,NA,NE,NG,RW,ST,SN,SC,SL,SO,ZA,SS,TZ,TG,UG,ZM,ZW,AF,AM,AZ,BD,BT,BN,KH,GE,ID,IR,BO,CL,CO,CR,AL,AT,BY,BE,BA,BG,HR,CZ,DK,EE,FI,GR,HU,IS,IE,LV,LT,LU,MT,MD,MC,ME,NL,MK,NO,PL,PT,RO,SM,RS,SK,SI,SE,CH,UA,VA,CU,DO,EC,SV,GT,HT,HN,JM,MX,NI,PA,PY,PE,UY,LY,US,TR,AE,EG,TN,SA,JO,QA,KW,OM,BH,MA,DZ,SD,YE,SY,LB,IQ,PS,GB,DE,FR,IT,ES,CA,AU,JP,CN,IN,RU,BR,AO,BJ,BW,BF,BI,AR,VE,KZ,KP,KR,KG,LA,MY,MV,MN,MM,NP,PK,PH,SG,LK,TW,TJ,TH,TL,TM,UZ,VN}	26	151	مصر	القاهرة	0	f	f	f	f	f	f	f	f	f	f	WER7O1G5	\N	\N	الدمنهوري للحوالات	\N
90	عدي العراقي	z6@z6.com	+964 990000000	bf48ee19114d2c3aaf88950cfd74c0dc001c2d7d3f6e6114a27bf1aa6d3748555b1520cba978d829a7e52dda30fbca958adfbd45a043f67295fee24af28bf754.07aee234ff8b19456b081085cf5c2e9e	agent	2025-09-14 10:48:31.815898	\N	1	\N	t	t	44003002	\N	t	5000.0000	50000.0000	{USD}	{CM,CV,CF,TD,KM,CD,DJ,GQ,ER,SZ,ET,GA,GM,GH,GN,GW,CI,KE,LS,LR,MG,MW,ML,MR,MU,MZ,NA,NE,NG,RW,ST,SN,SC,SL,SO,ZA,SS,TZ,TG,UG,ZM,ZW,AF,AM,AZ,BD,BT,BN,KH,GE,ID,IR,BO,CL,CO,CR,AL,AT,BY,BE,BA,BG,HR,CZ,DK,EE,FI,GR,HU,IS,IE,LV,LT,LU,MT,MD,MC,ME,NL,MK,NO,PL,PT,RO,SM,RS,SK,SI,SE,CH,UA,VA,CU,DO,EC,SV,GT,HT,HN,JM,MX,NI,PA,PY,PE,UY,LY,US,TR,AE,EG,TN,SA,JO,QA,KW,OM,BH,MA,DZ,SD,YE,SY,LB,IQ,PS,GB,DE,FR,IT,ES,CA,AU,JP,CN,IN,RU,BR,AO,BJ,BW,BF,BI,AR,VE,KZ,KP,KR,KG,LA,MY,MV,MN,MM,NP,PK,PH,SG,LK,TW,TJ,TH,TL,TM,UZ,VN}	40	165	العراق	بغداد	0	f	f	f	f	f	f	f	f	f	f	PVQ6TPGC	89	\N	بغداد للحوالات	\N
91	اشرف المحمودي	z7@z7.com	+1 90000000	50226906f7e8bd8f4beaaa6fe11d4d9f728ef1dd6568501db477de29f495c010472dbb6151442e56215803b07c30a34bf90d4c4cb51287557e30810ce57dcf3d.e633f4713c98d72aa61c45b27a959d30	agent	2025-09-14 10:56:43.036471	\N	1	\N	t	t	44003003	\N	t	5000.0000	50000.0000	{USD}	{CM,CV,CF,TD,KM,CD,DJ,GQ,ER,SZ,ET,GA,GM,GH,GN,GW,CI,KE,LS,LR,MG,MW,ML,MR,MU,MZ,NA,NE,NG,RW,ST,SN,SC,SL,SO,ZA,SS,TZ,TG,UG,ZM,ZW,AF,AM,AZ,BD,BT,BN,KH,GE,ID,IR,BO,CL,CO,CR,AL,AT,BY,BE,BA,BG,HR,CZ,DK,EE,FI,GR,HU,IS,IE,LV,LT,LU,MT,MD,MC,ME,NL,MK,NO,PL,PT,RO,SM,RS,SK,SI,SE,CH,UA,VA,CU,DO,EC,SV,GT,HT,HN,JM,MX,NI,PA,PY,PE,UY,LY,US,TR,AE,EG,TN,SA,JO,QA,KW,OM,BH,MA,DZ,SD,YE,SY,LB,IQ,PS,GB,DE,FR,IT,ES,CA,AU,JP,CN,IN,RU,BR,AO,BJ,BW,BF,BI,AR,VE,KZ,KP,KR,KG,LA,MY,MV,MN,MM,NP,PK,PH,SG,LK,TW,TJ,TH,TL,TM,UZ,VN}	28	153	المملكة العربية السعودية	الرياض	0	f	f	f	f	f	f	f	f	f	f	05QY2S3K	90	\N	رياضي للحوالات	\N
102	سعد مسعود	z9@z9.com	+218 920002315	222b11d115b680d6bae3e886b22ec6a8abdbaa78981115a522eb47c0703a33ad88ab75b0fe03018447a4d48cc3397726e30064f82a5cbb46645f7c9f0921baa2.5df459783fea7865e6aa9184e63d9f79	agent	2025-09-14 16:53:54.244859	البريقة	\N	\N	t	t	33003003	\N	t	5000.0000	50000.0000	{USD}	{CM,CV,CF,TD,KM,CD,DJ,GQ,ER,SZ,ET,GA,GM,GH,GN,GW,CI,KE,LS,LR,MG,MW,ML,MR,MU,MZ,NA,NE,NG,RW,ST,SN,SC,SL,SO,ZA,SS,TZ,TG,UG,ZM,ZW,AF,AM,AZ,BD,BT,BN,KH,GE,ID,IR,BO,CL,CO,CR,AL,AT,BY,BE,BA,BG,HR,CZ,DK,EE,FI,GR,HU,IS,IE,LV,LT,LU,MT,MD,MC,ME,NL,MK,NO,PL,PT,RO,SM,RS,SK,SI,SE,CH,UA,VA,CU,DO,EC,SV,GT,HT,HN,JM,MX,NI,PA,PY,PE,UY,LY,US,TR,AE,EG,TN,SA,JO,QA,KW,OM,BH,MA,DZ,SD,YE,SY,LB,IQ,PS,GB,DE,FR,IT,ES,CA,AU,JP,CN,IN,RU,BR,AO,BJ,BW,BF,BI,AR,VE,KZ,KP,KR,KG,LA,MY,MV,MN,MM,NP,PK,PH,SG,LK,TW,TJ,TH,TL,TM,UZ,VN}	1	195	ليبيا	البريقة	0	f	f	f	f	f	f	f	f	f	f	Z20RY2NK	101	\N	الوفاء	\N
101	رمزي ابراهيم	z8@z8.com	+218 920000001	$2b$12$.H6gmTOA3d3hILERiT7.4uuV1RTOQhPNN8tJb4HwXonikK47vmgl.	agent	2025-09-14 16:46:49.774838	أجدابيا	\N	\N	t	t	33003002	\N	t	2000.0000	3000.0000	{USD}	{CM,CV,CF,TD,KM,CD,DJ,GQ,ER,SZ,ET,GA,GM,GH,GN,GW,CI,KE,LS,LR,MG,MW,ML,MR,MU,MZ,NA,NE,NG,RW,ST,SN,SC,SL,SO,ZA,SS,TZ,TG,UG,ZM,ZW,AF,AM,AZ,BD,BT,BN,KH,GE,ID,IR,BO,CL,CO,CR,AL,AT,BY,BE,BA,BG,HR,CZ,DK,EE,FI,GR,HU,IS,IE,LV,LT,LU,MT,MD,MC,ME,NL,MK,NO,PL,PT,RO,SM,RS,SK,SI,SE,CH,UA,VA,CU,DO,EC,SV,GT,HT,HN,JM,MX,NI,PA,PY,PE,UY,LY,US,TR,AE,EG,TN,SA,JO,QA,KW,OM,BH,MA,DZ,SD,YE,SY,LB,IQ,PS,GB,DE,FR,IT,ES,CA,AU,JP,CN,IN,RU,BR,AO,BJ,BW,BF,BI,AR,VE,KZ,KP,KR,KG,LA,MY,MV,MN,MM,NP,PK,PH,SG,LK,TW,TJ,TH,TL,TM,UZ,VN}	1	184	ليبيا	أجدابيا	0	f	f	f	f	f	f	f	f	f	f	K4GHBI6V	\N	\N	ريماس للصرافة	\N
\.


--
-- Data for Name: verification_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.verification_requests (id, user_id, id_photo_url, proof_of_address_url, status, notes, created_at, updated_at) FROM stdin;
64	102	/uploads/verification/id/102_1757868884771.jpg	/uploads/verification/address/102_1757868885459.jpg	approved	\N	2025-09-14 16:54:45.690203	2025-09-14 16:55:00.925
52	89	/uploads/verification/id/89_1757847472779.png	/uploads/verification/address/89_1757847473310.png	approved	\N	2025-09-14 10:57:53.516035	2025-09-14 10:57:58.817
54	91	/uploads/verification/id/91_1757847551383.jpg	/uploads/verification/address/91_1757847551757.jpg	approved	\N	2025-09-14 10:59:12.143797	2025-09-14 10:59:24.591
53	90	/uploads/verification/id/90_1757847518715.jpg	/uploads/verification/address/90_1757847519366.jpg	approved	\N	2025-09-14 10:58:39.473682	2025-09-14 10:59:26.929
63	101	/uploads/verification/id/101_1757868446968.jpg	/uploads/verification/address/101_1757868447896.jpg	approved	\N	2025-09-14 16:47:28.191016	2025-09-14 16:47:38.86
\.


--
-- Data for Name: voice_rate_limits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.voice_rate_limits (id, user_id, message_count, window_start_time, last_reset_at) FROM stdin;
\.


--
-- Data for Name: voice_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.voice_settings (id, max_duration_seconds, max_file_size_mb, enabled, transcription_enabled, allowed_mime_types) FROM stdin;
\.


--
-- Name: admin_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_messages_id_seq', 1, false);


--
-- Name: admin_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_settings_id_seq', 1, false);


--
-- Name: agent_commissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_commissions_id_seq', 128, true);


--
-- Name: agent_offices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_offices_id_seq', 127, true);


--
-- Name: agent_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agent_transfers_id_seq', 183, true);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 120, true);


--
-- Name: badge_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.badge_types_id_seq', 8, true);


--
-- Name: balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.balances_id_seq', 151, true);


--
-- Name: chat_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_messages_id_seq', 135, true);


--
-- Name: chat_rooms_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.chat_rooms_id_seq', 1, true);


--
-- Name: cities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cities_id_seq', 478, true);


--
-- Name: city_transfer_commissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.city_transfer_commissions_id_seq', 33, true);


--
-- Name: city_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.city_transfers_id_seq', 70, true);


--
-- Name: commission_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.commission_logs_id_seq', 170, true);


--
-- Name: commission_pool_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.commission_pool_transactions_id_seq', 548, true);


--
-- Name: countries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.countries_id_seq', 262, true);


--
-- Name: crypto_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.crypto_keys_id_seq', 1, false);


--
-- Name: exchange_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.exchange_rates_id_seq', 1, false);


--
-- Name: group_chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_chats_id_seq', 14, true);


--
-- Name: group_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_members_id_seq', 69, true);


--
-- Name: group_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.group_messages_id_seq', 124, true);


--
-- Name: hidden_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hidden_transfers_id_seq', 26, true);


--
-- Name: internal_transfer_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.internal_transfer_logs_id_seq', 1, false);


--
-- Name: international_transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.international_transfers_id_seq', 16, true);


--
-- Name: international_transfers_new_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.international_transfers_new_id_seq', 9, true);


--
-- Name: market_bids_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.market_bids_id_seq', 1, false);


--
-- Name: market_channels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.market_channels_id_seq', 1, false);


--
-- Name: market_deals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.market_deals_id_seq', 1, false);


--
-- Name: market_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.market_messages_id_seq', 114, true);


--
-- Name: market_offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.market_offers_id_seq', 108, true);


--
-- Name: market_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.market_transactions_id_seq', 144, true);


--
-- Name: message_likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.message_likes_id_seq', 9, true);


--
-- Name: office_commissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.office_commissions_id_seq', 4, true);


--
-- Name: office_country_commissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.office_country_commissions_id_seq', 1, false);


--
-- Name: page_restrictions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.page_restrictions_id_seq', 69, true);


--
-- Name: password_reset_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_requests_id_seq', 1, false);


--
-- Name: points_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.points_history_id_seq', 2524, true);


--
-- Name: private_chats_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.private_chats_id_seq', 29, true);


--
-- Name: private_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.private_messages_id_seq', 168, true);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 6, true);


--
-- Name: receipt_audit_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.receipt_audit_log_id_seq', 62, true);


--
-- Name: receipt_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.receipt_settings_id_seq', 5, true);


--
-- Name: referral_balances_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.referral_balances_id_seq', 76, true);


--
-- Name: referral_rewards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.referral_rewards_id_seq', 75, true);


--
-- Name: reward_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reward_settings_id_seq', 1, true);


--
-- Name: rewards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rewards_id_seq', 6, true);


--
-- Name: signing_keys_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.signing_keys_id_seq', 1, true);


--
-- Name: system_commission_rates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_commission_rates_id_seq', 68, true);


--
-- Name: system_commission_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_commission_settings_id_seq', 18, true);


--
-- Name: transaction_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transaction_logs_id_seq', 156, true);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transactions_id_seq', 1623, true);


--
-- Name: transfers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transfers_id_seq', 150, true);


--
-- Name: upgrade_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.upgrade_requests_id_seq', 91, true);


--
-- Name: user_2fa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_2fa_id_seq', 2, true);


--
-- Name: user_badges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_badges_id_seq', 113, true);


--
-- Name: user_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_notifications_id_seq', 1028, true);


--
-- Name: user_points_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_points_id_seq', 44, true);


--
-- Name: user_receive_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_receive_settings_id_seq', 4, true);


--
-- Name: user_rewards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_rewards_id_seq', 1, false);


--
-- Name: user_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_settings_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 102, true);


--
-- Name: verification_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.verification_requests_id_seq', 64, true);


--
-- Name: admin_messages admin_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_messages
    ADD CONSTRAINT admin_messages_pkey PRIMARY KEY (id);


--
-- Name: admin_settings admin_settings_key_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_key_unique UNIQUE (key);


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- Name: admin_transactions admin_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_transactions
    ADD CONSTRAINT admin_transactions_pkey PRIMARY KEY (id);


--
-- Name: admin_transactions admin_transactions_ref_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_transactions
    ADD CONSTRAINT admin_transactions_ref_no_key UNIQUE (ref_no);


--
-- Name: agent_commissions agent_commissions_agent_id_currency_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_commissions
    ADD CONSTRAINT agent_commissions_agent_id_currency_code_key UNIQUE (agent_id, currency_code);


--
-- Name: agent_commissions agent_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_commissions
    ADD CONSTRAINT agent_commissions_pkey PRIMARY KEY (id);


--
-- Name: agent_offices agent_offices_office_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_offices
    ADD CONSTRAINT agent_offices_office_code_key UNIQUE (office_code);


--
-- Name: agent_offices agent_offices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_offices
    ADD CONSTRAINT agent_offices_pkey PRIMARY KEY (id);


--
-- Name: agent_transfers agent_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_transfers
    ADD CONSTRAINT agent_transfers_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: badge_types badge_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_types
    ADD CONSTRAINT badge_types_name_key UNIQUE (name);


--
-- Name: badge_types badge_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badge_types
    ADD CONSTRAINT badge_types_pkey PRIMARY KEY (id);


--
-- Name: balances balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balances
    ADD CONSTRAINT balances_pkey PRIMARY KEY (id);


--
-- Name: balances balances_user_id_currency_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balances
    ADD CONSTRAINT balances_user_id_currency_unique UNIQUE (user_id, currency);


--
-- Name: chat_message_reads chat_message_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_reads
    ADD CONSTRAINT chat_message_reads_pkey PRIMARY KEY (message_id, user_id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: city_transfer_commissions city_transfer_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_transfer_commissions
    ADD CONSTRAINT city_transfer_commissions_pkey PRIMARY KEY (id);


--
-- Name: city_transfers city_transfers_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_transfers
    ADD CONSTRAINT city_transfers_code_unique UNIQUE (code);


--
-- Name: city_transfers city_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_transfers
    ADD CONSTRAINT city_transfers_pkey PRIMARY KEY (id);


--
-- Name: commission_logs commission_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_logs
    ADD CONSTRAINT commission_logs_pkey PRIMARY KEY (id);


--
-- Name: commission_pool_transactions commission_pool_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_pool_transactions
    ADD CONSTRAINT commission_pool_transactions_pkey PRIMARY KEY (id);


--
-- Name: countries countries_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_code_key UNIQUE (code);


--
-- Name: countries countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (id);


--
-- Name: crypto_keys crypto_keys_kid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crypto_keys
    ADD CONSTRAINT crypto_keys_kid_key UNIQUE (kid);


--
-- Name: crypto_keys crypto_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crypto_keys
    ADD CONSTRAINT crypto_keys_pkey PRIMARY KEY (id);


--
-- Name: dev_audit_logs dev_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_audit_logs
    ADD CONSTRAINT dev_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: dev_blocks dev_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_blocks
    ADD CONSTRAINT dev_blocks_pkey PRIMARY KEY (id);


--
-- Name: dev_components dev_components_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_components
    ADD CONSTRAINT dev_components_pkey PRIMARY KEY (key);


--
-- Name: dev_feature_flags dev_feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_feature_flags
    ADD CONSTRAINT dev_feature_flags_pkey PRIMARY KEY (key);


--
-- Name: dev_pages dev_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_pages
    ADD CONSTRAINT dev_pages_pkey PRIMARY KEY (id);


--
-- Name: dev_pages dev_pages_route_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_pages
    ADD CONSTRAINT dev_pages_route_key UNIQUE (route);


--
-- Name: dev_themes dev_themes_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_themes
    ADD CONSTRAINT dev_themes_name_key UNIQUE (name);


--
-- Name: dev_themes dev_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_themes
    ADD CONSTRAINT dev_themes_pkey PRIMARY KEY (id);


--
-- Name: exchange_rates exchange_rates_from_currency_to_currency_fetched_at_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_from_currency_to_currency_fetched_at_key UNIQUE (from_currency, to_currency, fetched_at);


--
-- Name: exchange_rates exchange_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.exchange_rates
    ADD CONSTRAINT exchange_rates_pkey PRIMARY KEY (id);


--
-- Name: export_jobs export_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT export_jobs_pkey PRIMARY KEY (id);


--
-- Name: group_chats group_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_chats
    ADD CONSTRAINT group_chats_pkey PRIMARY KEY (id);


--
-- Name: group_members group_members_group_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_user_id_key UNIQUE (group_id, user_id);


--
-- Name: group_members group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_pkey PRIMARY KEY (id);


--
-- Name: group_message_reads group_message_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_message_reads
    ADD CONSTRAINT group_message_reads_pkey PRIMARY KEY (message_id, user_id);


--
-- Name: group_messages group_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_pkey PRIMARY KEY (id);


--
-- Name: hidden_transfers hidden_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hidden_transfers
    ADD CONSTRAINT hidden_transfers_pkey PRIMARY KEY (id);


--
-- Name: hidden_transfers hidden_transfers_user_id_transfer_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hidden_transfers
    ADD CONSTRAINT hidden_transfers_user_id_transfer_id_key UNIQUE (user_id, transfer_id);


--
-- Name: internal_transfer_logs internal_transfer_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.internal_transfer_logs
    ADD CONSTRAINT internal_transfer_logs_pkey PRIMARY KEY (id);


--
-- Name: international_transfers_new international_transfers_new_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.international_transfers_new
    ADD CONSTRAINT international_transfers_new_pkey PRIMARY KEY (id);


--
-- Name: international_transfers_new international_transfers_new_transfer_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.international_transfers_new
    ADD CONSTRAINT international_transfers_new_transfer_code_key UNIQUE (transfer_code);


--
-- Name: international_transfers international_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.international_transfers
    ADD CONSTRAINT international_transfers_pkey PRIMARY KEY (id);


--
-- Name: international_transfers international_transfers_transfer_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.international_transfers
    ADD CONSTRAINT international_transfers_transfer_code_key UNIQUE (transfer_code);


--
-- Name: market_bids market_bids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_bids
    ADD CONSTRAINT market_bids_pkey PRIMARY KEY (id);


--
-- Name: market_channels market_channels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_channels
    ADD CONSTRAINT market_channels_pkey PRIMARY KEY (id);


--
-- Name: market_deals market_deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_deals
    ADD CONSTRAINT market_deals_pkey PRIMARY KEY (id);


--
-- Name: market_messages market_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_messages
    ADD CONSTRAINT market_messages_pkey PRIMARY KEY (id);


--
-- Name: market_offers market_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_offers
    ADD CONSTRAINT market_offers_pkey PRIMARY KEY (id);


--
-- Name: market_transactions market_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_transactions
    ADD CONSTRAINT market_transactions_pkey PRIMARY KEY (id);


--
-- Name: message_likes message_likes_message_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_likes
    ADD CONSTRAINT message_likes_message_id_user_id_key UNIQUE (message_id, user_id);


--
-- Name: message_likes message_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_likes
    ADD CONSTRAINT message_likes_pkey PRIMARY KEY (id);


--
-- Name: message_voices message_voices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_voices
    ADD CONSTRAINT message_voices_pkey PRIMARY KEY (id);


--
-- Name: office_commissions office_commissions_office_id_city_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_commissions
    ADD CONSTRAINT office_commissions_office_id_city_unique UNIQUE (office_id, city);


--
-- Name: office_commissions office_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_commissions
    ADD CONSTRAINT office_commissions_pkey PRIMARY KEY (id);


--
-- Name: office_country_commissions office_country_commissions_office_id_country_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_country_commissions
    ADD CONSTRAINT office_country_commissions_office_id_country_unique UNIQUE (office_id, country);


--
-- Name: office_country_commissions office_country_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_country_commissions
    ADD CONSTRAINT office_country_commissions_pkey PRIMARY KEY (id);


--
-- Name: page_restrictions page_restrictions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_restrictions
    ADD CONSTRAINT page_restrictions_pkey PRIMARY KEY (id);


--
-- Name: page_restrictions page_restrictions_user_id_page_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_restrictions
    ADD CONSTRAINT page_restrictions_user_id_page_key_key UNIQUE (user_id, page_key);


--
-- Name: password_reset_requests password_reset_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_pkey PRIMARY KEY (id);


--
-- Name: password_reset_requests password_reset_requests_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_token_key UNIQUE (token);


--
-- Name: points_history points_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_history
    ADD CONSTRAINT points_history_pkey PRIMARY KEY (id);


--
-- Name: private_chats private_chats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_chats
    ADD CONSTRAINT private_chats_pkey PRIMARY KEY (id);


--
-- Name: private_message_reads private_message_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_message_reads
    ADD CONSTRAINT private_message_reads_pkey PRIMARY KEY (message_id, user_id);


--
-- Name: private_messages private_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_messages
    ADD CONSTRAINT private_messages_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_user_id_endpoint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_endpoint_key UNIQUE (user_id, endpoint);


--
-- Name: receipt_audit_log receipt_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_audit_log
    ADD CONSTRAINT receipt_audit_log_pkey PRIMARY KEY (id);


--
-- Name: receipt_settings receipt_settings_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_settings
    ADD CONSTRAINT receipt_settings_key_key UNIQUE (key);


--
-- Name: receipt_settings receipt_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_settings
    ADD CONSTRAINT receipt_settings_pkey PRIMARY KEY (id);


--
-- Name: receipts receipts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipts
    ADD CONSTRAINT receipts_pkey PRIMARY KEY (id);


--
-- Name: referral_balances referral_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_balances
    ADD CONSTRAINT referral_balances_pkey PRIMARY KEY (id);


--
-- Name: referral_balances referral_balances_user_id_currency_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_balances
    ADD CONSTRAINT referral_balances_user_id_currency_key UNIQUE (user_id, currency);


--
-- Name: referral_rewards referral_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_rewards
    ADD CONSTRAINT referral_rewards_pkey PRIMARY KEY (id);


--
-- Name: referral_rewards referral_rewards_tx_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_rewards
    ADD CONSTRAINT referral_rewards_tx_id_key UNIQUE (tx_id);


--
-- Name: reward_settings reward_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reward_settings
    ADD CONSTRAINT reward_settings_pkey PRIMARY KEY (id);


--
-- Name: rewards rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);


--
-- Name: security_logs security_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_logs
    ADD CONSTRAINT security_logs_pkey PRIMARY KEY (id);


--
-- Name: signing_keys signing_keys_kid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signing_keys
    ADD CONSTRAINT signing_keys_kid_key UNIQUE (kid);


--
-- Name: signing_keys signing_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signing_keys
    ADD CONSTRAINT signing_keys_pkey PRIMARY KEY (id);


--
-- Name: system_commission_rates system_commission_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_commission_rates
    ADD CONSTRAINT system_commission_rates_pkey PRIMARY KEY (id);


--
-- Name: system_commission_settings system_commission_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_commission_settings
    ADD CONSTRAINT system_commission_settings_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- Name: transaction_logs transaction_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_logs
    ADD CONSTRAINT transaction_logs_pkey PRIMARY KEY (id);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_pkey PRIMARY KEY (id);


--
-- Name: transfers transfers_reference_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_reference_number_key UNIQUE (reference_number);


--
-- Name: system_commission_settings unique_commission_per_currency; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_commission_settings
    ADD CONSTRAINT unique_commission_per_currency UNIQUE (currency);


--
-- Name: private_chats unique_user_pairs; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_chats
    ADD CONSTRAINT unique_user_pairs UNIQUE (user1_id, user2_id);


--
-- Name: upgrade_requests upgrade_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upgrade_requests
    ADD CONSTRAINT upgrade_requests_pkey PRIMARY KEY (id);


--
-- Name: user_2fa user_2fa_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_2fa
    ADD CONSTRAINT user_2fa_pkey PRIMARY KEY (id);


--
-- Name: user_2fa user_2fa_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_2fa
    ADD CONSTRAINT user_2fa_user_id_key UNIQUE (user_id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_user_id_badge_type_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_badge_type_id_key UNIQUE (user_id, badge_type_id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_points user_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_points
    ADD CONSTRAINT user_points_pkey PRIMARY KEY (id);


--
-- Name: user_points user_points_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_points
    ADD CONSTRAINT user_points_user_id_key UNIQUE (user_id);


--
-- Name: user_receive_settings user_receive_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_receive_settings
    ADD CONSTRAINT user_receive_settings_pkey PRIMARY KEY (id);


--
-- Name: user_rewards user_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_pkey PRIMARY KEY (id);


--
-- Name: user_settings user_settings_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);


--
-- Name: users users_account_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_account_number_key UNIQUE (account_number);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_referral_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);


--
-- Name: verification_requests verification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_pkey PRIMARY KEY (id);


--
-- Name: voice_rate_limits voice_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_rate_limits
    ADD CONSTRAINT voice_rate_limits_pkey PRIMARY KEY (id);


--
-- Name: voice_settings voice_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_settings
    ADD CONSTRAINT voice_settings_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_actor_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs USING btree (actor_id);


--
-- Name: idx_audit_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);


--
-- Name: idx_audit_logs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity);


--
-- Name: idx_cities_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cities_country ON public.cities USING btree (country_id);


--
-- Name: idx_exchange_rates_pair; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_exchange_rates_pair ON public.exchange_rates USING btree (from_currency, to_currency, fetched_at);


--
-- Name: idx_export_jobs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_export_jobs_status ON public.export_jobs USING btree (status);


--
-- Name: idx_export_jobs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_export_jobs_user ON public.export_jobs USING btree (user_id);


--
-- Name: idx_message_voices_private_room; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_voices_private_room ON public.message_voices USING btree (private_room_id);


--
-- Name: idx_message_voices_room; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_voices_room ON public.message_voices USING btree (room_id);


--
-- Name: idx_message_voices_sender; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_voices_sender ON public.message_voices USING btree (sender_id);


--
-- Name: idx_message_voices_transcript; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_message_voices_transcript ON public.message_voices USING gin (to_tsvector('simple'::regconfig, COALESCE(transcript, ''::text)));


--
-- Name: idx_page_restrictions_account_number; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_restrictions_account_number ON public.page_restrictions USING btree (account_number);


--
-- Name: idx_page_restrictions_page_key; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_restrictions_page_key ON public.page_restrictions USING btree (page_key);


--
-- Name: idx_page_restrictions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_restrictions_user_id ON public.page_restrictions USING btree (user_id);


--
-- Name: idx_transaction_logs_currency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_logs_currency ON public.transaction_logs USING btree (currency);


--
-- Name: idx_transaction_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_logs_status ON public.transaction_logs USING btree (status);


--
-- Name: idx_transaction_logs_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_logs_type ON public.transaction_logs USING btree (type);


--
-- Name: idx_transaction_logs_user_ts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_transaction_logs_user_ts ON public.transaction_logs USING btree (user_id, ts);


--
-- Name: receipt_audit_receipt_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX receipt_audit_receipt_id_idx ON public.receipt_audit_log USING btree (receipt_id);


--
-- Name: receipt_audit_timestamp_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX receipt_audit_timestamp_idx ON public.receipt_audit_log USING btree ("timestamp");


--
-- Name: receipts_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX receipts_created_at_idx ON public.receipts USING btree (created_at);


--
-- Name: receipts_revoked_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX receipts_revoked_idx ON public.receipts USING btree (revoked);


--
-- Name: receipts_txn_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX receipts_txn_id_idx ON public.receipts USING btree (txn_id);


--
-- Name: signing_keys_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX signing_keys_active_idx ON public.signing_keys USING btree (active);


--
-- Name: signing_keys_kid_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX signing_keys_kid_idx ON public.signing_keys USING btree (kid);


--
-- Name: admin_messages admin_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_messages
    ADD CONSTRAINT admin_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: agent_offices agent_offices_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_offices
    ADD CONSTRAINT agent_offices_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: agent_offices agent_offices_country_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_offices
    ADD CONSTRAINT agent_offices_country_code_fkey FOREIGN KEY (country_code) REFERENCES public.countries(code);


--
-- Name: agent_offices agent_offices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_offices
    ADD CONSTRAINT agent_offices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: agent_transfers agent_transfers_agent_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_transfers
    ADD CONSTRAINT agent_transfers_agent_id_users_id_fk FOREIGN KEY (agent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: agent_transfers agent_transfers_destination_agent_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_transfers
    ADD CONSTRAINT agent_transfers_destination_agent_id_users_id_fk FOREIGN KEY (destination_agent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: agent_transfers agent_transfers_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agent_transfers
    ADD CONSTRAINT agent_transfers_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.users(id);


--
-- Name: balances balances_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.balances
    ADD CONSTRAINT balances_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_message_reads chat_message_reads_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_message_reads
    ADD CONSTRAINT chat_message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id);


--
-- Name: chat_messages chat_messages_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id);


--
-- Name: chat_messages chat_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: cities cities_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id) ON DELETE CASCADE;


--
-- Name: city_transfer_commissions city_transfer_commissions_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_transfer_commissions
    ADD CONSTRAINT city_transfer_commissions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: city_transfers city_transfers_receiver_office_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_transfers
    ADD CONSTRAINT city_transfers_receiver_office_id_users_id_fk FOREIGN KEY (receiver_office_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: city_transfers city_transfers_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_transfers
    ADD CONSTRAINT city_transfers_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: commission_logs commission_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commission_logs
    ADD CONSTRAINT commission_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: dev_blocks dev_blocks_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dev_blocks
    ADD CONSTRAINT dev_blocks_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.dev_pages(id) ON DELETE CASCADE;


--
-- Name: export_jobs export_jobs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.export_jobs
    ADD CONSTRAINT export_jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_chats group_chats_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_chats
    ADD CONSTRAINT group_chats_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_banned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_banned_by_fkey FOREIGN KEY (banned_by) REFERENCES public.users(id);


--
-- Name: group_members group_members_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.group_chats(id);


--
-- Name: group_members group_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_members group_members_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_members
    ADD CONSTRAINT group_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: group_message_reads group_message_reads_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_message_reads
    ADD CONSTRAINT group_message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.group_messages(id);


--
-- Name: group_messages group_messages_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.group_chats(id);


--
-- Name: group_messages group_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: group_messages group_messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_messages
    ADD CONSTRAINT group_messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hidden_transfers hidden_transfers_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hidden_transfers
    ADD CONSTRAINT hidden_transfers_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.agent_transfers(id) ON DELETE CASCADE;


--
-- Name: hidden_transfers hidden_transfers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hidden_transfers
    ADD CONSTRAINT hidden_transfers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: international_transfers international_transfers_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.international_transfers
    ADD CONSTRAINT international_transfers_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: international_transfers_new international_transfers_new_receiver_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.international_transfers_new
    ADD CONSTRAINT international_transfers_new_receiver_office_id_fkey FOREIGN KEY (receiver_office_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: international_transfers_new international_transfers_new_sender_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.international_transfers_new
    ADD CONSTRAINT international_transfers_new_sender_agent_id_fkey FOREIGN KEY (sender_agent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: international_transfers international_transfers_receiving_office_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.international_transfers
    ADD CONSTRAINT international_transfers_receiving_office_id_fkey FOREIGN KEY (receiving_office_id) REFERENCES public.agent_offices(id);


--
-- Name: market_bids market_bids_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_bids
    ADD CONSTRAINT market_bids_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.market_offers(id);


--
-- Name: market_bids market_bids_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_bids
    ADD CONSTRAINT market_bids_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: market_deals market_deals_bid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_deals
    ADD CONSTRAINT market_deals_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.market_bids(id);


--
-- Name: market_deals market_deals_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_deals
    ADD CONSTRAINT market_deals_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: market_deals market_deals_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_deals
    ADD CONSTRAINT market_deals_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.market_offers(id);


--
-- Name: market_deals market_deals_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_deals
    ADD CONSTRAINT market_deals_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: market_messages market_messages_bid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_messages
    ADD CONSTRAINT market_messages_bid_id_fkey FOREIGN KEY (bid_id) REFERENCES public.market_bids(id);


--
-- Name: market_messages market_messages_channel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_messages
    ADD CONSTRAINT market_messages_channel_id_fkey FOREIGN KEY (channel_id) REFERENCES public.market_channels(id);


--
-- Name: market_messages market_messages_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_messages
    ADD CONSTRAINT market_messages_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.market_deals(id);


--
-- Name: market_messages market_messages_offer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_messages
    ADD CONSTRAINT market_messages_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.market_offers(id);


--
-- Name: market_messages market_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_messages
    ADD CONSTRAINT market_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: market_offers market_offers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_offers
    ADD CONSTRAINT market_offers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: market_transactions market_transactions_buyer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_transactions
    ADD CONSTRAINT market_transactions_buyer_id_users_id_fk FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: message_likes message_likes_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_likes
    ADD CONSTRAINT message_likes_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id);


--
-- Name: message_likes message_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_likes
    ADD CONSTRAINT message_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: message_voices message_voices_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_voices
    ADD CONSTRAINT message_voices_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE CASCADE;


--
-- Name: message_voices message_voices_private_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_voices
    ADD CONSTRAINT message_voices_private_message_id_fkey FOREIGN KEY (private_message_id) REFERENCES public.private_messages(id) ON DELETE CASCADE;


--
-- Name: message_voices message_voices_private_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_voices
    ADD CONSTRAINT message_voices_private_room_id_fkey FOREIGN KEY (private_room_id) REFERENCES public.private_chats(id) ON DELETE CASCADE;


--
-- Name: message_voices message_voices_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_voices
    ADD CONSTRAINT message_voices_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;


--
-- Name: message_voices message_voices_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.message_voices
    ADD CONSTRAINT message_voices_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: office_commissions office_commissions_office_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_commissions
    ADD CONSTRAINT office_commissions_office_id_users_id_fk FOREIGN KEY (office_id) REFERENCES public.users(id);


--
-- Name: office_country_commissions office_country_commissions_office_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.office_country_commissions
    ADD CONSTRAINT office_country_commissions_office_id_users_id_fk FOREIGN KEY (office_id) REFERENCES public.users(id);


--
-- Name: page_restrictions page_restrictions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_restrictions
    ADD CONSTRAINT page_restrictions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: page_restrictions page_restrictions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_restrictions
    ADD CONSTRAINT page_restrictions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_requests password_reset_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_requests
    ADD CONSTRAINT password_reset_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: points_history points_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.points_history
    ADD CONSTRAINT points_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: private_chats private_chats_user1_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_chats
    ADD CONSTRAINT private_chats_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: private_chats private_chats_user1_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_chats
    ADD CONSTRAINT private_chats_user1_id_users_id_fk FOREIGN KEY (user1_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: private_chats private_chats_user2_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_chats
    ADD CONSTRAINT private_chats_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: private_chats private_chats_user2_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_chats
    ADD CONSTRAINT private_chats_user2_id_users_id_fk FOREIGN KEY (user2_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: private_message_reads private_message_reads_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_message_reads
    ADD CONSTRAINT private_message_reads_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.private_messages(id);


--
-- Name: private_messages private_messages_chat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_messages
    ADD CONSTRAINT private_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.private_chats(id);


--
-- Name: private_messages private_messages_original_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_messages
    ADD CONSTRAINT private_messages_original_sender_id_fkey FOREIGN KEY (original_sender_id) REFERENCES public.users(id);


--
-- Name: private_messages private_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_messages
    ADD CONSTRAINT private_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: private_messages private_messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.private_messages
    ADD CONSTRAINT private_messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: receipt_audit_log receipt_audit_log_receipt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.receipt_audit_log
    ADD CONSTRAINT receipt_audit_log_receipt_id_fkey FOREIGN KEY (receipt_id) REFERENCES public.receipts(id);


--
-- Name: referral_balances referral_balances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_balances
    ADD CONSTRAINT referral_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: referral_rewards referral_rewards_referred_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_rewards
    ADD CONSTRAINT referral_rewards_referred_user_id_fkey FOREIGN KEY (referred_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: referral_rewards referral_rewards_referrer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.referral_rewards
    ADD CONSTRAINT referral_rewards_referrer_id_fkey FOREIGN KEY (referrer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: system_commission_settings system_commission_settings_updated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_commission_settings
    ADD CONSTRAINT system_commission_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id);


--
-- Name: transaction_logs transaction_logs_agent_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_logs
    ADD CONSTRAINT transaction_logs_agent_transfer_id_fkey FOREIGN KEY (agent_transfer_id) REFERENCES public.agent_transfers(id) ON DELETE CASCADE;


--
-- Name: transaction_logs transaction_logs_city_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_logs
    ADD CONSTRAINT transaction_logs_city_transfer_id_fkey FOREIGN KEY (city_transfer_id) REFERENCES public.city_transfers(id);


--
-- Name: transaction_logs transaction_logs_international_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_logs
    ADD CONSTRAINT transaction_logs_international_transfer_id_fkey FOREIGN KEY (international_transfer_id) REFERENCES public.international_transfers(id);


--
-- Name: transaction_logs transaction_logs_market_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_logs
    ADD CONSTRAINT transaction_logs_market_transaction_id_fkey FOREIGN KEY (market_transaction_id) REFERENCES public.market_transactions(id);


--
-- Name: transaction_logs transaction_logs_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_logs
    ADD CONSTRAINT transaction_logs_transfer_id_fkey FOREIGN KEY (transfer_id) REFERENCES public.transfers(id);


--
-- Name: transaction_logs transaction_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transaction_logs
    ADD CONSTRAINT transaction_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transfers transfers_receiver_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_receiver_id_users_id_fk FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: transfers transfers_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfers
    ADD CONSTRAINT transfers_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: upgrade_requests upgrade_requests_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upgrade_requests
    ADD CONSTRAINT upgrade_requests_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: upgrade_requests upgrade_requests_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upgrade_requests
    ADD CONSTRAINT upgrade_requests_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: upgrade_requests upgrade_requests_decided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upgrade_requests
    ADD CONSTRAINT upgrade_requests_decided_by_fkey FOREIGN KEY (decided_by) REFERENCES public.users(id);


--
-- Name: upgrade_requests upgrade_requests_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.upgrade_requests
    ADD CONSTRAINT upgrade_requests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_2fa user_2fa_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_2fa
    ADD CONSTRAINT user_2fa_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_badges user_badges_badge_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_type_id_fkey FOREIGN KEY (badge_type_id) REFERENCES public.badge_types(id) ON DELETE CASCADE;


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_notifications user_notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_points user_points_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_points
    ADD CONSTRAINT user_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_receive_settings user_receive_settings_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_receive_settings
    ADD CONSTRAINT user_receive_settings_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: user_receive_settings user_receive_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_receive_settings
    ADD CONSTRAINT user_receive_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_rewards user_rewards_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE CASCADE;


--
-- Name: user_rewards user_rewards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_rewards
    ADD CONSTRAINT user_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_settings user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_settings
    ADD CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id);


--
-- Name: users users_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id);


--
-- Name: users users_referred_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_referred_by_fkey FOREIGN KEY (referred_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: verification_requests verification_requests_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: voice_rate_limits voice_rate_limits_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.voice_rate_limits
    ADD CONSTRAINT voice_rate_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: dev_audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dev_audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: dev_audit_logs dev_audit_logs_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_audit_logs_policy ON public.dev_audit_logs USING (public.is_dev_studio_authorized(actor_email));


--
-- Name: dev_blocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dev_blocks ENABLE ROW LEVEL SECURITY;

--
-- Name: dev_blocks dev_blocks_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_blocks_policy ON public.dev_blocks USING ((EXISTS ( SELECT 1
   FROM public.dev_pages p
  WHERE ((p.id = dev_blocks.page_id) AND public.is_dev_studio_authorized(p.created_by)))));


--
-- Name: dev_components; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dev_components ENABLE ROW LEVEL SECURITY;

--
-- Name: dev_components dev_components_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_components_policy ON public.dev_components USING (public.is_dev_studio_authorized('ss73ss73ss73@gmail.com'::text));


--
-- Name: dev_feature_flags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dev_feature_flags ENABLE ROW LEVEL SECURITY;

--
-- Name: dev_feature_flags dev_feature_flags_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_feature_flags_policy ON public.dev_feature_flags USING (public.is_dev_studio_authorized('ss73ss73ss73@gmail.com'::text));


--
-- Name: dev_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dev_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: dev_pages dev_pages_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_pages_policy ON public.dev_pages USING (public.is_dev_studio_authorized(created_by)) WITH CHECK (public.is_dev_studio_authorized(created_by));


--
-- Name: dev_themes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.dev_themes ENABLE ROW LEVEL SECURITY;

--
-- Name: dev_themes dev_themes_policy; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY dev_themes_policy ON public.dev_themes USING (public.is_dev_studio_authorized('ss73ss73ss73@gmail.com'::text));


--
-- PostgreSQL database dump complete
--

