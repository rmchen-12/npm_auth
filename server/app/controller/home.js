const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { npmConfig } = this.ctx.service;
    const users = await npmConfig.findUsers();
    const config = await npmConfig.findConfig();
    const packages = await npmConfig.findPackages();

    this.ctx.body = { users, config, packages: packages.list };
  }

  async update() {
    const { npmConfig } = this.ctx.service;
    const newConfig = this.ctx.request.body;
    await npmConfig.updateConfig(newConfig);
    this.ctx.body = 'update success';
  }
}

module.exports = HomeController;
