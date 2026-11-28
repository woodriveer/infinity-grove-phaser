-- Rankings (spec rankings, AD-037). Expand only (AD-016): the previous backend never reads these tables, and the trigger keeps the
-- fortune peak for every wallet write, the previous backend's included.
create table if not exists player_run_clock (
    username        varchar(255) not null primary key references users (username) on delete cascade,
    run_started_at  bigint,
    boss_reached_at bigint
);

create table if not exists player_boss_times (
    username    varchar(255) not null references users (username) on delete cascade,
    chapter     integer      not null check (chapter between 1 and 15),
    best_ms     bigint       not null check (best_ms >= 0),
    achieved_at bigint       not null,
    primary key (username, chapter)
);

create index if not exists idx_player_boss_times_board on player_boss_times (chapter, best_ms, achieved_at);

create table if not exists player_story_times (
    username    varchar(255) not null primary key references users (username) on delete cascade,
    best_ms     bigint       not null check (best_ms >= 0),
    achieved_at bigint       not null
);

create index if not exists idx_player_story_times_board on player_story_times (best_ms, achieved_at);

create table if not exists player_click_power (
    username    varchar(255)     not null primary key references users (username) on delete cascade,
    best_power  double precision not null check (best_power > 0),
    achieved_at bigint           not null
);

create index if not exists idx_player_click_power_board on player_click_power (best_power desc, achieved_at);

create table if not exists player_fortune (
    username    varchar(255) not null primary key references users (username) on delete cascade,
    peak_copper bigint       not null check (peak_copper >= 0),
    achieved_at bigint       not null
);

create index if not exists idx_player_fortune_board on player_fortune (peak_copper desc, achieved_at);

-- The peak copper of a wallet (spec rankings, Fortune): every insert and every copper change keeps the larger value
create or replace function record_peak_copper() returns trigger as $$
begin
    insert into player_fortune (username, peak_copper, achieved_at)
    values (new.username, new.copper, (extract(epoch from clock_timestamp()) * 1000)::bigint)
    on conflict (username) do update
        set peak_copper = excluded.peak_copper, achieved_at = excluded.achieved_at
        where excluded.peak_copper > player_fortune.peak_copper;
    return new;
end;
$$ language plpgsql;

drop trigger if exists wallets_peak_copper on wallets;

create trigger wallets_peak_copper
    after insert or update of copper on wallets
    for each row execute function record_peak_copper();

-- Every existing wallet starts its peak at its current copper (spec Q12)
insert into player_fortune (username, peak_copper, achieved_at)
select username, copper, (extract(epoch from clock_timestamp()) * 1000)::bigint from wallets
on conflict (username) do nothing;
