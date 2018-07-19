const { Router } = require('express');
const restify = require('restify-clients');
const recon = require('../recon/smsrecon');
const net = require('net');
const hammer = require('../lib/sledgehammer');
const { dns } = require('concordant')();
const router = Router();
var clients;
var hammery;

(function(){
    if(clients) return
    const smsservice = `_main._tcp.smsservice.micro.svc.cluster.local`
    const loggingservice = `_main._tcp.logging.micro.svc.cluster.local`
    const scheduleservice = `_main._tcp.scheduleservice.micro.svc.cluster.local`
    dns.resolve(smsservice, (err, locs)=>{
        if(err) return
        const { host, port } = locs[0];
        const sms = `${host}:${port}`
        dns.resolve(scheduleservice, (err, locs)=>{
            if(err) return
            const { host, port } = locs[0];
            hammery = {schedule: hammer(net.connect({host, port}))}
            dns.resolve(loggingservice, (err, locs)=>{
                if(err) return
                const { host, port } = locs[0];
                const logging = `${host}:${port}`;
                clients = {
                    sms: restify.createJsonClient({url:`http://${sms}`, agent: false}),
                    logs: restify.createJsonClient({url:`http://${logging}`, agent: false})
                }
            })
        })
    })
}());


router.get('/', function(req,res){ res.json({"Public": "Viewing frontend"}) })
router.get('/balance', balance)
router.post('/generic', general);
router.post('/schedule', scheduler);
router.post('/linkpay', paybylink)
router.post('/provider/:provider', change_provider)

// Get the balance
function balance(req, res, next){
    clients.sms.get(`/2`, (err, rq, rs, data)=>{
        if(err){
            next(err)
            return
        } else {
            const { result } = data
            res.send(result);
        }
        
    })
}
//General Sms
function general(req,res,next){
    const point = 'smsGeneric';
    recon(Buffer.from(JSON.stringify(req.body)), point, (error,data)=>{
        if(error){
            res.status(400).end(error)
        }else {
            const { c_phone, c_message } = data
            clients.sms.get(`/1/${c_phone}/${c_message}`, (err, rq, rs, result)=>{
                if(err){
                    next(err)
                    return
                } else {
                    process.nextTick(()=>{
                        clients.logs.post('/append', result, (err)=>{
                            if(err)console.error(err)
                        })
                    });
                    res.status(result.code).send(result.message)
                }
            })
        }
    })
}

// Scheduler
function scheduler(req,res,next){
    const point = 'smsSchedule';
    recon(Buffer.from(JSON.stringify(req.body)), point, (error,data)=>{
        if(error){
            res.status(400).end(error)
        }else {
            clients.sms.post(`/4`, data, (err, rq, rs, binary)=>{
                if(err){
                    next(err)
                    return
                } else {
                    const {result} = res;
                    // process.nextTick(()=>{
                    //     clients.logs.post('/append', result, (err)=>{
                    //         if(err)console.error(err)
                    //     })
                    // });
                    res.send(binary)
                }
            })
        }
    })
}

function aggresive_schedule(req,res,next){
    const point = 'sms';
}
// Paybylink
function paybylink(){
    const { id } = req.body
}

// Change the provider
function change_provider(req,res,next){
    const { provider } = req.params;
    clients.sms.get(`/3/${provider}`, (err, rq, rs, data)=>{
        if(err){
            next(err)
            return
        }
        else {
            const { result } = data
            res.json(result)
        }
    })
}

module.exports = router