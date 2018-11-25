const express = require('express');
const mysql = require('mysql');
const path = require('path');
const app = express();

//var http = require('http');

/*
Things to implement if time allows
- configure HTTPS with "Lets Encrypt"
- containerize application
- produce a CI/CD build and release in VSTS
 */

app.use(express.static(path.join(__dirname, 'public')));


//set up database connection
const connection = mysql.createConnection({
    host: 'typetester-db.mysql.database.azure.com',
    user: 'AdminUser14@typetester-db',
    password: 'HelloGoodbye12!',
    database: 'cs340_final'
});
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected!');
});


/*
const server = http.createServer(function(request, response) {

    response.writeHead(200, {"Content-Type": "text/plain"});
    response.end("Hello World!");

});
*/


app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname + '/index.html'))
);

const port = process.env.PORT || 1337;

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

console.log("Server running at http://localhost:%d", port);

/*
app.listen(port, (err) => {
    if (err) {return console.log('something bad happened', err)}
    console.log(`server is listening on ${port}`)
});
*/