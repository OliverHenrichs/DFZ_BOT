import express from "express";
import hbs from "express-handlebars";
import { Express } from "express-serve-static-core";
import path from "path";
import { TimeInMs } from "../src/logic/time/TimeConverter";

export function setupMiddleWares(app: Express) {
  app.use(getStaticExpressMW()); // sequence matters here: visitCounter will fire for each static resource...
  app.use(getRateLimitMW());
  setEngine(app);
}

function getStaticExpressMW() {
  return express.static(path.join(__dirname, "public"));
}

function getRateLimitMW() {
  const RateLimit = require("express-rate-limit");
  const maxRequests = 100;
  return new RateLimit({
    windowMs: TimeInMs.fifteenMinutes,
    max: maxRequests,
    delayMs: 0,
  });
}

function setEngine(app: Express) {
  app.engine("hbs", getHBSEngine());
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "hbs");
}

function getHBSEngine() {
  return hbs({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/layouts",
  });
}
