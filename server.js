//Importing relevant libraries
var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
const express = require('express');
const app = express();
const Vue = require("vue");
var $ = jQuery = require('jquery')(window);

//Assigning a port value
const port = "3000";

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

app.get('/create/:name',createDB)

//Host the website located in the folder
app.use(express.static('website'))

function createDB(req, res){

}