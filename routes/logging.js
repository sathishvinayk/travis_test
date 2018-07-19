const { Router } = require('express');
const restify = require('restify-clients');
const { dns } = require('concordant')();
const router = Router();
var client;

(function(){
    if(client) return 
    const loggingservice = `_main._tcp.logging.micro.svc.cluster.local`
    (loggingservice, (err, locs)=>{
        if(err) return
        const { host, port } = locs[0];
        const logging  = `${host}:${port}`;
        client = restify.createJsonClient({url:`http://${logging}`})
    })
}());

router.get('/', respond)

function respond(req,res,next){
    client.get('/list', (err, rq, rs, data)=>{
        if(err){
            next(err)
            return
        }
        res.render('log', data)
    })
}
module.exports = router;