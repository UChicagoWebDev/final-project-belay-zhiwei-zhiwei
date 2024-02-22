create table users
(
    id       INTEGER PRIMARY KEY,
    name     VARCHAR(40) UNIQUE,
    password VARCHAR(40),
    api_key  VARCHAR(40)
);