// CONFIG /////////////////////////////////////////////////////////
var config = require('./config.json');
var currentstateConfig = 0;

// SUBPROCESSING /////////////////////////////////////////////////////////
// import child_process with CommonJS // TODO mrw change to EJS
const { spawn } = require('child_process');

const jsonminify = require("jsonminify");

const redis = require("ioredis");

// REDIS CLIENT /////////////////////////////////////////////////////////
// two of them, as one is in blocking mode
const clientsub = redis.createClient({ host: config.redis.host, port: config.redis.port });
const clientpub = redis.createClient({ host: config.redis.host, port: config.redis.port });

clientsub.on('error', err => {
     console.log('Error ' + err);
});

clientpub.on('error', err => {
     console.log('Error ' + err);
});

// thanks https://stackoverflow.com/questions/62179656/node-redis-xread-blocking-subscription / loop idea
// maybe relevant https://github.com/redis/node-redis/issues/1394
// sample https://github.com/luin/ioredis/blob/main/examples/stream.js / blocking idea

const xread = ({ stream, id }) => {
  clientsub.xread('BLOCK', 0, 'STREAMS', stream, id, (err, str) => {
    if (err) return console.error('Error reading from stream:', err);

    str[0][1].forEach(message => {
      id = message[0];
      console.log(id);
      console.log(message[1]);
      createFunction(message[1][2], message[1][3], function (result) {
          //console.log(result)
          clientpub.xadd(message[1][1],'*','result',result);
      })
    });

    setTimeout(() => xread({ stream, id }), 0)
  });
}

xread({ stream: 'work2do', id: '$' })

// SUBPROCESSING /////////////////////////////////////////////////////////
// start subprocess routine
function createFunction(playbook, extra_vars, cb) {
    var spawn = require('child_process').spawn;
    var child = spawn('/usr/local/bin/ansible-playbook', [config.app.playbookpath + playbook + '/playbook.yml','-i','localhost,','-e',extra_vars], { env: { ...process.env, ANSIBLE_PIPELINING: true, ANSIBLE_STDOUT_CALLBACK: 'json' }});
    
    var answer = "";

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', function(data) {
        answer = answer + data;
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', function(data) {
        console.log(child.pid + ' error occured');
        answer = answer + data;
    });

    child.on('close', function(code) {
        console.log(child.pid + ' closing code ' + code);
        answerclean = answer.replace(/(\r\n|\n|\r)/gm, "");
        answermin=jsonminify(answerclean);
        cb(answermin);
    });
}
