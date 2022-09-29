const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

const format = require("date-fns/format");

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

///
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const convertDBResponseToResponseObj = (dbResponse) => {
  let todoList = [];
  for (eachTodo of dbResponse) {
    const todo = {
      id: eachTodo.id,
      todo: eachTodo.todo,
      priority: eachTodo.priority,
      status: eachTodo.status,
      category: eachTodo.category,
      dueDate: eachTodo.due_date,
    };
    todoList.push(todo);
  }
  return todoList;
};

///API 1
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;
  let getTodoQuery = "";

  switch (true) {
    case hasStatusProperty(request.query):
      getTodoQuery = ` 
             SELECT *
             FROM todo
            WHERE 
            todo LIKE '%${search_q}%' AND 
            status = '${status}';
            `;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = ` 
             SELECT *
             FROM todo
            WHERE 
            todo LIKE '%${search_q}%' AND 
            priority = '${priority}';
            `;
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = ` 
             SELECT *
             FROM todo
            WHERE 
            todo LIKE '%${search_q}%' AND 
            priority = '${priority}'
            AND status = '${status};
            `;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodoQuery = ` 
             SELECT *
             FROM todo
            WHERE 
            todo LIKE '%${search_q}%' AND 
            category = '${category}'
            AND status = '${status};
            `;
      break;
    case hasCategoryProperty(request.query):
      getTodoQuery = ` 
             SELECT *
             FROM todo
            WHERE 
            todo LIKE '%${search_q}%' AND 
            category = '${category}';
            `;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodoQuery = ` 
             SELECT *
             FROM todo
            WHERE 
            todo LIKE '%${search_q}%' AND 
            category = '${category}'
            AND priority = '${priority};
            `;
      break;
    default:
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  const dbResponse = await db.all(getTodoQuery);

  const todoList = convertDBResponseToResponseObj(dbResponse);

  response.send(todoList);
});

///API 2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT *
    FROM todo
    WHERE id = ${todoId};
  `;
  const dbResponse = await db.get(getTodoQuery);
  const convertDBResponseToResponseObj = (dbResponse) => {
    return {
      id: dbResponse.id,
      todo: dbResponse.todo,
      priority: dbResponse.priority,
      status: dbResponse.status,
      category: dbResponse.category,
      dueDate: dbResponse.due_date,
    };
  };
  const todo = convertDBResponseToResponseObj(dbResponse);
  response.send(todo);
});

///API 3

///API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, dueDate } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status, due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}'), ${dueDate};`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});
///API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "due_date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      due_date = '${dueDate}',
      category = '${category}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});
///API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
