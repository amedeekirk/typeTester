let wpm = 0;
let started = false;
let timer;
new Vue({
    el: '#wrapper',
    data: {
        input: '',
        counter: 60,
        finished: false,
        wordlist: [
            {word: '', ID: '1'},
            {word: '', ID: '2'},
            {word: '', ID: '3'},
            {word: '', ID: '4'},
            {word: '', ID: '5'},
            {word: '', ID: '6'},
            {word: '', ID: '7'},
            {word: '', ID: '8'},
            {word: '', ID: '9'},
            {word: '', ID: '10'},
        ],
    },
    created: function () {
        for(item of this.wordlist){
            item.word = array[Math.floor(Math.random() * 501)];
        }
    },
    methods: {
        update: function () {
            //check if correct word
            if(this.input.trim() === this.wordlist[0].word){
                wpm++;
            }
            //clear input
            this.input='';

            //change words
            for(index in this.wordlist){
                let item = parseInt(index);
                if(item===9){
                        this.wordlist[item].word = array[Math.floor(Math.random() * 501)];
                }
                else{
                    this.wordlist[item].word = this.wordlist[item+1].word;
                }
            }
        },
        timerstart: function () {
            if(started){return;}
            else{started = true;}
             timer = setInterval(() => {
                this.counter-=1;
                if(this.counter === 0){
                    clearInterval(timer);
                    this.finished = true;
                    this.input = '';
                    for(item of this.wordlist){
                        item.word = '';
                    }
                    this.wordlist[5].word = `Time is up! Your WPM is ${wpm}`
                }
            },1000);
        },
        //soft refresh of page
        restart: function (){
            clearInterval(timer);
            wpm = 0;
            started = false;
            this.input = '';
            this.counter = 60;
            this.finished = false;
            for(item of this.wordlist){item.word = array[Math.floor(Math.random() * 501)];}
        }
    }
});