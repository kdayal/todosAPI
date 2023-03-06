const { Stack, Duration } = require('aws-cdk-lib');
const apigateway = require("aws-cdk-lib/aws-apigateway");
const lambda = require("aws-cdk-lib/aws-lambda");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");

class TodosApiStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // lambda as the handler for the /todos end points
    const handler = new lambda.Function(this, 'todosHandler', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("src"),
      handler: 'todos.handler',
      environment: {
        TABLE_NAME: 'todosTable'
      }
    });

    // table to store the data
    const todosTable = new dynamodb.Table(this, 'todosTable', {
      partitionKey: {
        name: 'userName',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      tableName: 'todosTable',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
    });

    // give read and write permissions to the lambda
    todosTable.grantReadWriteData(handler);

    // create an API Gateway as the entry point for all api end points
    const api = new apigateway.RestApi(this, 'todosApi', {
      restApiName: 'Todos API'
    });

    const todosLambdaIntegration = new apigateway.LambdaIntegration(handler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.addMethod("GET", todosLambdaIntegration);
    
    const todosResource = api.root.addResource('todos');
    todosResource.addMethod("GET", todosLambdaIntegration);
    todosResource.addMethod("POST", todosLambdaIntegration);

    const singleTodo = todosResource.addResource('{id}');
    singleTodo.addMethod('GET', todosLambdaIntegration); // GET /todos/{id}
    singleTodo.addMethod('PUT', todosLambdaIntegration); // PUT /todos/{id}
    singleTodo.addMethod('DELETE', todosLambdaIntegration); //DELETE /todos/{id}

  }
  
}

module.exports = { TodosApiStack }
