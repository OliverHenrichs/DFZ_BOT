const path = require('path');
const fs = require('fs');
const tr = require('../misc/tracker');
const express = require('express')
const hbs = require('express-handlebars')
//const bodyParser = require('body-parser')
var visitCounter = require('express-visit-counter');
const https = require('https');
const http = require('http');

// SSL credentials
const credentials = {
	key: undefined,
	cert: undefined,
	ca: undefined
};

var justHttp = false;
try {
    credentials.privateKey = fs.readFileSync('/etc/letsencrypt/live/dotafromzero.com/privkey.pem', 'utf8');
    credentials.certificate = fs.readFileSync('/etc/letsencrypt/live/dotafromzero.com/cert.pem', 'utf8');
    credentials.ca = fs.readFileSync('/etc/letsencrypt/live/dotafromzero.com/chain.pem', 'utf8');
} catch (e) {
    justHttp = true;
    console.log("Could not find https-cert, only loading http-server");
};

// rate limit
var RateLimit = require('express-rate-limit');
var limiter = new RateLimit({
  windowMs: 15*60*1000, // 15 minutes 
  max: 100, // limit each IP to 100 requests per windowMs 
  delayMs: 0 // disable delaying - full speed until the max limit is reached 
});

const _title ='No Bullshit. No Ads. Just DOTA.'

class WebSocket {
    constructor(token, client) {
        this.token = token;
        this.coachList = {};
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
        this.app.use(visitCounter.initialize());

        // this.app.use(bodyParser.urlencoded({extended: false}));
        // this.app.use(bodyParser.json());

        this.registerRoots();

        this.setupHallOfFame();

        // Starting both http & https servers
        this.httpServer = http.createServer(this.app);
        this.httpServer.listen(80, () => {
            console.log('HTTP Server running on port 80');
        });

        if(!justHttp) {
            this.httpsServer = https.createServer(credentials, this.app);
            this.httpsServer.listen(443, () => {
                console.log('HTTPS Server running on port 443');
            });
        }
    }

    async updateCoachList() {
        if(this.client.dbHandle === undefined)
            return;

        var guild = await this.client.guilds.fetch(process.env.GUILD);
        var nativeCoachList = await tr.getCoachList(this.client.dbHandle, 'lobbyCount');
        for (let i = 0; i < nativeCoachList.length; i++) {
            var coach = nativeCoachList[i];
            try{
                var member = await guild.members.fetch(coach.user_id);
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

    async registerRoots() {
        this.app.get('/', async (req, res) => {
            var vc = await visitCounter.Loader.getCount();
            res.render('index', {
                title: _title, 
                coaches: this.coachList,
                visitorCount: vc
            });
        })
        this.app.get('/join', async (req, res) => {
            var vc = await visitCounter.Loader.getCount();
            res.render('joinLink', {
                title: _title,
                visitorCount: vc
            });
        })

        // this.app.post('/sendMessage', (req, res) => {
        //     var _token = req.body.token;
        //     var text = req.body.text;
        //     var channelId = req.body.channelid;

        //     if(!this.checkToken(_token)) 
        //         return;

        //     var channel = this.client.guilds.fetch(process.env.GUILD).channels.get(channelId)

        //     if(channel)
        //         channel.send(text);
        // })
    }
}

module.exports = WebSocket;