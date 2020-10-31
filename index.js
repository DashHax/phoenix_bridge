const fs = require("fs");
const path = require("path");

const SerialPort = require("serialport");
const express = require("express");

const bodyParser = require("body-parser");
const cors = require("cors");

const { tryJSON } = require("./helper");

const app = express();
const port = 52073;

let comPort = process.argv.length > 2 ? (process.argv[2] || "COM5") : "COM5";

const serial = new SerialPort(comPort, { baudRate: 115200 });

app.use(bodyParser.json());
app.use(cors({
    origin: [/localhost/, /odellobrien\.com$/]
}));

app.get("/", (req, res) => {
    res.redirect("https://odellobrien.com/kiosk");
})

app.post("/auth", async (req, res) => {
    console.log(req.originalUrl);
    return res.json({ status: "success", premiseId: "testpremise1" });
});

let readingBuffers = [];
let arrBuff = "";

serial.on("data", (data) => {
    data = data.toString();
    for (let i = 0, len = data.length; i < len; i++) {
        let c = data[i];
        if (c !== "\n") {
            arrBuff += c;
        } else {
            let arr = tryJSON(arrBuff);
            readingBuffers.push(arr);
            console.log("> " + arrBuff);
            arrBuff = "";
        }
    }
})

app.post("/temp", (req, res) => {
    serial.write("021", (err, _) => {
        if (err) {
            res.json({status: "error", error: err.message});
            console.log("Error level 1:", err);
        } else {
            setTimeout(() => {
                serial.write("000", (err2, _) => {

                    if (err2) {
                        res.json({status: "error", error: err2.message });
                        console.log("Error level 2:", err2);
                    } else {
                        let avg = new Array(64).fill(0);
                        let totalRow = 0;

                        console.log("Sending reading...");

                        for (let row = 0; row < avg.length; row++) {
                            totalRow = readingBuffers.length;
                            for (let arr of readingBuffers) {
                                avg[row] += arr[row];
                            }

                            avg[row] /= totalRow;
                        }
                        readingBuffers = [];
                        res.json({status: "success", readings: avg, len: avg.length});
                    }
                })
            }, 1750);
        }
    });
})

serial.on("open", () => {
    console.log("IVIS Client is ready for IVIS Thermo on port " + comPort + "!");
})

app.listen(port, () => {
    console.log("IVIS Client is ready to go!");
})