export const exactFloatToFixed = (floatOrString, val) => {
  let ret = floatOrString.toString();
  if (ret.indexOf(".") === -1) {
    return ret;
  }
  ret = ret.slice(0, ret.indexOf(".") + val + 1);
  return ret;
};
