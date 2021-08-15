export function readCsv(filename) {
  const file = require("@/assets/csv/" + filename + ".txt");
  const lines = file["default"].split("\n");
  var returnArr = [];
  lines.forEach((element) => {
    returnArr.push(element.split(","));
  });
  return returnArr;
}
