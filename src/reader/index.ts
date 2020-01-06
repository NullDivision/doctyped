import { readApi as readGraphqlApi } from './api/graphql';
import { readApi as readNelmioApi } from './api/nelmio';
import { readApi as readSwaggerApi } from './api/swagger';

export enum API_TYPE {
  GRAPHQL = 'graphql',
  NELMIO = 'nelmio',
  SWAGGER = 'swagger'
}

export const readApi = (api: API_TYPE) => {
  if (api === API_TYPE.GRAPHQL) return readGraphqlApi();
  if (api === API_TYPE.NELMIO) return readNelmioApi();
  if (api === API_TYPE.SWAGGER) return readSwaggerApi();
}
