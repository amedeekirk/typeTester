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


//root
app.get('/', function (req, res) {
    res.render('home');
});

//from home
app.get('/login', function (req, res) {
    if(req.session.loggedIn)
            res.render('account', req.session);
    else
        res.render('login');
});

//from login
app.get('/profileCreation', function (req, res) {
    res.render('profileCreation');
});


//from profileCreation to account apge
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
                }
                //add tuple to the database and login, make session persistent
                else{
                    connection.query("INSERT INTO user (username, password) VALUES (?, ?)", [req.body.username,req.body.passWord], function(err){
                        if(err){
                            console.log(err);
                            return;
                        }
                        console.log("1 record inserted");
                    });



                    //query for the newly inserted user_ID
                    connection.query("SELECT user_ID FROM user WHERE username = ?", [req.body.username], function(err, rows){
                        if(err){
                            console.log(err);
                            return;
                        }
                        createLogin(rows[0].user_ID);
                    });


                    req.session.loggedIn = true;
                    req.session.username = req.body.username;

                    res.render('account', req.session);
                }
             });
        }
    }
});

//Make a post from the login page
app.post('/Login',function(req, res) {
    var context = {};

    if(req.body['password'] && req.body['username']){
        connection.query("SELECT * FROM user WHERE username = ? AND password = ?", [req.body.username, req.body['password']], function(err, rows) {
            if (err) {
                console.log(err);
                return;
            }
            //user tuple with credentials exists
            if(rows.length){

                //add login tuple
                createLogin(rows[0].user_ID);
                console.log("successful login!");

                //eventually we want to call some populate user object function here!
                req.session.username = rows[0].username;

                //get the associated results tuple for the user
                connection.query("SELECT date_taken, score FROM results WHERE user_ID = ?", [rows[0].user_ID], function(err, result_tuples) {
                    if (err) {
                        console.log(err);
                        return;
                    }

                    req.session.results = result_tuples;

                    //get the Top 5 most misspelled words for the given user
                    connection.query("SELECT word, count FROM word AS W, top_misspelled AS T WHERE T.user_ID = ? AND W.word_ID = T.word_ID ORDER BY count DESC LIMIT 5", [rows[0].user_ID], function(err, result_tuples) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        req.session.top_mispelled = result_tuples;
                        req.session.loggedIn = true;
                        res.render('account', req.session);
                    });
                });
            }

            //incorrect information entered during login attempt
            else{
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

//from the home page to the leaderboard
app.get('/leaderboard', function (req, res) {
    var board = {};

    //query DB for top 10 results tuples
    connection.query("SELECT R.score, R.date_taken, U.username FROM results AS R, user AS U WHERE R.user_ID = U.user_ID ORDER BY score DESC LIMIT 10", [], function(err, result) {
        if (err) {
            console.log(err);
            return;
        }
        board.results = result;
        res.render('leaderboard', board);
    });
});

//logout request
app.post('/logout', function(req, res){
    req.session.destroy();
    res.render('home');
});

/*
Query for grabbing 200 random words from the "word" relation
SELECT * FROM word ORDER BY RAND() LIMIT 200;
 */


const port = process.env.PORT || 1337;

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

console.log("Server running at http://localhost:%d", port);
