import { CollectionManager, DataSource, ICollection, Repository } from '@nocobase/data-source-manager';
import axios, { AxiosInstance } from 'axios';

class RestApiRepository extends Repository {
  protected collection: ICollection;
  protected dataSource: RestApiDataSource;

  constructor(collection: ICollection) {
    super();
    this.collection = collection;
    this.dataSource = collection.collectionManager.dataSource as RestApiDataSource;
  }

  protected get api() {
    return this.dataSource.api;
  }

  protected get collectionPath() {
    return `/${this.collection.name}`;
  }

  async create(options: any) {
    const { values } = options || {};
    const response = await this.api.post(this.collectionPath, values);
    return response.data;
  }

  async update(options: any) {
    const id = this.extractPrimaryKey(options);
    const { values } = options || {};
    const response = await this.api.put(`${this.collectionPath}/${id}`, values);
    return response.data;
  }

  async find(options: any = {}) {
    const { limit, offset, filter } = options;
    const params: Record<string, any> = {};

    if (limit !== undefined) {
      params._limit = limit;
    }
    if (offset !== undefined) {
      params._start = offset;
    }
    if (filter?.id) {
      params.id = filter.id;
    }

    const response = await this.api.get(this.collectionPath, { params });
    return response.data;
  }

  async findOne(options: any = {}) {
    const id = this.extractPrimaryKey(options);
    const response = await this.api.get(`${this.collectionPath}/${id}`);
    return response.data;
  }

  async destroy(options: any) {
    const id = this.extractPrimaryKey(options);
    await this.api.delete(`${this.collectionPath}/${id}`);
    return {};
  }

  async count(options?: any): Promise<number> {
    const rows = await this.find(options);
    return Array.isArray(rows) ? rows.length : 0;
  }

  async findAndCount(options?: any): Promise<[any[], number]> {
    const rows = await this.find(options);
    const count = Array.isArray(rows) ? rows.length : 0;
    return [rows, count];
  }

  private extractPrimaryKey(options: any) {
    const id = options?.filterByTk ?? options?.where?.id ?? options?.filter?.id;
    if (id === undefined || id === null) {
      throw new Error('A primary key value is required.');
    }
    return id;
  }
}

class RestApiCollectionManager extends CollectionManager {
  constructor(options: any = {}) {
    super(options);
    this.registerRepositories({
      restApi: RestApiRepository,
      Repository: RestApiRepository,
    });
  }
}

export class RestApiDataSource extends DataSource {
  private client: AxiosInstance;

  constructor(options: any) {
    super(options);
    this.client = axios.create({
      baseURL: this.options.baseURL,
    });
  }

  get api() {
    return this.client;
  }

  createCollectionManager(options?: any) {
    return new RestApiCollectionManager({
      ...options,
      dataSource: this,
    });
  }

  async load() {
    const tableNames = this.options?.tables || (await this.getTables());

    for (const table of tableNames) {
      const fields = await this.getFields(table);
      this.collectionManager.defineCollection({
        name: table,
        fields,
        repository: 'restApi',
      });
    }
  }

  async getTables() {
    return ['posts', 'comments', 'albums', 'photos', 'todos', 'users'];
  }

  async getTable(name: string) {
    const fields = await this.getFields(name);
    return {
      name,
      fields,
    };
  }

  async getFields(name: string) {
    try {
      const response = await this.api.get(`/${name}/1`);
      return Object.keys(response.data).map((key) => ({
        name: key,
        type: 'string',
      }));
    } catch (error) {
      this.logger?.warn?.(`Failed to load fields for ${name}: ${error}`);
      return [];
    }
  }
}

export default RestApiDataSource;
