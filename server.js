//Importing relevant libraries
const express = require('express');
const app = express();
const aws = require('aws-sdk');

//Assigning a port value
const port = "80";

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

app.get('/create/',createDB);
app.get('/query/:param',queryDB);
app.get('/destroy/',destroyDB);

//Host the website located in the folder
app.use(express.static('website'));

aws.config.setPromisesDependency();
        aws.config.update({
            accessKeyId: "AKIA3SGNJHTY6LWWQCUY",
            secretAccessKey: "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",
            region: 'eu-west-1'
        });

const s3 = new aws.S3();
var docClient = new aws.DynamoDB.DocumentClient();
var dynamodb = new aws.DynamoDB();

async function getData(){
    try {
        const s3 = new aws.S3();
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

//Finished
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
//---------------------------------------------------------
//TODO: Finish this guy 
function queryDB(req, res){
    console.log("query pressed")
    var paramArr = req.params.param.split("_")
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
    
    docClient.query(params, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            res.json(data)
            // var str = {}
            // var k = 0
            // console.log("Query succeeded.");
            // data.Items.forEach(function(item) {
            //     console.log(item)
            //     str[k] = item
            //     k++;
            //     // {"year":item.year,"title":item.title, "rank":item.info.rank, "release":item.info.release_date}
            // });
            // console.log(str)
            // res.json(str) 
        }
    });


}

//---------------------------------------------------------



// Finished this function
function destroyDB(req, res){
    var params = {
        TableName : "Movies"
    };
    
    dynamodb.deleteTable(params, function(err, data) {
        if (err) {
            console.error("Unable to delete table. Error JSON:", JSON.stringify(err, null, 2));
        } else {
            res = "Success"
            console.log("Deleted table. Table description JSON:", JSON.stringify(data, null, 2));
        }
    });
}