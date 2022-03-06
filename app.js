// CONFIG /////////////////////////////////////////////////////////
var config = require('./config.json');
var currentstateConfig = 0;

// SUBPROCESSING /////////////////////////////////////////////////////////
// import child_process with CommonJS // TODO mrw change to EJS
const { spawn } = require('child_process');

// FASTIFY /////////////////////////////////////////////////////////
// import fastify with CommonJS // TODO mrw change to EJS
const fastify = require('fastify')({
    logger: true
})
// import fastify auth plugin
fastify.register(require('fastify-auth'));
// satisfy external loads
fastify.register(require('fastify-cors'), { origin: '*' });

const jsonminify = require("jsonminify");

// FASTIFY-AUTH /////////////////////////////////////////////////////////
const authenticate = {realm: 'Westeros'}
fastify.register(require('fastify-jwt'), {
    secret: 'supersecret'
})

fastify.decorate("authenticate", async function(req, reply) {
    try {
        await req.jwtVerify()
    } catch (err) {
        reply.send(err)
    }
})

fastify.post('/signup', (req, reply) => {
    // some code
    if ( typeof req.body !== 'undefined' && req.body ) {
        // console.log(req.body);
        if ( req.body.user !== 'undefined' && req.body.user && req.body.password !== 'undefined' && req.body.password ) {
            if ( req.body.user === 'install' && req.body.password === 'serial' ) {
                const userId = req.body.user;
                const payload = { algorithm: 'HS256', expiresIn: 120, subject: userId }
                const secret = 'supersecret';
                const token = fastify.jwt.sign(payload, secret, {
                    algorithm: 'HS256',
                    expiresIn: '10m' // if ommited, the token will not expire
                })
                reply.send({"status": "ok","csrf": "csrf_hash","data": [{ token }],"errors": []})
            } else {
                reply.send({"status":"error","csrf":"csrf_hash","data":[],"errors":["User and/or Password does not match"]})
            }
        } else
        {
            reply.send({"status":"error","csrf":"csrf_hash","data":[],"errors":["Error in request",{"field":"body","message":"User and/or Password not given","significancy":"error"}]})
        }
    } else {
        reply.send({"status":"error","csrf":"csrf_hash","data":[],"errors":["Error in request",{"field":"body","message":"Body was empty","significancy":"error"}]})
    }
})


fastify.get('/version', (req, reply) => {
    reply.send({version: 'VA01A'})
})

fastify.get('/versionui', (req, reply) => {
    reply.send({version: '0.1.0'})
})

fastify.get('/status/config', (req, reply) => {
    reply.send({config: currentstateConfig})
})

fastify.get('/status/config/0', { preValidation: [fastify.authenticate] }, (req, reply) => {
    currentstateConfig = 0;
    reply.send({config: '0'})
})

fastify.get('/status/config/1', { preValidation: [fastify.authenticate] }, (req, reply) => {
    currentstateConfig = 1;
    reply.send({config: '1'})
})

// start subprocess routine
fastify.get('/start', { preValidation: [fastify.authenticate] }, function (req, reply) {
    console.log(JSON.stringify(req.headers));
    if ( typeof req.query.extra_vars !== 'undefined' && req.query.extra_vars ) {
        if ( typeof req.query.playbook !== 'undefined' && req.query.playbook ) {
            var sub = createFunction(req.query.playbook, req.query.extra_vars, reply)
        } else {
            reply.send({ module: 'start', result: 'error', errormsg: 'parameter playbook missing' })
        }
    } else {
        reply.send({ module: 'start', result: 'error', errormsg: 'parameter extra_vars missing' })
    }
})

// SCHEDULER /////////////////////////////////////////////////////////
// repetitive work
function intervalFunc() {
    fastify.log.info('unstoppable task');
}
setInterval(intervalFunc, config.app.schedulerms);


// start the fastify server
fastify.listen(config.app.port, config.app.host, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
})

// SUBPROCESSING /////////////////////////////////////////////////////////
// start subprocess routine
function createFunction(playbook, extra_vars, reply) {
    var spawn = require('child_process').spawn;
    var child = spawn('/usr/local/bin/ansible-playbook', [playbook + '/playbook.yml','-i','inventory','-e',extra_vars], { env: { ...process.env, ANSIBLE_PIPELINING: true, ANSIBLE_STDOUT_CALLBACK: 'json' }});
    
    var answer = "";

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
        answer = answer + data;
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(data) {
        fastify.log.error(child.pid + ' error occured');
        answer = answer + data;
    });

    child.on('close', function(code) {
        fastify.log.info(child.pid + ' closing code ' + code);
        answerclean = answer.replace(/(\r\n|\n|\r)/gm, "");
        answermin=jsonminify(answerclean);
        reply.send(answermin);
    });
    return answer;
}
