-- The talent points the first clear of a phase, miniboss or chapter boss paid (spec talent-points). One row per player and cleared
-- position (key chapter:stage:encounter:phase), so a replay finds its row and pays nothing. A level costs one point, so the points
-- spent are derived from player_talents and never stored.
create table talent_point_awards (
    username  varchar(255) not null references users (username) on delete cascade,
    award_key varchar(64)  not null,
    points    integer      not null check (points >= 0),
    primary key (username, award_key)
);

-- Talent levels were bought with coins before this table existed: grant each owner as many points as their levels cost, so nobody holds
-- levels the points do not cover.
insert into talent_point_awards (username, award_key, points)
select username, 'legacy', sum(level)
from player_talents
group by username;
