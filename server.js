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


//user object, the field of the user object are populated by the return objects of SQL queries
function User(user_row, result_rows, top_misspelled_rows){
    //user tuple information
    this.username = user_row[0].username.trim();
    this.results = result_row;

}


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
                    connection.query("INSERT INTO user (username, password) VALUES (?, ?)", [req.body.username,req.body.passWord], function(err){
                        if(err){
                            console.log(err);
                            return;
                        }
                        console.log("1 record inserted");
                    });



                    //come here after playing with an already initialized user!
                    console.log()
                    //TO DO:
                    //1.) populate an object with the information of the user, multiple queries gathering the results of the user and all of
                    //the users information then PASS this object as a parameter to the below function
                    //2.) Create and write a login tuple to the DB
                    //3.) implement login persistence
                    res.render('account');
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
                //TO DO: produce and insert a Login tuple
                console.log("successful login!");

                //eventually we want to call some populate user object function here!
                var user = {};

                user.username = rows[0].username;
                console.log("username: " + user.username);

                //get the associated results tuple for the user
                connection.query("SELECT date_taken, score FROM results WHERE user_ID = ?", [rows[0].user_ID], function(err, result_tuples, next) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log(result_tuples);
                    console.log(result_tuples[0].score);

                    user.results = result_tuples;
                    console.log("Logging the results: " + user.results[1].score + "number of results: " + user.results.length);

                    //get the Top 5 most misspelled words for the given user
                    connection.query("SELECT word, count FROM word AS W, top_misspelled AS T WHERE T.user_ID = ? AND W.word_ID = T.word_ID ORDER BY count DESC LIMIT 5", [rows[0].user_ID], function(err, result_tuples) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        user.top_mispelled = result_tuples;
                        console.log("Logging the top_mispelled: " + user.top_mispelled);
                        res.render('account', user);
                    });
                });
            }
            //incorrect information entered during login attempt
            else{
                context.error = "Username already exists!";
                res.render('login', context);
                return;
            }
        });
    }
});


/*More stuff to do
1.) Leader board queries the DB for top Results tuples
2.) actually linking up an array which is presented as client side JS for the type test
3.) monitoring the number of misspelled attempts for each word
4.) writing this back to the DB
5.) When populating a user profile we need:

    ---user---
    a.) username

    ---Results---
    b.) all results with the users user_ID
        i.)score
        ii.) date_taken
        SQL:

        SELECT R.score, U.username
        FROM results AS R, user AS U
        WHERE R.user_ID = U.user_ID
        ORDER BY score DESC
        LIMIT 10


    ---Top_Misspelled--- (we have the user_ID)
    c.) SELECT word, count
        FROM word AS W, top_misspelled AS T
        WHERE T.user_ID = 12365 AND W.word_ID = T.word_ID
        ORDER BY count DESC
        LIMIT 5
*/



const port = process.env.PORT || 1337;

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

console.log("Server running at http://localhost:%d", port);

/*
app.listen(port, (err) => {
    if (err) {return console.log('something bad happened', err)}
    console.log(`server is listening on ${port}`)
});
*/