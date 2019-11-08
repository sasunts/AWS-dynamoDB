//Importing relevant libraries
const express = require('express');
const app = express();
const aws = require('aws-sdk');

//Assigning a port value
const port = "3000";

//Listen on assigned port
app.listen(port, () => console.log(`Example app listening on port ${port}!`))

//API's for create, query and destory 
app.get('/create/',createDB);
app.get('/query/:param',queryDB);
app.get('/destroy/',destroyDB);

//Host the website located in the folder 'website'
app.use(express.static('website'));

//Configure aws access key
aws.config.setPromisesDependency();
        aws.config.update({
            accessKeyId: "AKIA3SGNJHTY6LWWQCUY",
            secretAccessKey: "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",
            region: 'eu-west-1'
        });
//New instances of s3 and dinamoDB
const s3 = new aws.S3();
const docClient = new aws.DynamoDB.DocumentClient();
const dynamodb = new aws.DynamoDB();

//Async function to get the s3 object with the movies
async function getData(){
    try {
        var params = {
            Bucket: "csu44000assignment2", 
            Key: "moviedata.json", 
           };
        const data = await s3.getObject(params).promise() 
        return data.Body
    } catch (e) {
        console.log('Error',e);
    }
};

//function linked with the create button
function createDB(req, res){
    var params = {
        TableName : "Movies",
        KeySchema: [       
            { AttributeName: "year", KeyType: "HASH"},  //Partition key
            { AttributeName: "title", KeyType: "RANGE" }  //Sort key
        ],
        AttributeDefinitions: [       
            { AttributeName: "year", AttributeType: "N" },
            { AttributeName: "title", AttributeType: "S" }
        ],
        BillingMode: "PAY_PER_REQUEST"
    };
    //create a dynamoDB table with above keyschema
    dynamodb.createTable(params, function (err, data) {
        if (err) {
            console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
        }
        else {
            console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });

    var params = {
        TableName: 'Movies' 
      };
      //Wait for a DB to be created then get results from s3 bucket 
      dynamodb.waitFor('tableExists', params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else  {
            getData().then(result => {
                // console.log(result)
                resToStr = result.toString()
                var allMovies = JSON.parse(resToStr);
                allMovies.forEach(function(movie) {
                    var params = {
                        TableName: "Movies",
                        Item: {
                            "year":  movie.year,
                            "title": movie.title,
                            "info":  movie.info
                        }
                    };
                    //fill the dynamoDB table with the new fetched data 
                    docClient.put(params, function(err, data) {
                        if (err) {
                            console.error("Unable to add movie", movie.title, ". Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("PutItem succeeded:", movie.title);
                        }
                    });
                });
            })
        }   
      });

}

//Function linked with the query button
function queryDB(req, res){
    //split request into an array 
    var paramArr = req.params.param.split("_")
    //make str request upercase at the first char as they all are upercase in DB
    var text = paramArr[1].charAt(0).toUpperCase() + paramArr[1].substring(1);
    var params = {
        TableName : "Movies",
        ProjectionExpression:"#yr, title, info.#rnk, info.release_date",
        KeyConditionExpression: "#yr = :yyyy and begins_with(title, :prefix)",
        ExpressionAttributeNames:{
            "#yr": "year",
            "#rnk": "rank"
        },
        ExpressionAttributeValues: {
            ":yyyy":parseInt(paramArr[0]),
            ":prefix": text
        }
    };
    //Query dynamoDB with above params and send data to client
    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            res.json(data)
        }
    });


}

// function which is linked to destroy button 
function destroyDB(req, res){
    var params = {
        TableName : "Movies"
    };
    //delete dynamoDB Table with above tablename
    dynamodb.deleteTable(params, function(err, data) {
        if (err) {
            console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            res = "Success"
            console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });
}