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