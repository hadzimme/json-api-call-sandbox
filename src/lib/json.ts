/**
 * 文字列が JSON 文字列である
 * @param string
 * @returns
 */
export const isJsonString = (string: string): boolean => {
  try {
    JSON.parse(string)
    return true
  } catch {
    return false
  }
}
