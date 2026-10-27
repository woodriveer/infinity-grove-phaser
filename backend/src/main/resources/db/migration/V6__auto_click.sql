-- The crystals of a player (spec auto-click): a special currency with no source yet, so every balance starts at 0. A player with no row
-- holds 0 crystals.
create table player_crystals (
    username varchar(255) not null primary key references users (username) on delete cascade,
    crystals bigint       not null check (crystals >= 0)
);

-- The auto click level a player bought with crystals; a player with no row is at level 0 (500 ms). The intervals and prices are settings
-- of the code (app.auto-click), so there is no catalog table to reference.
create table player_auto_click (
    username varchar(255) not null primary key references users (username) on delete cascade,
    level    integer      not null check (level >= 1)
);
