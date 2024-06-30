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
        db = g._database = sqlite3.connect('db/watchparty.sqlite3')
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
@app.route('/room')
@app.route('/room/<chat_id>')
def index(chat_id=None):
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
    test = query_db('select * from users where name = 123')
    print(test)
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


# def new_user():
#     name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
#     password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
#     api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
#     u = query_db('insert into users (name, password, api_key) ' +
#                  'values (?, ?, ?) returning id, name, password, api_key',
#                  (name, password, api_key),
#                  one=True)
#     return u


@app.route('/api/room', methods=['POST'])
def new_room():
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    if user:
        name = "Unnamed Room #" + ''.join(random.choices(string.digits, k=6))
        room = query_db('insert into rooms (name) values (?) returning id, name', [name], one=True)
        print("room of /api/room", room['id'], "    ", room['name'])
        return jsonify({'id': room['id'], 'name': room['name']}), 200
    else:
        return {}, 403

@app.route('/api/room', methods=['GET'])
def get_all_room():
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    if not user:
        return {}, 403
    rooms = query_db('select * from rooms')
    if rooms:
        print("GET Room LIST SUCCESSFULLY!!!")
        return jsonify([dict(room) for room in rooms]), 200
    else:
        return jsonify([]), 200


@app.route('/api/room/<int:chat_id>', methods=['GET'])
def get_room_info(chat_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    if not user:
        return {}, 403
    room = query_db('select * from rooms where id = ?', [chat_id], one=True)

    print("get the room detail here ----------------", int(room['id']))
    # room = query_db('select * from rooms where id = ?', [chat_id])
    return jsonify({'id': room['id'], 'name': room['name'], 'username': user['name']}), 200


@app.route('/api/room/<int:chat_id>', methods=['POST'])
def update_room_name(chat_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select * from users where api_key = ?', [api_key], one=True)
    if not user:
        return {}, 403
    new_name = request.json.get('name')
    print("new_name", new_name)
    query_db('update rooms set name = ? where id = ?', [new_name, chat_id])
    print("update the room name here ----------------")
    # room = query_db('select * from rooms where id = ?', [chat_id])
    return {}, 200


@app.route('/api/room/<int:chat_id>/messages', methods=['GET'])
def get_messages(chat_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select id from users where api_key = ?', [api_key], one=True)
    if not user:
        return {}, 403
    message = query_db('select * from messages left join users on messages.user_id = users.id where room_id = ?',
                       [chat_id])
    if message:
        print("GET MESSAGE SUCCESSFULLY!!!")
        return jsonify([dict(message) for message in message]), 200
    else:
        return jsonify([]), 200


@app.route('/api/room/<int:chat_id>/messages', methods=['POST'])
def post_message(chat_id):
    api_key = request.headers.get('Authorization')
    user = query_db('select id from users where api_key = ?', [api_key], one=True)
    if not user:
        return {}, 403

    user_id = user['id']
    body = request.json.get('body')
    query_db('insert into messages (user_id, room_id, body) values (?, ?, ?)', [user_id, chat_id, body], one=True)
    return {}, 200
