import * as jsonApi from './lib/json-api'

/**
 * httpbin.org の anything API をコールする
 */
export const call = jsonApi.defineJsonApi<
  Security,
  Parameters,
  RequestBody,
  ResponseBody
>({
  host: 'httpbin.org',
  path: () => '/anything/users',
  method: jsonApi.HttpRequestMethod.POST,
  authorization: ({ token }) => `Bearer ${token}`,
  secure: true,
})

interface Security {
  token: string
}

type Parameters = void

interface RequestBody {
  mailAddress: string
}

interface ResponseBody {
  url: string
  headers: {
    Authorization: string
    Host: string
  }
  method: string
  json: {
    mailAddress: string
  }
}
