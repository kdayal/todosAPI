const { 
    PutItemCommand, GetItemCommand, ScanCommand,
    DeleteItemCommand, UpdateItemCommand, QueryCommand
 } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { ddbClient } = require("./ddbClient.js");
const ULID = require('ulid');

exports.handler = async (event) => {
    
    console.log('Environment variable value');
    console.log(process.env.TABLE_NAME);

    let body;
    
    console.log('Contents of the event object');
    console.log(event);
    
    try {
        
        switch (event.httpMethod) {
            case 'GET':
                if(event.queryStringParameters != null && event.pathParameters == null) {
                    body = await getTodosByUsername(event); // GET todos?username=gargi
                  }
                  else if (event.pathParameters != null) {
                    body = await getTodo(event); // GET todos/{id}
                  } else {
                    body = 'Unsupported type of GET requests';
                  }
                break;
            case 'POST':
                body = await createTodo(event);
                break;
            case 'PUT':
                body = await updateTodo(event);
                // code
                break;
            case 'DELETE':
                body = await deleteTodo(event.pathParameters.id);
                break;
            default:
                // code
                body = 'Unknown type of request';
        }
    } catch (error) {
        console.log(error);
    }

    
    // TODO implement
    const response = {
        statusCode: 200,
        body: JSON.stringify(body),
    };
    return response;
};

/**
 * ====================================================
 */

const getTodo = async (event) => {
    console.log("getTodo");
  
    const userName = event.queryStringParameters.userName;
    const todoId = event.pathParameters.id;
    try {
      const params = {
        TableName: process.env.TABLE_NAME,
        Key: marshall({ userName: userName, id: todoId })
      };
  
      console.log('Passed Params to GetItemCommand in getTodo');
      console.log(params);
      
      const { Item } = await ddbClient.send(new GetItemCommand(params));
  
      console.log(Item);
      return (Item) ? unmarshall(Item) : {};
  
    } catch(e) {
      console.error(e);
      throw e;
    }
  }
  
  const getAllTodos = async () => {
    console.log("getAllTodos");
    try {
      const params = {
        TableName: process.env.TABLE_NAME
      };
  
      console.log('Passed Params to ScanCommand in getAllTodos');
      console.log(params);

      const { Items } = await ddbClient.send(new ScanCommand(params));
  
      console.log(Items);
      return (Items) ? Items.map((item) => unmarshall(item)) : {};
  
    } catch(e) {
      console.error(e);
      throw e;
    }
  }
  
  const createTodo = async (event) => {
    console.log(`createTodo function. event : "${event}"`);
    try {
      const todoRequest = JSON.parse(event.body);
      // set todoId
      const todoId = ULID.ulid();
      todoRequest.id = todoId;
  
      const params = {
        TableName: process.env.TABLE_NAME,
        Item: marshall(todoRequest || {})
      };
  
      console.log('Passed Params to PutItemCommand in createTodo');
      console.log(params);

      const createResult = await ddbClient.send(new PutItemCommand(params));
  
      console.log(createResult);
      return createResult;
  
    } catch(e) {
      console.error(e);
      throw e;
    }
  }
  
  const deleteTodo = async (todoId) => {
    console.log(`deleteTodo function. todoId : "${todoId}"`);
  
    try {
      const params = {
        TableName: process.env.TABLE_NAME,
        Key: marshall({ id: todoId }),
      };
  
      console.log('Passed Params to DeleteItemCommand in deleteTodo');
      console.log(params);

      const deleteResult = await ddbClient.send(new DeleteItemCommand(params));
  
      console.log(deleteResult);
      return deleteResult;
    } catch(e) {
      console.error(e);
      throw e;
    }
  }
  
  const updateTodo = async (event) => {
    console.log(`updateTodo function. event : "${event}"`);
    try {
      const requestBody = JSON.parse(event.body);
      const objKeys = Object.keys(requestBody);
      console.log(`updateTodo function. requestBody : "${requestBody}", objKeys: "${objKeys}"`);    
  
      const params = {
        TableName: process.env.TABLE_NAME,
        Key: marshall({ id: event.pathParameters.id }),
        UpdateExpression: `SET ${objKeys.map((_, index) => `#key${index} = :value${index}`).join(", ")}`,
        ExpressionAttributeNames: objKeys.reduce((acc, key, index) => ({
            ...acc,
            [`#key${index}`]: key,
        }), {}),
        ExpressionAttributeValues: marshall(objKeys.reduce((acc, key, index) => ({
            ...acc,
            [`:value${index}`]: requestBody[key],
        }), {})),
      };

      console.log('Passed Params to UpdateItemCommand in updateTodo');
      console.log(params);
  
      const updateResult = await ddbClient.send(new UpdateItemCommand(params));
  
      console.log(updateResult);
      return updateResult;
    } catch(e) {
      console.error(e);
      throw e;
    }
  
  }
  
  const getTodosByUsername = async (event) => {
    console.log("getTodosByUsername");
    try {
      // GET todos?userName=gargi
      const userName = event.queryStringParameters.userName;
  
      const params = {
        KeyConditionExpression: "userName = :userName",
        ExpressionAttributeValues: {
          ":userName": { S: userName }
        },      
        TableName: process.env.TABLE_NAME
      };
  
      console.log('Passed Params to QueryCommand in getTodosByUsername');
      console.log(params);

      const { Items } = await ddbClient.send(new QueryCommand(params));
  
      console.log(Items);
      return Items.map((item) => unmarshall(item));
    } catch(e) {
      console.error(e);
      throw e;
    }
  }