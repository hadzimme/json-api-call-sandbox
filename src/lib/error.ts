/**
 * コードベース上で定義できるカスタムエラーの種類
 */
export const ErrorType = {
  BUSINESS_ERROR: 'BusinessError',
  UNEXPECTED_ERROR: 'UnexpectedError',
} as const

interface BaseError extends Error {
  type: typeof ErrorType[keyof typeof ErrorType]
}

/**
 * ビジネスエラーのスーパータイプ
 */
export interface BusinessError extends BaseError {
  type: typeof ErrorType.BUSINESS_ERROR
}

/**
 * 想定外エラーのスーパータイプ
 */
export interface UnexpectedError extends BaseError {
  type: typeof ErrorType.UNEXPECTED_ERROR
}

/**
 * カスタムエラーを生成する関数の型
 */
export interface ComposeBaseError<E extends BaseError> {
  (
    props: Omit<E, keyof BaseError> extends { [key: string]: never }
      ? void
      : Omit<E, keyof BaseError>
  ): E
}

/**
 * カスタムエラーにスタックトレースを付与する
 * @param error
 * @param compose
 * @returns カスタムエラー
 */
export const captureStackTrace = <E extends BaseError>(
  error: E,
  compose: ComposeBaseError<E>
): E => {
  Error.captureStackTrace(error, compose)
  return {
    ...error,
    stack: error.stack,
  }
}
