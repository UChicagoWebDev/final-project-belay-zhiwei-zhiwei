const {
    BrowserRouter,
    Switch,
    Route,
    useHistory,
    useParams,
} = ReactRouterDOM;


function App() {
    const [user, setUser] = React.useState(null);
    const [unreadCounts, setUnreadCounts] = React.useState({});
    const [rooms, setRooms] = React.useState([]);
    const [currChannel, setCurrChannel] = React.useState({name: ''}); // State to hold room details
    const [isEditing, setIsEditing] = React.useState(false); // State to toggle edit mode
    const [newRoomName, setNewRoomName] = React.useState(''); // State for the new room name input
    const [messages, setMessages] = React.useState([]); // State to hold messages
    const [newMessage, setNewMessage] = React.useState(''); // State for the new message input
    const [repliesCount, setRepliesCount] = React.useState({});
    const [replies, setReplies] = React.useState([]);
    const [replyInput, setReplyInput] = React.useState({});
    const [selectedMessageId, setSelectedMessageId] = React.useState(null);
    const [selectedMessage, setSelectedMessage] = React.useState(null);
    const handleLogin = (username, password) => {
        return fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({username, password}),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Login failed');
                }
                return response.json();
            })
            .then(data => {
                console.log("data", data)
                setUser({
                    id: data.id,
                    username: data.username,
                    apiKey: data.api_key
                });

                console.log("user", user);

                localStorage.setItem('zhiweic_api-key', data.api_key);

                return true;
            })
            .catch(error => {
                console.error('Error during login:', error);
                return false;
            });
    };

    const fetchUnreadMessageCounts = () => {
        const apiKey = localStorage.getItem('zhiweic_api-key');
        if (apiKey) {
            fetch('/api/user/unread-messages', {
                method: 'GET',
                headers: {
                    'Authorization': apiKey,
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    const counts = data.reduce((acc, curr) => {
                        acc[curr.channel_id] = curr.unread_count;
                        return acc;
                    }, {});
                    setUnreadCounts(counts);
                })
                .catch((error) => console.error('Failed to fetch unread messages count:', error));
        }

    };

    const fetchRooms = () => {
        fetch('/api/channel', {
            method: 'GET',
            headers: {
                // 'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log("fetch room data", data);
                setRooms(data);
                // setIsLoading(false);
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
                // setIsLoading(false);
            });
    }

    const handleUpdateRoomName = (id, newRoomName) => {
        fetch(`/api/channel/${id}`, {
            method: 'POST',
            headers: {
                'Authorization': localStorage.getItem('zhiweic_api-key'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({name: newRoomName}),
        })
            .then(() => {
                setCurrChannel({name: newRoomName});
                setIsEditing(false);
            })
            .catch(error => console.error("Failed to update room name:", error));
    };

    const handleEditClick = () => {
        console.log("Click the edit BUTTON!!!!!!")
        setIsEditing(true);
    };

    const fetch_room_detail = (id) => {
        fetch(`/api/channel/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': localStorage.getItem('zhiweic_api-key'),
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                setCurrChannel({name: data.name});
                setNewRoomName(data.name);
            })
            .catch(error => console.error("Failed to fetch room details:", error));
    }

    const fetch_messages = (id) => {
        fetch(`/api/channel/${id}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': localStorage.getItem('zhiweic_api-key'),
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(messagesData => {
                console.log("Fetched messages: ", messagesData);
                const fetchReactionsPromises = messagesData.map(message =>
                    fetch(`/api/message/${message.id}/reaction`, {
                        method: 'GET',
                        headers: {
                            'Authorization': localStorage.getItem('zhiweic_api-key'),
                            'Content-Type': 'application/json'
                        }
                    }).then(response => response.json())
                );

                // Wait for all reactions to be fetched
                Promise.all(fetchReactionsPromises).then(reactionsData => {
                    const messagesWithReactions = messagesData.map((message, index) => ({
                        ...message,
                        reactions: reactionsData[index]
                    }));

                    setMessages(messagesWithReactions);
                });
            })
    }

    const handlePostMessage = (event, id) => {
        event.preventDefault(); // Prevent form submission from reloading the page

        const trimmedMessage = newMessage.trim();

        if (!trimmedMessage) {
            alert('Message cannot be empty'); // Alert the user
            return; // Exit the function early
        }

        fetch(`/api/channel/${id}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': localStorage.getItem('zhiweic_api-key'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({body: newMessage}),
        })
            .then(() => {
                setMessages([...messages, {body: newMessage}]);
                setNewMessage(''); // Clear input field
                updateLastViewed(id);
            })
            .catch(error => console.error("Failed to post message:", error));
    };

    const updateLastViewed = (id) => {
        const apiKey = localStorage.getItem('zhiweic_api-key');
        fetch(`/api/channel/${id}/messages`, {
            method: 'GET',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                setMessages(data);
                if (data.length > 0) {
                    const lastMessageId = data[data.length - 1].id;
                    fetch(`/api/channel/${id}/view`, {
                        method: 'POST',
                        headers: {
                            'Authorization': apiKey,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({last_message_id_seen: lastMessageId}),
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to update last viewed message');
                            }
                            return response.json();
                        })
                        .then(() => console.log('Last viewed message updated successfully'))
                        .catch(error => console.error('Failed to update last viewed message:', error));
                }
            })
            .catch(error => console.error("Failed to fetch messages:", error));
    };

    const fetchRepliesCount = (id) => {
        const apiKey = localStorage.getItem('zhiweic_api-key');
        fetch(`/api/channel/${id}/message-replies`, {
            method: 'GET',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                console.log("123123123", data)
                const repliesMap = data.reduce((acc, item) => {
                    acc[item.message_id] = item.reply_count;
                    return acc;
                }, {});
                setRepliesCount(repliesMap);
            })
            .catch(error => console.log("Failed to fetch replies count: There is no massages at this Channel aright now"));
    };

    const fetchRepliesForMessage = (messageId) => {
        const apiKey = localStorage.getItem('zhiweic_api-key');
        fetch(`/api/messages/${messageId}/replies`, {
            method: 'GET',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(replyData => {
                console.log("Fetched messages: ", replyData);
                const fetchReactionsPromises = replyData.map(message =>
                    fetch(`/api/message/${message.id}/reaction`, {
                        method: 'GET',
                        headers: {
                            'Authorization': localStorage.getItem('zhiweic_api-key'),
                            'Content-Type': 'application/json'
                        }
                    }).then(response => response.json())
                );

                // Wait for all reactions to be fetched
                Promise.all(fetchReactionsPromises).then(reactionsData => {
                    const messagesWithReactions = replyData.map((message, index) => ({
                        ...message,
                        reactions: reactionsData[index]
                    }));

                    setReplies(messagesWithReactions);
                });
            })
            .catch(error => console.error("Failed to fetch replies:", error));
    };

    const handlePostReply = (event, messageId) => {
        event.preventDefault(); // Prevent the default form submission behavior
        const apiKey = localStorage.getItem('zhiweic_api-key');
        const replyBody = replyInput[messageId];

        console.log("reply body is ------  ", replyBody);

        if (!replyBody) {
            alert('Reply cannot be empty');
            return;
        }

        fetch(`/api/messages/${messageId}/replies`, {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({body: replyBody}),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to post reply');
                }
                return response.json();
            })
            .then(() => {
                console.log('Reply posted successfully');
                setReplyInput(prev => ({...prev, [messageId]: ''}));
                fetchRepliesForMessage(messageId); // Refresh the replies to include the new one
            })
            .catch(error => console.error('Failed to post reply:', error));
    };

    const handleShowReplies = (messageId) => {
        const message = messages.find(m => m.id === messageId);
        setSelectedMessage(message);
        setSelectedMessageId(messageId);
        fetchRepliesForMessage(messageId);
    };


    const handleAddReaction = (messageId, emoji) => {
        const apiKey = localStorage.getItem('zhiweic_api-key');
        fetch(`/api/message/${messageId}/reaction`, {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({emoji}),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to add reaction');
                }
                return response.json();
            })
            .then(data => {
                if (data.message === "Reaction already exists") {
                    alert("You have already added this emoji :)");
                }
            })
            .catch(error => console.error('Error adding reaction:', error));
    };

    const parseImageUrls = (message) => {
        // Check if message is null or undefined
        if (!message) return [];
        const regex = /https?:\/\/\S+\.(jpg|jpeg|png|gif)/gi;
        return message.match(regex) || [];
    };

    const fetch_message = (id) => {
        const apiKey = localStorage.getItem('zhiweic_api-key');
        fetch(`/api/message/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(message => {
                setSelectedMessage(message);
            })
            .catch(error => console.error("Failed to fetch messages:", error));
    };


    return (
        <BrowserRouter>
            <div>
                <Switch>
                    <Route path="/login">
                        <LoginForm user={user} setUser={setUser} handleLogin={handleLogin}/>
                    </Route>
                    <Route path="/profile">
                        <Profile user={user} setUser={setUser} setRooms={setRooms}/>
                    </Route>
                    <Route exact path="/channel/:id/thread/:msg_id">
                        <Thread fetchUnreadMessageCounts={fetchUnreadMessageCounts}
                                unreadCounts={unreadCounts}
                                fetchRooms={fetchRooms}
                                handleUpdateRoomName={handleUpdateRoomName}
                                handleEditClick={handleEditClick}
                                fetch_room_detail={fetch_room_detail}
                                fetch_messages={fetch_messages}
                                handlePostMessage={handlePostMessage}
                                updateLastViewed={updateLastViewed}
                                fetchRepliesCount={fetchRepliesCount}
                                fetchRepliesForMessage={fetchRepliesForMessage}
                                handlePostReply={handlePostReply}
                                handleShowReplies={handleShowReplies}
                                handleAddReaction={handleAddReaction}
                                parseImageUrls={parseImageUrls}
                                fetch_message={fetch_message}

                                rooms={rooms}
                                setRooms={setRooms}
                                currChannel={currChannel}
                                setCurrChannel={setCurrChannel}
                                isEditing={isEditing}
                                setIsEditing={setIsEditing}
                                newRoomName={newRoomName}
                                setNewRoomName={setNewRoomName}
                                messages={messages}
                                setMessages={setMessages}
                                newMessage={newMessage}
                                setNewMessage={setNewMessage}
                                repliesCount={repliesCount}
                                setRepliesCount={setRepliesCount}
                                replies={replies}
                                setReplies={setReplies}
                                replyInput={replyInput}
                                setReplyInput={setReplyInput}
                                selectedMessageId={selectedMessageId}
                                setSelectedMessageId={setSelectedMessageId}
                                selectedMessage={selectedMessage}
                                setSelectedMessage={setSelectedMessage}
                        />
                    </Route>

                    <Route exact path="/channel/:id">
                        <ChatChannel fetchUnreadMessageCounts={fetchUnreadMessageCounts}
                                     unreadCounts={unreadCounts}
                                     fetchRooms={fetchRooms}
                                     handleUpdateRoomName={handleUpdateRoomName}
                                     handleEditClick={handleEditClick}
                                     fetch_room_detail={fetch_room_detail}
                                     fetch_messages={fetch_messages}
                                     handlePostMessage={handlePostMessage}
                                     updateLastViewed={updateLastViewed}
                                     fetchRepliesCount={fetchRepliesCount}
                                     fetchRepliesForMessage={fetchRepliesForMessage}
                                     handlePostReply={handlePostReply}
                                     handleShowReplies={handleShowReplies}
                                     handleAddReaction={handleAddReaction}
                                     parseImageUrls={parseImageUrls}

                                     rooms={rooms}
                                     setRooms={setRooms}
                                     currChannel={currChannel}
                                     setCurrChannel={setCurrChannel}
                                     isEditing={isEditing}
                                     setIsEditing={setIsEditing}
                                     newRoomName={newRoomName}
                                     setNewRoomName={setNewRoomName}
                                     messages={messages}
                                     setMessages={setMessages}
                                     newMessage={newMessage}
                                     setNewMessage={setNewMessage}
                                     repliesCount={repliesCount}
                                     setRepliesCount={setRepliesCount}
                                     replies={replies}
                                     setReplies={setReplies}
                                     replyInput={replyInput}
                                     setReplyInput={setReplyInput}
                                     selectedMessageId={selectedMessageId}
                                     setSelectedMessageId={setSelectedMessageId}
                                     selectedMessage={selectedMessage}
                                     setSelectedMessage={setSelectedMessage}
                        />
                    </Route>

                    <Route exact path="/">
                        <SplashScreen fetchUnreadMessageCounts={fetchUnreadMessageCounts}
                                      unreadCounts={unreadCounts}
                                      fetchRooms={fetchRooms}
                                      rooms={rooms}
                                      setRooms={setRooms}
                                      user={user}
                                      setUser={setUser}/>
                    </Route>
                    <Route path="*">
                        <div>Page not found</div>
                        <NotFoundPage/>
                    </Route>
                </Switch>
            </div>
        </BrowserRouter>
    );
}

function SplashScreen(props) {
    const {rooms} = props;
    const {unreadCounts} = props;
    // const [isLoading, setIsLoading] = React.useState(true);
    const apiKey = localStorage.getItem('zhiweic_api-key');
    const history = useHistory();
    console.log("props", props);
    const handleLoginClick = () => {
        history.push('/login');
    };

    const handleSignup = () => {
        fetch('/api/signup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Signup failed');
                }
                return response.json();
            })
            .then(data => {
                console.log("New user data:", data);

                localStorage.setItem('zhiweic_api-key', data.api_key);
                props.setUser({id: data.id, username: data.username, apiKey: data.api_key});
                history.push('/profile');
            })
            .catch(error => {
                console.error('Error during signup:', error);
            });
    };

    function fetchUserInfo() {
        const apiKey = localStorage.getItem('zhiweic_api-key');
        if (apiKey) {
            fetch('/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': apiKey,
                    'Content-Type': 'application/json',
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch user data');
                    }
                    return response.json();
                })
                .then(userData => {
                    props.setUser({
                        id: userData.id,
                        username: userData.username,
                    });
                })
                .catch(error => {
                    console.error('Error fetching user data:', error);
                });
        }
    }

    const handleCreateRoom = () => {
        fetch('/api/channel', {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create a new room');
                }
                return response.json();
            })
            .then(newRoom => {
                history.push(`/channel/${newRoom.id}`);
                props.setRooms(prevRooms => [...prevRooms, newRoom]);

            })
            .catch(error => {
                console.error('Error creating a new room:', error);
            });
    };

    React.useEffect(() => {
        document.title = "Belay Main Page";
        props.fetchRooms();
        fetchUserInfo();
        props.fetchUnreadMessageCounts();
        const counts_interval = setInterval(() => {
            props.fetchRooms();
            props.fetchUnreadMessageCounts();
            console.log("rooms data ---------", props.rooms);
        }, 1000);
        return () => clearInterval(counts_interval);
    }, []);

    const navigateToChannel = (channelId) => {
        history.push(`/channel/${channelId}`);
        // props.setSelectedMessageId();
    };

    return (
        <div className="splash container">
            <div className="rooms">
                {rooms.length > 0 ? (
                    <div className="roomList">
                        <h2>Rooms</h2>
                        {rooms.map((room) => (
                            <button key={room.id} onClick={() => navigateToChannel(room.id)}>
                                {room.name} {unreadCounts[room.id] !== 0 && props.user &&
                                <strong>({unreadCounts[room.id]} unread messages)</strong>}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="noRooms">No rooms yet! You get to be first!</div>
                )}
            </div>


            <div className="hero">
                <div className="splashHeader">
                    <div className="loginHeader">
                        {props.user ? (
                            <div className="loggedIn" onClick={() => history.push('/profile')}>
                                <span className="username">Welcome back, {props.user.username}!</span>
                                <span className="material-symbols-outlined md-18">person</span>
                            </div>
                        ) : (
                            <button onClick={handleLoginClick}>Login</button>
                        )}
                    </div>
                </div>
                <div className="logo">
                    <img id="tv" src={"/static/tv.jpeg"} alt="TV"/>
                    <img id="popcorn" src={"/static/popcorn.png"} alt="Popcorn"/>
                </div>
                <h1>Belay</h1>
                {props.user ? (
                    <button className="create" onClick={handleCreateRoom}>Create a Room</button>
                ) : (
                    <button className="signup" onClick={handleSignup}>Signup</button>
                )}
            </div>


        </div>
    );
}


// LoginForm component changes
function LoginForm(props) {
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [errorMessage, setErrorMessage] = React.useState('');
    const history = useHistory();

    const handleInputChange = (event) => {
        const {name, value} = event.target;
        if (name === 'username') {
            setUsername(value);
        } else if (name === 'password') {
            setPassword(value);
        }
    };

    const handleSignup = () => {
        fetch('/api/signup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Signup failed');
                }
                return response.json();
            })
            .then(data => {
                console.log("New user data:", data);

                localStorage.setItem('zhiweic_api-key', data.api_key);
                props.setUser({id: data.id, username: data.username, apiKey: data.api_key});
                history.push('/profile');
            })
            .catch(error => {
                console.error('Error during signup:', error);
            });
    };


    const handleSubmit = (event) => {
        event.preventDefault();

        props.handleLogin(username, password)
            .then(success => {
                if (!success) {
                    setErrorMessage('Oops, that username and password don\'t match any of our users!');
                } else {
                    history.push('/');
                    console.log("login successfully")
                }
            })
            .catch(error => {
                console.error('Login error:', error);
                setErrorMessage('An error occurred. Please try again.');
            });
    };

    return (
        <div className="login">
            <div className="header">
                <h2><a onClick={() => history.push('/')}>Belay</a></h2>
                <h4></h4>
            </div>
            <div className="clip">
                <h3>Enter your username and password to log in:</h3>
                <div className="auth container">

                    <div className="alignedForm">
                        <form onSubmit={handleSubmit} className="alignedForm login">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                name="username"
                                value={username}
                                onChange={handleInputChange}
                                required
                            />
                            <div></div>
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={password}
                                onChange={handleInputChange}
                                required
                            />
                            <button type="submit">Login</button>
                        </form>
                        <button type="button" onClick={handleSignup}>Create a new Account</button>
                    </div>


                    {/*<div className="failed">*/}

                    {/*</div>*/}


                    {errorMessage && (
                        <div className="failed">
                            <div className="message">
                                {errorMessage}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


// Profile component changes

function Profile(props) {
    const history = useHistory();

    const [username, setUsername] = React.useState(props.user ? props.user.username : '');
    const [password, setPassword] = React.useState('');
    const [repeatPassword, setRepeatPassword] = React.useState('');
    const [error, setError] = React.useState('');

    const handleLogout = () => {
        props.setUser(null);
        localStorage.removeItem('zhiweic_api-key');
        history.push('/');
        // props.setRooms([]);  // uncomment this line, when user logout, they cannot get any channels on main page.
    };

    const handleUpdateUsername = () => {
        const apiKey = localStorage.getItem('zhiweic_api-key');
        fetch('/api/profile', {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({name: username})
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update username');
                }
                return response.json();
            })
            .then(updatedUser => {
                console.log('Username updated to', updatedUser.username);
                props.setUser(updatedUser);
                setUsername(updatedUser.username);
            })
            .catch(error => {
                console.error('Error updating username:', error);
                setError('Failed to update username');
            });
    };

    const handleUpdatePassword = () => {
        if (password !== repeatPassword) {
            setError("Passwords don't match");
        } else {
            setError(null);
            const apiKey = localStorage.getItem('zhiweic_api-key');
            fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Authorization': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({password: password})
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to update password');
                    }
                    console.log('Password updated successfully');
                    alert('Password updated successfully')
                    setPassword('');
                    setRepeatPassword('');
                })
                .catch(error => {
                    console.error('Error updating password:', error);
                    setError('Failed to update password');
                });
        }

    };


    const goToSplash = () => {
        history.push('/');
    };

    React.useEffect(() => {
        const apiKey = localStorage.getItem('zhiweic_api-key');
        if (!apiKey) {
            history.push('/login');
        } else {
            document.title = "Belay Profile"
            fetch('/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': apiKey,
                    'Content-Type': 'application/json',
                },
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch user data');
                    }
                    return response.json();
                })
                .then(userData => {
                    setUsername(userData.username);
                    setPassword(userData.password);
                    setRepeatPassword(userData.password);
                })
                .catch(error => {
                    console.error('Error fetching user data:', error);
                });
        }
    }, [history]);

    return (
        <div className="profile">
            <div className="header">
                <h2><a className="go_to_splash_page" onClick={goToSplash}>Belay</a></h2>
                <h4>Profile Page</h4>
            </div>
            <div className="clip">
                <h2>Welcome to Belay!</h2>
                <div className="auth container">

                    <div className="alignedForm">
                        <label htmlFor="username">Username: </label>
                        <input name="username" value={username} onChange={(e) => setUsername(e.target.value)}/>
                        <button className="update_name" onClick={handleUpdateUsername}>update</button>

                        <label htmlFor="password">Password: </label>
                        <input type="password" name="password" value={password}
                               onChange={(e) => setPassword(e.target.value)}/>
                        <button className="update_password" onClick={handleUpdatePassword}>update</button>

                        <label htmlFor="repeatPassword">Repeat: </label>
                        <input type="password" name="repeatPassword" value={repeatPassword}
                               onChange={(e) => setRepeatPassword(e.target.value)}/>
                        {error && <div className="error">{error}</div>}

                        <button className="exit goToSplash" onClick={goToSplash}>Cool, let's go!</button>
                        <button className="exit logout" onClick={handleLogout}>Log out</button>
                    </div>
                </div>
            </div>
        </div>
    );
}


// ChatChannel component changes
function ChatChannel(props) {
    const {rooms} = props;
    const {unreadCounts} = props;
    let {id} = useParams(); // Get the channel ID from the URL
    let history = useHistory();
    const [view, setView] = React.useState('message');

    const goToSplash = () => {
        history.push('/');
    };

    const navigateToChannel = (channelId) => {
        history.push(`/channel/${channelId}`);
        props.setSelectedMessageId(null);
        setView('message');
    };

    const navigateToThread = (channelId, messageId) => {
        history.push(`/channel/${channelId}/thread/${messageId}`);
        props.setSelectedMessageId(messageId);
        const message = props.messages.find(m => m.id === messageId);
        props.setSelectedMessage(message);

        console.log("props.setSelectedMessage(message)", props.selectedMessage)
        // setView('reply');
    };

    const handleBackToChannels = () => {
        props.setSelectedMessageId(null);
        setView('channel'); // only show channel list
        history.push(`/`);
    };


    React.useEffect(() => {
        const apiKey = localStorage.getItem('zhiweic_api-key');
        if (!apiKey) {
            history.push('/login');
        } else {
            document.title = `Belay Channel #${id}`;
            props.fetchRooms();
            props.fetchUnreadMessageCounts(apiKey);
            props.fetch_room_detail(id);
            props.fetch_messages(id);
            props.updateLastViewed(id);
            const message_interval = setInterval(() => {
                props.fetchRooms();
                props.fetch_messages(id);
                props.fetchRepliesCount(id);
                props.fetchUnreadMessageCounts(apiKey)
                if (props.selectedMessageId)
                    props.fetchRepliesForMessage(props.selectedMessageId);
            }, 500);
            return () => clearInterval(message_interval);
        }


    }, [id, props.selectedMessageId]);

    if (rooms.length < parseInt(id, 10)) {
        return <NotFoundPage/>;
    } else {
        return (

            <div className="splash container">
                <div className={`rooms ${view !== 'channel' ? 'hidden' : ''}`}>
                    {rooms.length > 0 ? (
                        <div className="roomList">
                            <h2>Rooms</h2>
                            {rooms.map((room) => (
                                <button key={room.id} onClick={() => navigateToChannel(room.id)}
                                        style={{backgroundColor: room.id === parseInt(id, 10) ? 'orange' : 'transparent'}}>
                                    {room.name} {unreadCounts[room.id] !== 0 &&
                                    <strong>({unreadCounts[room.id]} unread messages)</strong>}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="noRooms">No rooms yet! You get to be first!</div>
                    )}
                </div>


                <div className="room">

                    <div className="header">
                        <h2><a className="go_to_splash_page" onClick={goToSplash}>Belay</a></h2>
                        <div className="roomDetail">
                            {!props.isEditing && props.currChannel ? (
                                <div className="displayRoomName">
                                    <h3 className="curr_room_name">
                                        Chatting in <strong>{props.currChannel.name}</strong>
                                        <a onClick={props.handleEditClick}>
                                            <span className="material-symbols-outlined md-18">edit</span>
                                        </a>
                                    </h3>
                                </div>
                            ) : (
                                <div className="editRoomName">
                                    <h3>
                                        Chatting in <input value={props.newRoomName}
                                                           onChange={(e) => props.setNewRoomName(e.target.value)}/>
                                        <button
                                            onClick={() => props.handleUpdateRoomName(id, props.newRoomName)}>Update
                                        </button>
                                    </h3>
                                </div>
                            )}
                            <a className="shar_link">/rooms/{id}</a>
                        </div>
                    </div>


                    <div className="clip">

                        <div className="container">

                            <div className="chat">

                                <div className={`message-list ${view !== 'message' ? 'hidden' : ''}`}>
                                    <div className="back-button" onClick={handleBackToChannels}>Back to Channels</div>

                                    <div className="messages">
                                        {props.messages.map((message, index) => (
                                            <div key={index} className="message-container">
                                                <div className="message">
                                                    <div className="author">{message.name} :</div>
                                                    {/*<div className="content">{message.body}</div>*/}
                                                    <div className="content">
                                                        {message.body}
                                                        {/* Display images after the message content */}
                                                        {props.parseImageUrls(message.body).map((url, imgIndex) => (
                                                            <img key={imgIndex} src={url} alt="Message Attachment"
                                                                 style={{
                                                                     maxWidth: '200px',
                                                                     maxHeight: '200px',
                                                                     marginTop: '10px'
                                                                 }}/>
                                                        ))}
                                                    </div>
                                                    <div className="message-actions">
                                                        {props.repliesCount[message.id] > 0 && (
                                                            <button onClick={() => navigateToThread(id, message.id)}>
                                                                Replies: {props.repliesCount[message.id]}
                                                            </button>
                                                        )}
                                                        <button onClick={() => navigateToThread(id, message.id)}>Reply!
                                                        </button>
                                                    </div>

                                                </div>

                                                <div className="message-reactions">
                                                    {['😀', '❤️', '👍'].map((emoji) => (
                                                        <button key={emoji}
                                                                onClick={() => props.handleAddReaction(message.id, emoji)}>
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                    {message.reactions && message.reactions.length > 0 && (
                                                        <div className="reactions">
                                                            {message.reactions.map((reaction, index) => (
                                                                <span key={index} className="reaction"
                                                                      onMouseEnter={(e) => {
                                                                          // Show tooltip
                                                                          e.currentTarget.querySelector('.users').style.display = 'block';
                                                                      }}
                                                                      onMouseLeave={(e) => {
                                                                          // Hide tooltip
                                                                          e.currentTarget.querySelector('.users').style.display = 'none';
                                                                      }}>
                                                         {reaction.emoji}{reaction.users.split(',').length}&nbsp;
                                                                    <span className="users" style={{display: 'none'}}>
                                                           {reaction.users}
                                                         </span>
                                                    </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>


                                            </div>
                                        ))}
                                    </div>
                                </div>


                                {/*{!props.selectedMessageId && (<div></div>)}*/}
                                <div className="comment_box">
                                    <label htmlFor="comment">What do you have to say?</label>
                                    <textarea name="comment" value={props.newMessage}
                                              onChange={(e) => props.setNewMessage(e.target.value)}></textarea>
                                    <button onClick={(event) => props.handlePostMessage(event, id)}
                                            className="post_room_messages">Post
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

function Thread(props) {
    const {rooms} = props;
    const {unreadCounts} = props;
    let {id, msg_id} = useParams();
    let history = useHistory();
    const [view, setView] = React.useState('reply');
    const [valid, setValid] = React.useState(true);

    const goToSplash = () => {
        history.push('/');
    };

    const navigateToChannel = (channelId) => {
        history.push(`/channel/${channelId}`);
        props.setSelectedMessageId(null);
        setView('message');
    };

    const navigateToThread = (channelId, messageId) => {
        history.push(`/channel/${channelId}/thread/${messageId}`);
        props.setSelectedMessageId(messageId);
        const message = props.messages.find(m => m.id === messageId);
        props.setSelectedMessage(message);
        console.log("props.setSelectedMessage(message)", props.selectedMessage)
        setView('reply');
    };

    const handleBackToChannels = () => {
        props.setSelectedMessageId(null);
        setView('channel'); // only show channel list
        history.push(`/channel/${id}`);
    };


    const handleBackToMain = () => {
        props.setSelectedMessageId(null);
        setView('channel'); // only show channel list
        history.push(`/`);
    };

    const checkValidThread = () => {
        fetch(`/api/check_valid/${id}/${msg_id}`, {
            method: 'GET',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    console.log('-+_+_+_+_+_+_+_+_+_+_+', response.json());
                    setValid(false);
                }

            })
            .catch(error => console.error("Failed to check if thread is valid:", error));
    }


    const apiKey = localStorage.getItem('zhiweic_api-key');
    React.useEffect(() => {

        if (!apiKey) {
            history.push('/login');
            alert("Please login before entering to the thread.")
        } else {
            document.title = `Belay Channel #${id}`;
            props.setSelectedMessageId(msg_id);
            props.fetchRooms();
            props.fetchUnreadMessageCounts(apiKey);
            props.fetch_room_detail(id);
            props.fetch_messages(id);
            props.updateLastViewed(id);
            props.fetch_message(msg_id);
            checkValidThread(id, msg_id);
            const message_interval = setInterval(() => {
                props.fetchRooms();
                props.fetch_messages(id);
                props.fetchRepliesCount(id);
                props.fetchUnreadMessageCounts(apiKey)
                props.fetchRepliesForMessage(msg_id);
                props.fetch_message(msg_id);
                // props.updateLastViewed(id);
            }, 500);
            return () => clearInterval(message_interval);
        }


    }, [id, props.selectedMessageId]);


    console.log("In the room {" + id + "} message {" + props.selectedMessageId + "}");


    if (rooms.length < parseInt(id, 10) || !valid) {
        return <NotFoundPage/>;
    } else {
        return (
            <div className="splash container">


                <>
                    <div className={`rooms ${view !== 'channel' ? 'hidden' : ''}`}>

                        {rooms.length > 0 ? (
                            <div className="roomList">
                                <h2>Rooms</h2>
                                {rooms.map((room) => (
                                    <button key={room.id} onClick={() => navigateToChannel(room.id)}
                                            style={{backgroundColor: room.id === parseInt(id, 10) ? 'orange' : 'transparent'}}>
                                        {room.name} {unreadCounts[room.id] !== 0 &&
                                        <strong>({unreadCounts[room.id]} unread messages)</strong>}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="noRooms">No rooms yet! You get to be first!</div>
                        )}
                    </div>


                    {/*<div className="room">*/}
                    <div className={`room ${view !== 'message' ? 'hidden' : ''}`}>

                        <div className="header">
                            <h2><a className="go_to_splash_page" onClick={goToSplash}>Belay</a></h2>
                            <div className="roomDetail">
                                {!props.isEditing && props.currChannel ? (
                                    <div className="displayRoomName">
                                        <h3 className="curr_room_name">
                                            Chatting in <strong>{props.currChannel.name}</strong>
                                            <a onClick={props.handleEditClick}>
                                                <span className="material-symbols-outlined md-18">edit</span>
                                            </a>
                                        </h3>
                                    </div>
                                ) : (
                                    <div className="editRoomName">
                                        <h3>
                                            Chatting in <input value={props.newRoomName}
                                                               onChange={(e) => props.setNewRoomName(e.target.value)}/>
                                            <button
                                                onClick={() => props.handleUpdateRoomName(id, props.newRoomName)}>Update
                                            </button>
                                        </h3>
                                    </div>
                                )}
                                <a className="shar_link">/rooms/{id}</a>
                            </div>
                        </div>

                        <div className="clip">
                            <div className="container">

                                <div className="chat">


                                    <div className="messages">
                                        {props.messages.map((message, index) => (
                                            <div key={index} className="message-container">
                                                <div className="message">
                                                    <div className="author">{message.name} :</div>
                                                    <div className="content">
                                                        {message.body}
                                                        {/* Display images after the message content */}
                                                        {props.parseImageUrls(message.body).map((url, imgIndex) => (
                                                            <img key={imgIndex} src={url} alt="Message Attachment"
                                                                 style={{
                                                                     maxWidth: '200px',
                                                                     maxHeight: '200px',
                                                                     marginTop: '10px'
                                                                 }}/>
                                                        ))}
                                                    </div>
                                                    <div className="message-actions">
                                                        {props.repliesCount[message.id] > 0 && (
                                                            <button onClick={() => navigateToThread(id, message.id)}>
                                                                Replies: {props.repliesCount[message.id]}
                                                            </button>
                                                        )}
                                                        <button onClick={() => navigateToThread(id, message.id)}>Reply!
                                                        </button>
                                                    </div>

                                                </div>

                                                <div className="message-reactions">
                                                    {['😀', '❤️', '👍'].map((emoji) => (
                                                        <button key={emoji}
                                                                onClick={() => props.handleAddReaction(message.id, emoji)}>
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                    {message.reactions && message.reactions.length > 0 && (
                                                        <div className="reactions">
                                                            {message.reactions.map((reaction, index) => (
                                                                <span key={index} className="reaction"
                                                                      onMouseEnter={(e) => {
                                                                          // Show tooltip
                                                                          e.currentTarget.querySelector('.users').style.display = 'block';
                                                                      }}
                                                                      onMouseLeave={(e) => {
                                                                          // Hide tooltip
                                                                          e.currentTarget.querySelector('.users').style.display = 'none';
                                                                      }}>
                                                         {reaction.emoji}{reaction.users.split(',').length}&nbsp;
                                                                    <span className="users" style={{display: 'none'}}>
                                                           {reaction.users}
                                                         </span>
                                                    </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>


                                            </div>
                                        ))}

                                    </div>
                                    <div className="comment_box">
                                        <label htmlFor="comment">What do you have to say?</label>
                                        <textarea name="comment" value={props.newMessage}
                                                  onChange={(e) => props.setNewMessage(e.target.value)}></textarea>
                                        <button onClick={(event) => props.handlePostMessage(event, id)}
                                                className="post_room_messages">Post
                                        </button>
                                    </div>

                                </div>


                            </div>
                        </div>


                    </div>


                    <div className="replies-section">

                        <div className="back-button" onClick={() => {
                            handleBackToMain()
                        }}>Back to Channel
                        </div>
                        <button onClick={() => {
                            handleBackToChannels()
                        }}>close
                        </button>

                        <h3>Message</h3>
                        <div className="message">
                            <div className="author">{props.selectedMessage && props.selectedMessage.name}</div>
                            <div className="content">
                                {props.selectedMessage && props.selectedMessage.body}
                                {/* Display images after the message content */}
                                {props.selectedMessage && props.parseImageUrls(props.selectedMessage.body).map((url, imgIndex) => (
                                    <img key={imgIndex} src={url} alt="Message Attachment"
                                         style={{
                                             maxWidth: '100px',
                                             maxHeight: '100px',
                                             marginTop: '10px'
                                         }}/>
                                ))}
                            </div>
                        </div>

                        <h3>Replies</h3>
                        <div className="replies">
                            {props.replies.map((reply, index) => (
                                <div key={index} className="reply">
                                    {/*<strong>{reply.name}</strong>: {reply.body}*/}
                                    <div className="room chat message author"><strong>{reply.name}</strong> :</div>
                                    <div className="content">
                                        {reply.body}
                                        {/* Display images after the reply content */}
                                        {props.parseImageUrls(reply.body).map((url, imgIndex) => (
                                            <img key={imgIndex} src={url} alt="Message Attachment"
                                                 style={{
                                                     maxWidth: '100px',
                                                     maxHeight: '100px',
                                                     marginTop: '10px'
                                                 }}/>
                                        ))}
                                    </div>

                                    <div className="message-reactions">
                                        {['😀', '❤️', '👍'].map((emoji) => (
                                            <button key={emoji}
                                                    onClick={() => props.handleAddReaction(reply.id, emoji)}>
                                                {emoji}
                                            </button>
                                        ))}
                                        {reply.reactions && reply.reactions.length > 0 && (
                                            <div className="reactions">
                                                {reply.reactions.map((reaction, index) => (
                                                    <span key={index} className="reaction"
                                                          onMouseEnter={(e) => {
                                                              // Show tooltip
                                                              e.currentTarget.querySelector('.users').style.display = 'block';
                                                          }}
                                                          onMouseLeave={(e) => {
                                                              // Hide tooltip
                                                              e.currentTarget.querySelector('.users').style.display = 'none';
                                                          }}>
                                 {reaction.emoji}{reaction.users.split(',').length}&nbsp;
                                                        <span className="users"
                                                              style={{display: 'none'}}>
                                   {reaction.users}
                                 </span>
                            </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>


                                </div>
                            ))}
                        </div>
                        <div className="comment_box">
                            <label htmlFor="comment">What do you have to say?</label>
                            <div></div>
                            <textarea
                                name="comment"
                                value={props.replyInput[props.selectedMessageId] || ''}
                                onChange={(e) => props.setReplyInput({
                                    ...props.replyInput,
                                    [props.selectedMessageId]: e.target.value
                                })}
                            ></textarea>
                            <button
                                onClick={(e) => props.handlePostReply(e, props.selectedMessageId)}
                                className="post_room_messages">Post
                            </button>
                        </div>
                    </div>
                </>

            </div>
        );
    }

}

function NotFoundPage() {
    document.title = "NOT FOUND";
    return (
        <div className="notFound">
            <div className="header">
                <h2><a href="/">Belay</a></h2> {/* Consider replacing <a> with <Link> if using React Router */}
                <h4>404 Error</h4>
            </div>
            <div className="clip">
                <div className="container">
                    <h1>404</h1>
                    <div className="message">
                        <h2>Oops, we can't find that page!</h2>
                        <a href="/">Let's go home and try again.</a> {/* Consider replacing <a> with <Link> if using React Router */}
                    </div>
                </div>
            </div>
        </div>

);
}


const rootContainer = document.getElementById('root');
const root = ReactDOM.createRoot(rootContainer);
root.render(
    <App/>
);
