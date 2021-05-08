const http = require('http');
const chalk = require('chalk');
const os = require('os');
const fs = require('fs');
const requests = require('requests');
const express = require("express");
const app = express();

const port = process.env.PORT || 3000;
const network = Object.values(os.networkInterfaces())[0][1].address;
const EventEmitter = require('events');

const event = new EventEmitter();
event.on("HttpCallbackFun", () => {
    console.log(`server statred at port ${chalk.bgRed("  " + port + "  ")}
To access, visit  http://127.0.0.1:${port}/
To access, visit http://localhost:${port}/
To access with network , visit http://${network}:${port}/`)
});


const serverData = {
    port: process.env.PORT|| 3000,
    host: "127.0.0.1",
    network: network
}
const json = JSON.stringify(serverData);
fs.readFile(__dirname + '/server.json', 'utf-8', (err, data) => {

    if (err || data != json) {
        fs.writeFile("server.json", json, (err) => {
            console.log('file written');
        });
        return false;
    }
});
const homeFile = fs.readFileSync("public/index.html", 'utf-8');
const replaceVal = (tempVal, orgValue) => {
    let temprature = tempVal.replace("{%tempval%}", orgValue.main.temp);
    temprature = temprature.replace("{%tempmin%}", orgValue.main.temp_min);
    temprature = temprature.replace("{%tempmax%}", orgValue.main.temp_max);
    temprature = temprature.replace("{%Country%}", orgValue.sys.country);
    temprature = temprature.replace("{%tempstatus%}", orgValue.weather[0].main);
    temprature = temprature.replace("{%location%}", orgValue.name);

    return temprature;
}
app.get('/', (req, res) => {
    requests("http://api.openweathermap.org/data/2.5/weather?q=Mumbai&appid=a9f94fe306570625574675e716e18460&units=metric")
        .on("data", chunk => {
            const objData = JSON.parse(chunk);
            const arrData = [objData];
               console.log(arrData)
            const realTimeData = arrData.map((val) => replaceVal(homeFile, val)).join();
            res.write(realTimeData);
            // console.log(realTimeData);
        })
        .on("end", err => {
            if (err) return console.log("connection closed due to error" + err);
            console.log("End");
            res.end();
        });
});
app.get('/:root', (req, res) => {
    const paramReq = req.params.root;
    requests("http://api.openweathermap.org/data/2.5/weather?q=" + paramReq + "&appid=a9f94fe306570625574675e716e18460&units=metric")
        .on("data", (chunk, err) => {
            const objData = JSON.parse(chunk);
            if(objData.cod == "404"){
                res.write(objData.message);
                return;
            }
            const arrData = [objData];
            const realTimeData = arrData.map((val) => replaceVal(homeFile, val)).join();
            res.write(realTimeData);
        })
        .on("end", err => {
            if (err) { res.end(err); return console.log("connection closed due to error") };
            console.log("End");
            res.end();
        });
})
app.listen(port, () => {
    event.emit("HttpCallbackFun");
});