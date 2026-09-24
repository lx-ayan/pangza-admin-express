/**
 * 用户管理接口契约冒烟脚本（需后端已启动）
 *
 * 用法：
 *   node scripts/verify-user-api.mjs http://localhost:3990   # Express
 *   node scripts/verify-user-api.mjs http://localhost:5270   # Java
 *
 * 默认账号：admin / 123456（按实际库修改）
 */
const base = (process.argv[2] || 'http://localhost:3990').replace(/\/$/, '')
const username = process.env.VERIFY_USER || 'admin'
const password = process.env.VERIFY_PASS || '123456'

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = token // 裸 token，无 Bearer
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  return json
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function main() {
  console.log(`Target: ${base}`)

  const login = await req('POST', '/api/user/login', {
    body: { username, password, platform: 'PC' },
  })
  assert(login.code === 200, `login failed: ${JSON.stringify(login)}`)
  assert(login.data?.token, 'login.data.token missing')
  assert(Array.isArray(login.data.permission) || typeof login.data.permission === 'string', 'permission shape')
  const token = login.data.token
  console.log('✓ login')

  const page = await req('POST', '/api/user/page', {
    token,
    body: { pageNum: 1, pageSize: 10, form: {} },
  })
  assert(page.code === 200, `page failed: ${JSON.stringify(page)}`)
  assert(Array.isArray(page.data?.list), 'page.data.list')
  assert(typeof page.data.total === 'number', 'page.data.total')
  console.log(`✓ page (total=${page.data.total})`)

  const pageSearch = await req('POST', '/api/user/page', {
    token,
    body: { pageNum: 1, pageSize: 10, form: { nickName: 'a' } },
  })
  assert(pageSearch.code === 200, `page search failed: ${JSON.stringify(pageSearch)}`)
  console.log('✓ page form.nickName')

  if (page.data.list?.[0]?.id) {
    const id = String(page.data.list[0].id)
    const detail = await req('POST', `/api/user/get/${id}`, { token })
    assert(detail.code === 200, `get failed: ${JSON.stringify(detail)}`)
    assert(detail.data?.username, 'get.username')
    assert(!('password' in (detail.data || {})), 'password should be omitted')
    console.log('✓ get/:id')

    const roles = await req('GET', `/api/user/get_role/${id}`, { token })
    assert(roles.code === 200, `get_role failed: ${JSON.stringify(roles)}`)
    assert(Array.isArray(roles.data), 'get_role.data array')
    console.log('✓ get_role/:id')
  }

  const roleList = await req('GET', '/api/role/list', { token })
  assert(roleList.code === 200, `role list failed: ${JSON.stringify(roleList)}`)
  assert(Array.isArray(roleList.data), 'role list array')
  console.log('✓ role/list')

  const logout = await req('POST', '/api/user/logout', { token })
  assert(logout.code === 200, `logout failed: ${JSON.stringify(logout)}`)
  console.log('✓ logout')
  console.log('All user-admin contract checks passed.')
}

main().catch((err) => {
  console.error('✗', err.message || err)
  process.exit(1)
})
