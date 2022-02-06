coraD
=========

Control & Operation Restful API Daemon

The heart of future system management interfaces

Do you need a piece of software that offers an abstraction layer between a frontend service and the execution of commands on a system?
This software is intended to be out-of-the-box ansible ready, so operations can be performed just by starting an ansible playbook with parameters.

THANKS to @michaelrommel for his always open ear and sharing his fascination about node.js :) This would be some GoLang Code otherwise

ALPHA-Status
> :warning: **service is running as root**: Currently coraD must be run as root - for the same reason as other system manamgent software also does (access to system services, perform certain actions like exchanging system files etc.). This is subject to be changed in the future (see todo)

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
# curl -X POST -H 'Content-Type: application/json' -d '{"foo":"bar"}' http://127.0.0.1:3000/signup
{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE2NDQyMzAyODN9.wN1S8vSkEGO_BjMEhFg5vrIFenP_4NvEXZzZeT2Pf3g"}
```
as long as this signup interface is open and without any verification, new tokens can be created (open during alpha phase)

with this token it is possible to access the interfaces /start and /status with the necessary parameters

start expectets the playbook-subfolder and the extra-vars
```
# curl -X GET -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE2NDQyMzAyODN9.wN1S8vSkEGO_BjMEhFg5vrIFenP_4NvEXZzZeT2Pf3g' http://127.0.0.1:3000/start?playbook=testplay\&extra_vars='\{"text":"HelloWorldFromCurl"\}'
{"module":"start","result":"ok","procid":411106}
```
the return shows me the processid `411106`

the output of the given process is being collected by the nodejs applicatino and redirected to the redis in memory database
```
# curl -X GET -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE2NDQyMzAyODN9.wN1S8vSkEGO_BjMEhFg5vrIFenP_4NvEXZzZeT2Pf3g' http://127.0.0.1:3000/status?procid=411106
["\nPLAY [localhost] ***************************************************************\n","\nTASK [print text variable] *****************************************************\n","ok: [localhost] => {\n    \"msg\": \"Variable has been set: HelloWorldFromCurl\"\n}\n","\nTASK [write textfile] **********************************************************\n","changed: [localhost]\n","\nTASK [restart nginx service] ***************************************************\n","changed: [localhost]\n","\nPLAY RECAP *********************************************************************\n","localhost                  : ok=3    changed=2    unreachable=0    failed=0    skipped=0    rescued=0    ignored=0   \n\n"]
```

with an installed nginx, the server should now offer the provided text under `http://localhost/txt.html`


based on
---------------
- fastify web framework
- redis in memory data structure store

prerequisites
---------------
- nodejs (https://github.com/Schniz/fnm; fnm install)
- ansible (`apt install -y python3 python3-pip && pip3 install ansible`)
- redis (`apt install -y redis`)

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
- [ ] separating externally communicating service run as service user, while root-process for internal communication only
- [ ] external sever endpoint verification
- [ ] playbook package signature verification
