let wpm = 0;
let counter = 60;
let started, finished = false;
let misspelled = [];

let inputField = document.getElementById("input");
let timerBtn = document.getElementById("timer");

timerBtn.innerHTML = counter;

//Adds first 10 words to the wordbank
function populateWordbank() {
    for(let i = 0; i < 10; i++) {
        let currentDiv = document.getElementById(String(i));
        currentDiv.innerHTML = wordlist[i].word;
    }
}
populateWordbank();

//Detects keydown event and checks if space
inputField.onkeydown = function keydownHandler(e) {
    if(e.key === ' '){
        update()
    }
    else{
        timerStart()
    }
};

//Checks if word is correct and shifts array
function update() {
    if(inputField.value.trim() === wordlist[0].word){
        wpm++;
    }
    else {
        misspelled.push(wordlist[0].word_ID);
    }
    inputField.value = '';
    wordlist.splice(0,1);
    populateWordbank();

}

//Starts and ends timer
function timerStart() {
    if(!started) {
        const timer = setInterval(() => {
            counter -= 1;
            timerBtn.innerHTML = counter;
            if (counter === 0) {
                clearInterval(timer);
                timerEnd();
            }

        }, 1000);
    }

    started = true;
}

function timerEnd() {
    finished = true;
    inputField.value = '';
    inputField.disabled = true;
    for(let i = 0; i < 10; i++) {
        let currentDiv = document.getElementById(String(i));
        currentDiv.innerHTML = '';
    }

    document.getElementById('4').innerHTML = `Time is up! Your WPM is ${wpm}`;
    console.log(misspelled);
    post("/", {
        misspelled: misspelled,
        wpm: wpm
    });

}

//Resets everything as if page was refreshed
document.getElementById("f5").onclick = function restart() {
    location.reload()
};


function post(path, params) {

    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("action", path);

    for(var key in params) {
        if(params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);

            form.appendChild(hiddenField);
        }
    }

    document.body.appendChild(form);
    form.submit();
}