import sqlite3
import string
import random
from datetime import datetime
from flask import Flask, g, jsonify, redirect, request
from functools import wraps

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0


def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('migrations/20240222162501_belay.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()


def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one:
            return rows[0]
        return rows
    return None


def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' +
                 'values (?, ?, ?) returning id, name, password, api_key',
                 (name, password, api_key),
                 one=True)
    return u


# TODO: If your app sends users to any other routes, include them here.
#       (This should not be necessary).
@app.route('/')
@app.route('/profile')
@app.route('/login')
@app.route('/channel')
@app.route('/channel/<channel_id>')
def index(channel_id=None):
    return app.send_static_file('index.html')


@app.errorhandler(404)
def page_not_found(e):
    return app.send_static_file('404.html'), 404


# -------------------------------- API ROUTES ----------------------------------

# TODO: Create the API

# @app.route('/api/signup')
# def login():
#   ...


# @app.route('/api/login')
# def login():
#   ...

# ... etc

@app.route('/api/signup', methods=['POST'])
def signup():
    user = new_user()
    if user:
        return jsonify({'id': user['id'], 'username': user['name'], 'api_key': user['api_key']}), 200
    else:
        return {}, 403


@app.route('/api/login', methods=['POST'])
def login():
    # test = query_db('select * from users where name = 123')
    # print(test)
    authorization = request.json
    name = authorization.get('username')
    print(name)
    password = authorization.get('password')
    print(password)
    user = query_db('select * from users where name = ? and password = ?', [name, password], one=True)
    print(user)
    if user:
        return jsonify({'id': user['id'], 'username': user['name'], 'api_key': user['api_key']}), 200
    else:
        print("enter else")
        return {}, 403


@app.route('/api/profile', methods=["POST"])
def update_profile():
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    print("user of /api/profile", user)
    if not user:
        return {}, 403
    new_name = request.json.get('name')
    new_password = request.json.get('password')

    if new_name:
        query_db('update users set name = ? where api_key = ?', [new_name, api_key])
    if new_password:
        query_db('update users set password = ? where api_key = ?', [new_password, api_key])

    return jsonify(
        {'id': user['id'], 'username': new_name, 'password': new_password, 'api_key': user['api_key']}), 200


@app.route('/api/profile', methods=["GET"])
def get_profile_info():
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    print("user of /api/profile", user)
    if not user:
        return {}, 403

    return jsonify(
        {'id': user['id'], 'username': user['name'], 'password': user['password'], 'api_key': user['api_key']}), 200


@app.route('/api/channel', methods=['POST'])
def new_channel():
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    if user:
        name = "Unnamed channel #" + ''.join(random.choices(string.digits, k=6))
        channel = query_db('insert into channels (name) values (?) returning id, name', [name], one=True)
        print("channel of /api/channel", channel['id'], "    ", channel['name'])
        return jsonify({'id': channel['id'], 'name': channel['name']}), 200
    else:
        return {}, 403


@app.route('/api/channel', methods=['GET'])
def get_all_channel():
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    if not user:
        return {}, 403
    channels = query_db('select * from channels')
    if channels:
        print("GET channel LIST SUCCESSFULLY!!!")
        return jsonify([dict(channel) for channel in channels]), 200
    else:
        return jsonify([]), 200


@app.route('/api/channel/<int:channel_id>', methods=['GET'])
def get_channel_info(channel_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    if not user:
        return {}, 403
    channel = query_db('select * from channels where id = ?', [channel_id], one=True)

    print("get the channel detail here ----------------", int(channel['id']))
    # room = query_db('select * from rooms where id = ?', [chat_id])
    return jsonify({'id': channel['id'], 'name': channel['name'], 'username': user['name']}), 200


@app.route('/api/channel/<int:channel_id>', methods=['POST'])
def update_channel_name(channel_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    if not user:
        return {}, 403
    new_name = request.json.get('name')
    print("new_name", new_name)
    query_db('update channels set name = ? where id = ?', [new_name, channel_id])
    print("update the channel name here ----------------")
    return {}, 200


@app.route('/api/channel/<int:channel_id>/messages', methods=['GET'])
def get_messages(channel_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select id from users where api_key = ?', [api_key], one=True)
    if not user:
        return {}, 403
    message = query_db(
        'select * from messages left join users on messages.user_id = users.id where channels_id = ? and replies_to IS NULL',
        [channel_id])
    if message:
        print("GET MESSAGE SUCCESSFULLY!!!")
        return jsonify([dict(message) for message in message]), 200
    else:
        return jsonify([]), 200


@app.route('/api/channel/<int:channel_id>/messages', methods=['POST'])
def post_message(channel_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select id from users where api_key = ?', [api_key], one=True)
    if not user:
        return {}, 403

    user_id = user['id']
    body = request.json.get('body')
    query_db('insert into messages (user_id, channels_id, body) values (?, ?, ?)', [user_id, channel_id, body],
             one=True)
    return {}, 200


@app.route('/api/channel/<int:channel_id>/view', methods=['POST'])
def update_last_message_viewed(channel_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    last_message_id = request.json.get('last_message_id_seen')
    existing_view = query_db('select * from user_message_views where user_id = ? and channel_id = ?',
                             [user['id'], channel_id], one=True)

    if existing_view:
        query_db('update user_message_views set last_message_id_seen = ? where user_id = ? and channel_id = ?',
                 [last_message_id, user['id'], channel_id])
    else:
        query_db('insert into user_message_views (user_id, channel_id, last_message_id_seen) values (?, ?, ?)',
                 [user['id'], channel_id, last_message_id])

    return jsonify({'message': 'User message view updated successfully'}), 200


@app.route('/api/user/unread-messages', methods=['GET'])
def get_unread_messages_count():
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    channels = query_db('select * from channels')
    unread_messages_counts = []

    for channel in channels:
        last_viewed_message_id = query_db(
            'select last_message_id_seen from user_message_views where user_id = ? and channel_id = ?',
            [user['id'], channel['id']], one=True)

        if last_viewed_message_id:
            unread_count = query_db(
                'select count(*) as unread_count from messages where channels_id = ? and id > ? and replies_to IS NULL',
                [channel['id'], last_viewed_message_id['last_message_id_seen']], one=True)
        else:
            unread_count = query_db(
                'select count(*) as unread_count from messages where channels_id = ? and replies_to IS NULL',
                [channel['id']], one=True)

        unread_messages_counts.append({'channel_id': channel['id'], 'unread_count': unread_count['unread_count']})

    return jsonify(unread_messages_counts), 200


@app.route('/api/channel/<int:channel_id>/message-replies', methods=['GET'])
def get_message_replies_count(channel_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    parent_messages = query_db(
        'select * from messages where channels_id = ? and replies_to IS NULL', [channel_id])

    replies_counts = []
    for message in parent_messages:
        replies_count = query_db(
            'select count(*) as reply_count from messages where replies_to = ?', [message['id']], one=True)

        replies_counts.append({
            'message_id': message['id'],
            'reply_count': replies_count['reply_count']
        })

    return jsonify(replies_counts), 200


@app.route('/api/messages/<int:message_id>/replies', methods=['GET'])
def get_message_replies(message_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select id from users where api_key = ?', [api_key], one=True)

    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    replies = query_db('SELECT * FROM messages left join users on messages.user_id = users.id WHERE replies_to = ?',
                       [message_id])

    if replies:
        return jsonify([dict(reply) for reply in replies]), 200
    else:
        return jsonify([]), 200


@app.route('/api/messages/<int:message_id>/replies', methods=['POST'])
def post_reply(message_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select id from users where api_key = ?', [api_key], one=True)

    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.json
    reply_body = data.get('body')

    if not reply_body:
        return jsonify({'error': 'Missing reply body'}), 400

    query_db('INSERT INTO messages (user_id, replies_to, body) VALUES (?, ?, ?)',
             [user['id'], message_id, reply_body])
    return {}, 200

