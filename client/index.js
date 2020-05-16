const got = require('got');
const ora = require('ora');
const _ = require('lodash');
const fuzzy = require('fuzzy');
const inquirer = require('inquirer');

inquirer.registerPrompt('search-list', require('inquirer-search-list'));
inquirer.registerPrompt(
  'checkbox-plus',
  require('inquirer-checkbox-plus-prompt')
);

class NpmAuthFlow {
  constructor() {
    this.spinner = ora({});
    this.users = [];
    this.packages = [];
    this.config = {};
    this.ans = [];

    this.startFlow();
  }

  async startFlow() {
    await this.fetchConfig();
    await this.getAns();
    const assigner = this.ans.reduce((obj, cur) => {
      return { ...obj, ...cur };
    }, {});

    const newAuth = {
      ..._.omit(this.config.packages, ['**']),
      ...assigner,
      ..._.pick(this.config.packages, ['**']),
    };

    this.config.packages = newAuth;
    this.updateConfig();
  }

  async getAns() {
    const { packages, users, config, ans } = this;
    const packagesWithScope = this.completePackage(packages);

    const ans1 = await inquirer.prompt([
      {
        type: 'search-list',
        message: 'Select package',
        name: 'package',
        choices: packagesWithScope,
      },
    ]);
    const selectPackage = config.packages[ans1.package];
    const ans2 = await inquirer.prompt([
      {
        type: 'checkbox-plus',
        name: 'newUsers',
        message: 'Select users',
        pageSize: 10,
        highlight: true,
        searchable: true,
        default: selectPackage ? selectPackage.publish.split(' ') : [],
        source: function (answersSoFar, input) {
          input = input || '';
          return new Promise(function (resolve) {
            var fuzzyResult = fuzzy.filter(input, users);
            var data = fuzzyResult.map(function (element) {
              return element.original;
            });
            resolve(data);
          });
        },
      },
    ]);

    const ans3 = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: '继续？',
        default: false,
      },
    ]);

    const oneAuth = {
      [ans1.package]: { access: '$all', publish: ans2.newUsers.join(' ') },
    };
    ans.push(oneAuth);

    if (ans3.continue) {
      return this.getAns();
    }
  }

  // 类似@aclink/test这些带scope的也需要作为可选项
  completePackage = (packages) => {
    const reg = /(^@.*\/)(?=.*)/gm;
    const res = packages.map((v) => {
      const scope = v.match(reg);
      return scope ? `${scope[0]}*` : undefined;
    });
    return [...packages, ..._(res).uniq().compact().valueOf()];
  };

  async fetchConfig() {
    this.spinner.start();
    this.spinner.text = 'Loading config';
    const { body } = await got.get('http://127.0.0.1:7001', {
      responseType: 'json',
    });
    this.spinner.text = 'Loading config succeed';
    this.spinner.succeed();

    const { users, packages, config } = body;
    this.users = users;
    this.packages = packages;
    this.config = config.config;
  }

  async updateConfig() {
    this.spinner.start();
    this.spinner.text = 'Updating config';
    await got.post('http://127.0.0.1:7001/update', {
      json: {
        config: this.config,
      },
    });
    this.spinner.text = 'Update config succeed';
    this.spinner.succeed();
  }
}

module.exports = NpmAuthFlow;
