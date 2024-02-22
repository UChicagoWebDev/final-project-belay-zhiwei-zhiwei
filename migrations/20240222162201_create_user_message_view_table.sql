CREATE TABLE user_message_views (
    user_id INTEGER,
    channel_id INTEGER,
    last_message_id_seen INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(channel_id) REFERENCES channels(id),
    FOREIGN KEY(last_message_id_seen) REFERENCES messages(id),
    PRIMARY KEY (user_id, channel_id)
);