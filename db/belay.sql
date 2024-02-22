create table channels
(
    id   INTEGER PRIMARY KEY,
    name VARCHAR(40) UNIQUE
);

create table users
(
    id       INTEGER PRIMARY KEY,
    name     VARCHAR(40) UNIQUE,
    password VARCHAR(40),
    api_key  VARCHAR(40)
);

create table messages
(
    id          INTEGER PRIMARY KEY,
    user_id     INTEGER,
    channels_id INTEGER,
    replies_to  INTEGER,
    body        TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (channels_id) REFERENCES channels (id),
    FOREIGN KEY (replies_to) REFERENCES messages (id)
);

CREATE TABLE reactions
(
    id         INTEGER PRIMARY KEY,
    emoji      VARCHAR(10),
    message_id INTEGER,
    user_id    INTEGER,
    FOREIGN KEY (message_id) REFERENCES messages (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE user_message_views (
    user_id INTEGER,
    channel_id INTEGER,
    last_message_id_seen INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(channel_id) REFERENCES channels(id),
    FOREIGN KEY(last_message_id_seen) REFERENCES messages(id),
    PRIMARY KEY (user_id, channel_id)
);
