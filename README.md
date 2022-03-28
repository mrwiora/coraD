coraD
=========

Control & Operation Restful API Daemon - Core Part

The heart of future system management interfaces

Do you need a piece of software that offers an abstraction layer between a frontend service and the execution of commands on a system?
This software is intended to be out-of-the-box ansible ready, so operations can be performed just by starting an ansible playbook with parameters.

THANKS to @michaelrommel for his always open ear and sharing his fascination about node.js :)

```
architecture picture - highlighted edge
```

=========	

ALPHA-Status
> :warning: This software is currently under heavy construction. Large changes are currently always possible.

=========

adjust coraD to your requirements (pay attention to prerequisites) via `config.js`

run coraD
`npm start`
```
root@debian:~/corad# npm start

> coraD@0.0.1 start
> node app.js

{"level":30,"time":1644230032404,"pid":409214,"hostname":"debian","msg":"Server listening at http://127.0.0.1:3000"}
```

first an authentication token must be obtained:
```
# curl -X POST -H 'Content-Type: application/json' -d '{"user":"install","password":"serial"}' http://127.0.0.1:3000/signup
```
as a result you should get an up2date bearer token:
```
{"status":"ok","csrf":"csrf_hash","data":[{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGdvcml0aG0iOiJIUzI1NiIsImV4cGlyZXNJbiI6MTIwLCJzdWJqZWN0IjoiaW5zdGFsbCIsImlhdCI6MTY0ODU0MjE1Mn0.Fw6uNjoCjUAlFChgctOmA9r8iDSnTPmlJe0Js7i3KA8"}],"errors":[]}
```
as long as this signup interface is open and without any verification, new tokens can be created (open during alpha phase)

with this token it is possible to access the interfaces /start with the necessary parameters

start expects the playbook-subfolder and the extra-vars
```
# curl -X GET -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbGdvcml0aG0iOiJIUzI1NiIsImV4cGlyZXNJbiI6MTIwLCJzdWJqZWN0IjoiaW5zdGFsbCIsImlhdCI6MTY0ODU0MjE1Mn0.Fw6uNjoCjUAlFChgctOmA9r8iDSnTPmlJe0Js7i3KA8' http://127.0.0.1:3000/start?playbook=testplay\&extra_vars='\{"text":"HelloWorldFromCurl"\}'
```
expected result something like:
```

```


with an installed nginx, the server should now offer the provided text under `http://localhost/txt.html`


based on
---------------
- fastify web framework
- redis

prerequisites
---------------
- nodejs (https://github.com/Schniz/fnm; fnm install)
- ansible (`apt install -y python3 python3-pip && pip3 install ansible`)

soft prerequisite
---------------
development has been done in debian - paths like /var/www/html which are access in ansible-playbook are subject to be altered in other installations

prerequisites development
---------------
- nodemon (`npm install -g nodemon`)
- nginx (`apt install -y nginx`)

checklist
---------------
basics
- [x] RESTful API to serve requests
- [x] Executing external commands
- [x] Collecting logs via external commands 
- [x] JWT based Authentication for calls
- [x] Scheduler to ask external server for Todos

security-improvement
- [x] separating externally communicating service run as service user, while root-process for internal communication only
- [ ] external sever endpoint verification
- [ ] playbook package signature verification
