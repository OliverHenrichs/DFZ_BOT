import { Request, Response } from "express";
import { visitCounter } from "./middlewares";
import Website from "./website";

interface EndPointNames {
  endPoint: string;
  view: string;
}

export async function registerEndpoints(ws: Website) {
  addIndexRoot(ws);
  addJoinRoot(ws);
  addHallOfFameRoot(ws);
}

async function addIndexRoot(ws: Website) {
  const names: EndPointNames = {
    endPoint: "/",
    view: "index",
  };
  const dataFun = () => {
    return { referrers: ws.referrerList };
  };
  setEndPoint(ws, names, dataFun);
}

async function addJoinRoot(ws: Website) {
  const names: EndPointNames = {
    endPoint: "/join",
    view: "joinLink",
  };
  setEndPoint(ws, names);
}

async function addHallOfFameRoot(ws: Website) {
  const names: EndPointNames = {
    endPoint: "/halloffame",
    view: "hallOfFame",
  };
  const dataFun = () => {
    return { coaches: ws.coachList };
  };
  setEndPoint(ws, names, dataFun);
}

async function setEndPoint(
  ws: Website,
  names: EndPointNames,
  dataFun: () => any = () => {
    return {};
  }
) {
  const endPointAdder = async (req: Request, res: Response) => {
    if (redirectHttps(req, res, ws)) {
      return;
    }
    console.log(JSON.stringify(dataFun()));

    const renderData = await getRenderData(dataFun);
    res.render(names.view, renderData);
  };

  ws.app.get(names.endPoint, endPointAdder);
}

function redirectHttps(req: Request, res: Response, ws: Website): boolean {
  if (!req.secure && ws.useHttps) {
    res.redirect("https://" + req.headers.host + req.url);
    return true;
  }
  return false;
}

async function getRenderData(dataFun: () => any) {
  const vc = await visitCounter.Loader.getCount();
  const standardData = {
    title: title,
    visitorCount: vc,
  };
  return { ...standardData, ...dataFun() };
}

const title = "No Bullshit. No Ads. Just DOTA.";
