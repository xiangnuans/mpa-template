import axios from "axios";
import { paramsToUrl } from "./index";
import qs from "qs";

const useMock = false;
const options = {
  backendUrl: "/auth/global/",
  noAccessUrl: "https://xxxx.cn/noAccess.html",
};

const responseCode = {
  '登陆过期': 401,
  '成功': 200,
  '没有权限': 403,
  '服务器错误': 500,
};

const baseUrl = useMock ? options["mockUrl"] : options["backendUrl"];

const parseData = (resp: any) => {
  try {
    const obj = JSON.parse(resp);
    if (obj.code === responseCode["登陆过期"]) {
      // 登录过期
      setTimeout(() => {
        window.location.href = `${obj.datas.url}?service=${encodeURIComponent(
          window.location.href
        )}`;
      }, 1500);
    }
    return JSON.parse(resp);
  } catch (e) {
    console.error("后端返回json解析有误", e);
    return {
      message: "服务器异常",
      success: false,
    };
  }
};

const instance = axios.create({
  timeout: 60000,
  headers: {
    "Content-Type": "application/json;charset=UTF-8",
    "X-Requested-With": "XMLHttpRequest",
  },
  transformResponse: [parseData],
});

const formInstance = axios.create({
  timeout: 60000,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    "X-Requested-With": "XMLHttpRequest",
  },
  transformResponse: [parseData],
});

export const post = (url: string, params: any, type = "") => {
  if (type === "form") {
    return formInstance.post(`${baseUrl}${url}`, qs.stringify(params));
  }
  return instance.post(`${baseUrl}${url}`, params);
};

export const get = (url: string, params = {}) => {
  return instance.get(`${baseUrl}${url}?${paramsToUrl(params)}`);
};

const responseError = (error: any) => {
  if (error.response) {
    if (error.response.status === responseCode["没有权限"]) {
      window.location.href = options["noAccessUrl"];
    }
    if (error.response.status >= responseCode["服务器错误"]) {
      // 服务器code:500以上的错误触发监听事件
      const evt = document.createEvent("Event");
      evt.initEvent("serverErrorEvent", true, true);
      document.dispatchEvent(evt);
    }
  }
  return {
    data: {
      success: false,
      message: "当前网络状况不稳定, 请检查网络环境",
    },
  };
};

instance.interceptors.response.use(function(response) {
  return response;
}, responseError);
formInstance.interceptors.response.use(function(response) {
  return response
}, responseError);
