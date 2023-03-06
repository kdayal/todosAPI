const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const ddbClient = new DynamoDBClient();
module.exports = { ddbClient };