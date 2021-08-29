import * as httpbinAnything from './httpbin-anything'

const ACCESS_TOKEN = process.env['ACCESS_TOKEN']
if (!ACCESS_TOKEN) {
  console.error('環境変数 `ACCESS_TOKEN` を指定してください。')
  process.exit(1)
}

interface Main {
  (args: string[]): void
}

const main: Main = async ([_, __, userId, mailAddress]) => {
  if (!userId || !mailAddress) {
    console.error('ユーザー ID とメールアドレスを指定してください。')
    process.exit(1)
  }
  try {
    const response = await httpbinAnything.call({
      security: { token: ACCESS_TOKEN },
      requestBody: { mailAddress },
    })
    const {
      url,
      headers: { Authorization: authorization, Host: host },
      method,
      json: { mailAddress: responseMailAddress },
    } = response.responseBody
    console.log({
      host,
      authorization,
      url,
      method,
      mailAddress: responseMailAddress,
    })
  } catch (error) {
    const output = {
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack,
      error,
    }
    console.log(output)
    process.exit(1)
  }
}

main(process.argv)
