let input = '';
let wpm = 0;
let counter = 60;
let started, finished = false;

//This will be the list of 300 words from the server
let wordlist = [];

//Checks if word is correct and shifts array
function update() {
    if(input.trim() === wordlist[0].word){
        wpm++;
    }

    input='';

    wordlist.splice(0,1);
    for(let i = 0; i < 10; i++) {
        let currentDiv = document.getElementById(String(i));
        currentDiv.innerHTML(wordlist[i]);
    }
}

//Starts and ends timer
function timerStart() {
    if(!started) {
        const timer = setInterval(() => {
            counter -= 1;
            if (counter === 0) {
                clearInterval(timer);
                finished = true;
                input = '';
                for(let index in wordlist) {
                    wordlist[index].word = '';
                }
                wordlist[5].word = `Time is up! Your WPM is ${wpm}`
            }
        }, 1000);
    }
    started = true;
}

//Resets everything as if page was refreshed
function restart() {
    clearInterval(timer);
    input = '';
    wpm = 0;
    counter = 60;
    started = false;
    finished = false;
    //TODO request new words from DB
}