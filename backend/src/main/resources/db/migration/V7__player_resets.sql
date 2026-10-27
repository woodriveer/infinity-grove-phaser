-- How many times a player reset the account (spec account-reset). A player with no row never reset; once they did, the auto click works
-- from chapter 1.
create table player_resets (
    username varchar(255) not null primary key references users (username) on delete cascade,
    resets   integer      not null check (resets >= 1)
);
