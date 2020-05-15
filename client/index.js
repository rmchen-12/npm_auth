const got = require('got');
const ora = require('ora');
const _ = require('lodash');
const inquirer = require('inquirer');
inquirer.registerPrompt('table', require('inquirer-table-prompt'));

class NpmAuthFlow {
  constructor() {
    this.spinner = ora({
      text: 'fetch ',
    });
    this.users = [];
    this.packages = [];
    this.config = {};

    this.startFlow();
  }

  async startFlow() {
    await this.fetchConfig();
    const { authList } = await inquirer.prompt([
      {
        type: 'table',
        name: 'authList',
        message: '请选择npm包的publish权限',
        columns: this.users.map((v) => ({ name: v, value: v })),
        rows: this.packages.map((v) => ({ name: v, value: v })),
      },
    ]);

    const addAuth = authList.reduce((res, cur, index) => {
      if (cur) {
        return {
          ...res,
          ...{ [this.packages[index]]: { access: '$all', publish: cur } },
        };
      }
      return res;
    }, {});

    const newAuth = {
      ..._.omit(this.config.packages, ['**']),
      ...addAuth,
      ..._.pick(this.config.packages, ['**']),
    };

    this.config.packages = newAuth;
    this.updateConfig();
  }

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
    const { body } = await got.post('http://127.0.0.1:7001/update', {
      json: {
        config: this.config,
      },
    });
    this.spinner.text = 'Updating config succeed';
    this.spinner.succeed();
  }
}

new NpmAuthFlow();
