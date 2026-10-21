-- The talent levels a player bought with coins (spec talents). One row per upgraded talent; a talent with no row is at level 0.
-- Rows go with the player; the talent ids are the catalog of the code, so there is no catalog table to reference.
create table player_talents (
    username  varchar(255) not null references users (username) on delete cascade,
    talent_id varchar(64)  not null,
    level     integer      not null check (level >= 1),
    primary key (username, talent_id)
);
