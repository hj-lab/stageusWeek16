const { v4 } = require("uuid")

// UUID indexing을 위한 작업
const uuid = () => {
    const tokens = v4().split('-')
    return tokens[2] + tokens[1] + tokens[0] + tokens[3] + tokens[4];
}

module.exports = { uuid }





// 참고
// https://velog.io/@bbaekddo/nodejs-1