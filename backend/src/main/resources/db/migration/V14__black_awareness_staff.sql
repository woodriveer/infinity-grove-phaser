-- The Cajado da Consciência Negra (spec black-awareness-staff). Expand only (AD-016): the previous backend neither reads nor writes the
-- new column or the new table, and a refine it saves keeps the column (its entity does not map it). Every statement can run again.
alter table equipment_pieces add column if not exists special varchar(32);

-- One row per account and gift: the unique key makes "once per account ever" hold under retries and concurrent claims. piece_id has no
-- foreign key on purpose: the staff may be sold (its row deleted) and the grant must stay.
create table if not exists player_gifts (
    id         varchar(255) primary key,
    username   varchar(255) not null references users (username) on delete cascade,
    gift_id    varchar(64)  not null,
    piece_id   varchar(255) not null,
    granted_at bigint       not null,
    constraint uk_player_gifts_username_gift unique (username, gift_id)
);
