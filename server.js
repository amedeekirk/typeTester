const express = require('express');
const exphbs  = require('express-handlebars');
const session = require('express-session');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser');
const datetime = require('node-datetime');
const app = express();

/*
Things to implement if time allows
- configure HTTPS with "Lets Encrypt"
- containerize application
 */

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: '<mysecret>',
    saveUninitialized: true,
    resave: true}));


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

//root
app.get('/', function (req, res) {
    res.render('home');
});

//from home
app.get('/login', function (req, res) {
    res.render('login');
});

//from login
app.get('/profileCreation', function (req, res) {
    res.render('profileCreation');
});

app.get('/leaderboard', function (req, res) {
    res.render('leaderboard');
});

//from profileCreation
app.post('/profile',function(req, res){
    var context ={};

    if(req.body['passWord']) {
        //send error if passwords do not match
        if (req.body.passWord != req.body.userRePassword || req.body.passWord == "") {
            context.error = "you did not enter the same password!";
            res.render('profileCreation', context);
            return;
        }
        //send error if password is too short
        if(req.body.passWord.length < 10 ){
            context.error = "Passwords must be at least 10 characters long!";
            res.render('profileCreation', context);
            return;
        }
        //query the database for any user tuples with the same username, node-mysql automatically performs escaping
        else{
             connection.query("SELECT COUNT(*) AS identicalUser FROM user WHERE username = ?", [req.body.username], function(err, rows){
                if(err){
                    console.log(err);
                    return;
                }
                //we have a tuple with the same username
                if(rows[0].identicalUser == 1){
                    context.error = "Username already exists!";
                    res.render('profileCreation', context);
                    return;
                }
                //add tuple to the database and login, make session persistent
                else{
                    connection.query("INSERT INTO user (username) VALUES (?)", [req.body.username], function(err){
                        if(err){
                            console.log(err);
                            return;
                        }
                        console.log("1 record inserted");
                    });

                    //TO DO:
                    //populate an object with the information of the user, multiple queries gathering the results of the user and all of
                    //the users information then PASS this object as a parameter to the below function
                    res.render('account');
                }
             });
        }
    }
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