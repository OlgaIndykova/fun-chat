(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const Pages = {
  LOGIN: "/login",
  MAIN: "/main",
  ABOUT: "/about",
  NOT_FOUND: "/not_found"
};
const createInput = (parameters = {}) => {
  const input = document.createElement("input");
  if (parameters.className) {
    input.className = parameters.className;
  }
  if (parameters.attributes) {
    for (const [key, value] of Object.entries(parameters.attributes)) {
      input.setAttribute(key, value);
    }
  }
  return input;
};
function createElement(tag, className, textContent, id, onClick) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  if (id) element.id = id;
  if (onClick) element.addEventListener("click", onClick);
  return element;
}
let senderLogin;
const sendMessage = (event) => {
  event.preventDefault();
  const userInput = document.querySelector(".user-input");
  const person = document.querySelector(".companion-name");
  if (!userInput.value.trim()) return;
  senderLogin = person.textContent || "";
  ws.send(
    JSON.stringify({
      id: "",
      type: "MSG_SEND",
      payload: {
        message: {
          to: person.textContent,
          text: userInput.value.trim()
        }
      }
    })
  );
  userInput.value = "";
};
const allUsers = [];
let userListLoaded = false;
const setUserListLoaded = (value) => {
  userListLoaded = value;
};
const showUsers = () => {
  if (!userListLoaded) {
    userListLoaded = true;
    sendMessageToServer("USER_ACTIVE");
    sendMessageToServer("USER_INACTIVE");
  }
  const input = app.querySelector(".user-search");
  input.addEventListener("input", () => {
    const searchString = input.value;
    showFilteredUsers(searchString);
  });
};
const showFilteredUsers = (value) => {
  const usersField = app.querySelector(".users-field");
  usersField.replaceChildren();
  const filtered = allUsers.filter((user) => user.login.toLowerCase().startsWith(value.toLowerCase()));
  for (const item of filtered) {
    usersField.append(addUser(item.login, item.type));
  }
};
const addUser = (name, type) => {
  const userContainer = createElement("div", "user-wrapper");
  const user = createElement("span", "contact", name);
  const userInput = document.querySelector(".user-input");
  const sendButton = document.querySelector(".send-btn");
  if (type === "USER_ACTIVE") {
    user.classList.add("active");
  }
  if (type === "USER_INACTIVE") {
    user.classList.add("inactive");
  }
  user.addEventListener("click", () => {
    const companion = document.querySelector(".companion-name");
    const messagesField = document.querySelector(".messages-field");
    companion.textContent = name;
    companion.style.color = getComputedStyle(user).color;
    messagesField.textContent = "";
    userInput.removeAttribute("disabled");
    sendButton.removeAttribute("disabled");
  });
  const messageCounter = createElement("span", "message-counter");
  userContainer.append(user, messageCounter);
  return userContainer;
};
const sendMessageToServer = (type, payload = {}) => {
  if ((ws == null ? void 0 : ws.readyState) === WebSocket.OPEN) {
    ws.send(JSON.stringify({ id: "", type, payload }));
  }
};
const getCurrentUser = () => {
  const data = JSON.parse(localStorage.getItem("user") || "{}");
  return data;
};
const renderMainPage = () => {
  activateLogoutButton();
  const chatContainer = createElement("div", "chat-container");
  chatContainer.append(createUsersList(), createMessagesChanger());
  app.append(chatContainer);
  showUsers();
};
const activateLogoutButton = () => {
  const logoutButton = header.querySelector(".logout");
  logoutButton.removeAttribute("disabled");
};
const createUsersList = () => {
  const usersContainer = createElement("div", "users-container");
  const searchInput = createInput({
    className: "user-search",
    attributes: {
      type: "text",
      placeholder: "Find user..."
    }
  });
  const usersField = createElement("div", "users-field");
  usersContainer.append(searchInput, usersField);
  return usersContainer;
};
const createMessagesChanger = () => {
  const messagesContainer = createElement("div", "messages-container");
  const companion = createElement("div", "companion-name");
  const messagesField = createElement("div", "messages-field", "Choose a contact to start a conversation...");
  const createdMessage = createElement("form", "created-message");
  const userInput = createInput({
    className: "user-input",
    attributes: {
      type: "text",
      placeholder: "Enter your message...",
      disabled: "true"
    }
  });
  const sendButton = createElement("button", "send-btn", "send");
  sendButton.setAttribute("disabled", "true");
  createdMessage.append(userInput, sendButton);
  createdMessage.addEventListener("submit", (event) => sendMessage(event));
  messagesContainer.append(companion, messagesField, createdMessage);
  return messagesContainer;
};
const createUserMessage = (time, text2) => {
  const date = new Date(time);
  const messageWrapper = createElement("div", "message-wrapper");
  const messageWrapperTop = createElement("div", "messageWrapper-top");
  const dateTime = createElement("div", "date-time", date.toLocaleString());
  const senderName = createElement("div", "sender-name", senderLogin);
  const manipulations = createElement("div");
  const editButton = createElement("button", "edit-btn", "🖊️");
  const deleteButton = createElement("button", "delete-btn", "❌", "", () => messageWrapper.remove());
  manipulations.append(editButton, deleteButton);
  const messageText = createElement("div", "message-text", text2);
  const messageWrapperBottom = createElement("div", "messageWrapper-bottom");
  const editingMarker = createElement("div", "editing");
  const messageStatus = createElement("div", "message-status", "sent");
  messageWrapperTop.append(senderName, manipulations);
  messageWrapperBottom.append(dateTime, editingMarker, messageStatus);
  messageWrapper.append(messageWrapperTop, messageText, messageWrapperBottom);
  return messageWrapper;
};
let ws;
const delay = 2e3;
const timeShowError = 3e3;
let attempt = 1;
let createdModal;
const initWebSocket = () => {
  ws = new WebSocket("ws://localhost:4000/");
  const body = document.querySelector(".body");
  ws.addEventListener("close", () => {
    reconnectToServer();
    body.classList.add("hidden");
    console.warn("WebSocket closed");
  });
  ws.addEventListener("error", () => {
    reconnectToServer();
    body.classList.add("hidden");
    console.warn("WebSocket closed");
  });
  ws.addEventListener("open", () => {
    attempt = 1;
    console.log("WebSocket connected");
    createdModal == null ? void 0 : createdModal.remove();
    body.classList.remove("hidden");
  });
  ws.addEventListener("message", (event) => {
    const response = JSON.parse(event.data);
    if (response.type === "USER_LOGIN" && response.payload.user.isLogined) {
      globalThis.location.hash = Pages.MAIN;
      const userName = header.querySelector(".user-name");
      userName.textContent = `User:  ${response.payload.user.login}`;
      localStorage.setItem(
        "user",
        JSON.stringify({
          login: currentLogin,
          password: currentPassword,
          isLogined: true
        })
      );
    }
    if (response.type === "ERROR") {
      const errorMessage = response.payload.error;
      const errorContainer = header.querySelector(".error-container");
      if (errorMessage) {
        errorContainer.innerHTML = `Something went wrong:<br>${errorMessage}`;
        errorContainer.classList.add("show");
        setTimeout(() => {
          errorContainer.classList.remove("show");
        }, timeShowError);
      }
    }
    if (response.type === "USER_ACTIVE" || response.type === "USER_INACTIVE") {
      const usersField = app.querySelector(".users-field");
      const users = response.payload.users;
      const currentUser = getCurrentUser();
      for (const user of users) {
        if (user.login === currentUser.login) continue;
        usersField.append(addUser(user.login, response.type));
        allUsers.push({ login: user.login, type: response.type });
      }
    }
    if (response.type === "MSG_SEND") {
      const messagesField = document.querySelector(".messages-field");
      const newMessage = createUserMessage(response.payload.message.datetime, response.payload.message.text);
      messagesField.append(newMessage);
    }
  });
};
const reconnectToServer = () => {
  const body = document.querySelector(".body");
  if (!createdModal) {
    createdModal = createReconnectModal();
    body.prepend(createdModal);
  }
  body.classList.add("hidden");
  const connectionFrequency = delay * attempt;
  attempt += 1;
  setTimeout(() => {
    initWebSocket();
  }, connectionFrequency);
};
const createReconnectModal = () => {
  const modal = createElement("div", "modal");
  const modalBody = createElement("div", "modal-body");
  const modalText = createElement("p", "modal-text", "Loading");
  const loadingImage = createElement("div", "loading-image");
  modalBody.append(modalText, loadingImage);
  modal.append(modalBody);
  return modal;
};
const validateLogin = (login) => {
  const loginRegex = /^(?=.*[A-Z])[A-Za-z0-9]{4,}$/;
  const isValidLogin = login.trim() !== "" && loginRegex.test(login) ? true : false;
  return isValidLogin;
};
const validatePassword = (password) => {
  const passwordRegex = /^(?!.*[A-Z])[\S]{6}$/;
  const isValidPassword = password.trim() !== "" && passwordRegex.test(password) ? true : false;
  return isValidPassword;
};
const checkLoginValue = (input) => {
  const error = document.querySelector(".invalid-login");
  input.addEventListener("input", () => {
    const isValidLogin = validateLogin(input.value);
    input.classList.remove("valid", "invalid");
    if (isValidLogin) {
      input.classList.remove("invalid");
      input.classList.add("valid");
      error.textContent = "";
    } else {
      input.classList.add("invalid");
      input.classList.remove("valid");
      error.textContent = "from 4 to 20 characters long, contain at least one uppercase letter, and consist of only Latin letters and digits, with no whitespace or special characters allowed";
    }
  });
};
const checkPasswordValue = (input) => {
  const error = document.querySelector(".invalid-password");
  input.addEventListener("input", () => {
    const isValidLogin = validatePassword(input.value);
    input.classList.remove("valid", "invalid");
    if (isValidLogin) {
      input.classList.remove("invalid");
      input.classList.add("valid");
      error.textContent = "";
      return input.value;
    } else {
      input.classList.add("invalid");
      input.classList.remove("valid");
      error.textContent = "only 6 characters long, consist of integers and lowercase letter with no whitespace";
    }
  });
};
const renderLogin = () => {
  app.append(createUserForm());
  const form = document.querySelector(".user-form");
  const login = document.querySelector(".login");
  const password = document.querySelector(".password");
  const submitButton = document.querySelector(".submit");
  checkLoginValue(login);
  checkPasswordValue(password);
  login.addEventListener("input", () => updateSubmitButtonState(login, password, submitButton));
  password.addEventListener("input", () => updateSubmitButtonState(login, password, submitButton));
  form.addEventListener("submit", (event) => signIn(event, login.value, password.value));
};
const updateSubmitButtonState = (login, password, button) => {
  const loginNow = validateLogin(login.value);
  const passwordNow = validatePassword(password.value);
  if (loginNow && passwordNow) {
    button.removeAttribute("disabled");
  } else {
    button.setAttribute("disabled", "true");
  }
};
const createUserForm = () => {
  const formWrapper = createElement("div");
  const userForm = createElement("form", "user-form");
  const loginLabel = createElement("label", "label-login", "Login: ");
  const loginInput = createInput({
    className: "login input",
    attributes: {
      type: "text",
      placeholder: "Enter your login",
      autocomplete: "username",
      maxlength: "20"
    }
  });
  const invalidLogin = createElement("div", "invalid-login message", "");
  const passwordLabel = createElement("label", "label-password", "Password: ");
  const passwordInput = createInput({
    className: "password input",
    attributes: {
      type: "password",
      placeholder: "Enter your password",
      autocomplete: "current-password",
      maxlength: "6",
      minlength: "6"
    }
  });
  const invalidPassword = createElement("div", "invalid-password message", "");
  const submitButton = createElement("button", "submit btn", "SIGN IN");
  submitButton.setAttribute("type", "submit");
  submitButton.setAttribute("disabled", "true");
  loginLabel.append(loginInput, invalidLogin);
  passwordLabel.append(passwordInput, invalidPassword);
  userForm.append(loginLabel, passwordLabel, submitButton);
  formWrapper.append(userForm);
  return formWrapper;
};
let currentLogin = "";
let currentPassword = "";
let userAlreadyLoaded = false;
const logOut = () => {
  userAlreadyLoaded = false;
  setUserListLoaded(false);
  const data = localStorage.getItem("user");
  if (data) {
    const { login, password } = JSON.parse(data);
    ws.send(
      JSON.stringify({
        id: "user",
        type: "USER_LOGOUT",
        payload: {
          user: {
            login,
            password
          }
        }
      })
    );
  }
  localStorage.removeItem("user");
  app.replaceChildren();
  globalThis.location.hash = Pages.LOGIN;
  renderLogin();
  deactivateLogoutButton();
  hideUserName();
};
const deactivateLogoutButton = () => {
  const logoutButton = header.querySelector(".logout");
  logoutButton.setAttribute("disabled", "true");
};
const hideUserName = () => {
  const userName = header.querySelector(".user-name");
  userName.textContent = "";
};
const signIn = (event, login, password) => {
  userAlreadyLoaded = true;
  event.preventDefault();
  currentLogin = login;
  currentPassword = password;
  ws.send(
    JSON.stringify({
      id: "user",
      type: "USER_LOGIN",
      payload: {
        user: {
          login,
          password
        }
      }
    })
  );
};
const parseUrl = (url) => {
  const pathParts = url.split("/");
  const result = {
    path: pathParts[0] || "",
    resource: pathParts[1] || ""
  };
  return result;
};
const getCurrentPath = () => globalThis.location.hash ? globalThis.location.hash.slice(1) : globalThis.location.pathname.slice(1);
const redirectToNotFound = (routes2, navigate) => {
  const notFoundRoute = routes2.find(({ path }) => path === Pages.NOT_FOUND);
  if (notFoundRoute) {
    navigate(notFoundRoute.path);
  } else {
    console.error("Page not found");
  }
};
const createRouter = (routes2, rootElement) => {
  const navigate = (url) => {
    const { path, resource } = parseUrl(url);
    const fullPath = resource ? `${path}/${resource}` : path;
    const route = routes2.find(({ path: path2 }) => path2 === fullPath);
    if (fullPath === Pages.LOGIN && userAlreadyLoaded) {
      console.log(userAlreadyLoaded);
      return navigate(Pages.MAIN);
    }
    if (fullPath === Pages.MAIN && !userAlreadyLoaded) {
      console.log(userAlreadyLoaded);
      return navigate(Pages.LOGIN);
    }
    if (route) {
      rootElement.replaceChildren();
      route.callback(resource);
    } else {
      redirectToNotFound(routes2, navigate);
    }
    globalThis.location.hash = `#${url}`;
  };
  document.addEventListener("DOMContentLoaded", () => {
    const path = getCurrentPath();
    if (path === "") {
      navigate(Pages.LOGIN);
    } else {
      navigate(path);
    }
  });
  globalThis.addEventListener("popstate", () => navigate(getCurrentPath()));
  globalThis.addEventListener("hashchange", () => navigate(getCurrentPath()));
  return { navigate };
};
const renderNotFound = () => {
  app.textContent = "404 Not Found";
};
const text = "This project was created for educational purposes. Have fun!";
const renderAbout = () => {
  const mainInfo = createElement("div", "main-info");
  const title = createElement("h2", "title", "Welcome to FUN CHAT");
  const aboutChat = createElement("p", "about-chat", text);
  const backButton = createElement("button", "back btn", "BACK", "", () => globalThis.history.back());
  mainInfo.append(title, aboutChat, backButton);
  app.append(mainInfo);
};
const createHeader = () => {
  const header2 = createElement("header", "header");
  const appName = createElement("h1", "app-name", "FUN CHAT");
  const userName = createElement("div", "user-name");
  const errorContainer = createElement("div", "error-container");
  const buttonWrapper = createElement("div", "button-wrapper");
  const aboutButton = createElement("button", "about btn", "ABOUT", "", () => globalThis.location.hash = Pages.ABOUT);
  const logoutButton = createElement("button", "logout btn", "LOGOUT", "", logOut);
  logoutButton.setAttribute("disabled", "true");
  buttonWrapper.append(aboutButton, logoutButton);
  header2.append(appName, userName, errorContainer, buttonWrapper);
  return header2;
};
const createFooter = () => {
  const footer = createElement("footer", "footer");
  const schoolLogo = createElement("a", "link-logo");
  schoolLogo.href = "https://rs.school/";
  const logoImg = createElement("img", "logo-img");
  logoImg.src = "/rs-logo.png";
  const myAccount = createElement("a", "link-github", "OlgaIndykova");
  myAccount.href = "https://github.com/olgaindykova";
  const githubImg = createElement("img", "github-img");
  githubImg.src = "/github-logo.png";
  const currentYear = createElement("span", "current-year", "2025");
  schoolLogo.append(logoImg);
  myAccount.prepend(githubImg);
  footer.append(schoolLogo, myAccount, currentYear);
  return footer;
};
initWebSocket();
const app = createElement("div", "app");
const header = createHeader();
document.body.append(header, app, createFooter());
const routes = [
  { path: "", callback: () => renderLogin() },
  { path: Pages.LOGIN, callback: () => renderLogin() },
  { path: Pages.MAIN, callback: () => renderMainPage() },
  { path: Pages.ABOUT, callback: () => renderAbout() },
  { path: Pages.NOT_FOUND, callback: () => renderNotFound() }
];
createRouter(routes, app);
