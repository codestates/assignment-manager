const { exec } = require("child_process");
const { post } = require("axios")
const { readFileSync } = require("fs");
const path = require('path')
const prompt = require('prompt')
const endpoint = 'https://nhfz4ymqhc.execute-api.ap-northeast-2.amazonaws.com/dev/auth'
const payload = {
  "name": path.basename(process.cwd()),
  "assessments": [{
    "type": "mocha",
    "timestamp": new Date().toISOString()
  }]
}

const schema = {
  properties: {
    email: {
      pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
      message: 'Email 형식을 입력해야 합니다',
      required: true,
      description: ' UrClass에서 GitHub로 로그인시 사용하는 Email을 입력하세요 '
    }
  }
}
prompt.message = '코드스테이츠에 과제를 제출합니다.\n--------------------------------'
prompt.delimiter = '\n>'

const getEmail = () => {
  prompt.start();

  prompt.get(schema, (err, result) => {
    if (err) {
      console.log('\n제출을 취소합니다.')
      return;
    }
    getEndpoint(result.email)
  })
}

const getEndpoint = (email) => {
  post(endpoint, {
    email
  })
  .then(res => {
    runReport(result => submit(result, res.data))
  })
  .catch(err => {
    if (err.response.status === 404) {
      console.log("UrClass에 해당 사용자가 존재하지 않습니다. 제출에 실패하였습니다.")
      return;
    }
    else {
      console.log(err)
    }
  })
}

const runReport = (callback) => {
  exec("npm run report", (err, stdout, stderr) => {

    let result = readFileSync('./report.json').toString()
    result = JSON.parse(result)
    callback(result.stats)
  })
}

const submit = (result, auth) => {
  payload.user = auth.users[0]
  payload.assessments[0].result = result

  post(auth.endpoint_submit, payload)
  .then(resp => {
    console.log('제출에 성공하였습니다.')
  })
  .catch(err => {
    throw new Error('제출에 실패하였습니다.')
  })
}

module.exports = getEmail;
