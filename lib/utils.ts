export const fetchWithTimeout = async (
  ressource: RequestInfo,
  options = { timeout: 8000 }
) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), options.timeout)

  const response = await fetch(ressource, {
    ...options,
    signal: controller.signal,
  })
  clearTimeout(id)

  return response
}


