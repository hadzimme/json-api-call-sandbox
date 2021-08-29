import * as http from 'http'
import * as https from 'https'
import * as error from '../lib/error'
import * as json from '../lib/json'

namespace JsonApiResponseError {
  const name = 'JsonApiResponseError'
  const message = 'JSON API からエラーレスポンスが返りました。'

  interface JsonApiResponseError extends error.UnexpectedError {
    name: typeof name
    statusCode?: number
    headers: http.IncomingHttpHeaders
    body: string
  }

  /**
   * JsonApiResponseError を生成する
   * @param props
   * @returns
   */
  export const compose: error.ComposeBaseError<JsonApiResponseError> = (
    props
  ) => {
    const customError: JsonApiResponseError = {
      type: error.ErrorType.UNEXPECTED_ERROR,
      name,
      message,
      ...props,
    }
    return error.captureStackTrace(customError, compose)
  }
}

namespace JsonApiParseError {
  const name = 'JsonApiParseError'
  const message =
    'JSON API から JSON 文字列ではないレスポンスボディが返りました。'

  interface JsonApiParseError extends error.UnexpectedError {
    name: typeof name
    headers: http.IncomingHttpHeaders
    body: string
  }

  /**
   * JsonApiParseError を生成する
   * @param props
   * @returns
   */
  export const compose: error.ComposeBaseError<JsonApiParseError> = (props) => {
    const customError: JsonApiParseError = {
      type: error.ErrorType.UNEXPECTED_ERROR,
      name,
      message,
      ...props,
    }
    return error.captureStackTrace(customError, compose)
  }
}

interface CallWebApiRequest {
  scheme: typeof https | typeof http
  host: string
  port?: number
  path: string
  method: string
  authorization?: string
  body?: string
}

interface CallWebApiResponse {
  statusCode?: number
  headers: http.IncomingHttpHeaders
  body: string
}

interface CallWebApi {
  (request: CallWebApiRequest): Promise<CallWebApiResponse>
}

const callWebApi: CallWebApi = async ({
  scheme,
  host,
  port,
  path,
  method,
  authorization,
  body,
}) => {
  const chunks: string[] = []
  return await new Promise<CallWebApiResponse>((resolve, reject) => {
    const headers = authorization ? { authorization } : undefined
    const request = scheme.request(
      { host, port, path, method, headers },
      (response) => {
        response.setEncoding('utf8')
        response.on('error', reject)
        response.on('data', (chunk) => {
          chunks.push(chunk)
        })
        response.on('end', () => {
          const { statusCode, headers } = response
          resolve({
            statusCode,
            headers,
            body: chunks.join(''),
          })
        })
      }
    )
    request.on('error', reject)
    if (body) {
      request.write(body)
    }
    request.end()
  })
}

interface CallJsonApiRequest<Security, Parameters, RequestBody> {
  security?: Security
  parameters?: Parameters
  requestBody?: RequestBody
}

interface CallJsonApiResponse<ResponseBody> {
  statusCode?: number
  headers: http.IncomingHttpHeaders
  responseBody: ResponseBody
}

interface CallJsonApi<Security, Parameters, RequestBody, ResponseBody> {
  (request: CallJsonApiRequest<Security, Parameters, RequestBody>): Promise<
    CallJsonApiResponse<ResponseBody>
  >
}

export const HttpRequestMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const

interface JsonApiDefinition<Security, Parameters> {
  host: string
  path: (parameters: Parameters) => string
  port?: number
  method: typeof HttpRequestMethod[keyof typeof HttpRequestMethod]
  authorization?: (security: Security) => string
  secure: boolean
}

interface DefineJsonApi {
  <Security, Parameters, RequestBody, ResponseBody>(
    definition: JsonApiDefinition<Security, Parameters>
  ): CallJsonApi<Security, Parameters, RequestBody, ResponseBody>
}

export const defineJsonApi: DefineJsonApi = <
  Security,
  Parameters,
  RequestBody,
  ResponseBody
>({
  host,
  path,
  port,
  method,
  authorization,
  secure,
}: JsonApiDefinition<Security, Parameters>) => {
  const scheme = secure ? https : http
  const callJsonApi: CallJsonApi<
    Security,
    Parameters,
    RequestBody,
    ResponseBody
  > = async ({
    parameters,
    requestBody,
    security,
  }: CallJsonApiRequest<Security, Parameters, RequestBody>): Promise<
    CallJsonApiResponse<ResponseBody>
  > => {
    const {
      statusCode,
      headers,
      body: webApiResponseBody,
    } = await callWebApi({
      scheme,
      host,
      port,
      path: parameters ? path(parameters) : path({} as Parameters),
      method,
      authorization:
        authorization && security ? authorization(security) : undefined,
      body: requestBody ? JSON.stringify(requestBody) : undefined,
    })
    if (statusCode && statusCode > 399) {
      throw JsonApiResponseError.compose({
        statusCode,
        headers,
        body: webApiResponseBody,
      })
    }
    if (!json.isJsonString(webApiResponseBody)) {
      throw JsonApiParseError.compose({
        headers,
        body: webApiResponseBody,
      })
    }
    return {
      statusCode,
      headers,
      responseBody: JSON.parse(webApiResponseBody),
    }
  }
  return callJsonApi
}
