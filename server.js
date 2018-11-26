const express = require('express');
var exphbs  = require('express-handlebars');
const mysql = require('mysql');
const path = require('path');
const app = express();

/*
Things to implement if time allows
- configure HTTPS with "Lets Encrypt"
- containerize application
 */

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

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

//sample query
connection.query("SELECT * FROM word",
    function (err, res){
        if(err){
            console.log(err);
            return;
        }
        res.forEach(function(res) {
            console.log(res.word_ID, ' ', res.word);
        })
    });

/*
app.get('/', (req, res) =>
    res.sendFile(path.join(__dirname + '/index.html'))
);
*/

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/login', function (req, res) {
    res.render('login');
});

app.get('/profileCreation', function (req, res) {
    res.render('profileCreation');
});






const port = process.env.PORT || 1337;

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

console.log("Server running at http://localhost:%d", port);

/*
app.listen(port, (err) => {
    if (err) {return console.log('something bad happened', err)}
    console.log(`server is listening on ${port}`)
});
*/