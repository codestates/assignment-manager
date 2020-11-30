const { exec } = require("child_process");
const { post } = require("axios")
const { existsSync, readFileSync } = require("fs");
const { requestDevice, getUser } = require('./github')
const path = require('path')
const homedir = require('os').homedir();
const prompt = require('prompt');
const zip = require('./zip')
const endpoint = 'https://2j12cf7y29.execute-api.ap-northeast-2.amazonaws.com/dev/'
const payload = {
  "name": path.basename(process.cwd()),
  "assessments": [{
    "type": "mocha",
    "timestamp": new Date().toISOString()
  }]
}

prompt.message = ''
prompt.delimiter = '\n>'
prompt.start({ noHandleSIGINT: true });
process.on('SIGINT', () => {
  console.log('과제 제출을 중단합니다.')
  process.exit()
})

const entryPoint = () => {
  const location = path.join(homedir, '.codestates-token')
  if (existsSync(location)) {
    const token = readFileSync(location).toString()
    getUser(token.split('\n')[0], ({ data }) => {
      getEndpoint(data.id)
    })
  }
  else {
    requestDevice(({ data }) => {
      getEndpoint(data.id)
    })
  }
}

const getEndpoint = (id) => {
  post(endpoint + 'auth', {
    id
  })
  .then(res => {
    console.log(`${res.data.users[0].name}님의 과제를 제출합니다`)
    runReport(async result => await submit(result, res.data))
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

const submit = async (result, auth) => {
  payload.user = auth.users[0]
  const filename = `${payload.user.githubId}--${new Date().toISOString().replace(/\:/g, '-')}.zip`
  payload.assessments[0].result = { ...result, filename }

  // console.log(payload)
  const config = {
    headers: {
      'Content-Type': 'application/json'
    }
  }

  post(auth.endpoint_submit, payload, config)
  .then(resp => {
    console.log('제출에 성공하였습니다.')
  })
  .catch(err => {
    console.log(err)
    throw new Error('제출에 실패하였습니다.')
  })

  const base64 = await zip(filename)
  post(auth.endpoint_upload, { contents: base64, filename }, config)
  .then(resp => {
    console.log('과제 업로드에 성공하였습니다.')
  })
  .catch(err => {
    console.log(err)
    throw new Error('과제 업로드에 실패하였습니다.')
  })
}

module.exports = entryPoint;