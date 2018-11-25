const express = require('express');
//const mysql = require('mysql');
const path = require('path');
const app = express();
const port = 3000;

/*
Things to implement if time allows
- configure HTTPS with "Lets Encrypt"
- containerize application
- produce a CI/CD build and release in VSTS
 */

//app.use(express.static(path.join(__dirname, 'public')));

/*
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
*/

app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, (err) => {
    if (err) {return console.log('something bad happened', err)}
    console.log(`server is listening on ${port}`)
});