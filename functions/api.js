// 定义 KV 命名空间（通过环境变量绑定）
let LINKS_KV = ''; // 替换为你的 KV 命名空间

// 定义管理员用户名和密码（实际应用中应使用更安全的鉴权方式）
let ADMIN_USERNAME = '';
let ADMIN_PASSWORD = '';

// 鉴权中间件
async function authenticate(request) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return false;
    }

    const encodedCredentials = authHeader.split(' ')[1];
    const decodedCredentials = atob(encodedCredentials);
    const [username, password] = decodedCredentials.split(':');

    return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

// 处理 GET 请求（查看链接）
async function handleGet(request) {
    const isAuthenticated = await authenticate(request);
    if (!isAuthenticated) {
        return new Response('Unauthorized', { status: 401 });
    }

    const links = await LINKS_KV.list();
    return new Response(JSON.stringify(links), {
        headers: { 'Content-Type': 'application/json' },
    });
}

// 处理 POST 请求（上传链接）
async function handlePost(request) {
    const isAuthenticated = await authenticate(request);
    if (!isAuthenticated) {
        return new Response('Unauthorized', { status: 401 });
    }

    const { link } = await request.json();
    if (!link) {
        return new Response('Missing link', { status: 400 });
    }

    const id = Date.now().toString();
    await LINKS_KV.put(id, link);

    return new Response(JSON.stringify({ id, link }), {
        headers: { 'Content-Type': 'application/json' },
    });
}

// 主处理函数
export async function onRequest(context) {
    const { request, env } = context;
    const { method } = request;

    LINKS_KV = env.LINKS_KV;
    ADMIN_USERNAME = env.ADMIN_USERNAME;
    ADMIN_PASSWORD = env.ADMIN_PASSWORD;

    switch (method) {
        case 'GET':
            return handleGet(request);
        case 'POST':
            return handlePost(request);
        default:
            return new Response('Method not allowed', { status: 405 });
    }
}