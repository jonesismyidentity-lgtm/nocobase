import { InstallOptions, Plugin } from '@nocobase/server';
import { RestApiDataSource } from './data-source';

export class PluginDataSourceRestApi extends Plugin {
  async afterLoad() {
    this.app.dataSourceManager?.registerDataSourceType('rest-api', RestApiDataSource);
  }

  async install(options?: InstallOptions) {
    //
  }
}

export default PluginDataSourceRestApi;
