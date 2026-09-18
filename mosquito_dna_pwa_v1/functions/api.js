const ALLOWED_ACTIONS = new Set([
  'getAppConfig',
  'getTargetData',
  'saveChangesBatch',
  'getStats'
]);

function jsonResponse(body, status = 200) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    }
  );
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.GAS_API_URL || !env.API_SECRET || !env.APP_ACCESS_CODE) {
    return jsonResponse(
      {
        ok: false,
        error: 'Cloudflare 환경 변수가 설정되지 않았습니다.'
      },
      500
    );
  }

  const appCode = request.headers.get('X-App-Code') || '';

  if (appCode !== env.APP_ACCESS_CODE) {
    return jsonResponse(
      {
        ok: false,
        error: '접속 코드가 올바르지 않습니다.'
      },
      401
    );
  }

  let body;

  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse(
      {
        ok: false,
        error: '잘못된 요청입니다.'
      },
      400
    );
  }

  const action = String(body.action || '');
  const args = Array.isArray(body.args) ? body.args : [];

  if (!ALLOWED_ACTIONS.has(action)) {
    return jsonResponse(
      {
        ok: false,
        error: '허용되지 않은 API 요청입니다.'
      },
      400
    );
  }

  try {
    const upstream = await fetch(
      env.GAS_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8'
        },
        body: JSON.stringify({
          action,
          args,
          secret: env.API_SECRET
        }),
        redirect: 'follow'
      }
    );

    const text = await upstream.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      return jsonResponse(
        {
          ok: false,
          error:
            'Apps Script 응답이 JSON이 아닙니다. ' +
            'Web App 배포 URL과 권한을 확인해주세요.'
        },
        502
      );
    }

    if (!data || data.ok !== true) {
      return jsonResponse(
        {
          ok: false,
          error:
            (data && data.error) ||
            'Apps Script 요청에 실패했습니다.'
        },
        502
      );
    }

    return jsonResponse(
      {
        ok: true,
        result: data.result
      }
    );
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: error?.message || String(error)
      },
      502
    );
  }
}

export function onRequestGet() {
  return jsonResponse({
    ok: true,
    service: 'Mosquito DNA PWA API'
  });
}
