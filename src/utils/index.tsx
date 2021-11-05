/**
 * 功能函数
 */
export const paramsToUrl = (params: any) => {
  return Object.keys(Object.assign(params, { __t: Date.now() }))
    .map((key) => {
      return params[key] === undefined
        ? ""
        : `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`;
    })
    .join("&");
};