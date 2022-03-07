var express = require("express");
var router = express.Router();
var multiparty = require("multiparty");
var http = require("http");
var util = require("util");
const fetch = require("node-fetch");

var FormData = require("form-data");

router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

router.post("/upload", async (req, res, next) => {
  try {
    await new Promise((resolve, reject) => {
      var form = new multiparty.Form();

      form.on("error", (err) => {
        console.log("Error parsing form: " + err.stack);
        reject(err);
      });

      // Parts are emitted when parsing the form
      form.on("part", async (part) => {
        // You *must* act on the part by reading it
        // NOTE: if you want to ignore it, just call "part.resume()"

        if (part.filename === undefined) {
          // filename is not defined when this is a field and not a file
          console.log("got field named " + part.name);
          // ignore field's content
          part.resume();
        }

        if (part.filename !== undefined) {
          console.log("got file named " + part.name);
          var formData = new FormData();

          formData.append("file", part, {
            filename: part.filename,
            contentType: part["content-type"],
          });

          const headers = { headers: { "transfer-encoding": "chunked" } };
          const url = "http://localhost:7070/store";
          try {
            const apiRes = await fetch(url, {
              method: "post",
              body: formData,
              headers: headers,
            });
            const data = await apiRes.json();
            console.log(data);
          } catch (error) {
            form.emit("error", error);
          }
        }

        part.on("error", (err) => {
          form.emit("error", error);
        });

        part.on("close", () => console.log("part closed"));
      });

      form.parse(req);
    });
    res.send("ok").status(200);
  } catch (error) {
    res.send(error).status(400);
  }
});

module.exports = router;
