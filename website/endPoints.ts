import { Request, Response } from "express";
import Website from "./website";

interface EndPointNames {
  endPoint: string;
  view: string;
}

export async function registerEndpoints(ws: Website) {
  await addIndexRoot(ws);
  await addJoinRoot(ws);
  await addHallOfFameRoot(ws);
}

async function addIndexRoot(ws: Website) {
  const names: EndPointNames = {
    endPoint: "/",
    view: "index",
  };
  const dataFun = () => {
    return {};
  };
  await setEndPoint(ws, names, dataFun);
}

async function addJoinRoot(ws: Website) {
  const names: EndPointNames = {
    endPoint: "/join",
    view: "joinLink",
  };
  await setEndPoint(ws, names);
}

async function addHallOfFameRoot(ws: Website) {
  const names: EndPointNames = {
    endPoint: "/halloffame",
    view: "hallOfFame",
  };
  const dataFun = () => {
    return { coaches: ws.coachList };
  };
  await setEndPoint(ws, names, dataFun);
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
  const standardData = {
    title: title,
  };
  return { ...standardData, ...dataFun() };
}

const title = "No Bullshit. No Ads. Just DOTA.";
