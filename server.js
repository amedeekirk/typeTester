const express = require('express');
const exphbs  = require('express-handlebars');
const session = require('express-session');
const mysql = require('mysql');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();


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

function getDateTime() {

    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return year + "-" + month + "-" + day + ":" + " " + hour + ":" + min + ":" + sec;
}

function createLogin(userID){
    connection.query("INSERT INTO login (user_ID, time) VALUES (?, ?)", [userID, getDateTime()], function(err){
        if(err){
            console.log(err);
            return;
        }
        console.log("1 login recorded");
    });
}


//home page
app.get('/', function (req, res) {
    var board = {};

    //query DB for 300 words
    connection.query("SELECT * FROM word ORDER BY RAND() LIMIT 300;", [], function(err, result) {
        if (err) {
            console.log(err);
            return;
        }
        board.results = result;
        res.render('home', board);                       //render the homepage
    });
});

app.post('/', function(req, res){
    //TODO
    if(req.session.loggedIn === true) {
        connection.query("INSERT INTO results (user_ID, date_taken, score) VALUES (?, ?, ?)", [req.session.user_ID, getDateTime(), req.body.wpm], function(err){
            if(err){
                console.log(err);
                return;
            }
            console.log("1 result recorded");
        });

        for(let word of req.body.misspelled){
            connection.query("IF EXISTS(SELECT * FROM top_misspelled WHERE word_ID = (?) AND user_ID = (?)) BEGIN UPDATE top_misspelled SET count = count + 1 WHERE word_ID = (?) AND user_ID = (?) END ELSE INSERT INTO top_misspelled (word_ID, user_ID, count) VALUES (?, ?, ?)",
            [word, req.session.user_ID, word, req.session.user_ID, word, req.session.user_ID, 1],
            function(err){
            if(err){
                console.log(err);
                return;
            }
            console.log("1 row updated");
        })}
    }
});


//handle requests from the home page to the login page
app.get('/login', function (req, res) {
    if(req.session.loggedIn)
            res.render('account', req.session);
    else
        res.render('login');
});

//handle requests from the login page to the account creation page
app.get('/profileCreation', function (req, res) {
    res.render('profileCreation');
});


//This route is triggered when the user enters information into the sign up page
app.post('/profile',function(req, res){
    var context ={};

    if(req.body['passWord']) {
        if (req.body.passWord != req.body.userRePassword || req.body.passWord == "") {    //send error if passwords do not match
            context.error = "you did not enter the same password!";
            res.render('profileCreation', context);
            return;
        }
        if(req.body.passWord.length < 10 ) {                                               //send error if password is too short
            context.error = "Passwords must be at least 10 characters long!";
            res.render('profileCreation', context);
        }
        else{                                                                              //query the database for any user tuples with the same username, node-mysql automatically performs escaping
             connection.query("SELECT COUNT(*) AS identicalUser FROM user WHERE username = ?", [req.body.username], function(err, rows){
                if(err){
                    console.log(err);
                    return;
                }
                if(rows[0].identicalUser == 1) {                                            //entered username already exists in the database
                    context.error = "Username already exists!";
                    res.render('profileCreation', context);
                }
                else{                                                                       //add a new user tuple to the database
                    connection.query("INSERT INTO user (username, password) VALUES (?, ?)", [req.body.username,req.body.passWord], function(err){
                        if(err){
                            console.log(err);
                            return;
                        }
                        console.log("1 record inserted");
                    });

                                                                                            //query for the newly inserted user_ID (set to auto-increment)
                    connection.query("SELECT user_ID FROM user WHERE username = ?", [req.body.username], function(err, rows){
                        if(err){
                            console.log(err);
                            return;
                        }
                        createLogin(rows[0].user_ID);
                        req.session.user_ID = rows[0].user_ID;
                    });


                    req.session.loggedIn = true;                                            //initialize a session object for persistence
                    req.session.username = req.body.username;

                    res.render('account', req.session);
                }
             });
        }
    }
});

//This route is triggered when the user enters their password and username in an attempt to login from the login page
app.post('/Login',function(req, res) {
    var context = {};

    if(req.body['password'] && req.body['username']){                       //query the database to see if a tuple exists with the provided username and password
        connection.query("SELECT * FROM user WHERE username = ? AND password = ?", [req.body.username, req.body['password']], function(err, rows) {
            if (err) {
                console.log(err);
                return;
            }
            if(rows.length){                                                //if a tuple does exist in the database with the proper login info fill out the session object

                createLogin(rows[0].user_ID);                               //add login tuple for security
                console.log("successful login!");
                req.session.username = rows[0].username;
                req.session.user_ID = rows[0].user_ID;

                                                                            //get the associated results tuple for the user
                connection.query("SELECT date_taken, score FROM results WHERE user_ID = ?", [rows[0].user_ID], function(err, result_tuples) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    req.session.results = result_tuples;                    //add results tuples to the session

                                                                            //get the Top 5 most misspelled words for the given user
                    connection.query("SELECT word, count FROM word AS W, top_misspelled AS T WHERE T.user_ID = ? AND W.word_ID = T.word_ID ORDER BY count DESC LIMIT 5", [rows[0].user_ID], function(err, result_tuples) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        req.session.top_mispelled = result_tuples;
                        req.session.loggedIn = true;
                        res.render('account', req.session);                 //send the user to the account page with the session information
                    });
                });
            }
            else{                                                           //incorrect information entered during login attempt
                context.error = "invalid login credentials!";
                res.render('login', context);
            }
        });
    }
    else{
        context.error = "invalid login credentials!";
        res.render('login', context);
    }
});

//this route handles requests to the leaderboard
app.get('/leaderboard', function (req, res) {
    var board = {};

                                                                //query DB for top 10 results tuples
    connection.query("SELECT R.score, R.date_taken, U.username FROM results AS R, user AS U WHERE R.user_ID = U.user_ID ORDER BY score DESC LIMIT 10", [], function(err, result) {
        if (err) {
            console.log(err);
            return;
        }
        board.results = result;
        res.render('leaderboard', board);                       //render the leaderboard
    });
});

//This route handles logout requests from the profile page
app.post('/logout', function(req, res){
    req.session.destroy();
    res.render('home');
});

/*
After one minute has expired create a new Result Tuple granted that req.session.loggedIn = true

Then:
design2.pdf
presentation.pdf
final-project.zip
URL.txt
 */


const port = process.env.PORT || 1337;

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

console.log("Server running at http://localhost:%d", port);
