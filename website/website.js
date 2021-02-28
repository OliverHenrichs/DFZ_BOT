const express = require('express')
const hbs = require('express-handlebars')
const bodyParser = require('body-parser')

var RateLimit = require('express-rate-limit');
var limiter = new RateLimit({
  windowMs: 15*60*1000, // 15 minutes 
  max: 100, // limit each IP to 100 requests per windowMs 
  delayMs: 0 // disable delaying - full speed until the max limit is reached 
});

const path = require('path');
const tr = require('../misc/tracker');
const _title ='No Bullshit. No Ads. Just DOTA.'

class WebSocket {
    constructor(token, port, client) {
        this.token = token;
        this.coachList = {};
        this.port = port;
        this.client = client;

        this.app = express();

        this.app.use(limiter);

        this.app.engine('hbs', hbs({
            extname: 'hbs',
            defaultLayout: 'layout',
            layoutsDir: __dirname + '/layouts'
        }));
        this.app.set('views', path.join(__dirname, 'views'));
        this.app.set('view engine', 'hbs');

        this.app.use(express.static(path.join(__dirname, 'public')));

        // this.app.use(bodyParser.urlencoded({extended: false}));
        // this.app.use(bodyParser.json());

        this.registerRoots();

        this.setupHallOfFame();

        this.server = this.app.listen(port, () => {
            console.log("Websocket listening on port " + (this.server.address().port));
        })
    }

    async updateCoachList() {
        if(this.client.dbHandle === undefined)
            return;

        var nativeCoachList = await tr.getCoachList(this.client.dbHandle, 'lobbyCount');
        for (let i = 0; i < nativeCoachList.length; i++) {
            var coach = nativeCoachList[i];
            try{
                var member = await this.client.guilds.get(process.env.GUILD).fetchMember(coach.user_id);
                coach.nick = member.displayName;
            } catch {
                coach.nick = "Unknown";
            }
        }
        this.coachList = nativeCoachList;
    }

    async setupHallOfFame() {
        await this.updateCoachList();
        setInterval(this.updateCoachList, 2*60*60000);
    }

    registerRoots() {
        this.app.get('/', (req, res) => {
            res.render('index', {
                title: _title, 
                coaches: this.coachList
            });
        })
        this.app.get('/join', (req, res) => {
            res.render('joinLink', {
                title: _title
            });
        })
        this.app.get('/referral', (req, res) => {
            res.render('referralLink', {
                title: _title
            });
        })

        // this.app.post('/sendMessage', (req, res) => {
        //     var _token = req.body.token;
        //     var text = req.body.text;
        //     var channelId = req.body.channelid;

        //     if(!this.checkToken(_token)) 
        //         return;

        //     var channel = this.client.guilds.get(process.env.GUILD).channels.get(channelId)

        //     if(channel)
        //         channel.send(text);
        // })
    }
}

module.exports = WebSocket;