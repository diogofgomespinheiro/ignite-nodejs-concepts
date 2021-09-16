const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function findExistingUserAccountByUsername(username) {
  return users.find((user) => user.username === username);
}

function findUserTaskById(user, id) {
  return user.todos.find((task) => task.id === id);
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  if (!username) {
    return response.status(404).json({ error: "This user doesn't exist!" });
  }

  request.user = findExistingUserAccountByUsername(username);
  next();
}

function generateNewUser(name, username) {
  return {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };
}

function generateNewTask(title, deadline) {
  return {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };
}

app.post("/users", (request, response) => {
  const { body: { name, username } = {} } = request;

  const existingUser = findExistingUserAccountByUsername(username);
  if (existingUser) {
    return response
      .status(400)
      .json({ error: "This username already exists!" });
  }

  const newUser = generateNewUser(name, username);
  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.status(200).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user, body = {} } = request;
  const { title, deadline } = body;

  const task = generateNewTask(title, deadline);
  user.todos.push(task);

  return response.status(201).json(task);
});

app.put("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { body, params, user } = request;
  const { title, deadline } = body;
  const { id } = params;

  const task = findUserTaskById(user, id);
  if (!task) {
    return response.status(404).json({ error: "This task doesn't exist!" });
  }

  task.title = title;
  task.deadline = new Date(deadline);

  return response.status(200).json(task);
});

app.patch("/todos/:id/done", checksExistsUserAccount, (request, response) => {
  const { params, user } = request;
  const { id } = params;

  const task = findUserTaskById(user, id);
  if (!task) {
    return response.status(404).json({ error: "This task doesn't exist!" });
  }

  task.done = true;

  return response.status(200).json(task);
});

app.delete("/todos/:id", checksExistsUserAccount, (request, response) => {
  const { params, user } = request;
  const { id } = params;

  const taskIndex = user.todos.findIndex((task) => task.id === id);
  if (taskIndex < 0) {
    return response.status(404).json({ error: "This task doesn't exist!" });
  }

  user.todos.splice(taskIndex, 1);
  return response.status(204).json();
});

module.exports = app;
