// Constants to easily refer to pages
const SPLASH = document.querySelector(".splash");
const PROFILE = document.querySelector(".profile");
const LOGIN = document.querySelector(".login");
const ROOM = document.querySelector(".room");
const ISLOGIN = document.querySelector(".loggedIn")
const ISLOGOUT = document.querySelector(".loggedOut")

// Custom validation on the password reset fields
const passwordField = document.querySelector(".profile input[name=password]");
const repeatPasswordField = document.querySelector(".profile input[name=repeatPassword]");
const repeatPasswordMatches = () => {
    const p = document.querySelector(".profile input[name=password]").value;
    const r = repeatPassword.value;
    return p == r;
};

const checkPasswordRepeat = () => {
    const passwordField = document.querySelector(".profile input[name=password]");
    if (passwordField.value == repeatPasswordField.value) {
        repeatPasswordField.setCustomValidity("");
        return;
    } else {
        repeatPasswordField.setCustomValidity("Password doesn't match");
    }
}

let CURRENT_ROOM = 0;
passwordField.addEventListener("input", checkPasswordRepeat);
repeatPasswordField.addEventListener("input", checkPasswordRepeat);


// TODO:  On page load, read the path and whether the user has valid credentials:
//        - If they ask for the splash page ("/"), display it
//        - If they ask for the login page ("/login") and don't have credentials, display it
//        - If they ask for the login page ("/login") and have credentials, send them to "/"
//        - If they ask for any other valid page ("/profile" or "/room") and do have credentials,
//          show it to them
//        - If they ask for any other valid page ("/profile" or "/room") and don't have
//          credentials, send them to "/login", but remember where they were trying to go. If they
//          login successfully, send them to their original destination
//        - Hide all other pages

// TODO:  When displaying a page, update the DOM to show the appropriate content for any element
//        that currently contains a {{ }} placeholder. You do not have to parse variable names out
//        of the curly  braces—they are for illustration only. You can just replace the contents
//        of the parent element (and in fact can remove the {{}} from index.html if you want).

// TODO:  Handle clicks on the UI elements.
//        - Send API requests with fetch where appropriate.
//        - Parse the results and update the page.
//        - When the user goes to a new "page" ("/", "/login", "/profile", or "/room"), push it to
//          History

// TODO:  When a user enters a room, start a process that queries for new chat messages every 0.1
//        seconds. When the user leaves the room, cancel that process.
//        (Hint: https://developer.mozilla.org/en-US/docs/Web/API/setInterval#return_value)

// On page load, show the appropriate page and hide the others


let showOnly = (element) => {
    CURRENT_ROOM = 0;
    PROFILE.classList.add("hide");
    LOGIN.classList.add("hide");
    ROOM.classList.add("hide");
    SPLASH.classList.add("hide");

    element.classList.remove("hide");
}

let credentials = () => localStorage.getItem('api_key') !== null;
console.log("localStorage.getItem('api_key')", localStorage.getItem('api_key'));

// show only one page at a time
let router = () => {
    let path = window.location.pathname;
    stopMessagePolling(CURRENT_ROOM);
    if (path === "/") {
        showOnly(SPLASH);
        if (credentials()) {
            getProfileDetailOnSplash();
            getRoomListForSplash();
            ISLOGIN.classList.remove('hide');
            ISLOGOUT.classList.add('hide');
            document.querySelector(".signup").classList.add('hide');
            document.querySelector(".create").classList.remove('hide');
        } else {
            ISLOGOUT.classList.remove('hide');
            ISLOGIN.classList.add('hide');
            document.querySelector(".signup").classList.remove('hide');
            document.querySelector(".create").classList.add('hide');
        }
    } else if (path === "/login") {
        stopMessagePolling(CURRENT_ROOM);
        if (credentials()) {
            showOnly(PROFILE);
            getProfileDetail();
        } else {
            showOnly(LOGIN);
        }
    } else if (path === "/profile") {
        stopMessagePolling(CURRENT_ROOM);
        if (credentials()) {
            showOnly(PROFILE);
            getProfileDetail();
        } else {
            localStorage.setItem('redirect_after_login', path);
            showOnly(LOGIN);
            window.history.pushState({}, '', '/login');
        }
    } else if (path.startsWith("/room/")) {
        // get room number by pathname, just after the 'room/'
        // CURRENT_ROOM = 5 // ...
        // get room id
        // start quering
        // ...
        if (credentials()) {
            showOnly(ROOM);
            CURRENT_ROOM = path.split("/")[2];

            let queryurl = '/api/room';
            // console.log(query)
            const myInit = {
                method: "GET",
                headers: {
                    'Authorization': localStorage.getItem('api_key')
                }
            }
            fetch(queryurl, myInit)
                .then(response => response.json())
                .then(rooms => {
                    if (rooms.length < CURRENT_ROOM) {
                        fetch('/404.html')
                            .then(response => response.text())
                            .then(html => {
                                document.body.innerHTML = html;
                            })
                            .catch(err => console.error('Failed to load the 404 page:', err));
                    } else {
                        startPolling(CURRENT_ROOM);
                    }
                });

        } else {
            localStorage.setItem('redirect_after_login', path);
            showOnly(LOGIN);
            window.history.pushState({}, '', '/login');
        }
    } else {
        stopMessagePolling(CURRENT_ROOM);
        fetch('/404.html')
            .then(response => response.text())
            .then(html => {
                document.body.innerHTML = html;
            })
            .catch(err => console.error('Failed to load the 404 page:', err));
    }
}

window.addEventListener("popstate", router); // go back to previous page (history)

window.addEventListener("DOMContentLoaded", () => {
    router();
    window.history.replaceState({}, '', window.location.pathname);
});


// TODO: --------------------------------BELOW FOR THE /ROOM--------------------------------
// TODO: --------------------------------BELOW FOR THE /ROOM--------------------------------
// TODO: --------------------------------BELOW FOR THE /ROOM--------------------------------
// TODO: POLLING messages to current room

let messagePollingInterval;
let roomDetailInterval;

function startPolling(room_id) {
    if (!messagePollingInterval) {
        messagePollingInterval = setInterval(() => getMessagesFromRoom(room_id), 100);
    }
    if (!roomDetailInterval) {
        roomDetailInterval = setInterval(() => getRoomDetail(room_id), 100);
    }
}

function getRoomDetail(room_id) {
    let query = '/api/room/' + room_id;
    const myInit = {
        method: "GET",
        headers: {
            'Authorization': localStorage.getItem('api_key')
        }
    }
    fetch(query, myInit)
        .then(response => response.json())
        .then(room_detail => {
            // console.log("room_detail", room_detail.name))
            const roomNameElement = document.querySelector(".curr_room_name strong");
            if (roomNameElement) {
                roomNameElement.textContent = room_detail.name;

            }
            const curr_username = document.querySelector(".room .loginHeader .loggedIn .welcomeBack .username");
            console.log("curr_username", curr_username)
            if (curr_username) {
                curr_username.textContent = room_detail.username;
            }
            console.log("after curr_username", curr_username)
        });
}

function getMessagesFromRoom(room_id) {
    let query = '/api/room/' + room_id + '/messages';
    console.log(query)
    const myInit = {
        method: "GET",
        headers: {
            'Authorization': localStorage.getItem('api_key')
        }
    }
    fetch(query, myInit)
        .then(response => response.json())
        .then(messages => {
            const messagesContainer = document.querySelector(".messages");
            messagesContainer.innerHTML = '';

            messages.forEach(message => {

                const messageElement = document.createElement("message");
                const authorElement = document.createElement("author");
                const contentElement = document.createElement("content");

                authorElement.textContent = message.name;
                contentElement.textContent = message.body;

                messageElement.appendChild(authorElement);
                messageElement.appendChild(contentElement);

                messagesContainer.appendChild(messageElement);

            })

        });

    const shareLinkElement = document.querySelector(".roomDetail .shar_link");
    if (shareLinkElement) {
        shareLinkElement.textContent = `/room/${room_id}`;
    }
}

function stopMessagePolling() {
    clearInterval(messagePollingInterval);
    messagePollingInterval = null;
    clearInterval(roomDetailInterval);
    roomDetailInterval = null;
}

// TODO: post message to current room
document.addEventListener('DOMContentLoaded', () => {
    const postButton = document.querySelector('.comment_box button[type="submit"]');

    postButton.addEventListener('click', () => {
        console.log("Posting message to the room");
        const messageInput = document.querySelector('.comment_box textarea');
        const message = messageInput.value;

        const roomId = window.location.pathname.split("/")[2];

        let queryUrl = "/api/room/" + roomId + "/messages";
        fetch(queryUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('api_key')
            },
            body: JSON.stringify({body: message})
        })
            .then(response => {
                if (response.ok) {
                    messageInput.value = '';
                } else {
                    console.error('Failed to post message');
                }
            })
            .catch(error => console.error('Error:', error));
    });
});


// TODO: Hide and show icon for update room name
document.addEventListener('DOMContentLoaded', () => {
    const editIcon = document.querySelector('.displayRoomName a');
    const displayRoomNameDiv = document.querySelector('.displayRoomName');
    const editRoomNameDiv = document.querySelector('.editRoomName');

    editRoomNameDiv.style.display = 'none';

    editIcon.addEventListener('click', () => {
        displayRoomNameDiv.style.display = 'none';
        editRoomNameDiv.style.display = 'block';
    });


});


// TODO: update room name, remove and add hide
document.addEventListener('DOMContentLoaded', () => {
    const updateButton = document.querySelector('.editRoomName button');
    const roomNameInput = document.querySelector('.editRoomName input');
    const roomNameDisplay = document.querySelector('.displayRoomName strong');
    const displayRoomNameDiv = document.querySelector('.displayRoomName');
    const editRoomNameDiv = document.querySelector('.editRoomName');

    updateButton.addEventListener('click', () => {
        const newRoomName = roomNameInput.value;
        console.log(newRoomName);

        room_id = window.location.pathname.split("/")[2];
        fetch('/api/room/' + room_id, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('api_key')
            },
            body: JSON.stringify({id: room_id, name: newRoomName})
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update room name');
                }
                const new_room_name_container = document.querySelector(".editRoomName input");
                new_room_name_container.innerHTML = '';

                return response.json();
            })
            .then(data => {
                // roomNameDisplay.textContent = newRoomName;
                displayRoomNameDiv.style.display = 'block';
                editRoomNameDiv.style.display = 'none';
            })
            .catch(error => {
                console.error('Error:', error);
                // Handle error (e.g., show an error message to the user)
            });
    });
});

// TODO: room link
document.querySelector(".roomDetail .shar_link").addEventListener("click", () => {
    console.log("share_link works");
    room_id = window.location.pathname.split("/")[2];
    console.log("share_link works", '/room/' + room_id);
    navigateTo('/room/' + room_id, 'room_link');
});


// TODO: Top left : go to the splash page
document.querySelector(".room .go_to_splash_page").addEventListener("click", () => {
    navigateTo('/', 'Watch Party Main Page');
});

// TODO: Top right : go to profile page
document.querySelector(".room .loginHeader").addEventListener("click", () => {
    navigateTo('/profile', 'Profile Page');
});

//  TODO: --------------------------------DONE FOR THE /ROOM--------------------------------
//  TODO: --------------------------------DONE FOR THE /ROOM--------------------------------
//  TODO: --------------------------------DONE FOR THE /ROOM--------------------------------


// TODO: --------------------------------BELOW FOR THE /LOGIN--------------------------------
// TODO: --------------------------------BELOW FOR THE /LOGIN--------------------------------
// TODO: --------------------------------BELOW FOR THE /LOGIN--------------------------------

// TODO: add and remove the login error message:

LOGINERROR = document.querySelector(".failed .message")
LOGINERROR.classList.add("hide");

// TODO: login BUTTON of /login
document.querySelector(".login button").addEventListener("click", () => {

    const username = document.querySelector(".login input[name=username]").value;
    const password = document.querySelector(".login input[name=password]").value;
    console.log(localStorage.getItem('api_key'));
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({username, password})
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Login failed');
            }
            return response.json();
        })
        .then(data => {
            if (data.api_key) {
                localStorage.setItem('api_key', data.api_key);
                const redirectPath = localStorage.getItem('redirect_after_login') || '/';
                localStorage.removeItem('redirect_after_login');
                navigateTo(redirectPath, 'User Login');
            } else {
                LOGINERROR.classList.remove(("hide"));
                // console.log('Login failed');
            }
        })
        .catch(error => {
            LOGINERROR.classList.remove(("hide"));
            console.error('Login error:', error);
        });
});

// TODO: Sign up button
document.querySelector(".login .clip .auth .failed button").addEventListener("click", () => {
    queryUrl = '/api/signup';
    fetch(queryUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                console.log("Fail to sign up");
            }
            console.log("signup successfully")
            return response.json();
        })
        .then(data => {
            localStorage.setItem('api_key', data.api_key);
            console.log("in sign up", localStorage.getItem('api_key'));
            navigateTo('/profile', 'User Sign Up');
            console.log("jump after")
            getProfileDetail();
        })
})

document.querySelector(".login .header").addEventListener("click", () => {
    navigateTo('/', 'Watch Party Main Page');
});


// TODO: --------------------------------DONE FOR THE /LOGIN--------------------------------
// TODO: --------------------------------DONE FOR THE /LOGIN--------------------------------
// TODO: --------------------------------DONE FOR THE /LOGIN--------------------------------


// TODO: --------------------------------BELOW FOR THE /SPLASH--------------------------------
// TODO: --------------------------------BELOW FOR THE /SPLASH--------------------------------
// TODO: --------------------------------BELOW FOR THE /SPLASH--------------------------------


HASROOM = document.querySelector(".noRooms")
HASROOM.classList.add("hide");
// TODO: Sign up button
document.querySelector(".splash .hero .signup").addEventListener("click", () => {
    queryUrl = '/api/signup';
    fetch(queryUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                console.log("Fail to sign up");
            }
            console.log("signup successfully")
            return response.json();
        })
        .then(data => {
            localStorage.setItem('api_key', data.api_key);
            console.log("in sign up", localStorage.getItem('api_key'));
            navigateTo('/profile', 'User Profile');
            console.log("jump after")
            getProfileDetail();
        })
})

// TODO: show {{username}} of /splash
function getProfileDetailOnSplash() {
    let query = '/api/profile';
    const myInit = {
        method: "GET",
        headers: {
            'Authorization': localStorage.getItem('api_key')
        }
    }
    fetch(query, myInit)
        .then(response => response.json())
        .then(profile_detail => {
            // TODO: for the top right username
            const curr_username =
                document.querySelector(".splash .splashHeader .loggedIn .welcomeBack .username");
            console.log("curr_username", curr_username);
            if (curr_username) {
                curr_username.textContent = profile_detail.username;
            }
            console.log("after curr_username", curr_username);
        });
}

// TODO: Top right : Logged in --- go to profile page
document.querySelector(".splash .splashHeader .loginHeader .loggedIn .welcomeBack")
    .addEventListener("click", () => {
        navigateTo('/profile', 'User Profile');
    });

// TODO: Top right : First log in --- go to profile page
document.querySelector(".splash .splashHeader .loginHeader ")
    .addEventListener("click", () => {
        navigateTo('/profile', 'User Profile');
    });

// TODO: show {{username}} of /splash
function getRoomListForSplash() {
    let query = '/api/room';
    // console.log(query)
    const myInit = {
        method: "GET",
        headers: {
            'Authorization': localStorage.getItem('api_key')
        }
    }
    fetch(query, myInit)
        .then(response => response.json())
        .then(rooms => {
            console.log("rooms", rooms);
            const roomListContainer = document.querySelector(".roomList");
            roomListContainer.innerHTML = '';
            if (rooms.length > 0) {
                console.log("enter if")
                rooms.forEach(room => {
                    const roomList = document.createElement("a");
                    roomList.innerHTML = `${room.id}: <strong>${room.name}</strong>`;
                    // roomList.href = '#';
                    roomList.addEventListener('click', (event) => {
                        navigateTo(`/room/${room.id}`, `room#${room.id}`);
                    })
                    console.log(roomList);
                    roomListContainer.appendChild(roomList);
                })
            } else {
                HASROOM.classList.remove('hide');
            }
        });
}

// TODO: create a room
console.log("document.querySelector(\".splash .create button\")", document.querySelector(".splash.container .hero .create"));
document.querySelector(".splash.container .hero .create").addEventListener("click", () => {
    queryUrl = '/api/room';
    fetch(queryUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('api_key')
        }
    })
        .then(response => {
            if (!response.ok) {
                console.log("Fail to create a room");
            }
            console.log("create a room successfully")
            return response.json();
        })
        .then(data => {
            navigateTo(`/room/${data.id}`, `room#${data.id}`);
            startPolling(data.id);
        })
})

// TODO: --------------------------------DONE FOR THE /SPLASH--------------------------------
// TODO: --------------------------------DONE FOR THE /SPLASH--------------------------------
// TODO: --------------------------------DONE FOR THE /SPLASH--------------------------------


// TODO: --------------------------------BELOW FOR THE /PROFILE--------------------------------
// TODO: --------------------------------BELOW FOR THE /PROFILE--------------------------------
// TODO: --------------------------------BELOW FOR THE /PROFILE--------------------------------

// TODO: update the username
document.querySelector(".profile button.update_name").addEventListener("click", () => {
    const username = document.querySelector(".profile input[name=username]").value;
    const api_key = localStorage.getItem('api_key');
    if (!api_key) {
        alert('You must login first!')
        return;
    }
    let query = '/api/profile';
    fetch(query, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': api_key
        },
        body: JSON.stringify({name: username})
    })
        .then(response => {
            if (response.ok) {
                alert('New User name applied!')
                return response.json
            } else {
                alert('Fail to update username!')
            }
        })
        .then(data => {
            document.querySelector('')
        })
        .catch(error => console.error())

});

// TODO: Update the password of profile page
document.querySelector(".profile button.update_password").addEventListener("click", () => {
    const password = document.querySelector(".profile input[name=password]").value;
    const repeatPassword = document.querySelector(".profile input[name=repeatPassword]").value;
    const api_key = localStorage.getItem('api_key');
    if (password && password === repeatPassword) {
        let query = '/api/profile';
        fetch(query, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': api_key,
            },
            body: JSON.stringify({password: repeatPassword})
        })
            .then(response => {
                if (response.ok) {
                    getProfileDetail();
                    alert('New User password applied!')
                } else {
                    alert('Fail to update password!')
                }
            })
            .catch(error => console.error())
    } else {
        alert("Make sure your repeate password is same as passoword");
    }
});

// TODO: show {{username}} and {{password}} of /profile
function getProfileDetail() {
    let query = '/api/profile';
    const myInit = {
        method: "GET",
        headers: {
            'Authorization': localStorage.getItem('api_key')
        }
    }
    fetch(query, myInit)
        .then(response => response.json())
        .then(profile_detail => {

            // TODO: for the input username
            const input_username =
                document.querySelector(".profile .clip .auth .alignedForm [name=username]");
            console.log("input_username", input_username);
            if (input_username) {
                input_username.value = profile_detail.username;
            }

            // TODO: for the input password
            const input_password =
                document.querySelector(".profile .clip .auth .alignedForm [name=password]");
            console.log("input_username", input_username);
            if (input_password) {
                input_password.value = profile_detail.password;
            }
            console.log("after input_password.value", input_password.value);

            // TODO: for the repeat input password
            const repeat_input_password =
                document.querySelector(".profile .clip .auth .alignedForm [name=repeatPassword]");
            console.log("input_username", input_username);
            if (repeat_input_password) {
                repeat_input_password.value = profile_detail.password;
            }
            console.log("after input_password.value", input_password.value);

            // TODO: for the top right username
            const curr_username =
                document.querySelector(".profile .loginHeader .loggedIn .welcomeBack .username");
            console.log("curr_username", curr_username)
            if (curr_username) {
                curr_username.textContent = profile_detail.username;
            }
            console.log("after curr_username", curr_username);
        });
}

// TODO: Cool, let's go BUTTON of /profile
document.querySelector(".profile button.goToSplash").addEventListener("click", () => {
    navigateTo('/', 'Watch Party Main Page');
});

// TODO: Top left: go to splash page:
document.querySelector(".profile .header").addEventListener("click", () => {
    navigateTo('/', 'Watch Party Main Page');
});

// TODO: Log out BUTTON of /profile
document.querySelector(".profile button.logout").addEventListener("click", () => {
    localStorage.removeItem('api_key');
    navigateTo('/login', 'User Log In');
});

// TODO: --------------------------------DONE FOR THE /PROFILE--------------------------------
// TODO: --------------------------------DONE FOR THE /PROFILE--------------------------------
// TODO: --------------------------------DONE FOR THE /PROFILE--------------------------------


const navigateTo = (path, title) => {
    document.title = title;
    window.history.pushState({}, '', path);
    router();
};
