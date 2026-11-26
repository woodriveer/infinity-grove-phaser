-- The legacy of the account resets (spec reset-legacy-drops, AD-031): a percent per chapter, 50 or 100. Expand only (AD-016): the previous
-- backend never reads this table. No row is created for players who reset before it (owner decision 2): their legacy starts empty.
create table if not exists player_legacy (
    username varchar(255) not null references users (username) on delete cascade,
    chapter  integer      not null check (chapter between 1 and 15),
    percent  integer      not null check (percent in (50, 100)),
    primary key (username, chapter)
);
