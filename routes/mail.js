'use strict'

const { Router } = require('express');
const router = Router();
const net = require('net');
const recon = require('../recon/emailrecon');
const hammer = require('../lib/sledgehammer');
const { dns } = require('concordant')();
var clients;

(function(){
    if(clients) return
    const mailservice = `_main._tcp.mailservice.micro.svc.cluster.local`
    const loggingservice = `_main._tcp.logging.micro.svc.cluster.local`
    dns.resolve(mailservice, (err, locs)=>{
        if(err) return
        const { host, port } = locs[0];
        clients = {mail: hammer(net.connect({host ,port}))}
        dns.resolve(loggingservice, (err, locs)=>{
            if(err) return
            const { host, port } = locs[0];
            const logging = `${host}:${port}`;
            clients["logging"] = logging;
        })
    })
}());

router.get('/', function(req,res){ res.json({ "Skull": "Death"}); })
router.post('/generic', generic);

function generic(req,res,next){
    const point = 'emailGeneric';
    recon(Buffer.from(JSON.stringify(req.body)), point, (err,data)=>{
        if(err){
            console.log("Error appeared here", err)
            res.status(400).end(err)
        }else {
            const { email, subject, message} = data;
            const role = 'generic', cmd = 'mail', strip = email.split(',');
            clients.mail.once('data', (data)=>{
                const { result } = data
                res.json({result})
            })
            clients.mail.write({role, cmd, strip, subject, message})
        }
    })
}

module.exports = router;