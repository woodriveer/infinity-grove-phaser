-- The ally slots a player bought and the hero in each (spec hero-team). A player with no row bought no slot and has no ally.
-- Expand only (AD-016): the previous backend never reads this table.
create table player_team (
    username     varchar(255) not null primary key references users (username) on delete cascade,
    bought_slots integer      not null check (bought_slots between 0 and 4),
    ally_1       varchar(255) references heroes (id) on delete restrict,
    ally_2       varchar(255) references heroes (id) on delete restrict,
    ally_3       varchar(255) references heroes (id) on delete restrict,
    ally_4       varchar(255) references heroes (id) on delete restrict,
    constraint player_team_ally_1_bought check (ally_1 is null or bought_slots >= 1),
    constraint player_team_ally_2_bought check (ally_2 is null or bought_slots >= 2),
    constraint player_team_ally_3_bought check (ally_3 is null or bought_slots >= 3),
    constraint player_team_ally_4_bought check (ally_4 is null or bought_slots >= 4),
    constraint player_team_allies_distinct check (
        ally_1 <> ally_2 and ally_1 <> ally_3 and ally_1 <> ally_4
        and ally_2 <> ally_3 and ally_2 <> ally_4 and ally_3 <> ally_4
    )
);
