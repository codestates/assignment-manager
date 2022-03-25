
const dotenv = require('dotenv');
const fs = require('fs');
const { existsSync, readFileSync } = require("fs");
const { getUser } = require('../lib/github')
const path = require('path')
const homedir = require('os').homedir();
const API_ENDPOINT = 'https://api.codestates-seb.link'
const { post } = require("axios")

class Reporter {

  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
  }

  async createRun(suiteId, tests) {
    console.log("Codestates : imposter-repoter ");
  }

  onRunComplete(contexts, results) {

    const specResults = results.testResults;
    let alltests = [];
    for (let j = 0; j < specResults.length; j += 1) {
      const itResults = specResults[j].testResults;
      for (let i = 0; i < itResults.length; i += 1) {
        let is_pass = itResults[i].status == "failed" ? false : true
        alltests.push({
          testcase_fullname: itResults[i].ancestorTitles[0] + " :: " + itResults[i].title,
          is_pass: is_pass
        })
      }
    }
    console.log("Codestates : imposter-repoter ");
    const packageName = JSON.parse(readFileSync('./package.json').toString('utf-8')).name
    console.log("Package Name", packageName)
    const location = path.join(homedir, '.codestates-token')
    if (existsSync(location)) {
      const token = readFileSync(location).toString()
      getUser(token.split('\n')[0], ({ data }) => {
        console.log('githubId ', data.id)
        post(`${API_ENDPOINT}/imposter/bulk-report`, {
          "github_id": data.id,
          "repo_name": packageName,
          "tests": alltests,
          "at": "2022-02-11 00:00:00"
        })
          .then(res => {
            console.log(`과제 진행이 추적관리 되고있습니다.`)
          })
          .catch(err => {
            console.log(err)
            console.log(err)
            
            console.log(`과제 진행 추적관리 에러 : ${err.errno? err.errno : -99}`)
          })
      })
    }

  }
}

module.exports = Reporter;