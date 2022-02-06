// CONFIG /////////////////////////////////////////////////////////
var config = require('./config.json');

// SUBPROCESSING /////////////////////////////////////////////////////////
// import child_process with CommonJS // TODO mrw change to EJS
const { spawn } = require('child_process');

// FASTIFY /////////////////////////////////////////////////////////
// import fastify with CommonJS // TODO mrw change to EJS
const fastify = require('fastify')({
    logger: true
})
// import fastify redis plugin
fastify.register(require('fastify-redis'), { host: config.redis.host, port: config.redis.port })
// import fastify auth plugin
fastify.register(require('fastify-auth'));
// satisfy external loads
fastify.register(require('fastify-cors'), { origin: '*' });

// FASTIFY-AUTH /////////////////////////////////////////////////////////
const authenticate = {realm: 'Westeros'}
fastify.register(require('fastify-jwt'), {
    secret: 'supersecret'
})
fastify.decorate("authenticate", async function(request, reply) {
    try {
        await request.jwtVerify()
    } catch (err) {
        reply.send(err)
    }
})

fastify.post('/signup', (req, reply) => {
    // some code
    const token = fastify.jwt.sign(req.body)
    reply.send({ token })
})


fastify.get('/version', (req, reply) => {
    reply.send({version: '0.0.1'})
})

// start subprocess routine
fastify.get('/start', { preValidation: [fastify.authenticate] }, function (request, reply) {
    if ( typeof request.query.extra_vars !== 'undefined' && request.query.extra_vars ) {
        if ( typeof request.query.playbook !== 'undefined' && request.query.playbook ) {
            var sub = createFunction(request.query.playbook, request.query.extra_vars)
            reply.send({ module: 'start', result: 'ok', procid: sub })
        } else {
            reply.send({ module: 'start', result: 'error', errormsg: 'parameter playbook missing' })
        }
    } else {
        reply.send({ module: 'start', result: 'error', errormsg: 'parameter extra_vars missing' })
    }
})

// get status of routine
fastify.get('/status', { preValidation: [fastify.authenticate] }, function (request, reply) {
    if ( typeof request.query.procid !== 'undefined' && request.query.procid ) {
        const { redis } = fastify
        redis.lrange(request.query.procid, 0, -1, (err, val) => {
            reply.send(err || val)
        })
    } else {
        reply.send({ module: 'status', result: 'error', errormsg: 'parameter procid missing' })
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
function createFunction(playbook, extra_vars) {
    var spawn = require('child_process').spawn;
    var child = spawn('/usr/local/bin/ansible-playbook', [playbook + '/playbook.yml','-i','testplay/inventory','-e',extra_vars]);
    
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
        data=data.toString();
        const { redis } = fastify
        redis.rpush(child.pid, data);
    });
    
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(data) {
        fastify.log.error(child.pid + ' error occured');
        data=data.toString();
        const { redis } = fastify
        redis.rpush(child.pid, data);
    });
    
    child.on('close', function(code) {
        fastify.log.info(child.pid + ' closing code ' + code);
    });
    return child.pid
}
