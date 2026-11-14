-- Coin drops of chapters 1 to 5 move to the coin factor of the spec campaign-chapters (AD-019). Same columns, so the previous backend
-- keeps crediting kills (AD-016). Each update only touches a rule still holding its old seeded range, so a range tuned in the database
-- survives.
update drop_rules set min_copper = 2, max_copper = 6 where id = 1 and min_copper = 1 and max_copper = 5;
update drop_rules set min_copper = 8, max_copper = 20 where id = 2 and min_copper = 5 and max_copper = 15;
update drop_rules set min_copper = 30, max_copper = 70 where id = 3 and min_copper = 20 and max_copper = 50;
update drop_rules set min_copper = 4, max_copper = 12 where id = 4 and min_copper = 2 and max_copper = 10;
update drop_rules set min_copper = 16, max_copper = 40 where id = 5 and min_copper = 10 and max_copper = 30;
update drop_rules set min_copper = 60, max_copper = 140 where id = 6 and min_copper = 40 and max_copper = 100;
update drop_rules set min_copper = 8, max_copper = 24 where id = 7 and min_copper = 3 and max_copper = 15;
update drop_rules set min_copper = 32, max_copper = 80 where id = 8 and min_copper = 15 and max_copper = 45;
update drop_rules set min_copper = 120, max_copper = 280 where id = 9 and min_copper = 60 and max_copper = 150;
update drop_rules set min_copper = 16, max_copper = 48 where id = 10 and min_copper = 4 and max_copper = 20;
update drop_rules set min_copper = 64, max_copper = 160 where id = 11 and min_copper = 20 and max_copper = 60;
update drop_rules set min_copper = 240, max_copper = 560 where id = 12 and min_copper = 80 and max_copper = 200;
update drop_rules set min_copper = 32, max_copper = 96 where id = 13 and min_copper = 5 and max_copper = 25;
update drop_rules set min_copper = 128, max_copper = 320 where id = 14 and min_copper = 25 and max_copper = 75;
update drop_rules set min_copper = 480, max_copper = 1120 where id = 15 and min_copper = 100 and max_copper = 250;
