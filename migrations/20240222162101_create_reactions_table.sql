CREATE TABLE reactions
(
    id         INTEGER PRIMARY KEY,
    emoji      VARCHAR(10),
    message_id INTEGER,
    user_id    INTEGER,
    FOREIGN KEY (message_id) REFERENCES messages (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
);